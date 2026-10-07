import { useUIStore } from '@/stores'
import { cn } from '@/utils/helpers'

export default function ProcessingModal() {
  const { processingModal } = useUIStore()

  if (!processingModal.open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={cn(
          'bg-[var(--bg-card)] rounded-2xl p-8 max-w-sm w-full mx-4',
          'shadow-xl border border-[var(--border-secondary)]',
          'animate-scale-in',
        )}
      >
        <div className="flex flex-col items-center text-center">
          {/* Spinner */}
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--bg-tertiary)]" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-accent-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>

          {/* Message */}
          <p className="text-sm font-medium text-[var(--text-primary)] mb-4">
            {processingModal.message}
          </p>

          {/* Progress Bar */}
          {processingModal.progress > 0 && (
            <div className="w-full">
              <div className="flex justify-between text-xs text-[var(--text-tertiary)] mb-1.5">
                <span>Đang xử lý...</span>
                <span>{Math.round(processingModal.progress)}%</span>
              </div>
              <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${processingModal.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
