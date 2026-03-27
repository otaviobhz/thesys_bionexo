import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link2 } from "lucide-react"

interface ModalParearProps {
  open: boolean
  onClose: () => void
  descricaoBionexo: string
  itemId: string
}

// Simple mock lookup for SKU descriptions
const skuDescriptions: Record<string, string> = {
  "9928": "SERINGA 10ML LUER LOCK",
  "5512": "GAZE ESTERIL 13F PCT C/10",
  "3301": "LUVA CIR. ESTERIL 7.5",
  "4410": "CATETER IV 18G",
  "2205": "FITA MICROPORE 25MM",
  "6601": "MASCARA CIR. TRIPLA",
  "7710": "FIO NYLON 3-0 C/AG",
  "1105": "ALGODAO HIDROFILO 500G",
}

export function ModalParear({ open, onClose, descricaoBionexo, itemId }: ModalParearProps) {
  const [sku, setSku] = useState("")

  if (!open) return null

  const descricaoMatch = skuDescriptions[sku.trim()] || ""

  function handleConfirmar() {
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
          <Link2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Parear Produto</h2>
        </div>

        {/* Bionexo description */}
        <div className="mb-4">
          <label className="text-sm font-medium text-muted-foreground">
            Descrição Bionexo
          </label>
          <div className="mt-1 rounded-md bg-muted/50 p-3 text-sm">
            {descricaoBionexo}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Item: {itemId}</p>
        </div>

        {/* Instruction */}
        <p className="text-sm text-muted-foreground mb-3">
          Vincule este produto a um SKU do Thesys:
        </p>

        {/* SKU input */}
        <div className="space-y-1.5 mb-4">
          <label className="text-sm font-medium">Código SKU Thesys</label>
          <Input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Digite o código SKU"
          />
        </div>

        {/* Description preview */}
        <div className="space-y-1.5 mb-4">
          <label className="text-sm font-medium text-muted-foreground">
            Descrição Interna (ERP)
          </label>
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            {descricaoMatch || "\u2014"}
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-muted-foreground mb-6">
          Ao parear, o item será automaticamente classificado como Interessante nas futuras
          integrações.
        </p>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={!sku.trim()}>
            Confirmar Pareamento
          </Button>
        </div>
      </div>
    </div>
  )
}
