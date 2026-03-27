// ===== TYPES =====

export type CotacaoStatus =
  | 'RECEBIDO'
  | 'PAREADO'
  | 'COTACAO_ENVIADA'
  | 'EM_ANALISE'
  | 'ACEITA'
  | 'PEDIDO_GERADO'
  | 'ADQUIRIDO_OUTRA'
  | 'CANCELADO'

export type CategoriaItem = 'NAO_ANALISADO' | 'INTERESSANTE' | 'COTADO' | 'DESCARTADO'

export interface CotacaoItemFlat {
  id: string
  cotacaoId: number
  dataVencimento: string
  horaVencimento: string
  uf: string
  cidade: string
  nomeHospital: string
  cnpjHospital: string
  formaPagamento: string
  status: CotacaoStatus
  sequencia: number
  descricaoBionexo: string
  quantidade: number
  unidadeMedida: string
  marcas: string
  categoria: CategoriaItem
  codigoInterno?: string
  descricaoInterna?: string
  precoUnitario?: number
  comentario?: string
  observacaoFornecedor?: string
  orientacoesComprador?: string
  catComercial?: string
  qtdAproximada?: number
  qtdEmbalagem?: number
}

export interface PareamentoSKU {
  id: string
  descricaoComprador: string
  skuThesys: string
  descricaoInterna: string
  dataCriacao: string
}

export interface RegraPalavraChave {
  id: string
  palavraChave: string
  acaoAutomatica: 'INTERESSANTE' | 'DESCARTAR'
  dataCriacao: string
}

export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: 'MASTER' | 'OPERADOR'
  status: 'ATIVO' | 'INATIVO'
  dataCriacao: string
}

export interface Pedido {
  id: string
  bionexoPedidoId: string
  cotacaoId: number
  nomeHospital: string
  cnpjHospital: string
  dataPedido: string
  status: string
  valorTotal: number
}

// ===== HELPERS =====

export function getStatusColor(status: CotacaoStatus): string {
  const map: Record<CotacaoStatus, string> = {
    RECEBIDO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    PAREADO: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    COTACAO_ENVIADA: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    EM_ANALISE: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    ACEITA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    PEDIDO_GERADO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    ADQUIRIDO_OUTRA: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    CANCELADO: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
  }
  return map[status]
}

export function getStatusLabel(status: CotacaoStatus): string {
  const map: Record<CotacaoStatus, string> = {
    RECEBIDO: 'Recebido',
    PAREADO: 'Pareado',
    COTACAO_ENVIADA: 'Cotação Enviada',
    EM_ANALISE: 'Em Análise',
    ACEITA: 'Cotação Aceita',
    PEDIDO_GERADO: 'Pedido Gerado',
    ADQUIRIDO_OUTRA: 'Adquirido de Outra',
    CANCELADO: 'Cancelado',
  }
  return map[status]
}

export function getCategoriaColor(cat: CategoriaItem): string {
  const map: Record<CategoriaItem, string> = {
    NAO_ANALISADO: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    INTERESSANTE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    COTADO: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    DESCARTADO: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  }
  return map[cat]
}

export function getCategoriaLabel(cat: CategoriaItem): string {
  const map: Record<CategoriaItem, string> = {
    NAO_ANALISADO: 'Não Analisado',
    INTERESSANTE: 'Interessante',
    COTADO: 'Cotado',
    DESCARTADO: 'Descartado',
  }
  return map[cat]
}

export function getRowBgColor(cat: CategoriaItem): string {
  const map: Record<CategoriaItem, string> = {
    INTERESSANTE: 'bg-green-50 dark:bg-green-950/20',
    COTADO: '',
    DESCARTADO: 'bg-rose-50 dark:bg-rose-950/20',
    NAO_ANALISADO: 'bg-amber-50 dark:bg-amber-950/20',
  }
  return map[cat]
}

export function getRowBorderColor(cat: CategoriaItem): string {
  const map: Record<CategoriaItem, string> = {
    INTERESSANTE: 'border-l-green-500',
    COTADO: 'border-l-blue-400',
    DESCARTADO: 'border-l-rose-500',
    NAO_ANALISADO: 'border-l-amber-400',
  }
  return map[cat]
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function formatCurrency(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ===== MOCK DATA =====

const hospitais = [
  { nome: 'Hospital Albert Einstein', cnpj: '60.765.823/0001-30', uf: 'SP', cidade: 'São Paulo' },
  { nome: 'Hospital Sírio-Libanês', cnpj: '60.944.631/0001-53', uf: 'SP', cidade: 'São Paulo' },
  { nome: 'Hospital Copa D\'Or', cnpj: '42.163.093/0001-11', uf: 'RJ', cidade: 'Rio de Janeiro' },
  { nome: 'Hospital Moinhos de Vento', cnpj: '92.685.833/0001-51', uf: 'RS', cidade: 'Porto Alegre' },
  { nome: 'Hospital Santa Catarina', cnpj: '60.922.168/0001-16', uf: 'SP', cidade: 'São Paulo' },
  { nome: 'Hospital São Luiz', cnpj: '60.283.810/0002-00', uf: 'SP', cidade: 'São Paulo' },
  { nome: 'Hospital Samaritano', cnpj: '60.520.414/0001-67', uf: 'SP', cidade: 'São Paulo' },
  { nome: 'Hospital Oswaldo Cruz', cnpj: '60.975.737/0002-80', uf: 'SP', cidade: 'São Paulo' },
  { nome: 'Hospital São Lucas', cnpj: '33.781.055/0001-35', uf: 'RJ', cidade: 'Niterói' },
  { nome: 'Hospital Mãe de Deus', cnpj: '87.020.517/0001-20', uf: 'RS', cidade: 'Porto Alegre' },
]

const produtos = [
  { desc: 'Seringa 10ml Luer Lock s/ agulha', un: 'CX', marcas: 'BD, Injex', cat: 'Mat. Hospitalar', qtdEmb: 100 },
  { desc: 'Gaze Estéril 13 Fios 7,5x7,5cm', un: 'PCT', marcas: 'Cremer', cat: 'Mat. Hospitalar', qtdEmb: 10 },
  { desc: 'Luva Cirúrgica Estéril Tam 7.5', un: 'PAR', marcas: 'Supermax, Medline', cat: 'Mat. Cirúrgico', qtdEmb: 1 },
  { desc: 'Cateter Intravenoso 18G', un: 'UN', marcas: 'BD, Jelco', cat: 'Mat. Hospitalar', qtdEmb: 1 },
  { desc: 'Fita Micropore 25mm x 10m', un: 'RL', marcas: '3M', cat: 'Mat. Hospitalar', qtdEmb: 1 },
  { desc: 'Equipo Macrogotas Simples', un: 'UN', marcas: 'Eurofarma, Embramed', cat: 'Mat. Hospitalar', qtdEmb: 1 },
  { desc: 'Agulha Hipodérmica 25x7 Desc.', un: 'UN', marcas: 'BD, SR', cat: 'Mat. Hospitalar', qtdEmb: 100 },
  { desc: 'Atadura Crepom 15cm x 1.8m', un: 'RL', marcas: 'Cremer, Neve', cat: 'Mat. Hospitalar', qtdEmb: 12 },
  { desc: 'Máscara Cirúrgica Tripla Camada', un: 'UN', marcas: 'Descarpack, 3M', cat: 'Mat. Cirúrgico', qtdEmb: 50 },
  { desc: 'Avental Cirúrgico Descartável', un: 'UN', marcas: 'Descarpack, Protdesc', cat: 'Mat. Cirúrgico', qtdEmb: 1 },
  { desc: 'Bisturi Descartável N.23', un: 'UN', marcas: 'Feather, Swann-Morton', cat: 'Mat. Cirúrgico', qtdEmb: 10 },
  { desc: 'Dreno Penrose N.3', un: 'UN', marcas: 'Madeitex, LCR', cat: 'Mat. Cirúrgico', qtdEmb: 1 },
  { desc: 'Fio Sutura Nylon 3-0 c/ Agulha', un: 'ENV', marcas: 'Ethicon, Brasuture', cat: 'Mat. Cirúrgico', qtdEmb: 24 },
  { desc: 'Campo Cirúrgico Estéril 45x50cm', un: 'UN', marcas: 'Protdesc, Descarpack', cat: 'Mat. Cirúrgico', qtdEmb: 50 },
  { desc: 'Compressa Gaze Não Estéril 500un', un: 'PCT', marcas: 'Cremer, Neve', cat: 'Mat. Hospitalar', qtdEmb: 500 },
  { desc: 'Dipirona Sódica 500mg/ml Ampola', un: 'AMP', marcas: 'Sanofi, Medley', cat: 'Medicamento', qtdEmb: 100 },
  { desc: 'Soro Fisiológico 0,9% 500ml', un: 'FR', marcas: 'Baxter, Eurofarma', cat: 'Medicamento', qtdEmb: 1 },
  { desc: 'Papel A4 Sulfite 75g Resma', un: 'RSM', marcas: 'Chamex, Report', cat: 'Outros', qtdEmb: 500 },
  { desc: 'Manutenção Ar Condicionado', un: 'SV', marcas: '', cat: 'Serviços', qtdEmb: 1 },
  { desc: 'Algodão Hidrófilo 500g', un: 'PCT', marcas: 'Cremer, Neve', cat: 'Mat. Hospitalar', qtdEmb: 1 },
]

const skuMap: Record<string, { sku: string; desc: string }> = {
  'Seringa 10ml Luer Lock s/ agulha': { sku: '9928', desc: 'SERINGA 10ML LUER LOCK' },
  'Gaze Estéril 13 Fios 7,5x7,5cm': { sku: '5512', desc: 'GAZE ESTERIL 13F PCT C/10' },
  'Luva Cirúrgica Estéril Tam 7.5': { sku: '3301', desc: 'LUVA CIR. ESTERIL 7.5' },
  'Cateter Intravenoso 18G': { sku: '4410', desc: 'CATETER IV 18G' },
  'Fita Micropore 25mm x 10m': { sku: '2205', desc: 'FITA MICROPORE 25MM' },
  'Máscara Cirúrgica Tripla Camada': { sku: '6601', desc: 'MASCARA CIR. TRIPLA' },
  'Fio Sutura Nylon 3-0 c/ Agulha': { sku: '7710', desc: 'FIO NYLON 3-0 C/AG' },
  'Algodão Hidrófilo 500g': { sku: '1105', desc: 'ALGODAO HIDROFILO 500G' },
}

const statusList: CotacaoStatus[] = ['RECEBIDO', 'PAREADO', 'COTACAO_ENVIADA', 'EM_ANALISE', 'ACEITA', 'PEDIDO_GERADO', 'ADQUIRIDO_OUTRA', 'CANCELADO']
const pagamentos = ['30 DDL', '28 DDL', '30/60 DDL', '45 DDL', '15 Dias', '60 DDL']

function randomDate(daysOffset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  return d.toISOString().split('T')[0]
}

function randomTime(): string {
  const h = String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')
  const m = String(Math.floor(Math.random() * 4) * 15).padStart(2, '0')
  return `${h}:${m}`
}

export const mockItensFlat: CotacaoItemFlat[] = (() => {
  const items: CotacaoItemFlat[] = []
  for (let c = 0; c < 35; c++) {
    const cotId = 10290 + c
    const hospital = hospitais[c % hospitais.length]
    const numItens = Math.floor(Math.random() * 6) + 1
    const status = statusList[Math.floor(Math.random() * statusList.length)]
    const venc = randomDate(Math.floor(Math.random() * 10) - 2)
    const hora = randomTime()
    const pagto = pagamentos[Math.floor(Math.random() * pagamentos.length)]

    for (let i = 0; i < numItens; i++) {
      const prod = produtos[Math.floor(Math.random() * produtos.length)]
      const paired = skuMap[prod.desc]
      const isPaired = !!paired && Math.random() > 0.3
      let categoria: CategoriaItem = 'NAO_ANALISADO'
      if (status === 'COTACAO_ENVIADA' || status === 'EM_ANALISE' || status === 'ACEITA' || status === 'PEDIDO_GERADO') {
        categoria = 'COTADO'
      } else if (status === 'PAREADO' && isPaired) {
        categoria = 'INTERESSANTE'
      } else if (status === 'CANCELADO' || status === 'ADQUIRIDO_OUTRA') {
        categoria = Math.random() > 0.5 ? 'DESCARTADO' : 'COTADO'
      } else if (isPaired) {
        categoria = Math.random() > 0.4 ? 'INTERESSANTE' : 'NAO_ANALISADO'
      }
      items.push({
        id: `item-${cotId}-${i + 1}`,
        cotacaoId: cotId,
        dataVencimento: venc,
        horaVencimento: hora,
        uf: hospital.uf,
        cidade: hospital.cidade,
        nomeHospital: hospital.nome,
        cnpjHospital: hospital.cnpj,
        formaPagamento: pagto,
        status,
        sequencia: i + 1,
        descricaoBionexo: prod.desc,
        quantidade: Math.floor(Math.random() * 2000) + 10,
        unidadeMedida: prod.un,
        marcas: prod.marcas,
        categoria,
        codigoInterno: isPaired ? paired?.sku : undefined,
        descricaoInterna: isPaired ? paired?.desc : undefined,
        precoUnitario: categoria === 'COTADO' ? Number((Math.random() * 80 + 1).toFixed(2)) : undefined,
        comentario: categoria === 'COTADO' ? 'Entrega em até 5 dias úteis' : undefined,
        orientacoesComprador: Math.random() > 0.7 ? 'Entregar na central de abastecimento. Horário: 07h às 17h.' : undefined,
        catComercial: prod.cat,
        qtdAproximada: Math.floor(Math.random() * 500) + 10,
        qtdEmbalagem: prod.qtdEmb,
      })
    }
  }
  return items
})()

export const mockPareamentos: PareamentoSKU[] = Object.entries(skuMap).map(([desc, val], i) => ({
  id: `par-${String(i + 1).padStart(3, '0')}`,
  descricaoComprador: desc,
  skuThesys: val.sku,
  descricaoInterna: val.desc,
  dataCriacao: randomDate(-Math.floor(Math.random() * 30)),
}))

export const mockRegrasKeywords: RegraPalavraChave[] = [
  { id: 'kw-001', palavraChave: 'Gaze Estéril', acaoAutomatica: 'INTERESSANTE', dataCriacao: '2026-03-20' },
  { id: 'kw-002', palavraChave: 'Seringa', acaoAutomatica: 'INTERESSANTE', dataCriacao: '2026-03-18' },
  { id: 'kw-003', palavraChave: 'Luva Cirúrgica', acaoAutomatica: 'INTERESSANTE', dataCriacao: '2026-03-15' },
  { id: 'kw-004', palavraChave: 'Cateter', acaoAutomatica: 'INTERESSANTE', dataCriacao: '2026-03-14' },
  { id: 'kw-005', palavraChave: 'Manutenção', acaoAutomatica: 'DESCARTAR', dataCriacao: '2026-03-12' },
  { id: 'kw-006', palavraChave: 'Papel A4', acaoAutomatica: 'DESCARTAR', dataCriacao: '2026-03-10' },
  { id: 'kw-007', palavraChave: 'Limpeza', acaoAutomatica: 'DESCARTAR', dataCriacao: '2026-03-08' },
  { id: 'kw-008', palavraChave: 'Fio Sutura', acaoAutomatica: 'INTERESSANTE', dataCriacao: '2026-03-05' },
  { id: 'kw-009', palavraChave: 'Máscara Cirúrgica', acaoAutomatica: 'INTERESSANTE', dataCriacao: '2026-03-03' },
  { id: 'kw-010', palavraChave: 'Algodão', acaoAutomatica: 'INTERESSANTE', dataCriacao: '2026-03-01' },
]

export const mockUsuarios: Usuario[] = [
  { id: 'usr-001', nome: 'Otávio Pereira', email: 'otavio@suprimed.com.br', perfil: 'MASTER', status: 'ATIVO', dataCriacao: '2026-01-15' },
  { id: 'usr-002', nome: 'Daniel Alves', email: 'daniel.alves@suprimed.com.br', perfil: 'MASTER', status: 'ATIVO', dataCriacao: '2026-01-15' },
  { id: 'usr-003', nome: 'João Silva', email: 'joao.cotacao@suprimed.com.br', perfil: 'OPERADOR', status: 'ATIVO', dataCriacao: '2026-02-01' },
  { id: 'usr-004', nome: 'Maria Souza', email: 'maria.souza@suprimed.com.br', perfil: 'OPERADOR', status: 'INATIVO', dataCriacao: '2026-02-10' },
  { id: 'usr-005', nome: 'Carlos Mendes', email: 'carlos.mendes@suprimed.com.br', perfil: 'OPERADOR', status: 'ATIVO', dataCriacao: '2026-03-01' },
]

export const mockPedidos: Pedido[] = [
  { id: 'ped-001', bionexoPedidoId: 'PED-200001', cotacaoId: 10293, nomeHospital: 'Hospital Albert Einstein', cnpjHospital: '60.765.823/0001-30', dataPedido: '2026-03-22', status: 'CONFIRMADO', valorTotal: 15230.50 },
  { id: 'ped-002', bionexoPedidoId: 'PED-200002', cotacaoId: 10295, nomeHospital: 'Hospital Sírio-Libanês', cnpjHospital: '60.944.631/0001-53', dataPedido: '2026-03-21', status: 'CONFIRMADO', valorTotal: 8745.00 },
  { id: 'ped-003', bionexoPedidoId: 'PED-200003', cotacaoId: 10298, nomeHospital: 'Hospital Copa D\'Or', cnpjHospital: '42.163.093/0001-11', dataPedido: '2026-03-20', status: 'EM_ENTREGA', valorTotal: 22100.75 },
  { id: 'ped-004', bionexoPedidoId: 'PED-200004', cotacaoId: 10301, nomeHospital: 'Hospital Moinhos de Vento', cnpjHospital: '92.685.833/0001-51', dataPedido: '2026-03-19', status: 'ENTREGUE', valorTotal: 5620.30 },
  { id: 'ped-005', bionexoPedidoId: 'PED-200005', cotacaoId: 10305, nomeHospital: 'Hospital Santa Catarina', cnpjHospital: '60.922.168/0001-16', dataPedido: '2026-03-18', status: 'ENTREGUE', valorTotal: 31450.00 },
]

export const mockSyncLogs = [
  { id: '1', operacao: 'WGG', direcao: 'IN' as const, status: 'SUCESSO' as const, mensagem: '12 cotações recebidas', processadas: 12, createdAt: '2026-03-24 14:30:00' },
  { id: '2', operacao: 'WHS', direcao: 'OUT' as const, status: 'SUCESSO' as const, mensagem: 'Cotação 10293 enviada com sucesso', processadas: 1, createdAt: '2026-03-24 14:25:00' },
  { id: '3', operacao: 'WGG', direcao: 'IN' as const, status: 'VAZIO' as const, mensagem: 'Nenhuma cotação nova', processadas: 0, createdAt: '2026-03-24 14:20:00' },
  { id: '4', operacao: 'WJG', direcao: 'IN' as const, status: 'SUCESSO' as const, mensagem: '2 pedidos confirmados', processadas: 2, createdAt: '2026-03-24 14:15:00' },
  { id: '5', operacao: 'THESYS', direcao: 'IN' as const, status: 'SUCESSO' as const, mensagem: '450 itens sincronizados', processadas: 450, createdAt: '2026-03-24 14:00:00' },
  { id: '6', operacao: 'WGG', direcao: 'IN' as const, status: 'ERRO' as const, mensagem: 'Timeout na conexão com Bionexo', processadas: 0, createdAt: '2026-03-24 13:55:00' },
  { id: '7', operacao: 'WGA', direcao: 'IN' as const, status: 'SUCESSO' as const, mensagem: '3 prorrogações recebidas', processadas: 3, createdAt: '2026-03-24 13:50:00' },
  { id: '8', operacao: 'WHU', direcao: 'OUT' as const, status: 'SUCESSO' as const, mensagem: 'Cotação 10290 cancelada', processadas: 1, createdAt: '2026-03-24 13:45:00' },
]
