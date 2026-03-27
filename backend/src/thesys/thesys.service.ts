import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class ThesysService {
  private readonly logger = new Logger(ThesysService.name)
  private readonly baseUrl = process.env.THESYS_BASE_URL || ''
  private readonly keys = {
    itens: process.env.THESYS_APIKEY_ITENS || '',
    precos: process.env.THESYS_APIKEY_PRECOS || '',
    hospitais: process.env.THESYS_APIKEY_HOSPITAIS || '',
    cotacao: process.env.THESYS_APIKEY_COTACAO || '',
  }

  private isConfigured(): boolean {
    return !!(this.baseUrl && this.keys.itens)
  }

  async getItens(search?: string) {
    if (!this.isConfigured()) return this.mockItens(search)

    try {
      const { data } = await axios.get(`${this.baseUrl}/bionexo/itens`, {
        headers: { 'X-API-Key': this.keys.itens },
        timeout: 15000,
      })

      let mapped = (data || []).map((item: any) => ({
        id: item.Id_Item,
        sku: item.Codigo,
        descricao: item.descricao,
        unidade: String(item.id_unidade || ''),
      }))

      if (search) {
        const q = search.toUpperCase()
        mapped = mapped.filter((p: any) =>
          p.sku?.toUpperCase().includes(q) || p.descricao?.toUpperCase().includes(q),
        )
      }

      return mapped
    } catch (error: any) {
      this.logger.error(`Thesys itens: ${error.message}`)
      return this.mockItens(search)
    }
  }

  async getPrecos(cnpj?: string, codigo?: string) {
    if (!this.isConfigured()) return []

    try {
      const params: Record<string, string> = {}
      if (cnpj) params.cnpj_numerico = cnpj
      if (codigo) params.codigo = codigo

      const { data } = await axios.get(`${this.baseUrl}/bionexo/precos`, {
        headers: { 'X-API-Key': this.keys.precos },
        params,
        timeout: 15000,
      })

      return (data || []).map((p: any) => ({
        sku: p.sku,
        descricao: p.descricao,
        preco: typeof p.preco === 'string' ? parseFloat(p.preco.replace(',', '.')) : p.preco,
      }))
    } catch (error: any) {
      this.logger.error(`Thesys precos: ${error.message}`)
      return []
    }
  }

  async getHospitais() {
    if (!this.isConfigured()) return []

    try {
      const { data } = await axios.get(`${this.baseUrl}/bionexo/hospitais`, {
        headers: { 'X-API-Key': this.keys.hospitais },
        timeout: 15000,
      })
      return data || []
    } catch (error: any) {
      this.logger.error(`Thesys hospitais: ${error.message}`)
      return []
    }
  }

  async criarCotacao(body: any) {
    if (!this.isConfigured()) {
      return { id_venda_cotacao: 0, numero: 0, error: 'Thesys não configurado' }
    }

    try {
      const { data } = await axios.post(`${this.baseUrl}/bionexo/cotacao`, body, {
        headers: { 'X-API-Key': this.keys.cotacao, 'Content-Type': 'application/json' },
        timeout: 15000,
      })
      return data
    } catch (error: any) {
      this.logger.error(`Thesys cotacao: ${error.message}`)
      throw error
    }
  }

  async testarConexao(): Promise<{ success: boolean; message: string }> {
    if (!this.baseUrl) return { success: false, message: 'THESYS_BASE_URL não configurada' }
    try {
      const { data } = await axios.get(`${this.baseUrl}/helloworld`, { timeout: 5000 })
      return { success: true, message: `Conexão OK: ${data}` }
    } catch (error: any) {
      return { success: false, message: `Erro: ${error.message}` }
    }
  }

  private mockItens(search?: string) {
    const mock = [
      { id: 1, sku: '9928', descricao: 'SERINGA 10ML LUER LOCK', unidade: 'CX' },
      { id: 2, sku: '5512', descricao: 'GAZE ESTERIL 13F PCT C/10', unidade: 'PCT' },
      { id: 3, sku: '3301', descricao: 'LUVA CIR. ESTERIL 7.5', unidade: 'PAR' },
      { id: 4, sku: '4410', descricao: 'CATETER IV 18G', unidade: 'UN' },
      { id: 5, sku: '7710', descricao: 'FIO NYLON 3-0 C/AG', unidade: 'ENV' },
    ]
    if (!search) return mock
    const q = search.toUpperCase()
    return mock.filter((p) => p.sku.includes(q) || p.descricao.includes(q))
  }
}
