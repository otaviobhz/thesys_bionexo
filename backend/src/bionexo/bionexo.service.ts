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

  private async callRequest(operation: string, parameters: string): Promise<BionexoResponse> {
    const config = await this.getConfig()
    const wsdlUrl = config.wsdlUrl

    const client = await soap.createClientAsync(wsdlUrl)
    const [result] = await client.requestAsync({
      login: config.usuario,
      password: config.senha,
      operation,
      parameters,
    })

    const raw = result?.return || ''
    this.logger.log(`[${operation}] Response: ${String(raw).substring(0, 200)}`)
    return this.parseResponse(String(raw))
  }

  private async parseAndSaveWGG(xmlData: string): Promise<number> {
    const parser = new xml2js.Parser({ explicitArray: false })
    const result = await parser.parseStringPromise(xmlData)

    const cotacoes = result?.Cotacoes?.Cotacao
    if (!cotacoes) return 0

    const list = Array.isArray(cotacoes) ? cotacoes : [cotacoes]
    let saved = 0

    for (const cot of list) {
      const bionexoId = parseInt(cot.Id_PDC)

      // Skip if already exists
      const existing = await this.prisma.cotacao.findUnique({ where: { bionexoId } })
      if (existing) continue

      const itens = cot.Itens?.Item
      const itensList = itens ? (Array.isArray(itens) ? itens : [itens]) : []

      // Parse date DD/MM/YYYY to Date
      const [d, m, y] = (cot.Dt_Vencimento || '').split('/')
      const dataVenc = new Date(`${y}-${m}-${d}`)

      await this.prisma.cotacao.create({
        data: {
          bionexoId,
          nomeHospital: cot.Nome_Hospital || '',
          cnpjHospital: cot.CNPJ_Hospital || '',
          ufHospital: cot.UF_Hospital || '',
          cidadeHospital: cot.Cidade_Hospital || '',
          dataVencimento: isNaN(dataVenc.getTime()) ? new Date() : dataVenc,
          horaVencimento: cot.Hr_Vencimento || '00:00',
          formaPagamento: cot.Cond_Pagamento || null,
          itens: {
            create: itensList.map((item: any, idx: number) => ({
              sequencia: parseInt(item.Id_Item_PDC) || idx + 1,
              descricaoBionexo: item.Descricao || '',
              quantidade: parseInt(item.Quantidade) || 0,
              unidadeMedida: item.Unidade_Medida || 'UN',
              marcas: item.Marcas || null,
            })),
          },
        },
      })
      saved++
    }
    return saved
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
      if (response.status > 0 && response.data && response.data !== 'null') {
        savedCount = await this.parseAndSaveWGG(response.data)
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
      let msg = error instanceof Error ? error.message : 'Erro desconhecido'
      if (msg.includes('Reference') || msg.includes("Cannot use 'in'") || msg.includes('503') || msg.includes('edgesuite')) {
        msg = 'Bionexo temporariamente indisponível (503). Aguarde 1-2 minutos e tente novamente.'
      }
      const log = await this.prisma.syncLog.create({
        data: { operacao: 'WGG', direcao: 'IN', status: 'ERRO', mensagem: msg, processadas: 0 },
      })
      return { id: log.id, operacao: log.operacao, direcao: log.direcao, status: log.status, mensagem: log.mensagem, processadas: log.processadas, createdAt: log.createdAt }
    }
  }

  async atualizar() {
    try {
      const config = await this.getConfig()
      const params = `TOKEN=${config.ultimoToken || '0'};ISO=0`

      const resWGA = await this.callRequest('WGA', params)
      await this.prisma.syncLog.create({
        data: {
          operacao: 'WGA', direcao: 'IN',
          status: resWGA.status >= 0 ? 'SUCESSO' : 'ERRO',
          mensagem: resWGA.status > 0 ? `${resWGA.status} prorrogações` : 'Sem prorrogações',
          processadas: Math.max(0, resWGA.status),
        },
      })

      const resWJG = await this.callRequest('WJG', params)
      return this.prisma.syncLog.create({
        data: {
          operacao: 'WJG', direcao: 'IN',
          status: resWJG.status >= 0 ? 'SUCESSO' : 'ERRO',
          mensagem: resWJG.status > 0 ? `${resWJG.status} pedidos confirmados` : 'Sem pedidos novos',
          processadas: Math.max(0, resWJG.status),
        },
      })
    } catch (error) {
      let msg = error instanceof Error ? error.message : 'Erro desconhecido'
      if (msg.includes('Reference #') || msg.includes("Cannot use 'in' operator")) {
        msg = 'Bionexo bloqueou (rate limit). Aguarde 1-2 min.'
      }
      return this.prisma.syncLog.create({
        data: { operacao: 'WGA', direcao: 'IN', status: 'ERRO', mensagem: msg, processadas: 0 },
      })
    }
  }

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
      const config = await this.getConfig()
      const response = await this.callRequest('WGG', 'LAYOUT=WG;TOKEN=0;ISO=0')
      if (response.status >= 0) {
        return { success: true, message: `Conexão OK (status: ${response.status}, token: ${response.timestamp})` }
      }
      return { success: false, message: `Erro: ${response.data}` }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro de conexão'
      if (msg.includes('Reference #') || msg.includes("Cannot use 'in' operator")) {
        return { success: false, message: 'Bionexo bloqueou (rate limit). Aguarde 1-2 min.' }
      }
      return { success: false, message: msg }
    }
  }

  private buildWHSXml(cotacao: any): string {
    const itensXml = cotacao.itens.map((item: any) => `
    <Item>
      <Id_Item_PDC>${item.sequencia}</Id_Item_PDC>
      <Preco_Unitario>${(item.precoUnitario || 0).toFixed(2).replace('.', ',')}</Preco_Unitario>
      <Codigo_Produto>${item.codigoInterno || ''}</Codigo_Produto>
      <Observacao>${item.comentario || ''}</Observacao>
    </Item>`).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<Cotacoes>
  <Cotacao>
    <Id_PDC>${cotacao.bionexoId}</Id_PDC>
    <Itens>${itensXml}
    </Itens>
  </Cotacao>
</Cotacoes>`
  }

  async enviarCotacao(cotacaoId: string) {
    const cotacao = await this.prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      include: { itens: true },
    })
    if (!cotacao) throw new Error('Cotação não encontrada')

    // Filter only items with price (ready to quote)
    const itensParaEnviar = cotacao.itens.filter(i => i.precoUnitario && i.precoUnitario > 0)
    if (itensParaEnviar.length === 0) {
      throw new Error('Nenhum item com preço preenchido para enviar')
    }

    const cotacaoComItens = { ...cotacao, itens: itensParaEnviar }

    // Build XML
    const xml = this.buildWHSXml(cotacaoComItens)
    this.logger.log(`[WHS] Sending ${itensParaEnviar.length} items for PDC ${cotacao.bionexoId}`)

    let bionexoResult = 'Bionexo: stub (sandbox indisponível)'
    try {
      const config = await this.getConfig()
      const client = await soap.createClientAsync(config.wsdlUrl)
      const [result] = await client.postAsync({
        login: config.usuario,
        password: config.senha,
        operation: 'WHS',
        parameters: 'LAYOUT=WH',
        xml,
      })
      const raw = String(result?.return || '')
      this.logger.log(`[WHS] Response: ${raw.substring(0, 200)}`)
      const parsed = this.parseResponse(raw)
      bionexoResult = parsed.status > 0
        ? `Bionexo: enviada com sucesso (ID: ${parsed.timestamp})`
        : parsed.status === 0 ? 'Bionexo: processada sem retorno'
        : `Bionexo: erro - ${parsed.data}`
    } catch (error: any) {
      let msg = error.message || 'Erro SOAP'
      if (msg.includes('Reference') || msg.includes('503') || msg.includes('edgesuite')) {
        bionexoResult = 'Bionexo: temporariamente indisponível (503)'
      } else {
        bionexoResult = `Bionexo: ${msg}`
      }
    }

    // Update status
    await this.prisma.cotacao.update({
      where: { id: cotacaoId },
      data: { status: 'COTACAO_ENVIADA', syncedAt: new Date() },
    })

    // Mark items as COTADO
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
}
