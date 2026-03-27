import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Plus, Search, X, Pencil, Trash2, Star, Ban, Sparkles } from "lucide-react"
import { mockRegrasKeywords, formatDate, type RegraPalavraChave } from "@/lib/mock-data"
import { api } from "@/lib/api"

export function PalavrasChavePage() {
  const [keywords, setKeywords] = useState<RegraPalavraChave[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [acaoFilter, setAcaoFilter] = useState<string>("TODAS")
  const [showAddForm, setShowAddForm] = useState(false)
  const [newKeyword, setNewKeyword] = useState("")
  const [newAcao, setNewAcao] = useState<"INTERESSANTE" | "DESCARTAR">("INTERESSANTE")

  function fetchKeywords() {
    setLoading(true)
    api.get('/keywords')
      .then(res => {
        const data = res.data.map((k: any) => ({
          id: k.id,
          palavraChave: k.palavraChave,
          acaoAutomatica: k.acaoAutomatica,
          dataCriacao: k.createdAt?.split('T')[0] || k.createdAt,
          matches: k.matches,
        }))
        setKeywords(data)
      })
      .catch(() => setKeywords(mockRegrasKeywords))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchKeywords() }, [])

  const filtered = keywords.filter((r) => {
    if (search && !r.palavraChave.toLowerCase().includes(search.toLowerCase())) return false
    if (acaoFilter !== "TODAS" && r.acaoAutomatica !== acaoFilter) return false
    return true
  })

  // Mock match counts as fallback
  const matchCounts: Record<string, number> = {
    "kw-001": 47, "kw-002": 132, "kw-003": 89, "kw-004": 56,
    "kw-005": 23, "kw-006": 15, "kw-007": 8, "kw-008": 34,
    "kw-009": 28, "kw-010": 21,
  }

  function handleCreate() {
    if (!newKeyword.trim()) return
    api.post('/keywords', { palavraChave: newKeyword, acaoAutomatica: newAcao })
      .then(() => { setNewKeyword(""); setShowAddForm(false); fetchKeywords() })
      .catch(() => {})
  }

  function handleDelete(id: string) {
    api.delete(`/keywords/${id}`)
      .then(() => fetchKeywords())
      .catch(() => {})
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Palavras-Chave</h1>
        </div>
        <Button size="sm" className="text-xs h-8" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
        </Button>
      </div>

      {/* Add form (toggleable) */}
      {showAddForm && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <h3 className="text-sm font-semibold mb-3">Nova Palavra-Chave</h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">Palavra-Chave</label>
                <Input
                  placeholder="Ex: SERINGA, CATETER, MANUTENÇÃO..."
                  className="h-8 text-sm"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Ação</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="radio" checked={newAcao === "INTERESSANTE"} onChange={() => setNewAcao("INTERESSANTE")} className="accent-green-600" />
                    <Star className="h-3 w-3 text-green-600 fill-green-600" /> Interessante
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="radio" checked={newAcao === "DESCARTAR"} onChange={() => setNewAcao("DESCARTAR")} className="accent-rose-600" />
                    <Ban className="h-3 w-3 text-rose-600" /> Descartar
                  </label>
                </div>
              </div>
              <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700" disabled={!newKeyword.trim()} onClick={handleCreate}>
                Salvar
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-end gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Buscar palavra-chave..." className="h-8 text-xs pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <Select value={acaoFilter} onChange={(e) => setAcaoFilter(e.target.value)} className="h-8 text-xs w-40">
            <option value="TODAS">Todas as ações</option>
            <option value="INTERESSANTE">Interessante</option>
            <option value="DESCARTAR">Descartar</option>
          </Select>
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} regras</span>
      </div>

      {/* Table */}
      <div className="border rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/60 border-b">
              <th className="p-2 text-left font-semibold">Palavra-Chave</th>
              <th className="p-2 text-left font-semibold">Ação Automática</th>
              <th className="p-2 text-right font-semibold">Matches</th>
              <th className="p-2 text-left font-semibold">Data Criação</th>
              <th className="p-2 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((regra) => (
              <tr
                key={regra.id}
                className={cn(
                  "border-b transition-colors",
                  regra.acaoAutomatica === "INTERESSANTE"
                    ? "bg-green-50/50 dark:bg-green-950/10 hover:bg-green-50 dark:hover:bg-green-950/20"
                    : "bg-rose-50/50 dark:bg-rose-950/10 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                )}
              >
                <td className="p-2 font-semibold">{regra.palavraChave}</td>
                <td className="p-2">
                  {regra.acaoAutomatica === "INTERESSANTE" ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
                      <Star className="h-3 w-3 mr-1 fill-current" /> Interessante
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 text-xs">
                      <Ban className="h-3 w-3 mr-1" /> Descartar
                    </Badge>
                  )}
                </td>
                <td className="p-2 text-right font-mono">{(regra as any).matches ?? matchCounts[regra.id] ?? 0}</td>
                <td className="p-2">{formatDate(regra.dataCriacao)}</td>
                <td className="p-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" title="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" title="Excluir" onClick={() => handleDelete(regra.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhuma palavra-chave encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="text-xs text-muted-foreground space-y-0.5">
        <p><Star className="h-3 w-3 inline text-green-600 fill-green-600" /> <strong>Interessante</strong> = itens com esta palavra ficam VERDES automaticamente nas próximas cotações</p>
        <p><Ban className="h-3 w-3 inline text-rose-600" /> <strong>Descartar</strong> = itens com esta palavra ficam VERMELHOS automaticamente</p>
        <p><strong>Matches</strong> = quantos itens já foram classificados por esta regra</p>
      </div>
    </div>
  )
}
