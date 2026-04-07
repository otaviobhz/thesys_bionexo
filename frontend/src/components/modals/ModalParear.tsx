import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link2, Search, Loader2, X, Package } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface ThesysItem {
  id: number
  sku: string
  descricao: string
  unidade: string
}

interface ModalParearProps {
  open: boolean
  onClose: () => void
  descricaoBionexo: string
  itemId: string
  onConfirm: (sku: string, descricao: string) => void
}

export function ModalParear({ open, onClose, descricaoBionexo, itemId, onConfirm }: ModalParearProps) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<ThesysItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ThesysItem | null>(null)
  const [precoSugerido, setPrecoSugerido] = useState<number | null>(null)
  const [loadingPreco, setLoadingPreco] = useState(false)
  const [saving, setSaving] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSearch("")
      setResults([])
      setSelectedItem(null)
      setPrecoSugerido(null)
      setLoadingPreco(false)
      setSaving(false)
      setHighlightIdx(-1)
      setShowDropdown(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [open])

  // S1.6 — Auto-buscar preço quando o usuário seleciona um SKU
  async function fetchPrecoSugerido(sku: string) {
    setLoadingPreco(true)
    setPrecoSugerido(null)
    try {
      const { data } = await api.get('/thesys/precos', { params: { codigo: sku } })
      const list = Array.isArray(data) ? data : []
      const first = list[0]
      if (first && typeof first.preco === 'number') {
        setPrecoSugerido(first.preco)
      }
    } catch {
      // Silencioso aqui — preço é "nice to have", não bloqueia o pareamento
      // Operador pode preencher manualmente
    } finally {
      setLoadingPreco(false)
    }
  }

  const doSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await api.get('/thesys/itens', { params: { search: term } })
      const items = (data || []).slice(0, 15) as ThesysItem[]
      setResults(items)
      setShowDropdown(items.length > 0)
      setHighlightIdx(-1)
    } catch (e: any) {
      setResults([])
      setShowDropdown(false)
      toast.error(`Falha ao buscar no Thesys: ${e?.response?.data?.message || e?.message || 'erro de conexão'}`)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleSearchChange(value: string) {
    setSearch(value)
    setSelectedItem(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 300)
  }

  function handleSelect(item: ThesysItem) {
    setSelectedItem(item)
    setSearch(item.sku)
    setShowDropdown(false)
    fetchPrecoSugerido(item.sku)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIdx(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIdx(prev => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault()
      handleSelect(results[highlightIdx])
    } else if (e.key === "Escape") {
      setShowDropdown(false)
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIdx >= 0 && dropdownRef.current) {
      const el = dropdownRef.current.children[highlightIdx] as HTMLElement
      el?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightIdx])

  async function saveMapping(item: ThesysItem) {
    try {
      await api.post('/mapeamento', {
        descricaoComprador: descricaoBionexo,
        skuThesys: item.sku,
        descricaoInterna: item.descricao,
      })
      return true
    } catch (e: any) {
      // Conflict (409) significa que o vínculo já existe → ok, não é erro
      if (e?.response?.status === 409) return true
      throw e
    }
  }

  async function handleConfirmar() {
    if (!selectedItem) return
    setSaving(true)
    try {
      // 1. Update the item with the SKU + preço sugerido (S1.6)
      const updatePayload: any = {
        codigoInterno: selectedItem.sku,
        descricaoInterna: selectedItem.descricao,
      }
      if (precoSugerido != null) {
        updatePayload.precoUnitario = precoSugerido
      }
      await api.put(`/cotacoes/itens/${itemId}`, updatePayload)

      // 2. Save the mapping for future auto-pairing — agora com tratamento de erro visível
      try {
        await saveMapping(selectedItem)
      } catch (mappingErr: any) {
        const msg = mappingErr?.response?.data?.message || mappingErr?.message || 'erro desconhecido'
        toast.warning(
          `Item pareado, mas o vínculo NÃO foi salvo no Dicionário De-Para. Próximas cotações com a mesma descrição NÃO virão pré-preenchidas. Motivo: ${msg}`,
          {
            duration: 10000,
            action: {
              label: 'Tentar novamente',
              onClick: () => {
                saveMapping(selectedItem)
                  .then(() => toast.success('De-Para salvo com sucesso'))
                  .catch((retryErr: any) => toast.error(`Falhou novamente: ${retryErr?.message || 'erro'}`))
              },
            },
          },
        )
      }

      onConfirm(selectedItem.sku, selectedItem.descricao)
      onClose()
    } catch (e: any) {
      toast.error(`Erro ao parear: ${e.response?.data?.message || e.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  function highlightMatch(text: string) {
    if (!search || search.length < 2) return text
    const idx = text.toUpperCase().indexOf(search.toUpperCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5">{text.slice(idx, idx + search.length)}</mark>
        {text.slice(idx + search.length)}
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl border bg-card p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Parear Produto</h2>
          <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Bionexo description */}
        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground">
            Descrição Bionexo
          </label>
          <div className="mt-1 rounded-md bg-muted/50 p-3 text-sm">
            {descricaoBionexo}
          </div>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <label className="text-sm font-medium block mb-1.5">Buscar SKU Thesys</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              placeholder="Digite código, descrição ou EAN..."
              className="pl-9 pr-9"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Mínimo 2 caracteres para buscar
          </p>

          {/* Dropdown results */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute z-20 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border bg-popover shadow-lg"
            >
              {results.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors flex items-start gap-2 border-b last:border-b-0 ${
                    idx === highlightIdx ? "bg-accent" : ""
                  }`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightIdx(idx)}
                >
                  <Package className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="font-mono font-medium text-primary">
                      {highlightMatch(item.sku)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {highlightMatch(item.descricao)}
                    </div>
                    <div className="text-xs text-muted-foreground/60">
                      Und: {item.unidade}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && search.length >= 2 && results.length === 0 && !selectedItem && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border bg-popover shadow-lg px-3 py-4 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado para "{search}"
            </div>
          )}
        </div>

        {/* Selected item preview */}
        {selectedItem && (
          <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Produto Selecionado</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
              <div>
                <span className="text-xs text-muted-foreground">Código SKU</span>
                <p className="font-mono font-semibold">{selectedItem.sku}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Unidade</span>
                <p className="font-medium">{selectedItem.unidade}</p>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-muted-foreground">Descrição Interna</span>
                <p className="font-medium">{selectedItem.descricao}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-primary/20">
                <span className="text-xs text-muted-foreground">Preço Sugerido (Thesys)</span>
                {loadingPreco ? (
                  <p className="text-sm text-muted-foreground italic flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Buscando no Thesys...
                  </p>
                ) : precoSugerido != null ? (
                  <p className="font-mono font-semibold text-primary">
                    R$ {precoSugerido.toFixed(2).replace('.', ',')}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Sem preço cadastrado no Thesys — preencha manualmente após confirmar
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Note */}
        <p className="text-xs text-muted-foreground mb-5">
          Ao parear, o mapeamento será salvo no De-Para para futuras cotações.
          {precoSugerido != null && ' O preço sugerido será aplicado ao item.'}
        </p>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={!selectedItem || saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Link2 className="h-4 w-4 mr-1" />}
            Confirmar Pareamento
          </Button>
        </div>
      </div>
    </div>
  )
}
