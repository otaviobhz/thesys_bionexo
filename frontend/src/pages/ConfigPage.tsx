import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Save, TestTube2, Power } from "lucide-react"
import { api } from "@/lib/api"

export function ConfigPage() {
  const [bionexoConfig, setBionexoConfig] = useState<any>(null)
  const [thesysConfig, setThesysConfig] = useState<any>(null)
  const [testResult, setTestResult] = useState<{bionexo?: string, thesys?: string}>({})

  const bionexoFormRef = useRef<HTMLFormElement>(null)
  const thesysFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    api.get('/config').then(res => {
      setBionexoConfig(res.data.bionexo)
      setThesysConfig(res.data.thesys)
    }).catch(() => {})
  }, [])

  async function handleTestarBionexo() {
    try {
      const { data } = await api.post('/config/testar-bionexo')
      setTestResult(prev => ({ ...prev, bionexo: data.success ? `✅ ${data.message}` : `❌ ${data.message}` }))
    } catch (e: any) {
      setTestResult(prev => ({ ...prev, bionexo: `❌ ${e.message}` }))
    }
  }

  async function handleTestarThesys() {
    try {
      const { data } = await api.post('/config/testar-thesys')
      setTestResult(prev => ({ ...prev, thesys: data.success ? `✅ ${data.message}` : `❌ ${data.message}` }))
    } catch (e: any) {
      setTestResult(prev => ({ ...prev, thesys: `❌ ${e.message}` }))
    }
  }

  async function handleSalvarBionexo() {
    const form = bionexoFormRef.current
    if (!form) return
    const formData = new FormData(form)
    await api.put('/config/bionexo', {
      cnpj_fornecedor: formData.get('cnpj_fornecedor'),
      token: formData.get('token'),
      ambiente: formData.get('ambiente'),
      intervalo_polling: Number(formData.get('intervalo_polling')),
    }).catch(() => {})
  }

  async function handleSalvarThesys() {
    const form = thesysFormRef.current
    if (!form) return
    const formData = new FormData(form)
    await api.put('/config/thesys', {
      url_base: formData.get('url_base'),
      token: formData.get('token'),
      intervalo_sync: Number(formData.get('intervalo_sync')),
    }).catch(() => {})
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure a integração com Bionexo e Thesys
        </p>
      </div>

      <div className="grid gap-6">
        {/* Bionexo Config */}
        <Card>
          <CardHeader>
            <CardTitle>Integração Bionexo</CardTitle>
            <CardDescription>Credenciais e configurações do EDI WebService</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form ref={bionexoFormRef}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">CNPJ Fornecedor</label>
                <Input name="cnpj_fornecedor" placeholder="00.000.000/0000-00" defaultValue={bionexoConfig?.cnpj_fornecedor ?? ""} key={`b-cnpj-${bionexoConfig?.cnpj_fornecedor}`} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Token</label>
                <Input name="token" type="password" placeholder="Token de integração" defaultValue={bionexoConfig?.token ?? ""} key={`b-token-${bionexoConfig?.token}`} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Ambiente</label>
                <Select name="ambiente" defaultValue={bionexoConfig?.ambiente ?? "SANDBOX"} key={`b-amb-${bionexoConfig?.ambiente}`}>
                  <option value="SANDBOX">Sandbox (Testes)</option>
                  <option value="PRODUCAO">Produção</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Intervalo de Polling (min)</label>
                <Input name="intervalo_polling" type="number" min={3} max={30} defaultValue={bionexoConfig?.intervalo_polling ?? 5} key={`b-poll-${bionexoConfig?.intervalo_polling}`} />
              </div>
            </div>
            </form>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSalvarBionexo}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
              <Button variant="outline" size="sm" onClick={handleTestarBionexo}><TestTube2 className="h-4 w-4 mr-1" /> Testar Conexão</Button>
            </div>
            {testResult.bionexo && <p className={`text-xs mt-1 ${testResult.bionexo.startsWith('✅') ? 'text-green-600' : 'text-rose-600'}`}>{testResult.bionexo}</p>}
          </CardContent>
        </Card>

        {/* Thesys Config */}
        <Card>
          <CardHeader>
            <CardTitle>Integração Thesys ERP</CardTitle>
            <CardDescription>API do ERP para busca de itens e envio de cotações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form ref={thesysFormRef}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">URL Base da API</label>
                <Input name="url_base" placeholder="https://api.thesys.com.br" defaultValue={thesysConfig?.url_base ?? ""} key={`t-url-${thesysConfig?.url_base}`} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Token de Autenticação</label>
                <Input name="token" type="password" placeholder="Bearer token" defaultValue={thesysConfig?.token ?? ""} key={`t-token-${thesysConfig?.token}`} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Intervalo de Sync (min)</label>
                <Input name="intervalo_sync" type="number" min={5} max={120} defaultValue={thesysConfig?.intervalo_sync ?? 30} key={`t-sync-${thesysConfig?.intervalo_sync}`} />
              </div>
            </div>
            </form>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSalvarThesys}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
              <Button variant="outline" size="sm" onClick={handleTestarThesys}><TestTube2 className="h-4 w-4 mr-1" /> Testar Conexão</Button>
            </div>
            {testResult.thesys && <p className={`text-xs mt-1 ${testResult.thesys.startsWith('✅') ? 'text-green-600' : 'text-rose-600'}`}>{testResult.thesys}</p>}
          </CardContent>
        </Card>

        {/* Bot Config */}
        <Card>
          <CardHeader>
            <CardTitle>Bot Automático</CardTitle>
            <CardDescription>Controle do download automático de cotações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Bot de Importação</p>
                <p className="text-sm text-muted-foreground">Download automático a cada 5 minutos</p>
              </div>
              <Button variant="outline" size="sm">
                <Power className="h-4 w-4 mr-1" /> Ativar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
