import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import { useToast } from '@/components/ui/Toast'
import {
  Mail, Lock, ArrowRight, Eye, EyeOff,
  Zap, Shield, CheckCircle2,
  ScanLine, Languages, FileStack, Star
} from 'lucide-react'
import { authApi } from '@/services/api'
import GoogleLoginButton from '@/components/auth/GoogleLoginButton'

export default function Login() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(true)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) / 100
      const y = (e.clientY - rect.top - rect.height / 2) / 100
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({ type: 'error', title: 'Lỗi', description: 'Vui lòng nhập đầy đủ email và mật khẩu.' })
      return
    }

    setIsLoading(true)

    try {
      const { user } = await authApi.login({ email, password })
      // Token đã được lưu vào localStorage bởi authApi.login()

      if (rememberMe) localStorage.setItem('rememberEmail', email)

      login(user)
      toast({ type: 'success', title: 'Đăng nhập thành công', description: `Chào mừng ${user.name} quay lại!` })
      navigate('/')
    } catch (error: any) {
      console.error('Login error:', error)
      const msg = error?.message || 'Đã xảy ra lỗi hệ thống.'
      toast({ type: 'error', title: 'Đăng nhập thất bại', description: msg })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-9 group cursor-default">
        <div className="relative animate-float">
          <div className="absolute inset-0 gradient-primary blur-xl opacity-40 rounded-2xl group-hover:opacity-60 transition-opacity" />
          <div className="relative w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30 ring-1 ring-white/10">
            <Zap className="w-6 h-6 text-white" strokeWidth={2.5} fill="white" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)] block leading-none">
            ScanPro
          </span>
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.2em] mt-1.5 block">
            AI Workspace
          </span>
        </div>
      </div>

      {/* Main Card with subtle parallax */}
      <div
        ref={cardRef}
        className="relative w-full"
        style={{
          transform: `perspective(1200px) rotateY(${mousePos.x * 0.25}deg) rotateX(${-mousePos.y * 0.25}deg)`,
          transition: 'transform 0.5s ease-out'
        }}
      >
        {/* Subtle border accent (modern top-bottom gradient) */}
        <div className="absolute -inset-px rounded-[28px] bg-gradient-to-b from-primary-500/30 via-primary-500/5 to-primary-500/30 opacity-70" />

        {/* Card */}
        <div className="relative bg-[var(--bg-card)]/95 backdrop-blur-2xl border border-[var(--border-secondary)]/60 rounded-[28px] shadow-2xl shadow-black/30 overflow-hidden">
          {/* Top accent bar (subtle) */}
          <div className="relative h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

          <div className="p-10 sm:p-12">
            {/* Header */}
            <div className="text-center mb-9">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[11px] font-semibold uppercase tracking-wider mb-6">
                <Shield className="w-3 h-3" />
                <span>Bảo mật đầu cuối</span>
                <div className="w-1 h-1 rounded-full bg-primary-400 animate-pulse ml-0.5" />
              </div>
              <h1 className="text-[28px] sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
                Chào mừng trở lại
              </h1>
              <p className="text-sm text-[var(--text-tertiary)]">
                Đăng nhập để tiếp tục với <span className="font-semibold text-[var(--text-secondary)]">ScanPro</span>
              </p>
            </div>

            {/* Social Login */}
            <div className="mb-6">
              <GoogleLoginButton redirect="/" />
              <p className="text-[11px] text-center text-[var(--text-tertiary)] mt-2.5 font-medium">
                Đăng nhập nhanh bằng tài khoản Google của bạn
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-7">
              <div className="flex-1 h-px bg-[var(--border-secondary)]/60" />
              <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.15em]">hoặc email</span>
              <div className="flex-1 h-px bg-[var(--border-secondary)]/60" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">
                  Email
                </label>
                <label
                  className={`relative flex items-center gap-3 rounded-xl bg-[var(--bg-tertiary)]/60 border px-4 transition-all duration-200 cursor-text ${
                    focusedField === 'email'
                      ? 'border-primary-500/60 bg-[var(--bg-tertiary)] ring-4 ring-primary-500/10'
                      : 'border-[var(--border-secondary)]/60 hover:border-[var(--text-tertiary)]/40'
                  }`}
                >
                  <Mail className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                    focusedField === 'email' ? 'text-primary-400' : 'text-[var(--text-tertiary)]'
                  }`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="name@example.com"
                    className="flex-1 py-3.5 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]/50 outline-none border-0"
                  />
                  {email && email.includes('@') && (
                    <CheckCircle2 className="w-[18px] h-[18px] text-primary-400 animate-scale-in shrink-0" />
                  )}
                </label>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">
                  Mật khẩu
                </label>
                <label
                  className={`relative flex items-center gap-3 rounded-xl bg-[var(--bg-tertiary)]/60 border px-4 transition-all duration-200 cursor-text ${
                    focusedField === 'password'
                      ? 'border-primary-500/60 bg-[var(--bg-tertiary)] ring-4 ring-primary-500/10'
                      : 'border-[var(--border-secondary)]/60 hover:border-[var(--text-tertiary)]/40'
                  }`}
                >
                  <Lock className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                    focusedField === 'password' ? 'text-primary-400' : 'text-[var(--text-tertiary)]'
                  }`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Nhập mật khẩu"
                    className="flex-1 py-3.5 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]/50 outline-none border-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="shrink-0 p-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors rounded"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </label>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between pt-1.5">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-[18px] h-[18px] rounded-md border-2 border-[var(--border-secondary)] peer-checked:border-primary-500 peer-checked:bg-primary-500 transition-all flex items-center justify-center group-hover:border-[var(--text-tertiary)]">
                    {rememberMe && <CheckCircle2 className="w-3 h-3 text-white animate-scale-in" strokeWidth={3.5} />}
                  </div>
                  <span className="text-[13px] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
                    Ghi nhớ đăng nhập
                  </span>
                </label>
                <a href="#" className="text-[13px] font-medium text-[var(--text-tertiary)] hover:text-primary-400 transition-colors">
                  Quên mật khẩu?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full flex items-center justify-center gap-2 py-3.5 mt-3 rounded-xl text-white text-sm font-semibold gradient-primary shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-200 disabled:opacity-70 active:scale-[0.98] overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin relative" />
                    <span className="relative">Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <span className="relative">Đăng nhập</span>
                    <ArrowRight className="w-[18px] h-[18px] relative group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Sign up link */}
            <p className="text-center text-[13px] text-[var(--text-tertiary)] mt-7">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-semibold text-primary-400 hover:text-primary-300 transition-colors">
                Đăng ký miễn phí
              </Link>
            </p>
          </div>

          {/* Bottom features strip */}
          <div className="px-10 sm:px-12 py-4 border-t border-[var(--border-secondary)]/40 bg-[var(--bg-tertiary)]/20">
            <div className="flex items-center justify-center gap-6 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.15em]">
              <div className="flex items-center gap-1.5">
                <ScanLine className="w-3 h-3" />
                <span className="hidden sm:inline">AI Scan</span>
              </div>
              <div className="w-px h-3 bg-[var(--border-secondary)]" />
              <div className="flex items-center gap-1.5">
                <Languages className="w-3 h-3" />
                <span className="hidden sm:inline">OCR 50+</span>
              </div>
              <div className="w-px h-3 bg-[var(--border-secondary)]" />
              <div className="flex items-center gap-1.5">
                <FileStack className="w-3 h-3" />
                <span className="hidden sm:inline">PDF</span>
              </div>
              <div className="w-px h-3 bg-[var(--border-secondary)]" />
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-primary-400 text-primary-400" />
                <span>4.9</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer text */}
      <p className="text-center text-[11px] text-[var(--text-tertiary)] mt-7 font-medium">
        © 2024 <span className="font-semibold text-[var(--text-secondary)]">ScanPro</span> · Được tin dùng bởi 12,000+ người dùng
      </p>
    </div>
  )
}