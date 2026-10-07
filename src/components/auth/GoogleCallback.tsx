import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import { useToast } from '@/components/ui/Toast'
import { authApi, setTokenRaw } from '@/services/api'
import { Loader2, ShieldAlert } from 'lucide-react'

/**
 * Component này xử lý URL sau khi Google OAuth redirect về:
 *   /auth/callback?token=xxx  (thành công)
 *   /auth/callback?error=yyy  (thất bại)
 *
 * - Nếu có token: lưu vào localStorage, gọi /api/auth/google/me để lấy user,
 *   update auth store, redirect về '/'
 * - Nếu có error: hiển thị lỗi, redirect về /login
 */
export default function GoogleCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login } = useAuthStore()
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error) {
      toast({
        type: 'error',
        title: 'Đăng nhập Google thất bại',
        description: getErrorMessage(error),
      })
      navigate('/login', { replace: true })
      return
    }

    if (!token) {
      toast({ type: 'error', title: 'Lỗi', description: 'Không nhận được token từ Google.' })
      navigate('/login', { replace: true })
      return
    }

    // Lưu token trước, sau đó gọi API lấy thông tin user
    setTokenRaw(token)

    fetch('/api/auth/google/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !data.user) {
          throw new Error(data.message || 'Không thể lấy thông tin người dùng.')
        }
        login(data.user)
        toast({
          type: 'success',
          title: 'Đăng nhập thành công',
          description: `Chào mừng ${data.user.name}!`,
        })

        // Nếu có ?then=... thì redirect về đó, ngược lại về '/'
        const then = searchParams.get('then') || '/'
        window.history.replaceState({}, '', then)
        navigate(then, { replace: true })
      })
      .catch(err => {
        console.error('Google callback error:', err)
        authApi.logout()
        toast({
          type: 'error',
          title: 'Đăng nhập thất bại',
          description: err.message || 'Token không hợp lệ.',
        })
        navigate('/login', { replace: true })
      })
  }, [searchParams, navigate, login, toast])

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] gap-4">
      <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      <p className="text-sm font-medium text-[var(--text-secondary)]">
        Đang hoàn tất đăng nhập với Google...
      </p>
      {searchParams.get('error') && (
        <div className="flex items-center gap-2 text-error-500 text-sm font-medium">
          <ShieldAlert className="w-4 h-4" />
          <span>{getErrorMessage(searchParams.get('error') || '')}</span>
        </div>
      )}
    </div>
  )
}

function getErrorMessage(error: string): string {
  const map: Record<string, string> = {
    'access_denied': 'Bạn đã từ chối quyền truy cập.',
    'email_not_verified': 'Email Google chưa được xác minh.',
    'invalid_state': 'Phiên đăng nhập không hợp lệ (CSRF). Vui lòng thử lại.',
    'missing_code_or_state': 'Thiếu mã xác thực từ Google.',
    'oauth_failed': 'Quá trình OAuth thất bại.',
  }
  return map[error] || `Lỗi: ${error}`
}