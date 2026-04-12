import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { api } from "@/lib/api"
import { ErrorBanner } from "@/components/ui/error-banner"
import { BookOpen, Loader2, FileText, Printer } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DocMeta {
  filename: string
  title: string
  description: string
  ordem: number
}

interface DocContent {
  filename: string
  title: string
  content: string
  updatedAt: string
}

/**
 * DocumentacaoPage — expõe os manuais markdown do projeto dentro do portal
 * para que o keyuser possa consultar enquanto valida.
 *
 * Lista whitelisted vem do backend (GET /docs).
 * Conteúdo de cada doc vem de GET /docs/:filename.
 *
 * Foco UX:
 * - Sidebar à esquerda com lista de docs (titulo + descricao curta)
 * - Conteúdo central com markdown renderizado (typography plugin)
 * - Botão Imprimir para keyuser que prefere papel
 * - Mostra "Atualizado em" do filesystem do servidor
 */
export function DocumentacaoPage() {
  const [docs, setDocs] = useState<DocMeta[]>([])
  const [selectedDoc, setSelectedDoc] = useState<DocContent | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDoc, setLoadingDoc] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function fetchList() {
    setLoadingList(true)
    setError(null)
    api
      .get<DocMeta[]>('/docs', { params: { categoria: 'manual' } })
      .then((res) => {
        setDocs(res.data)
        if (res.data.length > 0 && !selectedDoc) {
          loadDoc(res.data[0].filename)
        }
      })
      .catch((err) => {
        setDocs([])
        setError(err?.response?.data?.message || err?.message || 'Erro ao carregar lista de documentação')
      })
      .finally(() => setLoadingList(false))
  }

  function loadDoc(filename: string) {
    setLoadingDoc(true)
    setError(null)
    api
      .get<DocContent>(`/docs/${filename}`)
      .then((res) => setSelectedDoc(res.data))
      .catch((err) => {
        setSelectedDoc(null)
        setError(err?.response?.data?.message || err?.message || `Erro ao carregar ${filename}`)
      })
      .finally(() => setLoadingDoc(false))
  }

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handlePrint() {
    window.print()
  }

  if (loadingList) {
    return (
      <div className="flex items-center gap-2 p-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando documentação...
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] -m-4 print:m-0 print:h-auto">
      {/* Sidebar */}
      <aside className="w-72 lg:w-80 shrink-0 border-r bg-muted/30 overflow-y-auto print:hidden">
        <div className="p-4 border-b sticky top-0 bg-muted/30 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-base">Documentação</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {docs.length} {docs.length === 1 ? 'documento' : 'documentos'} disponível{docs.length === 1 ? '' : 'is'}
          </p>
        </div>

        <nav className="p-2 space-y-1">
          {docs.map((doc) => {
            const isActive = selectedDoc?.filename === doc.filename
            return (
              <button
                key={doc.filename}
                onClick={() => loadDoc(doc.filename)}
                className={cn(
                  "w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors flex gap-2.5",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-accent text-foreground"
                )}
              >
                <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium leading-tight">{doc.title}</div>
                  <div
                    className={cn(
                      "text-[11px] mt-1 leading-snug",
                      isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
                    {doc.description}
                  </div>
                </div>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-background print:overflow-visible">
        {error && (
          <div className="p-6">
            <ErrorBanner
              title="Erro ao carregar documentação"
              message={error}
              onRetry={() => (selectedDoc ? loadDoc(selectedDoc.filename) : fetchList())}
            />
          </div>
        )}

        {loadingDoc && (
          <div className="flex items-center gap-2 p-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando documento...
          </div>
        )}

        {!loadingDoc && !error && selectedDoc && (
          <article className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-0">
            {/* Cabeçalho do doc */}
            <div className="mb-6 pb-4 border-b print:border-b-2 print:border-black">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{selectedDoc.title}</h1>
                  <p className="text-xs text-muted-foreground mt-2">
                    Arquivo: <code className="font-mono">{selectedDoc.filename}</code> ·
                    Atualizado em{' '}
                    {new Date(selectedDoc.updatedAt).toLocaleString('pt-BR', {
                      timeZone: 'America/Sao_Paulo',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="text-xs h-8 print:hidden"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Imprimir
                </Button>
              </div>
            </div>

            {/* Markdown rendered */}
            <div className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-headings:scroll-mt-20 prose-table:text-xs prose-th:bg-muted prose-th:px-2 prose-td:px-2 prose-pre:text-xs">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedDoc.content}
              </ReactMarkdown>
            </div>
          </article>
        )}

        {!loadingDoc && !error && !selectedDoc && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Selecione um documento na barra lateral</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
