import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import { useToast } from '@/components/ui/Toast'
import {
  Mail, Lock, ArrowRight, Eye, EyeOff, User,
  Zap, Shield, CheckCircle2, Check, Sparkles,
  ScanLine, Languages, FileStack, Star,
  UserPlus, KeyRound
} from 'lucide-react'
import axios from 'axios'

export default function Register() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login } = useAuthStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) / 50
      const y = (e.clientY - rect.top - rect.height / 2) / 50
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const passwordStrength = (() => {
    if (!password) return { level: 0, label: '', color: '', bars: 'bg-[var(--bg-tertiary)]' }
    let level = 0
    if (password.length >= 8) level++
    if (/[A-Z]/.test(password)) level++
    if (/[0-9]/.test(password)) level++
    if (/[^A-Za-z0-9]/.test(password)) level++

    const colors = ['bg-error-500', 'bg-warning-500', 'bg-info-500', 'bg-success-500']
    const labels = ['Yếu', 'Trung bình', 'Tốt', 'Mạnh']
    return {
      level,
      label: labels[level - 1] || '',
      color: colors[level - 1] || 'bg-[var(--bg-tertiary)]',
      bars: colors[level - 1] || 'bg-[var(--bg-tertiary)]'
    }
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast({ type: 'error', title: 'Lỗi', description: 'Vui lòng nhập đầy đủ thông tin.' })
      return
    }
    if (password !== confirmPassword) {
      toast({ type: 'error', title: 'Lỗi', description: 'Mật khẩu xác nhận không khớp.' })
      return
    }
    if (password.length < 6) {
      toast({ type: 'error', title: 'Lỗi', description: 'Mật khẩu phải có ít nhất 6 ký tự.' })
      return
    }
    if (!agreeTerms) {
      toast({ type: 'error', title: 'Lỗi', description: 'Vui lòng đồng ý với điều khoản sử dụng.' })
      return
    }

    setIsLoading(true)

    try {
      const response = await axios.post('/api/auth/register', { name, email, password })
      const { user, token } = response.data

      localStorage.setItem('token', token)

      login(user)
      toast({ type: 'success', title: 'Đăng ký thành công', description: `Chào mừng ${user.name}!` })
      navigate('/')
    } catch (error: any) {
      console.error('Register error:', error)
      const msg = error.response?.data?.message || 'Đã xảy ra lỗi hệ thống.'
      toast({ type: 'error', title: 'Đăng ký thất bại', description: msg })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Logo - Top */}
      <div className="flex items-center gap-3.5 mb-10 group cursor-default">
        <div className="relative animate-float">
          <div className="absolute inset-0 gradient-primary blur-xl opacity-70 rounded-2xl group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -inset-1 gradient-primary opacity-30 blur-md rounded-2xl group-hover:opacity-60 transition-opacity" />
          <div className="relative w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-2xl shadow-primary-500/50 ring-1 ring-white/20">
            <Zap className="w-8 h-8 text-white drop-shadow-md" strokeWidth={2.5} fill="white" />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-warning-400 to-warning-600 ring-2 ring-[var(--bg-primary)] flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        </div>
        <div>
          <span className="text-2xl font-black tracking-tight text-[var(--text-primary)] block leading-none">
            ScanPro
          </span>
          <span className="text-[11px] font-bold text-primary-500 uppercase tracking-[0.2em] mt-1.5 block">AI Workspace</span>
        </div>
      </div>

      {/* Main Card with parallax */}
      <div
        ref={cardRef}
        className="relative w-full max-w-[540px]"
        style={{
          transform: `perspective(1000px) rotateY(${mousePos.x * 0.5}deg) rotateX(${-mousePos.y * 0.5}deg)`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        <div className="absolute -inset-[2px] rounded-[2rem] bg-gradient-to-r from-primary-500 via-accent-500 to-info-500 opacity-50 blur-sm animate-gradient-x" />
        <div className="absolute -inset-[2px] rounded-[2rem] bg-gradient-to-r from-primary-500 via-accent-500 to-info-500 opacity-30" />
        <div className="absolute -inset-2 bg-gradient-to-r from-primary-500/40 via-accent-500/40 to-info-500/40 rounded-[2rem] blur-3xl opacity-50 animate-pulse-slow" />
        <div className="absolute -top-32 -right-32 w-72 h-72 bg-primary-500/30 blur-3xl rounded-full animate-blob" />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-accent-500/30 blur-3xl rounded-full animate-blob" style={{ animationDelay: '3s' }} />

        {/* Card */}
        <div className="relative bg-gradient-to-br from-[var(--bg-card)]/98 to-[var(--bg-card)]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl shadow-black/20 overflow-hidden">
          <div className="relative h-1.5 bg-gradient-to-r from-primary-500 via-accent-500 to-info-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shine" />
          </div>

          <div className="absolute top-6 right-6 opacity-20 pointer-events-none">
            <Sparkles className="w-24 h-24 text-primary-500" />
          </div>

          <div className="relative p-9 sm:p-12">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary-500/15 to-accent-500/15 text-primary-600 dark:text-primary-400 font-bold text-xs mb-5 border border-primary-500/30 uppercase tracking-wider shadow-sm backdrop-blur-sm">
                <Shield className="w-3.5 h-3.5" />
                <span>Miễn phí vĩnh viễn</span>
                <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight mb-2.5">
                Tạo tài khoản
              </h1>
              <p className="text-base text-[var(--text-secondary)]">
                Bắt đầu hành trình số hóa với <span className="font-bold gradient-text">ScanPro</span>
              </p>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3 mb-7">
              <button
                type="button"
                className="group relative flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-secondary)] hover:border-primary-500/50 transition-all active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <svg className="w-5 h-5 transition-transform group-hover:scale-110 relative" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-semibold text-[var(--text-primary)] relative">Google</span>
              </button>
              <button
                type="button"
                className="group relative flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-secondary)] hover:border-primary-500/50 transition-all active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <svg className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-primary-500 transition-all group-hover:scale-110 relative" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="text-sm font-semibold text-[var(--text-primary)] relative">GitHub</span>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-7">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-secondary)] to-transparent" />
              <span className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">hoặc email</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border-secondary)] to-transparent" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    Họ và tên
                  </span>
                </label>
                <label
                  className={`relative flex items-center gap-3.5 rounded-xl bg-[var(--bg-tertiary)] border-2 px-4 transition-all duration-300 cursor-text overflow-hidden ${
                    focusedField === 'name'
                      ? 'border-primary-500 bg-[var(--bg-card)] shadow-xl shadow-primary-500/20 -translate-y-0.5'
                      : 'border-transparent hover:border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  {focusedField === 'name' && (
                    <div className="absolute inset-0 rounded-xl border-2 border-primary-500 animate-pulse-ring pointer-events-none" />
                  )}
                  <User className={`w-5 h-5 shrink-0 transition-all duration-300 ${
                    focusedField === 'name' ? 'text-primary-500 scale-110' : 'text-[var(--text-tertiary)]'
                  }`} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Nguyễn Văn A"
                    className="flex-1 py-3.5 bg-transparent text-base font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]/70 outline-none border-0"
                  />
                </label>
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </span>
                  {email && email.includes('@') && (
                    <CheckCircle2 className="w-4 h-4 text-success-500 animate-scale-in" />
                  )}
                </label>
                <label
                  className={`relative flex items-center gap-3.5 rounded-xl bg-[var(--bg-tertiary)] border-2 px-4 transition-all duration-300 cursor-text overflow-hidden ${
                    focusedField === 'email'
                      ? 'border-primary-500 bg-[var(--bg-card)] shadow-xl shadow-primary-500/20 -translate-y-0.5'
                      : 'border-transparent hover:border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  {focusedField === 'email' && (
                    <div className="absolute inset-0 rounded-xl border-2 border-primary-500 animate-pulse-ring pointer-events-none" />
                  )}
                  <Mail className={`w-5 h-5 shrink-0 transition-all duration-300 ${
                    focusedField === 'email' ? 'text-primary-500 scale-110' : 'text-[var(--text-tertiary)]'
                  }`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="name@example.com"
                    className="flex-1 py-3.5 bg-transparent text-base font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]/70 outline-none border-0"
                  />
                </label>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Mật khẩu
                  </span>
                </label>
                <label
                  className={`relative flex items-center gap-3.5 rounded-xl bg-[var(--bg-tertiary)] border-2 px-4 transition-all duration-300 cursor-text overflow-hidden ${
                    focusedField === 'password'
                      ? 'border-primary-500 bg-[var(--bg-card)] shadow-xl shadow-primary-500/20 -translate-y-0.5'
                      : 'border-transparent hover:border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  {focusedField === 'password' && (
                    <div className="absolute inset-0 rounded-xl border-2 border-primary-500 animate-pulse-ring pointer-events-none" />
                  )}
                  <Lock className={`w-5 h-5 shrink-0 transition-all duration-300 ${
                    focusedField === 'password' ? 'text-primary-500 scale-110' : 'text-[var(--text-tertiary)]'
                  }`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="flex-1 py-3.5 bg-transparent text-base font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]/70 outline-none border-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="shrink-0 p-2 text-[var(--text-tertiary)] hover:text-primary-500 transition-all hover:scale-110 rounded-lg"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </label>

                {/* Password strength with animation */}
                {password && (
                  <div className="flex items-center gap-2.5 mt-3 animate-fade-in">
                    <div className="flex-1 flex gap-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                            i <= passwordStrength.level ? passwordStrength.bars : 'bg-[var(--bg-tertiary)]'
                          }`}
                          style={{
                            transform: i <= passwordStrength.level ? 'scaleX(1)' : 'scaleX(0.7)',
                            opacity: i <= passwordStrength.level ? 1 : 0.5
                          }}
                        />
                      ))}
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider animate-fade-in ${
                      passwordStrength.level <= 1 ? 'text-error-500' :
                      passwordStrength.level === 2 ? 'text-warning-500' :
                      passwordStrength.level === 3 ? 'text-info-500' : 'text-success-500'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Xác nhận mật khẩu
                  </span>
                </label>
                <label
                  className={`relative flex items-center gap-3.5 rounded-xl bg-[var(--bg-tertiary)] border-2 px-4 transition-all duration-300 cursor-text overflow-hidden ${
                    confirmPassword && confirmPassword === password
                      ? 'border-success-500 bg-[var(--bg-card)] shadow-xl shadow-success-500/20 -translate-y-0.5'
                      : focusedField === 'confirm'
                      ? 'border-primary-500 bg-[var(--bg-card)] shadow-xl shadow-primary-500/20 -translate-y-0.5'
                      : 'border-transparent hover:border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  {(focusedField === 'confirm' || (confirmPassword && confirmPassword === password)) && (
                    <div className={`absolute inset-0 rounded-xl border-2 animate-pulse-ring pointer-events-none ${
                      confirmPassword && confirmPassword === password ? 'border-success-500' : 'border-primary-500'
                    }`} />
                  )}
                  <Lock className={`w-5 h-5 shrink-0 transition-all duration-300 ${
                    confirmPassword && confirmPassword === password
                      ? 'text-success-500 scale-110'
                      : focusedField === 'confirm'
                      ? 'text-primary-500 scale-110'
                      : 'text-[var(--text-tertiary)]'
                  }`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Nhập lại mật khẩu"
                    className="flex-1 py-3.5 bg-transparent text-base font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]/70 outline-none border-0"
                  />
                  {confirmPassword && confirmPassword === password && (
                    <Check className="w-5 h-5 shrink-0 text-success-500 animate-scale-in" />
                  )}
                </label>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer group pt-2">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 rounded-md border-2 border-[var(--border-secondary)] peer-checked:border-primary-500 peer-checked:bg-gradient-to-br peer-checked:from-primary-500 peer-checked:to-accent-500 transition-all flex items-center justify-center group-hover:border-primary-500/50">
                    {agreeTerms && <Check className="w-3.5 h-3.5 text-white animate-scale-in" strokeWidth={3} />}
                  </div>
                </div>
                <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors leading-relaxed">
                  Tôi đồng ý với <a href="#" className="font-semibold text-primary-500 hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="font-semibold text-primary-500 hover:underline">Chính sách bảo mật</a> của ScanPro
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full flex items-center justify-center gap-2 py-4 mt-4 rounded-xl text-white font-bold text-base gradient-primary shadow-2xl shadow-primary-500/40 hover:shadow-primary-500/60 hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0 active:scale-[0.98] overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500 delay-200" />
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity -z-10" />
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative" />
                    <span className="relative">Đang tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 relative animate-pulse" />
                    <span className="relative">Tạo tài khoản</span>
                    <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>
            </form>

            {/* Sign in link */}
            <p className="text-center text-sm text-[var(--text-secondary)] mt-7">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-bold text-primary-500 hover:text-primary-600 transition-all inline-flex items-center gap-1 group relative">
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 group-hover:w-full transition-all duration-300" />
              </Link>
            </p>
          </div>

          {/* Bottom features strip */}
          <div className="relative px-9 sm:px-12 py-5 border-t border-[var(--border-secondary)] bg-gradient-to-r from-[var(--bg-tertiary)]/30 via-[var(--bg-tertiary)]/50 to-[var(--bg-tertiary)]/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/5 to-transparent animate-shine-slow" />
            <div className="relative flex items-center justify-between gap-2 text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
              <div className="flex items-center gap-2 hover:text-primary-500 transition-colors cursor-default group">
                <ScanLine className="w-3.5 h-3.5 text-primary-500 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">AI Scan</span>
              </div>
              <div className="w-px h-3.5 bg-[var(--border-secondary)]" />
              <div className="flex items-center gap-2 hover:text-accent-500 transition-colors cursor-default group">
                <Languages className="w-3.5 h-3.5 text-accent-500 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">OCR 50+</span>
              </div>
              <div className="w-px h-3.5 bg-[var(--border-secondary)]" />
              <div className="flex items-center gap-2 hover:text-info-500 transition-colors cursor-default group">
                <FileStack className="w-3.5 h-3.5 text-info-500 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">PDF Tools</span>
              </div>
              <div className="w-px h-3.5 bg-[var(--border-secondary)]" />
              <div className="flex items-center gap-1.5 group cursor-default">
                <Star className="w-3.5 h-3.5 fill-warning-500 text-warning-500 group-hover:scale-110 transition-transform" />
                <span>4.9</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer text */}
      <p className="text-center text-xs text-[var(--text-tertiary)] mt-8 font-medium">
        © 2024 <span className="font-bold text-[var(--text-secondary)]">ScanPro</span> · Được tin dùng bởi 12,000+ người dùng
      </p>
    </div>
  )
}