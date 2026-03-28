import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  mockPareamentos,
  formatDate,
  type PareamentoSKU,
} from "@/lib/mock-data"
import { api } from "@/lib/api"
import { Search, Undo2, Download, Upload, Info } from "lucide-react"
import * as XLSX from "xlsx"
import { ImportInfoModal } from "@/components/modals/ImportInfoModal"

export function MapeamentoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dicionário De-Para</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie os pareamentos de produtos (Bionexo → Thesys)
        </p>
      </div>

      <TabPareamentos />
    </div>
  )
}

function TabPareamentos() {
  const [search, setSearch] = useState("")
  const [pareamentos, setPareamentos] = useState<PareamentoSKU[]>([])
  const [_loading, setLoading] = useState(true)
  const [showImportInfo, setShowImportInfo] = useState(false)

  function fetchPareamentos() {
    setLoading(true)
    api.get('/mapeamento')
      .then(res => {
        const data = res.data.map((p: any) => ({
          id: p.id,
          descricaoComprador: p.descricaoComprador,
          skuThesys: p.skuThesys,
          descricaoInterna: p.descricaoInterna,
          dataCriacao: p.createdAt?.split('T')[0] || p.createdAt,
        }))
        setPareamentos(data)
      })
      .catch(() => setPareamentos(mockPareamentos))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPareamentos() }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return pareamentos
    const q = search.toLowerCase()
    return pareamentos.filter(
      (p) =>
        p.descricaoComprador.toLowerCase().includes(q) ||
        p.skuThesys.toLowerCase().includes(q)
    )
  }, [search, pareamentos])

  function handleDesfazer(id: string) {
    api.delete(`/mapeamento/${id}`)
      .then(() => fetchPareamentos())
      .catch(() => setPareamentos((prev) => prev.filter((p) => p.id !== id)))
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por Descrição do Comprador ou SKU Thesys"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" className="text-xs h-8 bg-green-600 hover:bg-green-700 text-white border-green-600" onClick={() => {
            const data = pareamentos.map(p => ({
              "Descrição Comprador": p.descricaoComprador,
              "SKU Thesys": p.skuThesys,
              "Descrição Interna": p.descricaoInterna,
            }))
            const ws = XLSX.utils.json_to_sheet(data)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "De-Para")
            XLSX.writeFile(wb, `de_para_${new Date().toISOString().split('T')[0]}.xlsx`)
          }}>
            <Download className="h-3.5 w-3.5 mr-1" /> Excel
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => {
            const input = document.createElement("input")
            input.type = "file"; input.accept = ".xlsx,.xls,.csv"
            input.onchange = async (e: any) => {
              const file = e.target.files?.[0]
              if (!file) return
              const data = new Uint8Array(await file.arrayBuffer())
              const wb = XLSX.read(data, { type: "array" })
              const ws = wb.Sheets[wb.SheetNames[0]]
              const rows: any[] = XLSX.utils.sheet_to_json(ws)
              let imported = 0
              for (const row of rows) {
                const descricaoComprador = (row["Descrição Comprador"] || row["descricaoComprador"] || "").toString().trim()
                const skuThesys = (row["SKU Thesys"] || row["skuThesys"] || "").toString().trim()
                const descricaoInterna = (row["Descrição Interna"] || row["descricaoInterna"] || "").toString().trim()
                if (descricaoComprador && skuThesys) {
                  try { await api.post('/mapeamento', { descricaoComprador, skuThesys, descricaoInterna }); imported++ } catch {}
                }
              }
              fetchPareamentos()
              alert(`✅ ${imported} pareamentos importados!`)
            }
            input.click()
          }}>
            <Upload className="h-3.5 w-3.5 mr-1" /> Importar
          </Button>
          <button
            onClick={() => setShowImportInfo(true)}
            className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
            title="Informações sobre o formato do Excel"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {showImportInfo && (
          <ImportInfoModal
            title="Formato do Excel — Pareamentos De-Para"
            columns={[
              { letter: "A", name: "Descrição Comprador", required: true, description: "Descrição do produto no hospital (Bionexo)" },
              { letter: "B", name: "SKU Thesys", required: true, description: "Código interno do produto no ERP" },
              { letter: "C", name: "Descrição Interna", required: false, description: "Nome do produto no ERP" },
            ]}
            note="Aceita arquivos .xlsx, .xls ou .csv"
            onClose={() => setShowImportInfo(false)}
          />
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">ID Regra</th>
                <th className="text-left p-3 font-medium">Descrição do Comprador (Bionexo)</th>
                <th className="text-left p-3 font-medium">SKU Thesys</th>
                <th className="text-left p-3 font-medium">Descrição Interna (ERP)</th>
                <th className="text-left p-3 font-medium">Data de Criação</th>
                <th className="text-left p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono text-xs">{p.id}</td>
                  <td className="p-3">{p.descricaoComprador}</td>
                  <td className="p-3 font-mono">{p.skuThesys}</td>
                  <td className="p-3">{p.descricaoInterna}</td>
                  <td className="p-3">{formatDate(p.dataCriacao)}</td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDesfazer(p.id)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Undo2 className="h-4 w-4 mr-1" />
                      Desfazer
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    Nenhum pareamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

