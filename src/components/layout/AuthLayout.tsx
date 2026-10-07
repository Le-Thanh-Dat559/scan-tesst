import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import { useEffect, useState, useRef } from 'react'
import {
  ScanLine, Languages, FileStack, Sparkles,
  Shield, Cpu, Cloud, Code2
} from 'lucide-react'

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore()
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] flex relative overflow-hidden font-sans"
    >
      {/* ============================================
          LAYER 1: Aurora gradient mesh background
          ============================================ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-60 transition-all duration-1000 ease-out"
          style={{
            background: `radial-gradient(ellipse 80% 50% at ${mousePos.x}% ${mousePos.y}%, rgba(99, 102, 241, 0.25) 0%, transparent 50%),
                         radial-gradient(ellipse 60% 50% at ${100 - mousePos.x}% ${100 - mousePos.y}%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)`
          }}
        />
      </div>

      {/* ============================================
          LAYER 2: Floating animated blobs
          ============================================ */}
      <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-primary-500/20 blur-[120px] rounded-full pointer-events-none animate-blob" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] bg-accent-500/20 blur-[120px] rounded-full pointer-events-none animate-blob" style={{ animationDelay: '4s' }} />
      <div className="absolute top-[30%] right-[5%] w-[35%] h-[35%] bg-info-500/15 blur-[100px] rounded-full pointer-events-none animate-blob" style={{ animationDelay: '8s' }} />
      <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] bg-warning-500/10 blur-[100px] rounded-full pointer-events-none animate-blob" style={{ animationDelay: '6s' }} />

      {/* ============================================
          LAYER 3: Animated grid pattern
          ============================================ */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <div
          className="absolute inset-0 animate-grid-move"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                             linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Radial mask for grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, var(--bg-primary) 80%)',
        }}
      />

      {/* ============================================
          LAYER 4: Floating particles (stars)
          ============================================ */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => {
          const size = Math.random() * 3 + 1
          const left = Math.random() * 100
          const top = Math.random() * 100
          const delay = Math.random() * 8
          const duration = Math.random() * 6 + 6
          return (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                top: `${top}%`,
                boxShadow: `0 0 ${size * 4}px rgba(255, 255, 255, 0.6)`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          )
        })}
      </div>

      {/* ============================================
          LAYER 5: Floating decorative icons
          ============================================ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[8%] left-[8%] opacity-20 animate-float-slow">
          <div className="p-3 rounded-2xl bg-primary-500/10 backdrop-blur-sm border border-primary-500/20">
            <ScanLine className="w-6 h-6 text-primary-500" />
          </div>
        </div>
        <div className="absolute top-[15%] right-[12%] opacity-20 animate-float-slow" style={{ animationDelay: '2s' }}>
          <div className="p-3 rounded-2xl bg-accent-500/10 backdrop-blur-sm border border-accent-500/20">
            <Languages className="w-6 h-6 text-accent-500" />
          </div>
        </div>
        <div className="absolute bottom-[20%] left-[12%] opacity-20 animate-float-slow" style={{ animationDelay: '4s' }}>
          <div className="p-3 rounded-2xl bg-info-500/10 backdrop-blur-sm border border-info-500/20">
            <FileStack className="w-6 h-6 text-info-500" />
          </div>
        </div>
        <div className="absolute top-[45%] right-[8%] opacity-15 animate-float-slow" style={{ animationDelay: '1s' }}>
          <div className="p-2 rounded-xl bg-warning-500/10 backdrop-blur-sm border border-warning-500/20">
            <Sparkles className="w-5 h-5 text-warning-500" />
          </div>
        </div>
        <div className="absolute bottom-[12%] right-[15%] opacity-15 animate-float-slow" style={{ animationDelay: '3s' }}>
          <div className="p-2 rounded-xl bg-success-500/10 backdrop-blur-sm border border-success-500/20">
            <Shield className="w-5 h-5 text-success-500" />
          </div>
        </div>
        <div className="absolute top-[60%] left-[6%] opacity-15 animate-float-slow" style={{ animationDelay: '5s' }}>
          <div className="p-2 rounded-xl bg-error-500/10 backdrop-blur-sm border border-error-500/20">
            <Cpu className="w-5 h-5 text-error-500" />
          </div>
        </div>
        <div className="absolute top-[25%] left-[20%] opacity-10 animate-float-slow" style={{ animationDelay: '6s' }}>
          <Cloud className="w-7 h-7 text-info-500" />
        </div>
        <div className="absolute bottom-[35%] right-[25%] opacity-10 animate-float-slow" style={{ animationDelay: '7s' }}>
          <Code2 className="w-7 h-7 text-accent-500" />
        </div>
      </div>

      {/* ============================================
          LAYER 6: SVG Wave shapes
          ============================================ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute bottom-0 left-0 w-full h-64 opacity-20"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="url(#wave-gradient-1)"
            d="M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,154.7C672,149,768,171,864,176C960,181,1056,171,1152,154.7C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-wave-slow"
          />
          <defs>
            <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>

        <svg
          className="absolute top-0 left-0 w-full h-64 opacity-15 rotate-180"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="url(#wave-gradient-2)"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,202.7C672,203,768,181,864,165.3C960,149,1056,139,1152,149.3C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-wave-slower"
          />
          <defs>
            <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ============================================
          LAYER 7: Light rays from top
          ============================================ */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-primary-500/30 via-transparent to-transparent pointer-events-none animate-pulse-slow" />
      <div className="absolute top-0 left-2/4 w-px h-full bg-gradient-to-b from-accent-500/20 via-transparent to-transparent pointer-events-none animate-pulse-slow" style={{ animationDelay: '1s' }} />
      <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-info-500/25 via-transparent to-transparent pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

      {/* ============================================
          LAYER 8: Mouse-following spotlight
          ============================================ */}
      <div
        className="absolute pointer-events-none transition-all duration-500 ease-out"
        style={{
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 50%)',
          filter: 'blur(40px)',
        }}
      />

      {/* ============================================
          LAYER 9: Vignette overlay
          ============================================ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 50%, var(--bg-primary) 100%)',
        }}
      />

      {/* ============================================
          MAIN CONTENT
          ============================================ */}
      <div className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-[560px]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}