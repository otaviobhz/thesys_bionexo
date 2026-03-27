import { Outlet } from "@tanstack/react-router"
import { AppSidebar } from "./AppSidebar"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"

function AppContent() {
  const { collapsed } = useSidebar()

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
