import { Outlet, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { AppSidebar } from "./AppSidebar"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"
import { isAuthenticated } from "@/lib/api"
import { Toaster } from "sonner"

function AppContent() {
  const { collapsed } = useSidebar()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" })
    }
  }, [navigate])

  if (!isAuthenticated()) return null

  return (
    <main
      className="transition-all duration-300 min-h-screen"
      style={{
        marginLeft: collapsed ? 'var(--sidebar-width-icon)' : 'var(--sidebar-width)',
      }}
    >
      <div className="px-3 py-2 w-full max-w-full overflow-x-hidden">
        <Outlet />
      </div>
    </main>
  )
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <AppContent />
        <Toaster position="top-right" richColors closeButton duration={3000} />
      </div>
    </SidebarProvider>
  )
}
