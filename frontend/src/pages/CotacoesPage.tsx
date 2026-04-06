import { useState, useMemo, useCallback, useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import {
  Download, RefreshCw, Search, X, Star, StarOff, EyeOff, RotateCcw,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
  FileText, Crown, ClipboardList, GraduationCap,
} from "lucide-react"
import { ModalAprender } from "@/components/modals/ModalAprender"
import {
  mockItensFlat,
  type CotacaoItemFlat,
  getRowBgColor,
  getRowBorderColor,
  formatDate,
} from "@/lib/mock-data"

interface SortConfig { key: string; direction: "asc" | "desc" }
const ITEMS_PER_PAGE = 25

const statusOptions = [
  { value: "TODOS", label: "Todos" },
  { value: "RECEBIDO", label: "Recebido" },
  { value: "PAREADO", label: "Pareado" },
  { value: "COTACAO_ENVIADA", label: "Cotação Enviada" },
  { value: "EM_ANALISE", label: "Em Análise pelo Hospital" },
  { value: "ACEITA", label: "Cotação Aceita" },
  { value: "PEDIDO_GERADO", label: "Pedido Gerado" },
  { value: "ADQUIRIDO_OUTRA", label: "Adquirido de Outra Empresa" },
  { value: "CANCELADO", label: "Cancelado" },
]
const categoriaOptions = [
  { value: "TODAS", label: "Todas as categorias" },
  { value: "NAO_ANALISADO", label: "Não analisado" },
  { value: "INTERESSANTE", label: "Interessante" },
  { value: "COTADO", label: "Cotado" },
  { value: "DESCARTADO", label: "Descartado" },
]

export function CotacoesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [idSearch, setIdSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("TODOS")
  const [categoriaFilter, setCategoriaFilter] = useState("TODAS")
  const [oportunidadePendente, setOportunidadePendente] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [multiSort, setMultiSort] = useState<SortConfig[]>([{ key: "cotacaoId", direction: "desc" }])
  const [currentPage, setCurrentPage] = useState(1)
  const [modalAprenderOpen, setModalAprenderOpen] = useState(false)
  const [modalAprenderDesc, setModalAprenderDesc] = useState("")
  const [allItems, setAllItems] = useState<CotacaoItemFlat[]>([])
  const [actionLoading, setActionLoading] = useState("")
  const [actionMsg, setActionMsg] = useState("")
  const [loadingData, setLoadingData] = useState(true)

  async function fetchData() {
    try {
      const { data } = await api.get('/cotacoes', { params: { limit: 1000 } })
      const items = (data.data || []).map((item: any) => ({
        ...item,
        dataVencimento: item.dataVencimento?.split('T')[0] || '',
        marcas: item.marcas || '',
        formaPagamento: item.formaPagamento || '',
        catComercial: item.catComercial || '',
        prioritaria: item.prioritaria || false,
        qtdAproximada: Math.floor(Math.random() * 500) + 10,
        qtdEmbalagem: 1,
      }))
      setAllItems(items)
    } catch (err) {
      console.error('Failed to fetch cotacoes:', err)
      setAllItems([])
      setActionMsg('❌ Erro ao carregar cotações. Verifique a conexão com o servidor.')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  async function handleBatchInteressante() {
    try {
      await api.post('/cotacoes/lote/interessante', { ids: Array.from(selectedIds) })
    } catch (e) { console.error(e) }
    setSelectedIds(new Set())
    fetchData()
  }

  async function handleBatchDesmarcarInteressante() {
    try {
      await api.post('/cotacoes/lote/restaurar', { ids: Array.from(selectedIds) })
    } catch (e) { console.error(e) }
    setSelectedIds(new Set())
    fetchData()
  }

  async function handleBatchDescartar() {
    try {
      await api.post('/cotacoes/lote/descartar', { ids: Array.from(selectedIds) })
    } catch (e) { console.error(e) }
    setSelectedIds(new Set())
    fetchData()
  }

  async function handleBatchRestaurar() {
    try {
      await api.post('/cotacoes/lote/restaurar', { ids: Array.from(selectedIds) })
    } catch (e) { console.error(e) }
    setSelectedIds(new Set())
    fetchData()
  }

  async function handleTogglePrioridade(cotacaoId: number) {
    try {
      await api.patch(`/cotacoes/${cotacaoId}/prioridade`)
      fetchData()
    } catch (e) { console.error(e) }
  }

  function handleOpenCotacao(cotacaoId: number) {
    navigate({ to: "/cotacoes/$cotacaoId", params: { cotacaoId: String(cotacaoId) } })
  }

  async function handleReceberNovos() {
    setActionLoading("receber")
    setActionMsg("")
    try {
      const { data } = await api.post('/bionexo/receber')
      setActionMsg(`✅ ${data.mensagem || 'Integração concluída'}`)
    } catch (e: any) {
      setActionMsg(`❌ Erro: ${e.response?.data?.message || e.message}`)
    }
    setActionLoading("")
    fetchData()
    setTimeout(() => setActionMsg(""), 5000)
  }

  async function handleAtualizarBionexo() {
    setActionLoading("atualizar")
    setActionMsg("")
    try {
      const { data } = await api.post('/bionexo/atualizar')
      setActionMsg(`✅ ${data.mensagem || 'Prorrogações e pedidos atualizados'}`)
    } catch (e: any) {
      setActionMsg(`❌ Erro: ${e.response?.data?.message || e.message}`)
    }
    setActionLoading("")
    fetchData()
    setTimeout(() => setActionMsg(""), 5000)
  }

  // Group items by cotacaoId, sort GROUPS, then flatten
  const filtered = useMemo(() => {
    let data = [...allItems]

    // Apply filters
    if (search) {
      const q = search.toLowerCase()
      data = data.filter((item) =>
        item.nomeHospital.toLowerCase().includes(q) ||
        item.descricaoBionexo.toLowerCase().includes(q) ||
        (item.codigoInterno && item.codigoInterno.toLowerCase().includes(q)) ||
        (item.descricaoInterna && item.descricaoInterna.toLowerCase().includes(q))
      )
    }
    if (idSearch) {
      const idNum = Number(idSearch)
      if (!isNaN(idNum)) data = data.filter((item) => item.cotacaoId === idNum)
    }
    if (statusFilter !== "TODOS") data = data.filter((item) => item.status === statusFilter)
    if (categoriaFilter !== "TODAS") data = data.filter((item) => item.categoria === categoriaFilter)
    if (oportunidadePendente) data = data.filter((item) => item.categoria === "NAO_ANALISADO" || item.categoria === "INTERESSANTE")

    // Group by cotacaoId
    const groups = new Map<number, CotacaoItemFlat[]>()
    for (const item of data) {
      if (!groups.has(item.cotacaoId)) groups.set(item.cotacaoId, [])
      groups.get(item.cotacaoId)!.push(item)
    }

    // Sort items within each group by sequencia
    for (const items of groups.values()) {
      items.sort((a, b) => a.sequencia - b.sequencia)
    }

    // Multi-sort groups (use first item as representative)
    const sortedGroups = [...groups.entries()]
    if (multiSort.length > 0) {
      sortedGroups.sort(([, aItems], [, bItems]) => {
        const a = aItems[0]
        const b = bItems[0]
        for (const { key, direction } of multiSort) {
          const aVal = a[key as keyof CotacaoItemFlat]
          const bVal = b[key as keyof CotacaoItemFlat]
          let cmp = 0
          if (typeof aVal === "number" && typeof bVal === "number") cmp = aVal - bVal
          else cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""))
          if (cmp !== 0) return direction === "asc" ? cmp : -cmp
        }
        return 0
      })
    }

    // Flatten back
    return sortedGroups.flatMap(([, items]) => items)
  }, [allItems, search, idSearch, statusFilter, categoriaFilter, oportunidadePendente, multiSort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  // Track first row of each cotação group in current page
  const firstRowOfGroup = useMemo(() => {
    const seen = new Set<number>()
    const result = new Set<string>()
    for (const item of paginatedItems) {
      if (!seen.has(item.cotacaoId)) {
        seen.add(item.cotacaoId)
        result.add(item.id)
      }
    }
    return result
  }, [paginatedItems])

  const handleFilter = useCallback(() => { setCurrentPage(1); setSelectedIds(new Set()) }, [])
  const handleLimpar = useCallback(() => { setSearch(""); setIdSearch(""); setStatusFilter("TODOS"); setCategoriaFilter("TODAS"); setOportunidadePendente(false); setCurrentPage(1); setSelectedIds(new Set()) }, [])

  function handleSort(key: string, e: React.MouseEvent) {
    setCurrentPage(1)
    const existing = multiSort.findIndex(s => s.key === key)

    if (e.shiftKey) {
      // Shift+click: add/toggle column in multi-sort (max 3)
      if (existing >= 0) {
        const current = multiSort[existing]
        if (current.direction === "asc") {
          setMultiSort(multiSort.map((s, i) => i === existing ? { ...s, direction: "desc" } : s))
        } else {
          setMultiSort(multiSort.filter((_, i) => i !== existing))
        }
      } else if (multiSort.length < 3) {
        setMultiSort([...multiSort, { key, direction: "asc" }])
      }
    } else {
      // Single click: replace sort
      if (existing >= 0 && multiSort.length === 1) {
        const current = multiSort[0]
        if (current.direction === "asc") setMultiSort([{ key, direction: "desc" }])
        else setMultiSort([])
      } else {
        setMultiSort([{ key, direction: "asc" }])
      }
    }
  }

  function SortIndicator({ sortKey }: { sortKey: string }) {
    const idx = multiSort.findIndex(s => s.key === sortKey)
    if (idx < 0) return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/40" />
    const { direction } = multiSort[idx]
    const badge = multiSort.length > 1 ? ["①", "②", "③"][idx] : null
    return (
      <span className="inline-flex items-center gap-0.5">
        {direction === "asc" ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />}
        {badge && <span className="text-[9px] font-bold text-primary">{badge}</span>}
      </span>
    )
  }

  const allPageSelected = paginatedItems.length > 0 && paginatedItems.every((item) => selectedIds.has(item.id))
  const somePageSelected = paginatedItems.some((item) => selectedIds.has(item.id))

  function toggleSelectAll() {
    const next = new Set(selectedIds)
    if (allPageSelected) paginatedItems.forEach((item) => next.delete(item.id))
    else paginatedItems.forEach((item) => next.add(item.id))
    setSelectedIds(next)
  }

  function toggleSelectItem(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  function handleRowClick(cotacaoId: number) {
    navigate({ to: "/cotacoes/$cotacaoId", params: { cotacaoId: String(cotacaoId) } })
  }

  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = []
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
    else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  const hasSelection = selectedIds.size > 0

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando cotações...</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Pedidos de Cotação Bionexo</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Empresa:</span>
            <span className="text-xs font-semibold">PROMEHO</span>
          </div>
          <span className="w-px h-5 bg-border" />
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Local de envio:</span>
            <Select className="h-7 text-xs w-52" defaultValue="SJC">
              <option value="SJC">Logmed São José dos Campos</option>
              <option value="VAL">Logmed Valinhos</option>
              <option value="JAC">Logmed Jacareí</option>
            </Select>
          </div>
          <Button variant="success" size="sm" className="text-xs h-7" onClick={handleReceberNovos} disabled={actionLoading === "receber"}>
            {actionLoading === "receber" ? <><RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" /> Recebendo...</> : <><Download className="h-3.5 w-3.5 mr-1" /> Receber novos</>}
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleAtualizarBionexo} disabled={actionLoading === "atualizar"}>
            {actionLoading === "atualizar" ? <><RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" /> Atualizando...</> : <><RefreshCw className="h-3.5 w-3.5 mr-1" /> Atualizar Bionexo</>}
          </Button>
        </div>
      </div>
      {actionMsg && (
        <div className={`text-xs px-3 py-1.5 rounded ${actionMsg.startsWith('✅') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'}`}>
          {actionMsg}
        </div>
      )}

      {/* ===== FILTROS ===== */}
      <div className="flex flex-wrap items-end gap-3 py-2">
        <div>
          <label className="text-xs text-muted-foreground block mb-0.5">Filtro</label>
          <Input placeholder="Hospital, produto, descrição..." className="h-8 text-xs w-52" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-0.5">Nº PDC</label>
          <Input type="number" placeholder="Digite o ID do PDC..." className="h-8 text-xs w-40" value={idSearch} onChange={(e) => setIdSearch(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-0.5">Status</label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 text-xs w-44">
            {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-0.5">Categoria</label>
          <Select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)} className="h-8 text-xs w-44">
            {categoriaOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </Select>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer self-end pb-1.5">
          <input type="checkbox" className="h-3.5 w-3.5 rounded border-input accent-primary" checked={oportunidadePendente} onChange={(e) => setOportunidadePendente(e.target.checked)} />
          Com oportunidade pendente
        </label>
        <div className="flex items-center gap-2 ml-auto">
          <Button size="sm" onClick={handleFilter} className="h-8 text-xs px-4 bg-destructive hover:bg-destructive/90 text-white">
            <Search className="h-3.5 w-3.5 mr-1" /> Buscar
          </Button>
          <Button variant="outline" size="sm" onClick={handleLimpar} className="h-8 text-xs px-3">
            <X className="h-3.5 w-3.5 mr-1" /> Limpar
          </Button>
        </div>
      </div>

      {/* ===== 4 BOTÕES DE AÇÃO ===== */}
      <div className="flex items-center gap-1 py-1">
        <Button variant="default" size="sm" className={cn("h-7 text-xs px-3", hasSelection ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-600/60 text-white/70 cursor-not-allowed")} disabled={!hasSelection} onClick={handleBatchInteressante}>
          <Star className="h-3.5 w-3.5 mr-1 fill-current" /> Marcar como Interessante
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs px-3" disabled={!hasSelection} onClick={handleBatchDesmarcarInteressante}>
          <StarOff className="h-3.5 w-3.5 mr-1" /> Desmarcar Interessante
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs px-3" disabled={!hasSelection} onClick={handleBatchDescartar}>
          <EyeOff className="h-3.5 w-3.5 mr-1" /> Descartar
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs px-3" disabled={!hasSelection} onClick={handleBatchRestaurar}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restaurar
        </Button>
        <span className="w-px h-5 bg-border" />
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-3"
          disabled={!hasSelection}
          onClick={() => {
            const firstSelectedItem = paginatedItems.find(i => selectedIds.has(i.id))
            if (firstSelectedItem) {
              setModalAprenderDesc(firstSelectedItem.descricaoBionexo)
              setModalAprenderOpen(true)
            }
          }}
        >
          <GraduationCap className="h-3.5 w-3.5 mr-1" /> Aprender
        </Button>
        {hasSelection && <span className="text-xs text-muted-foreground ml-2">{selectedIds.size} selecionado(s)</span>}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} itens</span>
      </div>

      {/* Modal Aprender */}
      <ModalAprender open={modalAprenderOpen} onClose={() => setModalAprenderOpen(false)} descricaoBionexo={modalAprenderDesc} />

      {/* ===== TABELA com scrollbar horizontal ===== */}
      <div className="border rounded overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/60 border-b">
              <th className="p-1.5 w-8 text-center">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-input accent-primary cursor-pointer" checked={allPageSelected} ref={(el) => { if (el) el.indeterminate = somePageSelected && !allPageSelected }} onChange={toggleSelectAll} />
              </th>
              <th className="p-1.5 w-12"></th>
              <th className="p-1.5 text-left font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("cotacaoId", e)}>
                <span className="flex items-center gap-0.5">Id PDC <SortIndicator sortKey="cotacaoId" /></span>
              </th>
              <th className="p-1.5 text-left font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("nomeHospital", e)}>
                <span className="flex items-center gap-0.5">Hospital <SortIndicator sortKey="nomeHospital" /></span>
              </th>
              <th className="p-1.5 text-left font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("dataVencimento", e)}>
                <span className="flex items-center gap-0.5">Vencimento <SortIndicator sortKey="dataVencimento" /></span>
              </th>
              <th className="p-1.5 text-center font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("horaVencimento", e)}>
                <span className="flex items-center justify-center gap-0.5">Hora Venc. <SortIndicator sortKey="horaVencimento" /></span>
              </th>
              <th className="p-1.5 text-center font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("uf", e)}>
                <span className="flex items-center justify-center gap-0.5">UF <SortIndicator sortKey="uf" /></span>
              </th>
              <th className="p-1.5 text-left font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("cidade", e)}>
                <span className="flex items-center gap-0.5">Cidade <SortIndicator sortKey="cidade" /></span>
              </th>
              <th className="p-1.5 text-center font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("sequencia", e)}>
                <span className="flex items-center justify-center gap-0.5">Seq <SortIndicator sortKey="sequencia" /></span>
              </th>
              <th className="p-1.5 text-left font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("descricaoBionexo", e)}>
                <span className="flex items-center gap-0.5">Descrição <SortIndicator sortKey="descricaoBionexo" /></span>
              </th>
              <th className="p-1.5 text-left font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("catComercial", e)}>
                <span className="flex items-center gap-0.5">Cód. Comercial <SortIndicator sortKey="catComercial" /></span>
              </th>
              <th className="p-1.5 text-center font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("codigoProduto", e)}>
                <span className="flex items-center justify-center gap-0.5">Cód. Prod. Hosp. <SortIndicator sortKey="codigoProduto" /></span>
              </th>
              <th className="p-1.5 text-center font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("quantidade", e)}>
                <span className="flex items-center justify-center gap-0.5">Qtde <SortIndicator sortKey="quantidade" /></span>
              </th>
              <th className="p-1.5 text-center font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("unidadeMedida", e)}>
                <span className="flex items-center justify-center gap-0.5">Und medida <SortIndicator sortKey="unidadeMedida" /></span>
              </th>
              <th className="p-1.5 text-center font-semibold whitespace-nowrap">
                <span>Qtd Emb.</span>
              </th>
              <th className="p-1.5 text-left font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("marcas", e)}>
                <span className="flex items-center gap-0.5">Marca <SortIndicator sortKey="marcas" /></span>
              </th>
              <th className="p-1.5 text-left font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("formaPagamento", e)}>
                <span className="flex items-center gap-0.5">F. Pagto <SortIndicator sortKey="formaPagamento" /></span>
              </th>
              <th className="p-1.5 text-left font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("codigoInterno", e)}>
                <span className="flex items-center gap-0.5">Produto Vinculado <SortIndicator sortKey="codigoInterno" /></span>
              </th>
              <th className="p-1.5 text-center font-semibold cursor-pointer select-none whitespace-nowrap" onClick={(e) => handleSort("precoUnitario", e)}>
                <span className="flex items-center justify-center gap-0.5">Preço Unit. <SortIndicator sortKey="precoUnitario" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item) => {
              const isGroupFirst = firstRowOfGroup.has(item.id)
              return (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b border-l-4 transition-colors cursor-pointer",
                    getRowBorderColor(item.categoria),
                    selectedIds.has(item.id) ? "bg-blue-100 dark:bg-blue-900/30" : getRowBgColor(item.categoria),
                    "hover:brightness-95 dark:hover:brightness-110"
                  )}
                  onClick={() => handleRowClick(item.cotacaoId)}
                >
                  <td className="p-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="h-3.5 w-3.5 rounded border-input accent-primary cursor-pointer" checked={selectedIds.has(item.id)} onChange={() => toggleSelectItem(item.id)} />
                  </td>
                  <td className="p-1.5" onClick={(e) => e.stopPropagation()}>
                    {isGroupFirst && (
                      <div className="flex items-center gap-1">
                        <button className={cn("hover:scale-110 transition-transform", (item as any).prioritaria ? "text-amber-500" : "text-gray-300 hover:text-amber-400")} title="Prioridade" onClick={(e) => { e.stopPropagation(); handleTogglePrioridade(item.cotacaoId) }}><Crown className="h-3.5 w-3.5" /></button>
                        <button className="text-green-600 hover:text-green-700 hover:scale-110 transition-transform" title="Abrir cotação" onClick={(e) => { e.stopPropagation(); handleOpenCotacao(item.cotacaoId) }}><ClipboardList className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </td>
                  <td className="p-1.5 font-mono font-semibold">{isGroupFirst ? item.cotacaoId : ""}</td>
                  <td className="p-1.5 max-w-[200px] truncate" title={item.nomeHospital}>{item.nomeHospital}</td>
                  <td className="p-1.5 whitespace-nowrap">{formatDate(item.dataVencimento)}</td>
                  <td className="p-1.5 text-center whitespace-nowrap">{item.horaVencimento}</td>
                  <td className="p-1.5 text-center font-medium">{item.uf}</td>
                  <td className="p-1.5 whitespace-nowrap">{item.cidade}</td>
                  <td className="p-1.5 text-center">{item.sequencia}</td>
                  <td className="p-1.5 max-w-[220px] truncate" title={item.descricaoBionexo}>{item.descricaoBionexo}</td>
                  <td className="p-1.5 whitespace-nowrap text-xs">{item.catComercial || "—"}</td>
                  <td className="p-1.5 text-center font-mono text-xs">{(item as any).codigoProduto || "—"}</td>
                  <td className="p-1.5 text-center">{item.quantidade}</td>
                  <td className="p-1.5 text-center">{item.unidadeMedida}</td>
                  <td className="p-1.5 text-center text-muted-foreground">—</td>
                  <td className="p-1.5 max-w-[100px] truncate" title={item.marcas}>{item.marcas || "—"}</td>
                  <td className="p-1.5 whitespace-nowrap">{item.formaPagamento}</td>
                  <td className="p-1.5 max-w-[180px] truncate font-mono text-xs" title={item.codigoInterno ? `${item.codigoInterno} — ${item.descricaoInterna || ''}` : ''}>{item.codigoInterno ? `${item.codigoInterno} — ${item.descricaoInterna || ''}` : "—"}</td>
                  <td className="p-1.5 text-center font-mono">{item.precoUnitario ? `R$ ${item.precoUnitario.toFixed(2)}` : ""}</td>
                </tr>
              )
            })}
            {paginatedItems.length === 0 && (
              <tr><td colSpan={20} className="p-6 text-center text-muted-foreground">Nenhum item encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== PAGINAÇÃO ===== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-1">
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
            <ChevronLeft className="h-3.5 w-3.5 mr-0.5" /> Anterior
          </Button>
          {getPageNumbers().map((p, idx) =>
            p === "..." ? (
              <span key={`e-${idx}`} className="px-1.5 text-muted-foreground text-xs">...</span>
            ) : (
              <Button key={p} variant={currentPage === p ? "default" : "outline"} size="sm" className="h-7 text-xs min-w-[28px] px-2" onClick={() => setCurrentPage(p as number)}>{p}</Button>
            )
          )}
          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
            Próxima <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
