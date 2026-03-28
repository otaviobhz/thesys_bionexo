import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { mockUsuarios, type Usuario } from "@/lib/mock-data"
import { api } from "@/lib/api"
import { Search, Plus, Pencil, Lock, Unlock, Info } from "lucide-react"

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [_loading, setLoading] = useState(true)

  function fetchUsuarios() {
    setLoading(true)
    api.get('/usuarios')
      .then(res => {
        const data = res.data.map((u: any) => ({
          id: u.id,
          nome: u.nome,
          email: u.email,
          perfil: u.perfil,
          status: u.ativo ? 'ATIVO' : 'INATIVO',
          dataCriacao: u.createdAt?.split('T')[0] || u.createdAt,
        }))
        setUsuarios(data)
      })
      .catch(() => setUsuarios(mockUsuarios))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsuarios() }, [])
  const [search, setSearch] = useState("")

  // Form state
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [perfil, setPerfil] = useState<"MASTER" | "OPERADOR">("OPERADOR")

  const filtered = useMemo(() => {
    if (!search.trim()) return usuarios
    const q = search.toLowerCase()
    return usuarios.filter(
      (u) =>
        u.nome.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    )
  }, [search, usuarios])

  function handleCriarUsuario() {
    if (!nome.trim() || !email.trim() || !senha.trim()) return
    if (senha !== confirmarSenha) return

    const novo: Usuario = {
      id: `usr-${String(usuarios.length + 1).padStart(3, "0")}`,
      nome: nome.trim(),
      email: email.trim(),
      perfil,
      status: "ATIVO",
      dataCriacao: new Date().toISOString().split("T")[0],
    }
    setUsuarios((prev) => [...prev, novo])
    setNome("")
    setEmail("")
    setSenha("")
    setConfirmarSenha("")
    setPerfil("OPERADOR")
  }

  function handleToggleStatus(id: string) {
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "ATIVO" ? "INATIVO" : "ATIVO" }
          : u
      )
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestão de Utilizadores do Sistema</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie os utilizadores e suas permissões de acesso
        </p>
      </div>

      {/* Add User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Novo Utilizador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome Completo</label>
              <Input
                placeholder="Nome do utilizador"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">E-mail</label>
              <Input
                type="email"
                placeholder="email@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Será o login</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                placeholder="Senha de acesso"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Confirmar Senha</label>
              <Input
                type="password"
                placeholder="Confirme a senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Perfil de Acesso</label>
              <div className="flex gap-6 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="perfil"
                    value="MASTER"
                    checked={perfil === "MASTER"}
                    onChange={() => setPerfil("MASTER")}
                    className="h-4 w-4 text-primary"
                  />
                  <span className="text-sm">Master</span>
                  <span className="text-xs text-muted-foreground">(acesso total ao sistema)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="perfil"
                    value="OPERADOR"
                    checked={perfil === "OPERADOR"}
                    onChange={() => setPerfil("OPERADOR")}
                    className="h-4 w-4 text-primary"
                  />
                  <span className="text-sm">Operador</span>
                  <span className="text-xs text-muted-foreground">(apenas cotações)</span>
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleCriarUsuario}>
              <Plus className="h-4 w-4 mr-1" />
              Criar Utilizador
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardContent className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por Nome ou E-mail"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium">E-mail</th>
                  <th className="text-left p-3 font-medium">Perfil</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{u.nome}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      <Badge variant={u.perfil === "MASTER" ? "default" : "secondary"}>
                        {u.perfil}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            u.status === "ATIVO" ? "bg-green-500" : "bg-red-500"
                          )}
                        />
                        <span className="text-sm">
                          {u.status === "ATIVO" ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleToggleStatus(u.id)}
                          title={u.status === "ATIVO" ? "Bloquear" : "Desbloquear"}
                        >
                          {u.status === "ATIVO" ? (
                            <Lock className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Unlock className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      Nenhum utilizador encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              O sistema não permite apagar utilizadores para manter o histórico de auditoria.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
