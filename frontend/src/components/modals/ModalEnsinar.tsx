import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen } from "lucide-react"

interface ModalEnsinarProps {
  open: boolean
  onClose: () => void
  descricaoBionexo: string
}

export function ModalEnsinar({ open, onClose, descricaoBionexo }: ModalEnsinarProps) {
  const [keyword, setKeyword] = useState("")
  const [acao, setAcao] = useState<"INTERESSANTE" | "DESCARTAR">("INTERESSANTE")

  useEffect(() => {
    if (open && descricaoBionexo) {
      const words = descricaoBionexo.split(" ").slice(0, 2).join(" ")
      setKeyword(words)
      setAcao("INTERESSANTE")
    }
  }, [open, descricaoBionexo])

  if (!open) return null

  function handleSave() {
    // Mock save — just close the modal
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl border bg-card p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Ensinar Palavra-Chave</h2>
        </div>

        {/* Bionexo description */}
        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground">
            Descrição Bionexo
          </label>
          <div className="mt-1 rounded-md bg-muted/50 p-3 text-sm">
            {descricaoBionexo}
          </div>
        </div>

        {/* Instruction */}
        <p className="text-sm text-muted-foreground mb-3">
          Selecione ou digite as palavras-chave que identificam este tipo de produto:
        </p>

        {/* Keyword input */}
        <div className="space-y-1.5 mb-4">
          <label className="text-sm font-medium">Palavra-Chave</label>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Digite a palavra-chave"
          />
        </div>

        {/* Action radio */}
        <div className="space-y-1.5 mb-6">
          <label className="text-sm font-medium">Ação Automática</label>
          <div className="flex gap-6 mt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="acao-ensinar"
                value="INTERESSANTE"
                checked={acao === "INTERESSANTE"}
                onChange={() => setAcao("INTERESSANTE")}
                className="h-4 w-4 text-primary"
              />
              <span className="text-sm">Classificar como Interessante</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="acao-ensinar"
                value="DESCARTAR"
                checked={acao === "DESCARTAR"}
                onChange={() => setAcao("DESCARTAR")}
                className="h-4 w-4 text-primary"
              />
              <span className="text-sm">Classificar como Descartar</span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!keyword.trim()}>
            Salvar Regra
          </Button>
        </div>
      </div>
    </div>
  )
}
