import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBannerProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

/**
 * Banner de erro padrão para falhas de carregamento de dados.
 *
 * Substitui o anti-padrão de fallback silencioso para mock-data:
 * - Mostra erro VISÍVEL ao usuário (não esconde sob dados fake)
 * - Permite retry manual
 * - Cor: rose (vermelho suave) para chamar atenção sem assustar
 *
 * Uso:
 * ```tsx
 * {error && <ErrorBanner message={error} onRetry={fetchData} />}
 * ```
 */
export function ErrorBanner({ title, message, onRetry, className }: ErrorBannerProps) {
  return (
    <div
      className={
        "rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 p-4 flex items-start gap-3 " +
        (className || "")
      }
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
      <div className="flex-1">
        {title && <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">{title}</p>}
        <p className={"text-xs text-rose-700 dark:text-rose-300 " + (title ? "mt-1" : "")}>{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="text-xs h-7 border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/30"
        >
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
