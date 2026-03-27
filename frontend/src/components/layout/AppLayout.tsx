import { Outlet, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { AppSidebar } from "./AppSidebar"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"
import { isAuthenticated } from "@/lib/api"

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
      <div className="px-4 py-2">
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
      </div>
    </SidebarProvider>
  )
}
