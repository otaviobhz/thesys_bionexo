import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { X, ChevronRight, ChevronsRight, ChevronLeft, ChevronsLeft, Search, Star, Ban, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

const STOP_WORDS = new Set([
  "COM", "DE", "DO", "DA", "DOS", "DAS", "PARA", "POR", "EM", "NO", "NA", "NOS", "NAS",
  "AO", "AOS", "O", "A", "OS", "AS", "UM", "UMA", "UNS", "UMAS", "E", "OU", "QUE", "SE",
  "TIPO", "MARCA", "REF", "COD", "LOTE", "S", "C", "N",
])

const SYMBOL_REGEX = /^[-/\\%+×x#().,;:!?'"]+$/

interface ModalAprenderProps {
  open: boolean
  onClose: () => void
  descricaoBionexo: string
}

function extractWords(desc: string): string[] {
  const raw = desc
    .toUpperCase()
    .replace(/[/\\-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)

  const unique = [...new Set(raw)]
  return unique.filter(w => !STOP_WORDS.has(w) && !SYMBOL_REGEX.test(w) && w.length > 1)
}

export function ModalAprender({ open, onClose, descricaoBionexo }: ModalAprenderProps) {
  const allWords = useMemo(() => extractWords(descricaoBionexo), [descricaoBionexo])
  const removedWords = useMemo(() => {
    const raw = descricaoBionexo.toUpperCase().replace(/[/\\-]+/g, " ").split(/\s+/).filter(Boolean)
    return [...new Set(raw)].filter(w => STOP_WORDS.has(w) || SYMBOL_REGEX.test(w) || w.length <= 1)
  }, [descricaoBionexo])

  const [available, setAvailable] = useState<string[]>(allWords)
  const [selected, setSelected] = useState<string[]>([])
  const [selectedLeft, setSelectedLeft] = useState<Set<string>>(new Set())
  const [selectedRight, setSelectedRight] = useState<Set<string>>(new Set())
  const [searchLeft, setSearchLeft] = useState("")
  const [searchRight, setSearchRight] = useState("")
  const [acao, setAcao] = useState<"INTERESSANTE" | "DESCARTAR">("INTERESSANTE")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Reset when description changes
  useEffect(() => {
    setAvailable(allWords)
    setSelected([])
    setSelectedLeft(new Set())
    setSelectedRight(new Set())
    setSaving(false)
    setSaveError(null)
  }, [allWords])

  const filteredAvailable = available.filter(w => !searchLeft || w.includes(searchLeft.toUpperCase()))
  const filteredSelected = selected.filter(w => !searchRight || w.includes(searchRight.toUpperCase()))

  function moveRight() {
    const toMove = available.filter(w => selectedLeft.has(w))
    setAvailable(available.filter(w => !selectedLeft.has(w)))
    setSelected([...selected, ...toMove])
    setSelectedLeft(new Set())
  }

  function moveAllRight() {
    setSelected([...selected, ...available])
    setAvailable([])
    setSelectedLeft(new Set())
  }

  function moveLeft() {
    const toMove = selected.filter(w => selectedRight.has(w))
    setSelected(selected.filter(w => !selectedRight.has(w)))
    setAvailable([...available, ...toMove])
    setSelectedRight(new Set())
  }

  function moveAllLeft() {
    setAvailable([...available, ...selected])
    setSelected([])
    setSelectedRight(new Set())
  }

  function toggleLeft(word: string) {
    const next = new Set(selectedLeft)
    if (next.has(word)) next.delete(word)
    else next.add(word)
    setSelectedLeft(next)
  }

  function toggleRight(word: string) {
    const next = new Set(selectedRight)
    if (next.has(word)) next.delete(word)
    else next.add(word)
    setSelectedRight(next)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-sm font-bold">Aprender — Marcar Palavras</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Item description */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Item selecionado:</label>
            <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm font-medium">{descricaoBionexo}</div>
          </div>

          <p className="text-xs text-muted-foreground">Selecione as palavras para auto-classificação em futuras cotações:</p>

          {/* Dual-list picker */}
          <div className="flex gap-2 items-stretch">
            {/* LEFT: Available */}
            <div className="flex-1 border rounded-lg overflow-hidden">
              <div className="bg-muted/40 px-2 py-1.5 text-xs font-semibold border-b">Disponíveis ({available.length})</div>
              <div className="p-1.5">
                <div className="relative mb-1.5">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input className="h-7 text-xs pl-7" placeholder="Buscar..." value={searchLeft} onChange={e => setSearchLeft(e.target.value)} />
                </div>
                <div className="h-40 overflow-y-auto space-y-0.5">
                  {filteredAvailable.map(w => (
                    <div
                      key={w}
                      onClick={() => toggleLeft(w)}
                      className={cn(
                        "px-2 py-1 text-xs rounded cursor-pointer transition-colors",
                        selectedLeft.has(w) ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      )}
                    >{w}</div>
                  ))}
                  {filteredAvailable.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma palavra</p>}
                </div>
              </div>
            </div>

            {/* CENTER: Arrows */}
            <div className="flex flex-col justify-center gap-1.5">
              <Button variant="outline" size="icon-sm" onClick={moveRight} disabled={selectedLeft.size === 0} title="Mover selecionadas">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={moveAllRight} disabled={available.length === 0} title="Mover todas">
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={moveLeft} disabled={selectedRight.size === 0} title="Devolver selecionadas">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={moveAllLeft} disabled={selected.length === 0} title="Devolver todas">
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* RIGHT: Selected */}
            <div className="flex-1 border rounded-lg overflow-hidden border-green-300 dark:border-green-800">
              <div className="bg-green-50 dark:bg-green-950/30 px-2 py-1.5 text-xs font-semibold border-b border-green-200 dark:border-green-800 text-green-800 dark:text-green-300">
                Selecionadas ({selected.length})
              </div>
              <div className="p-1.5">
                <div className="relative mb-1.5">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input className="h-7 text-xs pl-7" placeholder="Buscar..." value={searchRight} onChange={e => setSearchRight(e.target.value)} />
                </div>
                <div className="h-40 overflow-y-auto space-y-0.5">
                  {filteredSelected.map(w => (
                    <div
                      key={w}
                      onClick={() => toggleRight(w)}
                      className={cn(
                        "px-2 py-1 text-xs rounded cursor-pointer transition-colors",
                        selectedRight.has(w) ? "bg-primary text-primary-foreground" : "hover:bg-green-100 dark:hover:bg-green-900/20"
                      )}
                    >{w}</div>
                  ))}
                  {filteredSelected.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Mova palavras para cá</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Removed stop-words info */}
          {removedWords.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Palavras removidas (stop-words): {removedWords.join(", ")}
            </p>
          )}

          {/* Action radio */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Na próxima integração, itens com estas palavras serão:</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="acao" checked={acao === "INTERESSANTE"} onChange={() => setAcao("INTERESSANTE")} className="accent-green-600" />
                <Star className="h-3.5 w-3.5 text-green-600 fill-green-600" />
                Classificados como Interessante
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="acao" checked={acao === "DESCARTAR"} onChange={() => setAcao("DESCARTAR")} className="accent-rose-600" />
                <Ban className="h-3.5 w-3.5 text-rose-600" />
                Classificados como Descartar
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
          {saveError && <span className="text-xs text-destructive mr-auto">{saveError}</span>}
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button
            size="sm"
            disabled={selected.length === 0 || saving}
            onClick={async () => {
              setSaving(true)
              setSaveError(null)
              try {
                await api.post('/keywords', {
                  palavraChave: selected.join(' '),
                  acaoAutomatica: acao,
                })
                onClose()
              } catch (e: any) {
                setSaveError(e.response?.data?.message || e.message)
              } finally {
                setSaving(false)
              }
            }}
            className={acao === "INTERESSANTE" ? "bg-green-600 hover:bg-green-700" : "bg-rose-600 hover:bg-rose-700"}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            Salvar Regra ({selected.length} {selected.length === 1 ? "palavra" : "palavras"})
          </Button>
        </div>
      </div>
    </div>
  )
}
