import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ErrorBanner } from "@/components/ui/error-banner"
import { api } from "@/lib/api"

type SyncLog = {
  id: string
  operacao: string
  direcao: string
  status: string
  mensagem: string
  processadas: number
  createdAt: string
}

function getLogStatusColor(status: string) {
  if (status === "SUCESSO") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
  if (status === "ERRO") return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300"
  return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
}

function getDirecaoColor(dir: string) {
  return dir === "IN"
    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
}

export function SyncLogsPage() {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [_loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function fetchLogs() {
    setLoading(true)
    setError(null)
    api.get('/sync-logs')
      .then(res => setSyncLogs(res.data))
      .catch((err) => {
        setSyncLogs([])
        setError(err?.response?.data?.message || err?.message || 'Erro ao carregar logs de sincronização. Verifique a conexão com o servidor.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLogs() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Logs de Sincronização</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Histórico de operações EDI e sincronizações
        </p>
      </div>
      {error && <ErrorBanner title="Erro ao carregar logs" message={error} onRetry={fetchLogs} />}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Data/Hora</th>
                  <th className="text-left p-3 font-medium">Operação</th>
                  <th className="text-left p-3 font-medium">Direção</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Mensagem</th>
                  <th className="text-right p-3 font-medium">Processadas</th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-xs font-mono">{log.createdAt}</td>
                    <td className="p-3">
                      <Badge variant="outline">{log.operacao}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={getDirecaoColor(log.direcao)}>
                        {log.direcao === "IN" ? "Download" : "Upload"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={getLogStatusColor(log.status)}>{log.status}</Badge>
                    </td>
                    <td className="p-3">{log.mensagem}</td>
                    <td className="p-3 text-right font-mono">{log.processadas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
