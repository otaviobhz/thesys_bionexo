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

  private async parseAndSaveWGG(xmlData: string): Promise<number> {
    const parser = new xml2js.Parser({ explicitArray: false })
    const result = await parser.parseStringPromise(xmlData)

    const pedidos = this.toArray(result?.Pedidos?.Pedido)
    if (pedidos.length === 0) return 0

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
            create: itensReq.map((item: any, idx: number) => ({
              sequencia: parseInt(item.Sequencia) || idx + 1,
              idArtigo: parseInt(item.Id_Artigo) || 0,
              descricaoBionexo: item.Descricao_Produto || '',
              quantidade: parseFloat(item.Quantidade) || 0,
              unidadeMedida: item.Unidade_Medida || 'UN',
              idUnidadeMedida: parseInt(item.Id_Unidade_Medida) || null,
              marcaFavorita: item.Marca_Favorita || null,
              codigoProduto: item.Codigo_Produto ? String(item.Codigo_Produto) : null,
              marcas: this.extractMarcas(item),
            })),
          },
        },
      })
      saved++
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

  private buildWHSXml(cotacao: any): string {
    const itensXml = cotacao.itens.map((item: any) => {
      const preco = (item.precoUnitario || 0).toFixed(2).replace('.', ',')
      return `
      <Item>
        <Id_Artigo>${item.idArtigo}</Id_Artigo>
        <Preco_Unitario>${preco}</Preco_Unitario>
        <Codigo_Produto_Fornecedor>${item.codigoInterno || ''}</Codigo_Produto_Fornecedor>
        <Fabricante>${item.marcaFavorita || ''}</Fabricante>
        <Observacao>${item.comentario || ''}</Observacao>
      </Item>`
    }).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<Pedidos>
  <Pedido>
    <Cabecalho>
      <Id_Pdc>${cotacao.bionexoId}</Id_Pdc>
      <Id_Forma_Pagamento>${cotacao.idFormaPagamento || 1}</Id_Forma_Pagamento>
    </Cabecalho>
    <Itens>${itensXml}
    </Itens>
  </Pedido>
</Pedidos>`
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
    try {
      const response = await this.callPost('WHS', 'LAYOUT=WH', xml)
      bionexoResult = response.status > 0
        ? `Bionexo: enviada com sucesso (ID: ${response.timestamp})`
        : response.status === 0 ? 'Bionexo: processada sem retorno'
        : `Bionexo: erro - ${response.data}`
    } catch (error: any) {
      bionexoResult = `Bionexo: ${this.formatBionexoError(error)}`
    }

    await this.prisma.cotacao.update({
      where: { id: cotacaoId },
      data: { status: 'COTACAO_ENVIADA', syncedAt: new Date() },
    })

    await this.prisma.cotacaoItem.updateMany({
      where: { cotacaoId, precoUnitario: { not: null } },
      data: { categoria: 'COTADO' },
    })

    await this.prisma.syncLog.create({
      data: {
        operacao: 'WHS',
        direcao: 'OUT',
        status: bionexoResult.includes('sucesso') || bionexoResult.includes('processada') ? 'SUCESSO' : 'ERRO',
        mensagem: `PDC ${cotacao.bionexoId}: ${bionexoResult} | ${itensParaEnviar.length} itens`,
        processadas: itensParaEnviar.length,
      },
    })

    return { success: true, message: `Cotação ${cotacao.bionexoId} enviada` }
  }

  // ==================== WGA — Prorrogações + WJG — Pedidos Confirmados ====================

  async atualizar() {
    try {
      const config = await this.getConfig()
      const params = `TOKEN=${config.ultimoToken || '0'};ISO=0`

      // WGA — Prorrogações/antecipações de vencimento
      const resWGA = await this.callRequest('WGA', params)
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

      // WJG — Pedidos confirmados (CORRIGIDO: era WJG)
      const resWJG = await this.callRequest('WJG', `TOKEN=0;LAYOUT=WJ;ISO=0`)
      let wijSaved = 0
      if (resWJG.status > 0 && resWJG.data && resWJG.data !== 'null') {
        wijSaved = await this.parseAndSaveWJG(resWJG.data)
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
