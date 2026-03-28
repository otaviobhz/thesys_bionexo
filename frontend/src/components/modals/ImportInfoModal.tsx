import { Info, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ImportColumn {
  letter: string
  name: string
  required: boolean
  description: string
}

interface ImportInfoModalProps {
  title: string
  columns: ImportColumn[]
  onClose: () => void
  note?: string
}

export function ImportInfoModal({ title, columns, onClose, note }: ImportInfoModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 rounded-t-xl flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-3">
            <Info className="text-white" size={24} />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-1 transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Column mapping */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 rounded-lg p-4 border-2">
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-3">📋 Mapeamento de Colunas</p>
            <div className="space-y-2">
              {columns.map(col => (
                <div key={col.letter} className="flex items-start gap-2 text-sm">
                  <span className="font-bold text-gray-900 dark:text-white min-w-[24px]">{col.letter}:</span>
                  <span className="font-medium">{col.name}</span>
                  <Badge className={col.required
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-[10px]"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-[10px]"
                  }>
                    {col.required ? "obrigatório" : "opcional"}
                  </Badge>
                  <span className="text-muted-foreground text-xs">— {col.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          {note && (
            <p className="text-xs text-muted-foreground">{note}</p>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
