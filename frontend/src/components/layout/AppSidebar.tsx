import { Link, useRouterState } from "@tanstack/react-router"
import { useSidebar } from "@/lib/sidebar-context"
import { logout } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  FileText,
  Sparkles,
  ArrowLeftRight,
  ShoppingCart,
  Users,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  LogOut,
  BookOpen,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

const menuItems = [
  { icon: FileText, label: "Cotações", path: "/" },
  { icon: Sparkles, label: "Palavras-Chave", path: "/palavras-chave" },
  { icon: ArrowLeftRight, label: "Dicionário De-Para", path: "/mapeamento" },
  { icon: ShoppingCart, label: "Pedidos", path: "/pedidos" },
  { icon: Users, label: "Utilizadores", path: "/usuarios" },
  { icon: Activity, label: "Logs de Sync", path: "/sync-logs" },
  { icon: BookOpen, label: "Documentação", path: "/documentacao" },
  { icon: Settings, label: "Configurações", path: "/config" },
]

export function AppSidebar() {
  const { collapsed, toggle } = useSidebar()
  const { theme, setTheme } = useTheme()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-[var(--sidebar-width-icon)]" : "w-[var(--sidebar-width)]"
        )}
      >
        {/* Header */}
        <div className={cn("flex items-center px-3", collapsed ? "justify-center h-14" : "h-16")}>
          {collapsed ? (
            <img
              src={theme === "dark" ? "/favicon-dark.png" : "/favicon-light.png"}
              alt="T·B"
              className="w-9 h-9 object-contain"
            />
          ) : (
            <div className="flex flex-col items-center w-full gap-1">
              <img
                src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
                alt="Integração Thesys Bionexo"
                className="w-full max-h-10 object-contain"
              />
              <span className="text-[10px] text-sidebar-foreground/50">{__APP_VERSION__}</span>
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = item.path === "/"
              ? currentPath === "/"
              : currentPath.startsWith(item.path)
            const Icon = item.icon

            const linkContent = (
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.path}>{linkContent}</div>
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 pb-4 space-y-1">
          <Separator className="bg-sidebar-border mb-3" />

          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm w-full transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                {theme === "dark" ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
                {!collapsed && <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</TooltipContent>}
          </Tooltip>

          {/* Logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={logout}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm w-full transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Sair</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Sair</TooltipContent>}
          </Tooltip>

          {/* Collapse toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggle}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm w-full transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                {collapsed ? <ChevronRight className="h-5 w-5 shrink-0" /> : <ChevronLeft className="h-5 w-5 shrink-0" />}
                {!collapsed && <span>Recolher</span>}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Expandir</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
