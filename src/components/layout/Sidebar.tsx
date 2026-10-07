import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/utils/helpers'
import { useUIStore, useAuthStore } from '@/stores'
import { authApi } from '@/services/api'
import { clearImageCache } from '@/hooks/useDocumentImage'
import {
  Home,
  ScanLine,
  FileText,
  Languages,
  FileStack,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
  LogOut,
  Sparkles,
} from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, label: 'Trang chủ', description: 'Tổng quan' },
  { path: '/scan', icon: ScanLine, label: 'Scan tài liệu', description: 'Số hóa' },
  { path: '/documents', icon: FileText, label: 'Tài liệu', description: 'Thư viện' },
  { path: '/ocr', icon: Languages, label: 'Trích xuất chữ', description: 'OCR' },
  { path: '/pdf-tools', icon: FileStack, label: 'Công cụ PDF', description: 'Xử lý PDF' },
  { path: '/settings', icon: Settings, label: 'Cài đặt', description: 'Tùy chỉnh' },
]

export default function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, sidebarCollapsed, setMobileMenu, setSidebarCollapsed } = useUIStore()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    authApi.logout()        // Xóa token
    clearImageCache()       // Xóa cached blob URLs
    logout()                // Reset Zustand auth
    // Trỏ về /login (do ProtectedRoute redirect)
    window.location.href = '/login'
  }

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'z-50 flex flex-col shrink-0 h-full select-none',
          'transition-all duration-300 ease-out',
          'bg-[var(--bg-sidebar)] border-r border-[var(--border-secondary)]',
          // Mobile vs Desktop
          'fixed md:relative top-0 left-0 md:top-auto md:left-auto',
          // Width rules - desktop: expanded 240px, collapsed 72px
          sidebarCollapsed ? 'md:w-[72px]' : 'md:w-[240px] w-[280px]',
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          'flex items-center h-16 px-4 shrink-0 border-b border-[var(--border-secondary)]',
          sidebarCollapsed ? 'justify-center' : 'justify-between',
        )}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl gradient-primary shrink-0 shadow-lg shadow-primary-500/30">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="text-base font-black tracking-tight text-[var(--text-primary)] leading-tight">
                  ScanPro
                </h1>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                  <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                    AI Workspace
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileMenu(false)}
            className="md:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-error-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto hidden-scrollbar">
          {!sidebarCollapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
              Menu chính
            </p>
          )}
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenu(false)}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium',
                  'transition-all duration-200 group relative',
                  sidebarCollapsed && 'justify-center px-0 py-3',
                  isActive
                    ? 'bg-gradient-to-r from-primary-500/15 to-primary-500/5 text-primary-600 dark:text-primary-500 font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
                )}
              >
                {isActive && !sidebarCollapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-r-full" />
                )}
                <item.icon className={cn(
                  'w-[18px] h-[18px] shrink-0 transition-all duration-200',
                  isActive
                    ? 'text-primary-500 scale-110'
                    : 'text-[var(--text-tertiary)] group-hover:text-primary-500 group-hover:scale-110'
                )} />
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="truncate leading-tight text-sm">{item.label}</div>
                    <div className="text-[10px] font-medium text-[var(--text-tertiary)] truncate leading-tight mt-0.5">
                      {item.description}
                    </div>
                  </div>
                )}
              </NavLink>
            )
          })}

          {/* Promo card */}
          {!sidebarCollapsed && (
            <div className="mt-5 mx-1 p-3.5 rounded-2xl bg-gradient-to-br from-primary-500/10 via-primary-500/5 to-transparent border border-primary-500/20 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-20 h-20 bg-primary-500/10 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                  <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">Pro Tip</span>
                </div>
                <p className="text-xs font-medium text-[var(--text-primary)] leading-snug">
                  Dùng phím tắt <kbd className="px-1 py-0.5 rounded bg-[var(--bg-tertiary)] text-[10px] font-mono border border-[var(--border-secondary)]">⌘K</kbd> để tìm nhanh
                </p>
              </div>
            </div>
          )}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 shrink-0 border-t border-[var(--border-secondary)] flex flex-col gap-2">
          <div className={cn(
            'flex items-center gap-2.5 p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] hover:border-primary-500/30 transition-colors group',
            sidebarCollapsed && 'justify-center p-2'
          )}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {user?.name || 'User'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 bg-success-500 rounded-full" />
                    <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      Đang hoạt động
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-error-500 hover:bg-error-500/10 transition-all shrink-0"
                  title="Đăng xuất"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex items-center justify-center w-full py-1.5 rounded-xl text-[var(--text-tertiary)] hover:text-primary-500 hover:bg-[var(--bg-tertiary)] transition-colors text-xs font-semibold gap-1.5 border border-transparent hover:border-[var(--border-secondary)]"
            title={sidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Thu gọn</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}