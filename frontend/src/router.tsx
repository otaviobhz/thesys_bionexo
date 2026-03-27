import { createRouter, createRoute, createRootRoute } from "@tanstack/react-router"
import { AppLayout } from "@/components/layout/AppLayout"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { LoginPage } from "@/pages/LoginPage"
import { CotacoesPage } from "@/pages/CotacoesPage"
import { CotacaoDetalhePage } from "@/pages/CotacaoDetalhePage"
import { PalavrasChavePage } from "@/pages/PalavrasChavePage"
import { MapeamentoPage } from "@/pages/MapeamentoPage"
import { PedidosPage } from "@/pages/PedidosPage"
import { UsuariosPage } from "@/pages/UsuariosPage"
import { ConfigPage } from "@/pages/ConfigPage"
import { SyncLogsPage } from "@/pages/SyncLogsPage"

const rootRoute = createRootRoute()

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "auth",
  component: AuthLayout,
})

const loginRoute = createRoute({
  getParentRoute: () => authRoute,
  path: "/login",
  component: LoginPage,
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: AppLayout,
})

const cotacoesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  component: CotacoesPage,
})

const cotacaoDetalheRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/cotacoes/$cotacaoId",
  component: CotacaoDetalhePage,
})

const palavrasChaveRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/palavras-chave",
  component: PalavrasChavePage,
})

const mapeamentoRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/mapeamento",
  component: MapeamentoPage,
})

const pedidosRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/pedidos",
  component: PedidosPage,
})

const usuariosRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/usuarios",
  component: UsuariosPage,
})

const configRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/config",
  component: ConfigPage,
})

const syncLogsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/sync-logs",
  component: SyncLogsPage,
})

const routeTree = rootRoute.addChildren([
  authRoute.addChildren([loginRoute]),
  appRoute.addChildren([
    cotacoesRoute,
    cotacaoDetalheRoute,
    palavrasChaveRoute,
    mapeamentoRoute,
    pedidosRoute,
    usuariosRoute,
    configRoute,
    syncLogsRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
