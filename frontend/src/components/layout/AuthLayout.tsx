import { Outlet } from "@tanstack/react-router"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun } from "lucide-react"

export function AuthLayout() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Brand */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-b from-primary via-primary to-primary/80 relative">
        <div className="flex flex-col items-center gap-6">
          <img
            src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
            alt="Integração Thesys Bionexo"
            className="max-w-xs w-full"
          />
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-col items-center justify-center p-8 relative">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition-colors"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Mobile logo */}
        <img src={theme === "dark" ? "/favicon-dark.png" : "/favicon-light.png"} alt="Thesys Bionexo" className="lg:hidden w-14 h-14 rounded-xl mb-8" />

        <div className="w-full max-w-sm">
          <Outlet />
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Thesys ERP &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
