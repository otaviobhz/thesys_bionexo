import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  variant?: "default" | "success" | "warning" | "destructive"
  description?: string
}

const variantStyles = {
  default: {
    border: "border-l-primary",
    iconBg: "bg-primary/10 text-primary",
  },
  success: {
    border: "border-l-success",
    iconBg: "bg-success/10 text-success",
  },
  warning: {
    border: "border-l-warning",
    iconBg: "bg-warning/10 text-warning",
  },
  destructive: {
    border: "border-l-destructive",
    iconBg: "bg-destructive/10 text-destructive",
  },
}

export function StatsCard({ title, value, icon: Icon, variant = "default", description }: StatsCardProps) {
  const styles = variantStyles[variant]

  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-sm border-l-4", styles.border)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        <div className={cn("p-2.5 rounded-lg", styles.iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
