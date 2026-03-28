import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { mockPedidos, formatDate, formatCurrency, type Pedido } from "@/lib/mock-data"
import { api } from "@/lib/api"

function getPedidoStatusColor(status: string): string {
  const map: Record<string, string> = {
    CONFIRMADO: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    EM_ENTREGA: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    ENTREGUE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    CANCELADO: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  }
  return map[status] || "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
}

export function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [_loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/pedidos')
      .then(res => setPedidos(res.data))
      .catch(() => setPedidos(mockPedidos))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pedidos Confirmados</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pedidos gerados pelos hospitais após aceite da cotação
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Pedido Bionexo</th>
                  <th className="text-left p-3 font-medium">Hospital</th>
                  <th className="text-left p-3 font-medium">CNPJ</th>
                  <th className="text-left p-3 font-medium">Data</th>
                  <th className="text-right p-3 font-medium">Valor Total</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-xs">{p.bionexoPedidoId}</td>
                    <td className="p-3 font-medium">{p.nomeHospital}</td>
                    <td className="p-3 text-xs">{p.cnpjHospital}</td>
                    <td className="p-3">{formatDate(p.dataPedido)}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(p.valorTotal)}</td>
                    <td className="p-3">
                      <Badge className={getPedidoStatusColor(p.status)}>
                        {p.status.replace("_", " ")}
                      </Badge>
                    </td>
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
