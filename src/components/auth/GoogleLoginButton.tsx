import { cn } from '@/utils/helpers'

interface GoogleLoginButtonProps {
  /** URL để redirect sau khi login thành công (mặc định '/') */
  redirect?: string
  /** Label hiển thị */
  label?: string
  className?: string
  disabled?: boolean
}

/**
 * Nút đăng nhập bằng Google.
 *
 * Click → redirect sang `/api/auth/google?redirect=...`
 * Backend sẽ chuyển hướng sang Google, user đồng ý, Google redirect về
 * /api/auth/google/callback → backend cấp JWT → redirect về frontend với
 * `?token=...` ở URL.
 */
export default function GoogleLoginButton({
  redirect = '/',
  label = 'Tiếp tục với Google',
  className,
  disabled,
}: GoogleLoginButtonProps) {
  const handleClick = () => {
    const params = new URLSearchParams()
    if (redirect) params.set('redirect', redirect)
    // window.location thay vì react-router để server xử lý hoàn toàn
    window.location.href = `/api/auth/google?${params.toString()}`
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'w-full inline-flex items-center justify-center gap-3 px-4 py-2.5',
        'rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-card)]',
        'text-[var(--text-primary)] text-sm font-semibold',
        'hover:bg-[var(--bg-tertiary)] hover:border-primary-500/30',
        'transition-all duration-200 active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
    >
      <GoogleIcon className="w-5 h-5 shrink-0" />
      <span>{label}</span>
    </button>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}