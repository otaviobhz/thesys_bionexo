import { StatsCard } from "@/components/dashboard/StatsCard"
import { Inbox, Clock, Send, CheckCircle2, AlertTriangle, Info } from "lucide-react"

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Visão Geral</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Resumo das operações Bionexo
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Recebidas Hoje" value={127} icon={Inbox} />
        <StatsCard title="Pendentes" value={84} icon={Clock} variant="warning" />
        <StatsCard title="Enviadas" value={312} icon={Send} />
        <StatsCard title="Aceitas" value={43} icon={CheckCircle2} variant="success" />
        <StatsCard title="Vencendo 24h" value={18} icon={AlertTriangle} variant="destructive" />
      </div>

      {/* Info text */}
      <div className="flex items-start gap-2 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Acesse as <strong className="text-foreground">Cotações</strong> no menu lateral para gerenciar as cotações.
        </span>
      </div>
    </div>
  )
}
