import { cn } from '@/utils/helpers'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={cn(
          'bg-[var(--bg-card)] rounded-2xl p-6 max-w-md w-full mx-4',
          'shadow-xl border border-[var(--border-secondary)]',
          'animate-scale-in',
        )}
      >
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{description}</p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium',
              'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
              'hover:bg-[var(--bg-secondary)] transition-colors duration-200',
            )}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium text-white',
              'transition-all duration-200',
              variant === 'danger'
                ? 'bg-error-500 hover:bg-error-600'
                : 'gradient-primary hover:opacity-90',
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
