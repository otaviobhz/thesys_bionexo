import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import * as soap from 'soap'
import * as xml2js from 'xml2js'

interface BionexoResponse {
  status: number
  timestamp: string
  data: string | null
}

@Injectable()
export class BionexoService {
  private readonly logger = new Logger(BionexoService.name)
  private cachedClient: any = null
  private cachedWsdlUrl: string = ''

  constructor(private readonly prisma: PrismaService) {}

  private parseResponse(raw: string): BionexoResponse {
    const parts = raw.split(';')
    return {
      status: parseInt(parts[0] || '-1'),
      timestamp: parts[1] || '',
      data: parts.slice(2).join(';') || null,
    }
  }

  private async getConfig() {
    const config = await this.prisma.bionexoConfig.findFirst()
    if (!config || !config.usuario || !config.senha) {
      throw new Error('Bionexo não configurado. Acesse Configurações e preencha usuário/senha.')
    }
    return config
  }

  private async getSoapClient(wsdlUrl: string) {
    if (this.cachedClient && this.cachedWsdlUrl === wsdlUrl) {
      return this.cachedClient
    }
    this.logger.log(`[SOAP] Creating new client for ${wsdlUrl}`)
    this.cachedClient = await soap.createClientAsync(wsdlUrl)
    this.cachedWsdlUrl = wsdlUrl
    return this.cachedClient
  }

  private async callRequest(operation: string, parameters: string): Promise<BionexoResponse> {
    const config = await this.getConfig()
    const raw = await this.rawSoapCall(config, operation, parameters)
    this.logger.log(`[${operation}] Raw response (${raw.length} chars): ${raw.substring(0, 200)}`)
    return this.parseResponse(raw)
  }

  private async rawSoapCall(config: any, operation: string, parameters: string, xml?: string): Promise<string> {
    const soapBody = xml
      ? `<tns:post><login>${config.usuario}</login><password>${config.senha}</password><operation>${operation}</operation><parameters>${parameters}</parameters><xml><![CDATA[${xml}]]></xml></tns:post>`
      : `<tns:request><login>${config.usuario}</login><password>${config.senha}</password><operation>${operation}</operation><parameters>${parameters}</parameters></tns:request>`

    const soapXml = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://webservice.bionexo.com/"><soap:Body>${soapBody}</soap:Body></soap:Envelope>`

    const endpoint = config.wsdlUrl.replace('?wsdl', '')
    const endpointUrl = new URL(endpoint)
    const mod = endpointUrl.protocol === 'https:' ? await import('https') : await import('http')

    this.logger.log(`[SOAP] ${operation} → ${endpointUrl.hostname}${endpointUrl.pathname}`)

    return new Promise((resolve, reject) => {
      const req = mod.request({
        hostname: endpointUrl.hostname,
        port: endpointUrl.port || (endpointUrl.protocol === 'https:' ? 443 : 80),
        path: endpointUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
          'Content-Length': Buffer.byteLength(soapXml),
          'SOAPAction': '',
        },
        timeout: 30000,
      }, (res: any) => {
        let body = ''
        res.on('data', (chunk: string) => body += chunk)
        res.on('end', () => {
          this.logger.log(`[SOAP] HTTP ${res.statusCode} from ${endpointUrl.hostname} (${body.length} bytes)`)
          if (res.statusCode === 503) {
            reject(new Error(`Bionexo retornou HTTP 503. Servidor pode estar em manutencao ou rate limit atingido.`))
            return
          }
          if (!body || body.trim().length === 0) {
            this.logger.warn(`[SOAP] Corpo vazio recebido (HTTP ${res.statusCode}). Retornando como vazio.`)
            resolve('0;;null')
            return
          }
          const match = body.match(/<return>([\s\S]*?)<\/return>/)
          if (match) {
            resolve(match[1])
          } else if (body.includes('xsi:nil')) {
            resolve('0;;null')
          } else {
            reject(new Error(`Resposta SOAP sem <return>: ${body.substring(0, 200)}`))
          }
        })
      })
      req.on('error', reject)
      req.on('timeout', () => { req.destroy(); reject(new Error('SOAP timeout 30s')) })
      req.write(soapXml)
      req.end()
    })
  }

  private async callPost(operation: string, parameters: string, xml: string): Promise<BionexoResponse> {
    const config = await this.getConfig()
    const raw = await this.rawSoapCall(config, operation, parameters, xml)
    this.logger.log(`[${operation}] Response: ${raw.substring(0, 200)}`)
    return this.parseResponse(raw)
  }

  private formatBionexoError(error: any): string {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    if (msg.includes('Reference') || msg.includes('503') || msg.includes('edgesuite')) {
      return 'Bionexo temporariamente indisponível (503). Aguarde 1-2 minutos.'
    }
    return msg
  }

  private toArray(val: any): any[] {
    if (!val) return []
    return Array.isArray(val) ? val : [val]
  }

  // ==================== WGG — Receber Cotações ====================

  /**
   * Aplica regras de classificação automática a um item recém-recebido.
   *
   * Ordem de prioridade:
   *  1. MapeamentoSku (de-para por descrição exata, case-insensitive) →
   *     se bater, define codigoInterno + descricaoInterna + categoria=INTERESSANTE.
   *  2. RegraPalavraChave (substring case-insensitive) →
   *     se houver match DESCARTAR, vence (mais conservador).
   *     Senão, se houver match INTERESSANTE, define categoria=INTERESSANTE.
   *
   * Retorna também a lista de IDs das regras que casaram, para incrementar o counter `matches`.
   */
  private classifyItem(
    descricao: string,
    mapeamentos: Array<{ descricaoComprador: string; skuThesys: string; descricaoInterna: string }>,
    regras: Array<{ id: string; palavraChave: string; acaoAutomatica: 'INTERESSANTE' | 'DESCARTAR' }>,
  ): {
    categoria: 'NAO_ANALISADO' | 'INTERESSANTE' | 'DESCARTADO'
    codigoInterno: string | null
    descricaoInterna: string | null
    matchedRegraIds: string[]
  } {
    const descUpper = (descricao || '').toUpperCase().trim()

    // 1. Tenta de-para exato (case-insensitive)
    const mapHit = mapeamentos.find(m => m.descricaoComprador.toUpperCase().trim() === descUpper)
    if (mapHit) {
      return {
        categoria: 'INTERESSANTE',
        codigoInterno: mapHit.skuThesys,
        descricaoInterna: mapHit.descricaoInterna,
        matchedRegraIds: [],
      }
    }

    // 2. Tenta regras de palavra-chave (substring)
    const matchedRegras = regras.filter(r => descUpper.includes(r.palavraChave.toUpperCase().trim()))
    const hasDescartar = matchedRegras.some(r => r.acaoAutomatica === 'DESCARTAR')
    const hasInteressante = matchedRegras.some(r => r.acaoAutomatica === 'INTERESSANTE')

    let categoria: 'NAO_ANALISADO' | 'INTERESSANTE' | 'DESCARTADO' = 'NAO_ANALISADO'
    if (hasDescartar) categoria = 'DESCARTADO'
    else if (hasInteressante) categoria = 'INTERESSANTE'

    return {
      categoria,
      codigoInterno: null,
      descricaoInterna: null,
      matchedRegraIds: matchedRegras.map(r => r.id),
    }
  }

  private async parseAndSaveWGG(xmlData: string): Promise<number> {
    const parser = new xml2js.Parser({ explicitArray: false })
    const result = await parser.parseStringPromise(xmlData)

    const pedidos = this.toArray(result?.Pedidos?.Pedido)
    if (pedidos.length === 0) return 0

    // Carrega regras e mapeamentos UMA vez para todo o batch (evita N+1)
    const [mapeamentos, regras] = await Promise.all([
      this.prisma.mapeamentoSku.findMany(),
      this.prisma.regraPalavraChave.findMany(),
    ])

    // Acumula contagem de matches por regra para incrementar atomicamente no fim
    const regraMatchCount = new Map<string, number>()
    const incrementMatches = (ids: string[]) => {
      for (const id of ids) regraMatchCount.set(id, (regraMatchCount.get(id) || 0) + 1)
    }

    let saved = 0
    for (const pedido of pedidos) {
      const cab = pedido.Cabecalho
      if (!cab) continue

      const bionexoId = parseInt(cab.Id_Pdc)
      if (isNaN(bionexoId)) continue

      const existing = await this.prisma.cotacao.findUnique({ where: { bionexoId } })
      if (existing) continue

      const itensReq = this.toArray(pedido.Itens_Requisicao?.Item_Requisicao)

      // Parse date DD/MM/YYYY
      const [d, m, y] = (cab.Data_Vencimento || '').split('/')
      const dataVenc = new Date(`${y}-${m}-${d}`)

      await this.prisma.cotacao.create({
        data: {
          bionexoId,
          tituloPdc: cab.Titulo_Pdc || null,
          nomeHospital: cab.Nome_Hospital || '',
          cnpjHospital: cab.CNPJ_Hospital || '',
          ufHospital: cab.UF_Hospital || '',
          cidadeHospital: cab.Cidade_Hospital || '',
          dataVencimento: isNaN(dataVenc.getTime()) ? new Date() : dataVenc,
          horaVencimento: cab.Hora_Vencimento || '00:00',
          idFormaPagamento: parseInt(cab.Id_Forma_Pagamento) || null,
          formaPagamento: cab.Forma_Pagamento || null,
          contato: cab.Contato || null,
          observacaoComprador: cab.Observacao || null,
          termos: cab.Termo || null,
          itens: {
            create: itensReq.map((item: any, idx: number) => {
              const descricao = item.Descricao_Produto || ''
              const classification = this.classifyItem(descricao, mapeamentos, regras)
              incrementMatches(classification.matchedRegraIds)
              return {
                sequencia: parseInt(item.Sequencia) || idx + 1,
                idArtigo: parseInt(item.Id_Artigo) || 0,
                descricaoBionexo: descricao,
                quantidade: parseFloat(item.Quantidade) || 0,
                unidadeMedida: item.Unidade_Medida || 'UN',
                idUnidadeMedida: parseInt(item.Id_Unidade_Medida) || null,
                marcaFavorita: item.Marca_Favorita || null,
                codigoProduto: item.Codigo_Produto ? String(item.Codigo_Produto) : null,
                marcas: this.extractMarcas(item),
                categoria: classification.categoria,
                codigoInterno: classification.codigoInterno,
                descricaoInterna: classification.descricaoInterna,
              }
            }),
          },
        },
      })
      saved++
    }

    // Incrementa counter de matches em batch (uma update por regra que casou)
    if (regraMatchCount.size > 0) {
      await Promise.all(
        Array.from(regraMatchCount.entries()).map(([id, count]) =>
          this.prisma.regraPalavraChave.update({
            where: { id },
            data: { matches: { increment: count } },
          }),
        ),
      )
      this.logger.log(`[WGG] auto-aplicação: ${regraMatchCount.size} regras casaram, ${Array.from(regraMatchCount.values()).reduce((a, b) => a + b, 0)} matches totais`)
    }

    return saved
  }

  private extractMarcas(item: any): string | null {
    const marcasList = this.toArray(item.Marcas?.Marca)
    if (marcasList.length > 0) {
      return marcasList.map((m: any) => m.Nome_Marca).filter(Boolean).join(', ')
    }
    return item.Marca_Favorita || null
  }

  async receber() {
    try {
      const config = await this.getConfig()
      const token = config.ultimoToken || '0'
      const response = await this.callRequest('WGG', `LAYOUT=WG;TOKEN=${token};ISO=0`)

      if (response.timestamp) {
        await this.prisma.bionexoConfig.update({
          where: { id: config.id },
          data: { ultimoToken: response.timestamp },
        })
      }

      let savedCount = 0
      const hasXml = !!(response.data && response.data.trim().startsWith('<'))
      this.logger.log(`[WGG] status=${response.status}, timestamp=${response.timestamp}, hasXml=${hasXml}, dataLen=${response.data?.length || 0}, dataPreview=${(response.data || 'null').substring(0, 200)}`)
      if (response.status > 0 && hasXml) {
        try {
          savedCount = await this.parseAndSaveWGG(response.data!)
        } catch (parseErr: any) {
          this.logger.error(`[WGG] Parse error: ${parseErr.message}`)
        }
      }

      const log = await this.prisma.syncLog.create({
        data: {
          operacao: 'WGG',
          direcao: 'IN',
          status: response.status > 0 ? 'SUCESSO' : response.status === 0 ? 'VAZIO' : 'ERRO',
          mensagem: response.status > 0
            ? `${response.status} cotações recebidas, ${savedCount} novas salvas`
            : response.status === 0 ? 'Nenhuma cotação nova' : `Erro: ${response.data}`,
          processadas: savedCount,
        },
      })

      return { id: log.id, operacao: log.operacao, direcao: log.direcao, status: log.status, mensagem: log.mensagem, processadas: log.processadas, createdAt: log.createdAt, cotacoes: Math.max(0, response.status), salvas: savedCount }
    } catch (error) {
      const msg = this.formatBionexoError(error)
      const log = await this.prisma.syncLog.create({
        data: { operacao: 'WGG', direcao: 'IN', status: 'ERRO', mensagem: msg, processadas: 0 },
      })
      return { id: log.id, operacao: log.operacao, direcao: log.direcao, status: log.status, mensagem: log.mensagem, processadas: log.processadas, createdAt: log.createdAt }
    }
  }

  // ==================== WHS — Enviar Resposta ====================

  /**
   * Constrói o XML do WHS (Upload_Respostas_WH) conforme schema esperado
   * pela classe Java `com.bionexo.bean.schema.WH_Resposta`.
   *
   * Schema oficial: Upload_Respostas_WH.xsd (não disponível no repo — manuais.bionexo.com.br offline)
   *
   * Inferência baseada em:
   * - Erro do servidor: "field '_WH_Cabecalho' (xml name 'Cabecalho') is required field of class WH_Resposta"
   *   → root element é WH_Resposta (não Pedidos)
   *   → tem campo Cabecalho obrigatório
   * - Doc EDI v3.14 §8: campos esperados são Id_Pdc, Id_Forma_Pagamento (cabeçalho)
   *   e Id_Artigo, Preco_Unitario, Codigo_Produto_Fornecedor, Fabricante, Observacao (item)
   * - Layout WG (download) usa namespace `http://www.bionexo.com.br` no XML real recebido
   */
  private buildWHSXml(cotacao: any): string {
    const escapeXml = (s: string) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')

    const itensXml = cotacao.itens
      .map((item: any) => {
        const preco = (item.precoUnitario || 0).toFixed(2).replace('.', ',')
        return `    <Item_Pdc>
      <Sequencia>${item.sequencia}</Sequencia>
      <Id_Artigo>${item.idArtigo}</Id_Artigo>
      <Codigo_Produto>${escapeXml(item.codigoProduto || '')}</Codigo_Produto>
      <Codigo_Produto_Fornecedor>${escapeXml(item.codigoInterno || '')}</Codigo_Produto_Fornecedor>
      <Preco_Unitario>${preco}</Preco_Unitario>
      <Embalagem>${escapeXml(item.unidadeMedida || 'UN')}</Embalagem>
      <Quantidade_Embalagem>1</Quantidade_Embalagem>
      <Fabricante>${escapeXml(item.marcaFavorita || '')}</Fabricante>
      <Observacao>${escapeXml(item.comentario || '')}</Observacao>
    </Item_Pdc>`
      })
      .join('\n')

    // Data atual e validade default 7 dias
    const hoje = new Date()
    const validadeData = new Date(hoje)
    validadeData.setDate(hoje.getDate() + (cotacao.validadeDias || 7))
    const formatDateBR = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`

    return `<?xml version="1.0" encoding="UTF-8"?>
<WH_Resposta>
  <Cabecalho>
    <Id_Pdc>${cotacao.bionexoId}</Id_Pdc>
    <CNPJ_Hospital>${escapeXml(cotacao.cnpjHospital || '')}</CNPJ_Hospital>
    <Id_Forma_Pagamento>${cotacao.idFormaPagamento || 1}</Id_Forma_Pagamento>
    <Faturamento_Minimo>${(cotacao.faturamentoMinimo || 0).toFixed(2).replace('.', ',')}</Faturamento_Minimo>
    <Prazo_Entrega>${cotacao.prazoEntrega || 5}</Prazo_Entrega>
    <Validade_Proposta>${formatDateBR(validadeData)}</Validade_Proposta>
    <Frete>${escapeXml(cotacao.tipoFrete || 'CIF')}</Frete>
    <Observacao>${escapeXml(cotacao.observacaoEnvio || '')}</Observacao>
  </Cabecalho>
  <Itens_Pdc>
${itensXml}
  </Itens_Pdc>
</WH_Resposta>`
  }

  async enviarCotacao(cotacaoId: string) {
    const cotacao = await this.prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      include: { itens: true },
    })
    if (!cotacao) throw new Error('Cotação não encontrada')

    const itensParaEnviar = cotacao.itens.filter(i => i.precoUnitario && i.precoUnitario > 0)
    if (itensParaEnviar.length === 0) {
      throw new Error('Nenhum item com preço preenchido para enviar')
    }

    const cotacaoComItens = { ...cotacao, itens: itensParaEnviar }
    const xml = this.buildWHSXml(cotacaoComItens)
    this.logger.log(`[WHS] Sending ${itensParaEnviar.length} items for PDC ${cotacao.bionexoId}`)

    let bionexoResult = 'Stub: sandbox sem dados'
    let whsSuccess = false
    try {
      const response = await this.callPost('WHS', 'LAYOUT=WH', xml)
      whsSuccess = response.status >= 0
      bionexoResult = response.status > 0
        ? `Bionexo: enviada com sucesso (ID: ${response.timestamp})`
        : response.status === 0 ? 'Bionexo: processada sem retorno'
        : `Bionexo: erro - ${response.data}`
    } catch (error: any) {
      bionexoResult = `Bionexo: ${this.formatBionexoError(error)}`
      whsSuccess = false
    }

    if (whsSuccess) {
      await this.prisma.cotacao.update({
        where: { id: cotacaoId },
        data: { status: 'COTACAO_ENVIADA', syncedAt: new Date() },
      })

      await this.prisma.cotacaoItem.updateMany({
        where: { cotacaoId, precoUnitario: { not: null } },
        data: { categoria: 'COTADO' },
      })
    }

    await this.prisma.syncLog.create({
      data: {
        operacao: 'WHS',
        direcao: 'OUT',
        status: whsSuccess ? 'SUCESSO' : 'ERRO',
        mensagem: `PDC ${cotacao.bionexoId}: ${bionexoResult} | ${itensParaEnviar.length} itens`,
        processadas: itensParaEnviar.length,
      },
    })

    return {
      success: whsSuccess,
      message: `Cotação ${cotacao.bionexoId}: ${bionexoResult}`,
      bionexoId: cotacao.bionexoId,
      itensEnviados: itensParaEnviar.length,
    }
  }

  // ==================== WGA — Prorrogações + WJG — Pedidos Confirmados ====================

  async atualizar() {
    try {
      const config = await this.getConfig()

      // WGA — Prorrogações/antecipações de vencimento
      // Doc v3.14 pág 17: usar DT_BEGIN/DT_END (TOKEN descontinuado desde v3.5)
      // Range recomendado: 5 minutos antes da hora atual
      const now = new Date()
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)
      const formatDt = (d: Date) => {
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = d.getFullYear()
        const hh = String(d.getHours()).padStart(2, '0')
        const mi = String(d.getMinutes()).padStart(2, '0')
        const ss = String(d.getSeconds()).padStart(2, '0')
        return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`
      }
      const wgaParams = `DT_BEGIN=${formatDt(fiveMinAgo)};DT_END=${formatDt(now)};LAYOUT=WG;ISO=0`
      this.logger.log(`[WGA] Buscando prorrogações: ${wgaParams}`)

      const resWGA = await this.callRequest('WGA', wgaParams)
      let wgaSaved = 0
      if (resWGA.status > 0 && resWGA.data && resWGA.data !== 'null') {
        wgaSaved = await this.parseAndUpdateWGA(resWGA.data)
      }
      await this.prisma.syncLog.create({
        data: {
          operacao: 'WGA', direcao: 'IN',
          status: resWGA.status >= 0 ? 'SUCESSO' : 'ERRO',
          mensagem: resWGA.status > 0 ? `${resWGA.status} prorrogações, ${wgaSaved} atualizadas` : 'Sem prorrogações',
          processadas: wgaSaved,
        },
      })

      // WJG — Pedidos confirmados
      // Doc v3.14 pág 19: TOKEN=0 não é recomendado (pode causar timeout)
      // Usar ultimoTokenWJG armazenado (token WJG é separado do WGG)
      const tokenWJG = config.ultimoTokenWJG || '0'
      const wjgParams = `TOKEN=${tokenWJG};LAYOUT=WJ;ISO=0`
      this.logger.log(`[WJG] Buscando pedidos confirmados: ${wjgParams}`)

      const resWJG = await this.callRequest('WJG', wjgParams)
      let wijSaved = 0
      if (resWJG.status > 0 && resWJG.data && resWJG.data !== 'null') {
        wijSaved = await this.parseAndSaveWJG(resWJG.data)
      }

      // Atualizar token WJG se retornou novo (doc: ID_PDC retornado deve ser o próximo TOKEN)
      if (resWJG.timestamp && resWJG.timestamp !== '0') {
        await this.prisma.bionexoConfig.update({
          where: { id: config.id },
          data: { ultimoTokenWJG: resWJG.timestamp },
        })
      }

      const log = await this.prisma.syncLog.create({
        data: {
          operacao: 'WJG', direcao: 'IN',
          status: resWJG.status >= 0 ? 'SUCESSO' : 'ERRO',
          mensagem: resWJG.status > 0 ? `${resWJG.status} pedidos, ${wijSaved} novos salvos` : 'Sem pedidos novos',
          processadas: wijSaved,
        },
      })
      return { id: log.id, operacao: log.operacao, direcao: log.direcao, status: log.status, mensagem: log.mensagem, processadas: log.processadas, createdAt: log.createdAt }
    } catch (error) {
      const msg = this.formatBionexoError(error)
      return this.prisma.syncLog.create({
        data: { operacao: 'WJG', direcao: 'IN', status: 'ERRO', mensagem: msg, processadas: 0 },
      })
    }
  }

  // Parse WGA — Mesmo layout WG, atualiza datas de vencimento
  private async parseAndUpdateWGA(xmlData: string): Promise<number> {
    const parser = new xml2js.Parser({ explicitArray: false })
    const result = await parser.parseStringPromise(xmlData)
    const pedidos = this.toArray(result?.Pedidos?.Pedido)
    let updated = 0

    for (const pedido of pedidos) {
      const cab = pedido.Cabecalho
      if (!cab) continue
      const bionexoId = parseInt(cab.Id_Pdc)
      if (isNaN(bionexoId)) continue

      const [d, m, y] = (cab.Data_Vencimento || '').split('/')
      const dataVenc = new Date(`${y}-${m}-${d}`)

      try {
        await this.prisma.cotacao.update({
          where: { bionexoId },
          data: {
            dataVencimento: isNaN(dataVenc.getTime()) ? undefined : dataVenc,
            horaVencimento: cab.Hora_Vencimento || undefined,
          },
        })
        updated++
      } catch {
        // Cotação não encontrada no banco — ignorar
      }
    }
    return updated
  }

  // Parse WJG — Layout WJ (pedidos confirmados)
  private async parseAndSaveWJG(xmlData: string): Promise<number> {
    const parser = new xml2js.Parser({ explicitArray: false })
    const result = await parser.parseStringPromise(xmlData)
    const confirmados = this.toArray(result?.Confirmados?.Confirmado)
    let saved = 0

    for (const conf of confirmados) {
      const cab = conf.Cabecalho
      if (!cab) continue

      const idPdc = parseInt(cab.Id_Pdc)
      const itens = this.toArray(conf.Itens_Confirmados?.Item_Confirmado)

      for (const item of itens) {
        const idConfirmacao = parseInt(item.Id_Confirmacao)
        if (isNaN(idConfirmacao)) continue

        // Skip if already saved
        const existing = await this.prisma.pedido.findUnique({ where: { idConfirmacao } })
        if (existing) continue

        await this.prisma.pedido.create({
          data: {
            idPdc,
            idConfirmacao,
            idArtigo: parseInt(item.Id_Artigo) || 0,
            codigoProduto: item.Codigo_Produto ? String(item.Codigo_Produto) : null,
            descricaoProduto: item.Descricao_Produto || null,
            quantidade: parseFloat(item.Quantidade) || 0,
            unidadeMedida: item.Unidade_Medida || null,
            fabricante: item.Fabricante || null,
            nomeHospital: cab.Nome_Hospital || '',
            cnpjHospital: cab.CNPJ_Hospital || '',
            contato: cab.Contato || null,
            formaPagamento: cab.Forma_Pagamento || null,
            enderecoEntrega: cab.Endereco_Entrega || null,
            observacao: cab.Observacao || null,
          },
        })
        saved++
      }

      // Update cotacao status to PEDIDO_GERADO
      try {
        await this.prisma.cotacao.update({
          where: { bionexoId: idPdc },
          data: { status: 'PEDIDO_GERADO' },
        })
      } catch { /* cotação não encontrada */ }
    }
    return saved
  }

  // ==================== WKN — Status dos Itens Respondidos ====================

  async verificarStatus(idPdc: number) {
    try {
      const response = await this.callRequest('WKN', `ID=${idPdc};LAYOUT=WK;ISO=0`)

      if (response.status > 0 && response.data && response.data !== 'null') {
        const statusItems = await this.parseWKN(response.data)
        await this.prisma.syncLog.create({
          data: { operacao: 'WKN', direcao: 'IN', status: 'SUCESSO', mensagem: `PDC ${idPdc}: ${statusItems.length} itens com status`, processadas: statusItems.length },
        })
        return { success: true, items: statusItems }
      }

      return { success: true, items: [], message: 'Sem status disponível' }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro'
      return { success: false, message: msg }
    }
  }

  private async parseWKN(xmlData: string): Promise<any[]> {
    const parser = new xml2js.Parser({ explicitArray: false })
    const result = await parser.parseStringPromise(xmlData)
    const pedidos = this.toArray(result?.Pedidos?.Pedido)
    const statusItems: any[] = []

    for (const pedido of pedidos) {
      const cab = pedido.Cabecalho
      const itens = this.toArray(pedido.Itens?.Item)

      for (const item of itens) {
        statusItems.push({
          idPdc: cab?.Id_Pdc,
          idArtigo: parseInt(item.Id_Artigo) || 0,
          codigoProduto: item.Codigo_Produto || '',
          status: item.Status || 'Desconhecido',
        })

        // Update cotacao status based on WKN response
        const statusMap: Record<string, string> = {
          'Adquirido de outra empresa': 'ADQUIRIDO_OUTRA',
          'Em analise pelo hospital': 'EM_ANALISE',
          'Cancelado': 'CANCELADO',
        }
        const mappedStatus = statusMap[item.Status]
        if (mappedStatus && cab?.Id_Pdc) {
          try {
            await this.prisma.cotacao.update({
              where: { bionexoId: parseInt(cab.Id_Pdc) },
              data: { status: mappedStatus as any },
            })
          } catch { /* not found */ }
        }
      }
    }
    return statusItems
  }

  // ==================== WMG — Dados Cadastrais do Comprador ====================

  async buscarCadastro(cnpj: string) {
    try {
      // Doc v3.14 pág 23: WMG busca por CNPJ, formato XX.XXX.XXX/XXXX-XX
      const params = `ISO=0;LAYOUT=WM;CNPJ=${cnpj}`
      this.logger.log(`[WMG] Buscando cadastro: ${params}`)

      const response = await this.callRequest('WMG', params)

      if (response.status > 0 && response.data && response.data !== 'null') {
        const empresas = await this.parseWMG(response.data)
        await this.prisma.syncLog.create({
          data: { operacao: 'WMG', direcao: 'IN', status: 'SUCESSO', mensagem: `CNPJ ${cnpj}: ${empresas.length} empresa(s) encontrada(s)`, processadas: empresas.length },
        })
        return { success: true, empresas }
      }

      await this.prisma.syncLog.create({
        data: { operacao: 'WMG', direcao: 'IN', status: 'SUCESSO', mensagem: `CNPJ ${cnpj}: nenhum cadastro encontrado`, processadas: 0 },
      })
      return { success: true, empresas: [], message: 'Nenhum cadastro encontrado' }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro'
      await this.prisma.syncLog.create({
        data: { operacao: 'WMG', direcao: 'IN', status: 'ERRO', mensagem: `CNPJ ${cnpj}: ${msg}`, processadas: 0 },
      })
      return { success: false, message: msg }
    }
  }

  private async parseWMG(xmlData: string): Promise<any[]> {
    const parser = new xml2js.Parser({ explicitArray: false })
    const result = await parser.parseStringPromise(xmlData)
    const empresas = this.toArray(result?.Empresas?.Empresa)

    return empresas.map((emp: any) => ({
      razaoSocial: emp.Razao_Social || '',
      nomeFantasia: emp.Nome_Fantasia || '',
      cnpj: emp.CNPJ || '',
      inscricaoEstadual: emp.Inscricao_Estadual || '',
      cep: emp.CEP || '',
      logradouro: emp.Logradouro || '',
      cidade: emp.Cidade || '',
      estado: emp.Estado || '',
      estadoSigla: emp.Estado_Sigla || '',
      pais: emp.Pais || '',
      telefone: emp.Telefone || '',
      fax: emp.Fax || '',
      contato: emp.Contato || '',
      email: emp.Email || '',
      tipoEmpresa: emp.Tipo_Empresa || '',
      categoria: emp.Categoria || '',
    }))
  }

  // ==================== Seed Cotações de Teste ====================

  async seedCotacoesTeste() {
    this.logger.log('[SEED] Inserindo cotações de teste para homologação...')

    const cotacoesTeste = [
      {
        bionexoId: 211652791,
        tituloPdc: 'Cotação criada por automação',
        nomeHospital: 'Automacao Cypress Classica Filial 1',
        cnpjHospital: '74.715.947/0001-15',
        ufHospital: 'PI',
        cidadeHospital: 'ACAUÃ',
        dataVencimento: new Date('2030-03-24'),
        horaVencimento: '19:03',
        idFormaPagamento: 30,
        formaPagamento: '30 DDL',
        contato: 'Automação Cypress',
        observacaoComprador: 'Cotação de teste para homologação EDI',
        termos: 'Obrigatório fornecimento de Materiais Hospitalares. A entrega deve ser no máximo em 15 dias.',
        itens: {
          create: [
            {
              sequencia: 1,
              idArtigo: 136822011,
              descricaoBionexo: 'AAS | 100mg | Comprimido | SANOFI MEDLEY',
              quantidade: 10.0,
              unidadeMedida: 'Comprimido',
              idUnidadeMedida: 29,
              marcaFavorita: 'SANOFI MEDLEY',
              codigoProduto: '11781528',
            },
          ],
        },
      },
      {
        bionexoId: 211652737,
        tituloPdc: 'Cotação de Materiais Hospitalares Diversos',
        nomeHospital: 'Associação das Pioneiras Sociais - Rede Sarah',
        cnpjHospital: '37.113.180/0004-70',
        ufHospital: 'DF',
        cidadeHospital: 'BRASÍLIA',
        dataVencimento: new Date('2030-03-31'),
        horaVencimento: '15:00',
        idFormaPagamento: 3,
        formaPagamento: '30 ddl',
        contato: 'PATRICIA MARIA DE SEIXAS BITTENCOURT',
        observacaoComprador: 'Obrigatório fornecimento de Materiais Hospitalares',
        termos: 'A entrega deve ser no máximo em 15 dias.',
        itens: {
          create: [
            {
              sequencia: 1,
              idArtigo: 136821959,
              descricaoBionexo: 'CURATIVO FILME TRANSPARENTE, TIPO BARREIRA',
              quantidade: 3.0,
              unidadeMedida: 'Peça',
              idUnidadeMedida: 8,
              codigoProduto: '10001196',
            },
            {
              sequencia: 2,
              idArtigo: 136821960,
              descricaoBionexo: 'COMPRESSA CAMPO OPERATORIO, 100% ALGODÃO',
              quantidade: 2.0,
              unidadeMedida: 'Pacote',
              codigoProduto: '10001475',
            },
            {
              sequencia: 3,
              idArtigo: 136821961,
              descricaoBionexo: 'LUVA CIRURGICA ESTERIL, LATEX, TAM 7.5',
              quantidade: 50.0,
              unidadeMedida: 'Par',
              codigoProduto: '10002834',
            },
          ],
        },
      },
      {
        bionexoId: 211654500,
        tituloPdc: 'Medicamentos Uso Contínuo - Abril/2026',
        nomeHospital: 'Hospital Santa Maria',
        cnpjHospital: '12.345.678/0001-90',
        ufHospital: 'SP',
        cidadeHospital: 'SÃO PAULO',
        dataVencimento: new Date('2030-04-15'),
        horaVencimento: '18:00',
        idFormaPagamento: 1,
        formaPagamento: 'A Vista',
        contato: 'Farmácia Central',
        observacaoComprador: 'Favor colocar nº do Pedido na NF',
        itens: {
          create: [
            {
              sequencia: 1,
              idArtigo: 136830001,
              descricaoBionexo: 'DIPIRONA SODICA 500MG | Comprimido | EMS',
              quantidade: 1000.0,
              unidadeMedida: 'Comprimido',
              idUnidadeMedida: 29,
              codigoProduto: '20001001',
            },
            {
              sequencia: 2,
              idArtigo: 136830002,
              descricaoBionexo: 'AMOXICILINA 500MG | Cápsula | EUROFARMA',
              quantidade: 500.0,
              unidadeMedida: 'Cápsula',
              idUnidadeMedida: 31,
              codigoProduto: '20001002',
            },
          ],
        },
      },
    ]

    // Carrega regras+mapeamentos uma vez para o batch (mesmo padrão de parseAndSaveWGG)
    const [mapeamentos, regras] = await Promise.all([
      this.prisma.mapeamentoSku.findMany(),
      this.prisma.regraPalavraChave.findMany(),
    ])
    const regraMatchCount = new Map<string, number>()

    let created = 0
    for (const cotacao of cotacoesTeste) {
      const existing = await this.prisma.cotacao.findUnique({ where: { bionexoId: cotacao.bionexoId } })
      if (existing) continue

      // Aplica classificação automática a cada item antes de criar
      const itensComClassificacao = cotacao.itens.create.map(item => {
        const classification = this.classifyItem(item.descricaoBionexo, mapeamentos, regras)
        for (const id of classification.matchedRegraIds) {
          regraMatchCount.set(id, (regraMatchCount.get(id) || 0) + 1)
        }
        return {
          ...item,
          categoria: classification.categoria,
          codigoInterno: classification.codigoInterno,
          descricaoInterna: classification.descricaoInterna,
        }
      })

      await this.prisma.cotacao.create({
        data: {
          ...cotacao,
          itens: { create: itensComClassificacao },
        },
      })
      created++
    }

    // Incrementa counter de matches
    if (regraMatchCount.size > 0) {
      await Promise.all(
        Array.from(regraMatchCount.entries()).map(([id, count]) =>
          this.prisma.regraPalavraChave.update({
            where: { id },
            data: { matches: { increment: count } },
          }),
        ),
      )
    }

    this.logger.log(`[SEED] ${created} cotações de teste inseridas (${regraMatchCount.size} regras casaram)`)
    return {
      success: true,
      message: `${created} cotações de teste inseridas com ${cotacoesTeste.reduce((sum, c) => sum + (c.itens.create?.length || 0), 0)} itens. Acesse a lista de cotações para testar o fluxo.`,
      created,
    }
  }

  /**
   * S1.7 — Aplica regras de classificação automática (RegraPalavraChave + MapeamentoSku)
   * a TODOS os itens existentes que ainda não foram processados ou pareados.
   *
   * Útil para:
   * - Reprocessar itens históricos depois de criar uma nova regra
   * - Limpar a "dívida histórica" depois de subir o S1.1 pela primeira vez
   * - Re-rodar quando o operador adiciona novas keywords/mapeamentos
   *
   * Critério de seleção: itens com `categoria=NAO_ANALISADO` OU sem `codigoInterno`.
   * Itens já cotados ou descartados manualmente NÃO são tocados.
   */
  async aplicarRegrasRetroativo(): Promise<{
    total: number
    classificados: number
    pareados: number
    matchesIncrementados: number
  }> {
    this.logger.log('[APLICAR-REGRAS] Iniciando aplicação retroativa...')

    const [mapeamentos, regras, itens] = await Promise.all([
      this.prisma.mapeamentoSku.findMany(),
      this.prisma.regraPalavraChave.findMany(),
      this.prisma.cotacaoItem.findMany({
        where: {
          OR: [
            { categoria: 'NAO_ANALISADO' },
            { codigoInterno: null },
          ],
        },
        select: { id: true, descricaoBionexo: true, categoria: true, codigoInterno: true },
      }),
    ])

    const regraMatchCount = new Map<string, number>()
    let classificados = 0
    let pareados = 0

    for (const item of itens) {
      const classification = this.classifyItem(item.descricaoBionexo, mapeamentos, regras)
      const updateData: any = {}
      let touched = false

      // Só pareia se ainda não tem SKU
      if (!item.codigoInterno && classification.codigoInterno) {
        updateData.codigoInterno = classification.codigoInterno
        updateData.descricaoInterna = classification.descricaoInterna
        pareados++
        touched = true
      }

      // Só classifica se ainda está NAO_ANALISADO
      if (item.categoria === 'NAO_ANALISADO' && classification.categoria !== 'NAO_ANALISADO') {
        updateData.categoria = classification.categoria
        classificados++
        touched = true
      }

      if (touched) {
        await this.prisma.cotacaoItem.update({ where: { id: item.id }, data: updateData })
        for (const id of classification.matchedRegraIds) {
          regraMatchCount.set(id, (regraMatchCount.get(id) || 0) + 1)
        }
      }
    }

    if (regraMatchCount.size > 0) {
      await Promise.all(
        Array.from(regraMatchCount.entries()).map(([id, count]) =>
          this.prisma.regraPalavraChave.update({
            where: { id },
            data: { matches: { increment: count } },
          }),
        ),
      )
    }

    const matchesIncrementados = Array.from(regraMatchCount.values()).reduce((a, b) => a + b, 0)
    this.logger.log(
      `[APLICAR-REGRAS] ${itens.length} itens analisados, ${classificados} classificados, ${pareados} pareados, ${matchesIncrementados} matches incrementados`,
    )

    return {
      total: itens.length,
      classificados,
      pareados,
      matchesIncrementados,
    }
  }

  // ==================== Reset Homologação ====================

  async resetHomologacao(limparTudo = false) {
    if (limparTudo) {
      this.logger.warn('[RESET] LIMPANDO TUDO — apagando todas cotações, itens, pedidos e logs...')

      // Ordem: itens primeiro (FK), depois cotações, pedidos, logs
      const itens = await this.prisma.cotacaoItem.deleteMany({})
      const cotacoes = await this.prisma.cotacao.deleteMany({})
      const pedidos = await this.prisma.pedido.deleteMany({})
      const logs = await this.prisma.syncLog.deleteMany({})

      await this.prisma.bionexoConfig.updateMany({
        data: { ultimoToken: '0', ultimoTokenWJG: '0' },
      })

      this.logger.warn(`[RESET] Tudo apagado: ${cotacoes.count} cotações, ${itens.count} itens, ${pedidos.count} pedidos, ${logs.count} logs`)

      return {
        success: true,
        message: `Banco zerado: ${cotacoes.count} cotações apagadas, ${itens.count} itens, ${pedidos.count} pedidos, ${logs.count} logs removidos. Clique "Receber novos" para baixar do Bionexo.`,
        cotacoes: cotacoes.count,
        itens: itens.count,
        pedidos: pedidos.count,
        logs: logs.count,
      }
    }

    this.logger.warn('[RESET] Resetando status de homologação (mantendo dados)...')

    const cotacoes = await this.prisma.cotacao.updateMany({
      data: { status: 'RECEBIDO', syncedAt: null },
    })

    const itens = await this.prisma.cotacaoItem.updateMany({
      data: {
        categoria: 'NAO_ANALISADO',
        precoUnitario: null,
        codigoInterno: null,
        descricaoInterna: null,
        comentario: null,
        observacaoFornecedor: null,
      },
    })

    const pedidos = await this.prisma.pedido.deleteMany({})
    await this.prisma.bionexoConfig.updateMany({
      data: { ultimoToken: '0', ultimoTokenWJG: '0' },
    })
    const logs = await this.prisma.syncLog.deleteMany({})

    this.logger.warn(`[RESET] Concluído: ${cotacoes.count} cotações resetadas, ${itens.count} itens limpos, ${pedidos.count} pedidos removidos`)

    return {
      success: true,
      message: `Homologação resetada: ${cotacoes.count} cotações → RECEBIDO, ${itens.count} itens limpos, ${pedidos.count} pedidos removidos`,
      cotacoes: cotacoes.count,
      itens: itens.count,
      pedidos: pedidos.count,
      logs: logs.count,
    }
  }

  // ==================== Utilitários ====================

  async status() {
    const lastLog = await this.prisma.syncLog.findFirst({ orderBy: { createdAt: 'desc' } })
    const config = await this.prisma.bionexoConfig.findFirst()
    return {
      ultimaOperacao: lastLog,
      configurado: !!(config?.usuario && config?.senha),
      botAtivo: config?.botAtivo || false,
      ambiente: config?.ambiente || 'SANDBOX',
    }
  }

  async testarConexao(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.callRequest('WGG', 'LAYOUT=WG;TOKEN=0;ISO=0')
      if (response.status >= 0) {
        return { success: true, message: `Conexão OK (status: ${response.status}, token: ${response.timestamp})` }
      }
      return { success: false, message: `Erro: ${response.data}` }
    } catch (error) {
      return { success: false, message: this.formatBionexoError(error) }
    }
  }

  async debugConexao(): Promise<any> {
    const steps: any[] = []
    const start = Date.now()

    let config: any
    try {
      config = await this.getConfig()
      steps.push({
        step: 1, label: 'Carregar Configuração', status: 'OK', ms: Date.now() - start,
        data: { usuario: config.usuario, wsdlUrl: config.wsdlUrl, ambiente: config.ambiente, ultimoToken: config.ultimoToken },
      })
    } catch (e: any) {
      steps.push({ step: 1, label: 'Carregar Configuração', status: 'ERRO', ms: Date.now() - start, error: e.message })
      return { success: false, steps, totalMs: Date.now() - start }
    }

    const t2 = Date.now()
    try {
      const https = await import('https')
      const http = await import('http')
      const parsed = new URL(config.wsdlUrl)
      const mod = parsed.protocol === 'https:' ? https : http
      const wsdlResult = await new Promise<{ statusCode: number; body: string; headers: any }>((resolve, reject) => {
        const req = mod.get(config.wsdlUrl, { timeout: 10000 }, (res: any) => {
          let body = ''
          res.on('data', (chunk: string) => body += chunk)
          res.on('end', () => resolve({ statusCode: res.statusCode, body: body.substring(0, 500), headers: res.headers }))
        })
        req.on('error', reject)
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout 10s')) })
      })
      steps.push({
        step: 2, label: 'GET WSDL', status: wsdlResult.statusCode === 200 ? 'OK' : `HTTP ${wsdlResult.statusCode}`, ms: Date.now() - t2,
        data: { url: config.wsdlUrl, httpStatus: wsdlResult.statusCode, contentType: wsdlResult.headers?.['content-type'] || 'N/A', bodyPreview: wsdlResult.body.substring(0, 300), isWsdlXml: wsdlResult.body.includes('<definitions') || wsdlResult.body.includes('<wsdl:') },
      })
    } catch (e: any) {
      steps.push({ step: 2, label: 'GET WSDL', status: 'ERRO', ms: Date.now() - t2, error: e.message, data: { url: config.wsdlUrl } })
    }

    const t3 = Date.now()
    let client: any
    try {
      client = await soap.createClientAsync(config.wsdlUrl)
      const desc = client.describe()
      steps.push({ step: 3, label: 'Criar SOAP Client', status: 'OK', ms: Date.now() - t3, data: { services: Object.keys(desc), endpoint: client.getEndpoint?.() || 'N/A' } })
    } catch (e: any) {
      steps.push({ step: 3, label: 'Criar SOAP Client', status: 'ERRO', ms: Date.now() - t3, error: e.message })
      return { success: false, steps, totalMs: Date.now() - start }
    }

    const t4 = Date.now()
    const soapRequest = { login: config.usuario, password: '***', operation: 'WGG', parameters: 'LAYOUT=WG;TOKEN=0;ISO=0' }
    try {
      const [result, rawResponse, soapHeader, rawRequest] = await client.requestAsync({
        login: config.usuario, password: config.senha, operation: 'WGG', parameters: 'LAYOUT=WG;TOKEN=0;ISO=0',
      })
      const raw = String(result?.return || '')
      const parsed = this.parseResponse(raw)
      steps.push({
        step: 4, label: 'SOAP Request (WGG)', status: parsed.status >= 0 ? 'OK' : 'ERRO', ms: Date.now() - t4,
        data: { requestSent: soapRequest, rawXmlSent: typeof rawRequest === 'string' ? rawRequest.substring(0, 500) : 'N/A', rawResponse: raw.substring(0, 500), parsed: { status: parsed.status, timestamp: parsed.timestamp, dataPreview: parsed.data?.substring(0, 200) || 'null' } },
      })
    } catch (e: any) {
      steps.push({
        step: 4, label: 'SOAP Request (WGG)', status: 'ERRO', ms: Date.now() - t4, error: e.message,
        data: { requestSent: soapRequest, isAkamai503: e.message?.includes('Reference') || e.message?.includes('503') },
      })
    }

    return { success: steps.every(s => s.status === 'OK'), ambiente: config.ambiente, wsdlUrl: config.wsdlUrl, steps, totalMs: Date.now() - start }
  }
}
