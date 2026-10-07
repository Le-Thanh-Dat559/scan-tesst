import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import { useEffect, useState, useRef } from 'react'
import {
  ScanLine, Languages, FileStack, Sparkles,
  Shield, Cpu, Cloud, Code2, FileText, Layers
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
      style={{
        background: 'radial-gradient(ellipse at top, #111b30 0%, #0a0e1a 50%, #060912 100%)',
      }}
    >
      {/* ============================================
          LAYER 1: Single accent mouse-following glow
          ============================================ */}
      <div
        className="absolute pointer-events-none transition-all duration-1000 ease-out"
        style={{
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          transform: 'translate(-50%, -50%)',
          width: '900px',
          height: '900px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 50%)',
          filter: 'blur(80px)',
        }}
      />

      {/* ============================================
          LAYER 2: Subtle blue blobs (corner accents)
          ============================================ */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-500/[0.08] blur-[140px] rounded-full pointer-events-none animate-blob" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[45%] h-[45%] bg-primary-500/[0.08] blur-[140px] rounded-full pointer-events-none animate-blob" style={{ animationDelay: '7s' }} />

      {/* ============================================
          LAYER 3: Subtle animated grid (dot pattern)
          ============================================ */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(148, 163, 184, 0.3) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Radial mask */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at center, transparent 30%, var(--bg-primary) 85%)',
        }}
      />

      {/* ============================================
          LAYER 4: Subtle particles (sparse, elegant)
          ============================================ */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => {
          const size = Math.random() * 1.5 + 0.5
          const left = Math.random() * 100
          const top = Math.random() * 100
          const delay = Math.random() * 8
          const duration = Math.random() * 6 + 10
          return (
            <div
              key={i}
              className="absolute rounded-full bg-primary-400/30 animate-twinkle"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                top: `${top}%`,
                boxShadow: `0 0 ${size * 3}px rgba(59, 130, 246, 0.25)`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          )
        })}
      </div>

      {/* ============================================
          LAYER 5: Floating monochrome icons (very subtle)
          ============================================ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[8%] opacity-[0.07] animate-float-slow">
          <ScanLine className="w-5 h-5 text-slate-400" />
        </div>
        <div className="absolute top-[18%] right-[10%] opacity-[0.07] animate-float-slow" style={{ animationDelay: '2s' }}>
          <Languages className="w-5 h-5 text-slate-400" />
        </div>
        <div className="absolute bottom-[22%] left-[10%] opacity-[0.07] animate-float-slow" style={{ animationDelay: '4s' }}>
          <FileStack className="w-5 h-5 text-slate-400" />
        </div>
        <div className="absolute top-[50%] right-[6%] opacity-[0.07] animate-float-slow" style={{ animationDelay: '1s' }}>
          <Sparkles className="w-4 h-4 text-slate-400" />
        </div>
        <div className="absolute bottom-[15%] right-[12%] opacity-[0.07] animate-float-slow" style={{ animationDelay: '3s' }}>
          <Shield className="w-4 h-4 text-slate-400" />
        </div>
        <div className="absolute top-[65%] left-[5%] opacity-[0.07] animate-float-slow" style={{ animationDelay: '5s' }}>
          <Cpu className="w-4 h-4 text-slate-400" />
        </div>
        <div className="absolute top-[28%] left-[18%] opacity-[0.07] animate-float-slow" style={{ animationDelay: '6s' }}>
          <Cloud className="w-5 h-5 text-slate-400" />
        </div>
        <div className="absolute bottom-[38%] right-[22%] opacity-[0.07] animate-float-slow" style={{ animationDelay: '7s' }}>
          <Code2 className="w-5 h-5 text-slate-400" />
        </div>
        <div className="absolute top-[40%] left-[12%] opacity-[0.07] animate-float-slow" style={{ animationDelay: '8s' }}>
          <FileText className="w-4 h-4 text-slate-400" />
        </div>
        <div className="absolute bottom-[50%] left-[4%] opacity-[0.07] animate-float-slow" style={{ animationDelay: '9s' }}>
          <Layers className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* ============================================
          LAYER 6: Single subtle wave at bottom
          ============================================ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute bottom-0 left-0 w-full h-48"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="url(#wave-gradient)"
            d="M0,192L48,197.3C96,203,192,213,288,213.3C384,213,480,203,576,192C672,181,768,171,864,170.7C960,171,1056,181,1152,181.3C1248,181,1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-wave-slow"
            opacity="0.06"
          />
          <defs>
            <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ============================================
          LAYER 7: Top vignette (focus on form)
          ============================================ */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* ============================================
          MAIN CONTENT
          ============================================ */}
      <div className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="w-full max-w-[500px]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}