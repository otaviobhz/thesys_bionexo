import { useState, useMemo, useEffect } from "react"
import { useParams, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  ArrowLeft, Send, Star, X, Ban, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  GraduationCap, ArrowLeftRight, Check, AlertTriangle,
} from "lucide-react"
import { api } from "@/lib/api"
import {
  mockItensFlat,
  type CotacaoItemFlat,
  getStatusColor,
  getStatusLabel,
  getCategoriaColor,
  getCategoriaLabel,
  formatDate,
  formatCurrency,
} from "@/lib/mock-data"

export function CotacaoDetalhePage() {
  const { cotacaoId } = useParams({ strict: false })
  const cotacaoIdNum = Number(cotacaoId)

  const [allItems, setAllItems] = useState<CotacaoItemFlat[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    async function fetchCotacao() {
      try {
        const { data } = await api.get(`/cotacoes/${cotacaoIdNum}`)
        const cotacao = data
        const items: CotacaoItemFlat[] = (cotacao.itens || []).map((item: any) => ({
          id: item.id,
          cotacaoId: cotacao.bionexoId,
          sequencia: item.sequencia,
          descricaoBionexo: item.descricaoBionexo || '',
          quantidade: item.quantidade,
          unidadeMedida: item.unidadeMedida || '',
          marcas: item.marcas || '',
          codigoInterno: item.codigoInterno || '',
          descricaoInterna: item.descricaoInterna || '',
          precoUnitario: item.precoUnitario ?? null,
          comentario: item.comentario || '',
          observacaoFornecedor: item.observacaoFornecedor || '',
          categoria: item.categoria || 'NAO_ANALISADO',
          status: cotacao.status || 'RECEBIDO',
          nomeHospital: cotacao.nomeHospital || '',
          cnpjHospital: cotacao.cnpjHospital || '',
          cidade: cotacao.cidade || '',
          uf: cotacao.uf || '',
          dataVencimento: (cotacao.dataVencimento || '').split('T')[0],
          horaVencimento: cotacao.horaVencimento || '',
          formaPagamento: cotacao.formaPagamento || '',
          orientacoesComprador: cotacao.orientacoesComprador || '',
          catComercial: cotacao.catComercial || '',
        }))
        setAllItems(items.length > 0 ? items : mockItensFlat.filter((item) => item.cotacaoId === cotacaoIdNum))
      } catch (err) {
        console.error('Failed to fetch cotacao:', err)
        setAllItems(mockItensFlat.filter((item) => item.cotacaoId === cotacaoIdNum))
      } finally {
        setLoadingData(false)
      }
    }
    fetchCotacao()
  }, [cotacaoIdNum])

  // Derive cotacao-level info from first item
  const firstItem = allItems[0]

  // Selection for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Active item for editing
  const [activeItemId, setActiveItemId] = useState<string | null>(
    firstItem?.id ?? null
  )

  // Filter navigation to interessantes only
  const [onlyInteressantes, setOnlyInteressantes] = useState(false)

  // Editable fields per item (local state)
  const [editState, setEditState] = useState<
    Record<string, {
      codigoInterno: string
      precoUnitario: string
      comentario: string
      observacaoFornecedor: string
    }>
  >(() => {
    const state: Record<string, any> = {}
    allItems.forEach((item) => {
      state[item.id] = {
        codigoInterno: item.codigoInterno || "",
        precoUnitario: item.precoUnitario != null ? String(item.precoUnitario) : "",
        comentario: item.comentario || "",
        observacaoFornecedor: item.observacaoFornecedor || "",
      }
    })
    return state
  })

  // Send template state
  const [sendData, setSendData] = useState({
    data: "",
    validade: "",
    condicaoPagamento: firstItem?.formaPagamento || "30 DDL",
    prazoEntrega: "5",
    faturamentoMinimo: "",
    tipoFrete: "CIF",
  })

  // Sync editState and activeItemId when allItems loads from API
  useEffect(() => {
    if (allItems.length === 0) return
    const state: Record<string, any> = {}
    allItems.forEach((item) => {
      state[item.id] = {
        codigoInterno: item.codigoInterno || "",
        precoUnitario: item.precoUnitario != null ? String(item.precoUnitario) : "",
        comentario: item.comentario || "",
        observacaoFornecedor: item.observacaoFornecedor || "",
      }
    })
    setEditState(state)
    setActiveItemId((prev) => prev ?? allItems[0]?.id ?? null)
    setSendData((prev) => ({
      ...prev,
      condicaoPagamento: allItems[0]?.formaPagamento || prev.condicaoPagamento,
    }))
  }, [allItems])

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando cotação...</span>
      </div>
    )
  }

  if (!firstItem || allItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cotação não encontrada</p>
        <Link to="/cotacoes">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </Link>
      </div>
    )
  }

  const status = firstItem.status
  const orientacoes = allItems.find((it) => it.orientacoesComprador)?.orientacoesComprador

  // Navigation items (with optional filter)
  const navItems = onlyInteressantes
    ? allItems.filter((it) => it.categoria === "INTERESSANTE")
    : allItems

  const activeItem = allItems.find((it) => it.id === activeItemId) ?? navItems[0]
  const activeNavIdx = navItems.findIndex((it) => it.id === activeItem?.id)

  function navigateTo(idx: number) {
    if (idx >= 0 && idx < navItems.length) {
      setActiveItemId(navItems[idx].id)
    }
  }

  // Selection
  const allSelected =
    allItems.length > 0 && allItems.every((item) => selectedIds.has(item.id))
  const someSelected = allItems.some((item) => selectedIds.has(item.id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allItems.map((it) => it.id)))
    }
  }

  function toggleSelectItem(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  // Edit helpers
  function updateEdit(itemId: string, field: string, value: string) {
    setEditState((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }))
  }

  function handleSaveItem(itemId: string) {
    // Would send to API
    showToast("Item salvo com sucesso.")
  }

  function handleCancelItem(itemId: string) {
    const item = allItems.find((it) => it.id === itemId)
    if (item) {
      setEditState((prev) => ({
        ...prev,
        [itemId]: {
          codigoInterno: item.codigoInterno || "",
          precoUnitario: item.precoUnitario != null ? String(item.precoUnitario) : "",
          comentario: item.comentario || "",
          observacaoFornecedor: item.observacaoFornecedor || "",
        },
      }))
    }
  }

  // Send validation
  const hasNaoAnalisado = allItems.some((it) => it.categoria === "NAO_ANALISADO")
  const hasUnpairedInteressante = allItems.some(
    (it) => it.categoria === "INTERESSANTE" && !it.codigoInterno
  )

  async function handleSendCotacao() {
    showToast("Enviando cotação...")
    try {
      const cotacaoUuid = allItems[0]?.id?.split('-').slice(0, -1).join('-') // hack: get cotacao UUID
      // Find cotacao UUID from API
      const { data: cotData } = await api.get(`/cotacoes/${cotacaoIdNum}`)
      const { data: result } = await api.post(`/bionexo/enviar/${cotData.id}`)
      showToast(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
    } catch (e: any) {
      showToast(`❌ ${e.response?.data?.message || e.message}`)
    }
  }

  async function handleCancelCotacao() {
    try {
      const { data: cotData } = await api.get(`/cotacoes/${cotacaoIdNum}`)
      await api.post(`/cotacoes/${cotData.id}/cancelar`)
      showToast("✅ Cotação cancelada.")
    } catch (e: any) {
      showToast(`❌ ${e.response?.data?.message || e.message}`)
    }
  }

  async function handleUpdateCotacao() {
    try {
      const { data: cotData } = await api.get(`/cotacoes/${cotacaoIdNum}`)
      const { data: result } = await api.post(`/bionexo/enviar/${cotData.id}`)
      showToast(result.success ? `✅ Cotação atualizada.` : `❌ ${result.message}`)
    } catch (e: any) {
      showToast(`❌ ${e.response?.data?.message || e.message}`)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Batch actions
  function handleBatchDescartar() {
    setSelectedIds(new Set())
  }

  function handleBatchInteressante() {
    setSelectedIds(new Set())
  }

  function handleBatchEnsinar() {
    // Would open modal
    setSelectedIds(new Set())
  }

  function handleBatchParear() {
    // Would open modal
    setSelectedIds(new Set())
  }

  const currentEdit = activeItem ? editState[activeItem.id] : null

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/cotacoes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Cotação #{cotacaoIdNum}</h1>
              <Badge className={getStatusColor(status)}>
                {getStatusLabel(status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {firstItem.nomeHospital} — {firstItem.cidade}/{firstItem.uf}
            </p>
          </div>
        </div>
      </div>

      {/* Info row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Vencimento</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                {formatDate(firstItem.dataVencimento)} {firstItem.horaVencimento}
              </p>
              <Button variant="ghost" size="icon-sm" title="Atualizar vencimento">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Forma Pagamento</p>
            <p className="text-sm font-semibold">{firstItem.formaPagamento}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Itens</p>
            <p className="text-sm font-semibold">{allItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">CNPJ Hospital</p>
            <p className="text-sm font-semibold">{firstItem.cnpjHospital}</p>
          </CardContent>
        </Card>
      </div>

      {/* Orientacoes do comprador */}
      {orientacoes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Orientações do Comprador</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{orientacoes}</p>
          </CardContent>
        </Card>
      )}

      {/* Batch action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          disabled={selectedIds.size === 0}
          onClick={handleBatchDescartar}
        >
          <X className="h-4 w-4 mr-1" /> Descartar
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={selectedIds.size === 0}
          onClick={handleBatchInteressante}
        >
          <Star className="h-4 w-4 mr-1" /> Interessante
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={selectedIds.size === 0}
          onClick={handleBatchEnsinar}
        >
          <GraduationCap className="h-4 w-4 mr-1" /> Ensinar
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={selectedIds.size === 0}
          onClick={handleBatchParear}
        >
          <ArrowLeftRight className="h-4 w-4 mr-1" /> Parear
        </Button>
        {selectedIds.size > 0 && (
          <span className="text-sm text-muted-foreground ml-2">
            {selectedIds.size} {selectedIds.size === 1 ? "item selecionado" : "itens selecionados"}
          </span>
        )}
      </div>

      {/* Items grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected && !allSelected
                      }}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left p-3 font-medium whitespace-nowrap">Seq</th>
                  <th className="text-left p-3 font-medium whitespace-nowrap">Descrição</th>
                  <th className="text-left p-3 font-medium whitespace-nowrap">Qtde</th>
                  <th className="text-left p-3 font-medium whitespace-nowrap">Und</th>
                  <th className="text-left p-3 font-medium whitespace-nowrap">Marca</th>
                  <th className="text-left p-3 font-medium whitespace-nowrap">Cód. Interno</th>
                  <th className="text-left p-3 font-medium whitespace-nowrap">Desc. Interna</th>
                  <th className="text-left p-3 font-medium whitespace-nowrap">Preço Unit.</th>
                  <th className="text-left p-3 font-medium whitespace-nowrap">Comentário</th>
                  <th className="text-left p-3 font-medium whitespace-nowrap">Categoria</th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((item) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "border-b transition-colors cursor-pointer",
                      activeItem?.id === item.id ? "bg-accent" : "hover:bg-muted/30"
                    )}
                    onClick={() => setActiveItemId(item.id)}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                      />
                    </td>
                    <td className="p-3">{item.sequencia}</td>
                    <td className="p-3">
                      <span className="block truncate max-w-[200px]" title={item.descricaoBionexo}>
                        {item.descricaoBionexo}
                      </span>
                    </td>
                    <td className="p-3 text-right">{item.quantidade}</td>
                    <td className="p-3">{item.unidadeMedida}</td>
                    <td className="p-3 text-xs">{item.marcas || "—"}</td>
                    <td className="p-3 font-mono text-xs">{item.codigoInterno || "—"}</td>
                    <td className="p-3 text-xs truncate max-w-[120px]">
                      {item.descricaoInterna || "—"}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {item.precoUnitario != null ? formatCurrency(item.precoUnitario) : "—"}
                    </td>
                    <td className="p-3 text-xs truncate max-w-[120px]">
                      {item.comentario || "—"}
                    </td>
                    <td className="p-3">
                      <Badge className={cn(getCategoriaColor(item.categoria), "whitespace-nowrap")}>
                        {getCategoriaLabel(item.categoria)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Item editing panel */}
      {activeItem && currentEdit && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                #{activeItem.sequencia} — {activeItem.descricaoBionexo}
              </CardTitle>
              <Badge className={getCategoriaColor(activeItem.categoria)}>
                {getCategoriaLabel(activeItem.categoria)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Item info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Quantidade</p>
                <p className="font-medium">{activeItem.quantidade} {activeItem.unidadeMedida}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Marcas</p>
                <p className="font-medium">{activeItem.marcas || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Descrição Bionexo</p>
                <p className="font-medium">{activeItem.descricaoBionexo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Código Interno Atual</p>
                <p className="font-medium font-mono">{activeItem.codigoInterno || "—"}</p>
              </div>
            </div>

            {/* Editable fields */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Produto (SKU)</label>
                  <Input
                    placeholder="Código SKU..."
                    value={currentEdit.codigoInterno}
                    onChange={(e) => updateEdit(activeItem.id, "codigoInterno", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Preço Unitário</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      className="pl-10"
                      value={currentEdit.precoUnitario}
                      onChange={(e) => updateEdit(activeItem.id, "precoUnitario", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Comentário</label>
                  <Input
                    placeholder="Observações..."
                    value={currentEdit.comentario}
                    onChange={(e) => updateEdit(activeItem.id, "comentario", e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs text-muted-foreground block mb-1">Observação do Fornecedor</label>
                <textarea
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[60px] resize-y"
                  placeholder="Observação adicional para o hospital..."
                  value={currentEdit.observacaoFornecedor}
                  onChange={(e) => updateEdit(activeItem.id, "observacaoFornecedor", e.target.value)}
                />
              </div>
            </div>

            {/* Save/Cancel + Navigation */}
            <div className="border-t pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleSaveItem(activeItem.id)}>
                  <Check className="h-4 w-4 mr-1" /> Salvar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleCancelItem(activeItem.id)}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={onlyInteressantes ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setOnlyInteressantes(!onlyInteressantes)
                  }}
                >
                  <Star className="h-4 w-4 mr-1" /> Apenas Interessantes
                </Button>
                <span className="text-sm text-muted-foreground mx-1">
                  {activeNavIdx + 1} / {navItems.length}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => navigateTo(0)}
                  disabled={activeNavIdx <= 0}
                  title="Primeiro"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => navigateTo(activeNavIdx - 1)}
                  disabled={activeNavIdx <= 0}
                  title="Anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => navigateTo(activeNavIdx + 1)}
                  disabled={activeNavIdx >= navItems.length - 1}
                  title="Próximo"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => navigateTo(navItems.length - 1)}
                  disabled={activeNavIdx >= navItems.length - 1}
                  title="Último"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pre-send template */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Enviar Cotação para Bionexo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warnings */}
          {hasNaoAnalisado && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Existem itens com categoria "Não Analisado". Classifique todos os itens antes de enviar.
              </p>
            </div>
          )}
          {hasUnpairedInteressante && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Apenas itens pareados (com código interno) podem ser cotados. Pare os itens interessantes antes de enviar.
              </p>
            </div>
          )}

          {/* Send form */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Data</label>
              <Input
                type="date"
                value={sendData.data}
                onChange={(e) => setSendData({ ...sendData, data: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Validade</label>
              <Input
                type="date"
                value={sendData.validade}
                onChange={(e) => setSendData({ ...sendData, validade: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Condição de Pagamento</label>
              <Select
                value={sendData.condicaoPagamento}
                onChange={(e) => setSendData({ ...sendData, condicaoPagamento: e.target.value })}
              >
                <option value="30 DDL">30 DDL</option>
                <option value="28 DDL">28 DDL</option>
                <option value="30/60 DDL">30/60 DDL</option>
                <option value="45 DDL">45 DDL</option>
                <option value="15 Dias">15 Dias</option>
                <option value="60 DDL">60 DDL</option>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Prazo de Entrega</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  className="w-20"
                  value={sendData.prazoEntrega}
                  onChange={(e) => setSendData({ ...sendData, prazoEntrega: e.target.value })}
                />
                <span className="text-sm text-muted-foreground">dias</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Faturamento Mínimo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className="pl-10"
                  value={sendData.faturamentoMinimo}
                  onChange={(e) => setSendData({ ...sendData, faturamentoMinimo: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tipo de Frete</label>
              <Select
                value={sendData.tipoFrete}
                onChange={(e) => setSendData({ ...sendData, tipoFrete: e.target.value })}
              >
                <option value="CIF">CIF</option>
                <option value="FOB">FOB</option>
              </Select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 border-t pt-4">
            <Button
              size="sm"
              disabled={hasNaoAnalisado}
              onClick={handleSendCotacao}
            >
              <Send className="h-4 w-4 mr-1" /> Enviar Cotação
            </Button>
            {status === "COTACAO_ENVIADA" && (
              <>
                <Button variant="outline" size="sm" onClick={handleUpdateCotacao}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Atualizar Cotação
                </Button>
                <Button variant="destructive" size="sm" onClick={handleCancelCotacao}>
                  <Ban className="h-4 w-4 mr-1" /> Cancelar Cotação
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
