import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Plus, Search, Pencil, Trash2, Star, Ban, Sparkles, Download, Upload, Info } from "lucide-react"
import { mockRegrasKeywords, formatDate, type RegraPalavraChave } from "@/lib/mock-data"
import { api } from "@/lib/api"
import * as XLSX from "xlsx"
import { ImportInfoModal } from "@/components/modals/ImportInfoModal"

export function PalavrasChavePage() {
  const [keywords, setKeywords] = useState<RegraPalavraChave[]>([])
  const [_loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [acaoFilter, setAcaoFilter] = useState<string>("TODAS")
  const [showAddForm, setShowAddForm] = useState(false)
  const [newKeyword, setNewKeyword] = useState("")
  const [newAcao, setNewAcao] = useState<"INTERESSANTE" | "DESCARTAR">("INTERESSANTE")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showImportInfo, setShowImportInfo] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

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

  const matchCounts: Record<string, number> = {
    "kw-001": 47, "kw-002": 132, "kw-003": 89, "kw-004": 56,
    "kw-005": 23, "kw-006": 15, "kw-007": 8, "kw-008": 34,
  }

  function handleCreate() {
    if (!newKeyword.trim()) return
    if (editingId) {
      api.put(`/keywords/${editingId}`, { palavraChave: newKeyword, acaoAutomatica: newAcao })
        .then(() => { resetForm(); fetchKeywords() })
        .catch(() => {})
    } else {
      api.post('/keywords', { palavraChave: newKeyword, acaoAutomatica: newAcao })
        .then(() => { resetForm(); fetchKeywords() })
        .catch(() => {})
    }
  }

  function handleEdit(regra: RegraPalavraChave) {
    setEditingId(regra.id)
    setNewKeyword(regra.palavraChave)
    setNewAcao(regra.acaoAutomatica as "INTERESSANTE" | "DESCARTAR")
    setShowAddForm(true)
  }

  function resetForm() {
    setNewKeyword("")
    setNewAcao("INTERESSANTE")
    setEditingId(null)
    setShowAddForm(false)
  }

  function handleDelete(id: string) {
    api.delete(`/keywords/${id}`)
      .then(() => fetchKeywords())
      .catch(() => {})
  }

  function handleExportXLSX() {
    const data = keywords.map(k => ({
      "Palavra-Chave": k.palavraChave,
      "Ação Automática": k.acaoAutomatica,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Palavras-Chave")
    XLSX.writeFile(wb, `palavras_chave_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  function handleImportXLSX(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: "array" })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(ws)
      let imported = 0
      for (const row of rows) {
        const palavraChave = (row["Palavra-Chave"] || row["palavraChave"] || "").toString().trim().toUpperCase()
        const acaoAutomatica = (row["Ação Automática"] || row["acaoAutomatica"] || "").toString().trim().toUpperCase()
        if (palavraChave && (acaoAutomatica === "INTERESSANTE" || acaoAutomatica === "DESCARTAR")) {
          try {
            await api.post('/keywords', { palavraChave, acaoAutomatica })
            imported++
          } catch { /* skip duplicates */ }
        }
      }
      fetchKeywords()
      alert(`✅ ${imported} palavras-chave importadas com sucesso!`)
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ""
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Palavras-Chave</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8 bg-green-600 hover:bg-green-700 text-white border-green-600" onClick={handleExportXLSX}>
            <Download className="h-3.5 w-3.5 mr-1" /> Excel
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => importRef.current?.click()}>
            <Upload className="h-3.5 w-3.5 mr-1" /> Importar
          </Button>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportXLSX} />
          <button
            onClick={() => setShowImportInfo(true)}
            className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
            title="Informações sobre o formato do Excel"
          >
            <Info className="w-4 h-4" />
          </button>
          <Button size="sm" className="text-xs h-8" onClick={() => { resetForm(); setShowAddForm(!showAddForm) }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
          </Button>
        </div>
      </div>

      {/* Import Info Modal */}
      {showImportInfo && (
        <ImportInfoModal
          title="Formato do Excel — Palavras-Chave"
          columns={[
            { letter: "A", name: "Palavra-Chave", required: true, description: "Ex: SERINGA, CATETER, MANUTENÇÃO" },
            { letter: "B", name: "Ação Automática", required: true, description: "INTERESSANTE ou DESCARTAR" },
          ]}
          note="Aceita arquivos .xlsx, .xls ou .csv (separador: ponto e vírgula)"
          onClose={() => setShowImportInfo(false)}
        />
      )}

      {/* Add/Edit form */}
      {showAddForm && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <h3 className="text-sm font-semibold mb-3">{editingId ? "Editar Palavra-Chave" : "Nova Palavra-Chave"}</h3>
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
                {editingId ? "Atualizar" : "Salvar"}
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={resetForm}>
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
                    <Button variant="ghost" size="icon-sm" title="Editar" onClick={() => handleEdit(regra)}><Pencil className="h-3.5 w-3.5" /></Button>
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
        <p><Download className="h-3 w-3 inline" /> <strong>Excel</strong> = baixa todas as palavras-chave como arquivo .xlsx</p>
        <p><Upload className="h-3 w-3 inline" /> <strong>Importar</strong> = carrega palavras-chave de arquivo .xlsx/.csv</p>
        <p><Info className="h-3 w-3 inline" /> <strong>Info</strong> = mostra o formato esperado para importação</p>
      </div>
    </div>
  )
}
