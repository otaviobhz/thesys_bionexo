import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Save, TestTube2, Power, Loader2, Eye, EyeOff, Bug, CheckCircle2, XCircle, Clock } from "lucide-react"
import { api } from "@/lib/api"

interface DebugStep {
  step: number
  label: string
  status: string
  ms: number
  data?: any
  error?: string
}

interface DebugResult {
  success: boolean
  ambiente?: string
  wsdlUrl?: string
  steps: DebugStep[]
  totalMs: number
}

function DebugPanel({ result, loading }: { result: DebugResult | null; loading: boolean }) {
  if (loading) {
    return (
      <Card className="border-amber-500/50">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-medium">Executando diagnóstico SOAP...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!result) return null

  return (
    <Card className={result.success ? "border-green-500/50" : "border-rose-500/50"}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bug className="h-4 w-4" />
          Debug Conexão Bionexo
          <span className={`ml-auto text-xs font-normal px-2 py-0.5 rounded ${
            result.success
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
          }`}>
            {result.success ? 'CONECTADO' : 'FALHA'}
          </span>
        </CardTitle>
        <CardDescription className="text-xs">
          Ambiente: <strong>{result.ambiente}</strong> | Total: <strong>{result.totalMs}ms</strong>
          {result.wsdlUrl && <> | WSDL: <code className="text-[10px]">{result.wsdlUrl}</code></>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {result.steps.map((step) => (
          <div key={step.step} className="rounded-lg border p-3 space-y-2">
            {/* Step header */}
            <div className="flex items-center gap-2">
              {step.status === 'OK' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
              )}
              <span className="font-medium text-sm">
                Passo {step.step}: {step.label}
              </span>
              <span className={`ml-auto text-xs px-1.5 py-0.5 rounded font-mono ${
                step.status === 'OK'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
              }`}>
                {step.status}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {step.ms}ms
              </span>
            </div>

            {/* Error message */}
            {step.error && (
              <div className="bg-rose-50 dark:bg-rose-950/30 rounded p-2 text-xs text-rose-700 dark:text-rose-400 font-mono break-all">
                {step.error}
              </div>
            )}

            {/* Step data */}
            {step.data && (
              <pre className="bg-muted/50 rounded p-2 text-[11px] font-mono overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                {JSON.stringify(step.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function ConfigPage() {
  const [bionexoConfig, setBionexoConfig] = useState<any>(null)
  const [thesysConfig, setThesysConfig] = useState<any>(null)
  const [testResult, setTestResult] = useState<{bionexo?: string, thesys?: string}>({})
  const [saving, setSaving] = useState<{bionexo?: boolean, thesys?: boolean}>({})
  const [testing, setTesting] = useState<{bionexo?: boolean, thesys?: boolean}>({})
  const [showSenha, setShowSenha] = useState(false)
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null)
  const [debugLoading, setDebugLoading] = useState(false)

  const bionexoFormRef = useRef<HTMLFormElement>(null)
  const thesysFormRef = useRef<HTMLFormElement>(null)

  const BIONEXO_PRESETS: Record<string, { usuario: string; senha: string; wsdlUrl: string }> = {
    SANDBOX: {
      usuario: 'ws_promeho_sand_76283',
      senha: 'xjtzJnz9FNmB62',
      wsdlUrl: 'https://ws-bionexo-sandbox-ssl.bionexo.com/ws2/BionexoBean?wsdl',
    },
    PRODUCAO: {
      usuario: 'ws_promeho_prod_152566',
      senha: 'RgjoSWVdzKuU6j',
      wsdlUrl: 'https://ws.bionexo.com.br/BionexoBean?wsdl',
    },
  }

  function handleAmbienteChange(novoAmbiente: string) {
    const preset = BIONEXO_PRESETS[novoAmbiente]
    if (!preset || !bionexoFormRef.current) return
    const form = bionexoFormRef.current
    const setInput = (name: string, value: string) => {
      const el = form.querySelector(`[name="${name}"]`) as HTMLInputElement
      if (el) { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })) }
    }
    setInput('usuario', preset.usuario)
    setInput('senha', preset.senha)
    setInput('wsdlUrl', preset.wsdlUrl)
    setTestResult(prev => ({ ...prev, bionexo: `ℹ️ Ambiente ${novoAmbiente} selecionado. Clique Salvar para aplicar.` }))
  }

  useEffect(() => {
    api.get('/config').then(res => {
      setBionexoConfig(res.data.bionexo)
      setThesysConfig(res.data.thesys)
    }).catch(() => {})
  }, [])

  async function handleDebugBionexo() {
    setDebugLoading(true)
    setDebugResult(null)
    try {
      const { data } = await api.post('/bionexo/debug')
      setDebugResult(data)
    } catch (e: any) {
      setDebugResult({
        success: false,
        steps: [{
          step: 0, label: 'API Request', status: 'ERRO', ms: 0,
          error: e.response?.data?.message || e.message,
        }],
        totalMs: 0,
      })
    } finally {
      setDebugLoading(false)
    }
  }

  async function handleTestarBionexo() {
    setTesting(prev => ({ ...prev, bionexo: true }))
    setTestResult(prev => ({ ...prev, bionexo: undefined }))
    try {
      const { data } = await api.post('/config/testar-bionexo')
      setTestResult(prev => ({ ...prev, bionexo: data.success ? `✅ ${data.message}` : `❌ ${data.message}` }))
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message
      setTestResult(prev => ({ ...prev, bionexo: `❌ ${msg}` }))
    } finally {
      setTesting(prev => ({ ...prev, bionexo: false }))
    }
  }

  async function handleTestarThesys() {
    setTesting(prev => ({ ...prev, thesys: true }))
    setTestResult(prev => ({ ...prev, thesys: undefined }))
    try {
      const { data } = await api.post('/config/testar-thesys')
      setTestResult(prev => ({ ...prev, thesys: data.success ? `✅ ${data.message}` : `❌ ${data.message}` }))
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message
      setTestResult(prev => ({ ...prev, thesys: `❌ ${msg}` }))
    } finally {
      setTesting(prev => ({ ...prev, thesys: false }))
    }
  }

  async function handleSalvarBionexo() {
    const form = bionexoFormRef.current
    if (!form) return
    setSaving(prev => ({ ...prev, bionexo: true }))
    const formData = new FormData(form)
    try {
      await api.put('/config/bionexo', {
        cnpj: formData.get('cnpj'),
        usuario: formData.get('usuario'),
        senha: formData.get('senha'),
        wsdlUrl: formData.get('wsdlUrl'),
        ambiente: formData.get('ambiente'),
        pollingInterval: Number(formData.get('pollingInterval')),
      })
      setTestResult(prev => ({ ...prev, bionexo: '✅ Configurações salvas' }))
    } catch (e: any) {
      setTestResult(prev => ({ ...prev, bionexo: `❌ Erro ao salvar: ${e.message}` }))
    } finally {
      setSaving(prev => ({ ...prev, bionexo: false }))
    }
  }

  async function handleSalvarThesys() {
    const form = thesysFormRef.current
    if (!form) return
    setSaving(prev => ({ ...prev, thesys: true }))
    const formData = new FormData(form)
    try {
      await api.put('/config/thesys', {
        baseUrl: formData.get('baseUrl'),
        authToken: formData.get('authToken'),
      })
      setTestResult(prev => ({ ...prev, thesys: '✅ Configurações salvas' }))
    } catch (e: any) {
      setTestResult(prev => ({ ...prev, thesys: `❌ Erro ao salvar: ${e.message}` }))
    } finally {
      setSaving(prev => ({ ...prev, thesys: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure a integração com Bionexo e Thesys ERP
        </p>
      </div>

      <div className="grid gap-6">
        {/* Bionexo Config */}
        <Card>
          <CardHeader>
            <CardTitle>Integração Bionexo (EDI SOAP)</CardTitle>
            <CardDescription>
              Credenciais do WebService EDI para receber/enviar cotações
              {bionexoConfig?.ambiente && (
                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  bionexoConfig.ambiente === 'PRODUCAO'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {bionexoConfig.ambiente}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form ref={bionexoFormRef}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1.5">CNPJ Fornecedor</label>
                  <Input name="cnpj" placeholder="00.000.000/0000-00" defaultValue={bionexoConfig?.cnpj ?? ""} key={`b-cnpj-${bionexoConfig?.cnpj}`} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Usuário WebService</label>
                  <Input name="usuario" placeholder="ws_empresa_prod_000000" defaultValue={bionexoConfig?.usuario ?? ""} key={`b-user-${bionexoConfig?.usuario}`} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Senha WebService</label>
                  <div className="relative">
                    <Input name="senha" type={showSenha ? "text" : "password"} placeholder="Senha de integração" defaultValue={bionexoConfig?.senha ?? ""} key={`b-senha-${bionexoConfig?.senha}`} />
                    <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">URL do WSDL</label>
                  <Input name="wsdlUrl" placeholder="https://ws.bionexo.com.br/BionexoBean?wsdl" defaultValue={bionexoConfig?.wsdlUrl ?? ""} key={`b-wsdl-${bionexoConfig?.wsdlUrl}`} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Ambiente</label>
                  <Select name="ambiente" defaultValue={bionexoConfig?.ambiente ?? "SANDBOX"} key={`b-amb-${bionexoConfig?.ambiente}`} onChange={(e) => handleAmbienteChange(e.target.value)}>
                    <option value="SANDBOX">Sandbox (Homologação)</option>
                    <option value="PRODUCAO">Produção</option>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Intervalo de Polling (min)</label>
                  <Input name="pollingInterval" type="number" min={3} max={60} defaultValue={bionexoConfig?.pollingInterval ?? 5} key={`b-poll-${bionexoConfig?.pollingInterval}`} />
                </div>
              </div>
              {bionexoConfig?.ultimoToken && bionexoConfig.ultimoToken !== '0' && (
                <p className="text-xs text-muted-foreground mt-3">
                  Último token: <code className="bg-muted px-1 rounded">{bionexoConfig.ultimoToken}</code>
                </p>
              )}
            </form>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={handleSalvarBionexo} disabled={saving.bionexo}>
                {saving.bionexo ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Salvar
              </Button>
              <Button variant="outline" size="sm" onClick={handleTestarBionexo} disabled={testing.bionexo}>
                {testing.bionexo ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <TestTube2 className="h-4 w-4 mr-1" />}
                Testar Conexão
              </Button>
              <Button variant="secondary" size="sm" onClick={handleDebugBionexo} disabled={debugLoading}>
                {debugLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Bug className="h-4 w-4 mr-1" />}
                Debug Completo
              </Button>
            </div>
            {testResult.bionexo && (
              <p className={`text-xs mt-1 ${testResult.bionexo.startsWith('✅') ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {testResult.bionexo}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Debug Panel */}
        <DebugPanel result={debugResult} loading={debugLoading} />

        {/* Thesys Config */}
        <Card>
          <CardHeader>
            <CardTitle>Integração Thesys ERP (REST API)</CardTitle>
            <CardDescription>API do ERP para busca de produtos, preços e hospitais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form ref={thesysFormRef}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium block mb-1.5">URL Base da API</label>
                  <Input name="baseUrl" placeholder="https://thesys.atrpservices.com.br/thesysbi/thesys_bi_api.dll" defaultValue={thesysConfig?.baseUrl ?? ""} key={`t-url-${thesysConfig?.baseUrl}`} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium block mb-1.5">Token de Autenticação (X-API-Key)</label>
                  <Input name="authToken" type="password" placeholder="API Key principal" defaultValue={thesysConfig?.authToken ?? ""} key={`t-token-${thesysConfig?.authToken}`} />
                  <p className="text-xs text-muted-foreground mt-1">As chaves por endpoint são configuradas no servidor (.env)</p>
                </div>
              </div>
            </form>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSalvarThesys} disabled={saving.thesys}>
                {saving.thesys ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Salvar
              </Button>
              <Button variant="outline" size="sm" onClick={handleTestarThesys} disabled={testing.thesys}>
                {testing.thesys ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <TestTube2 className="h-4 w-4 mr-1" />}
                Testar Conexão
              </Button>
            </div>
            {testResult.thesys && (
              <p className={`text-xs mt-1 ${testResult.thesys.startsWith('✅') ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {testResult.thesys}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Bot Config */}
        <Card>
          <CardHeader>
            <CardTitle>Bot Automático</CardTitle>
            <CardDescription>Download automático de cotações via polling</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Bot de Importação</p>
                <p className="text-sm text-muted-foreground">
                  Download automático a cada {bionexoConfig?.pollingInterval ?? 5} minutos
                </p>
              </div>
              <Button
                variant={bionexoConfig?.botAtivo ? "destructive" : "outline"}
                size="sm"
                onClick={async () => {
                  const newVal = !bionexoConfig?.botAtivo
                  try {
                    await api.put('/config/bionexo', { botAtivo: newVal })
                    setBionexoConfig((prev: any) => prev ? { ...prev, botAtivo: newVal } : prev)
                  } catch {}
                }}
              >
                <Power className="h-4 w-4 mr-1" />
                {bionexoConfig?.botAtivo ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
