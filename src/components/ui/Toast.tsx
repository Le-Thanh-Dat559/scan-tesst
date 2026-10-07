import { useState, createContext, useContext, useCallback, type ReactNode } from 'react'
import { cn } from '@/utils/helpers'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastContextType {
  toast: (options: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors: Record<ToastType, string> = {
  success: 'border-l-success-500 bg-success-500/5',
  error: 'border-l-error-500 bg-error-500/5',
  warning: 'border-l-warning-500 bg-warning-500/5',
  info: 'border-l-primary-500 bg-primary-500/5',
}

const iconColors: Record<ToastType, string> = {
  success: 'text-success-500',
  error: 'text-error-500',
  warning: 'text-warning-500',
  info: 'text-primary-500',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9)
    const duration = options.duration ?? 4000
    const newToast: Toast = { ...options, id, duration }
    setToasts(prev => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((t) => {
          const Icon = icons[t.type]
          return (
            <div
              key={t.id}
              className={cn(
                'flex items-start gap-3 px-4 py-3 rounded-xl min-w-[320px] max-w-[420px]',
                'shadow-lg border border-[var(--border-secondary)] border-l-4',
                'bg-[var(--bg-card)] backdrop-blur-sm',
                'animate-slide-left',
                colors[t.type],
              )}
            >
              <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', iconColors[t.type])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
