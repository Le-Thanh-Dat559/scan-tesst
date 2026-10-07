import { useLocation, useNavigate } from 'react-router-dom'
import { useThemeStore, useUIStore, useAuthStore } from '@/stores'
import {
  Menu, Sun, Moon, Search, Plus,
  Home, ScanLine, FileText, Languages, FileStack, Settings,
  Bell, Command
} from 'lucide-react'

const routeMeta: Record<string, { title: string; subtitle: string; icon: any }> = {
  '/': { title: 'Tổng quan', subtitle: 'Theo dõi hoạt động và truy cập nhanh', icon: Home },
  '/scan': { title: 'Scan tài liệu', subtitle: 'Chụp hoặc tải lên hình ảnh để số hóa', icon: ScanLine },
  '/documents': { title: 'Tài liệu của tôi', subtitle: 'Quản lý thư viện tài liệu cá nhân', icon: FileText },
  '/ocr': { title: 'Trích xuất văn bản (OCR)', subtitle: 'Chuyển đổi hình ảnh thành văn bản', icon: Languages },
  '/pdf-tools': { title: 'Công cụ PDF', subtitle: 'Xử lý, chuyển đổi và tối ưu PDF', icon: FileStack },
  '/settings': { title: 'Cài đặt hệ thống', subtitle: 'Tùy chỉnh theo sở thích của bạn', icon: Settings },
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { resolved: theme, setMode } = useThemeStore()
  const { toggleSidebar } = useUIStore()
  const { user } = useAuthStore()

  const currentMeta = routeMeta[location.pathname] || {
    title: 'ScanPro Workspace',
    subtitle: 'Trợ lý số hóa tài liệu thông minh',
    icon: ScanLine
  }
  const Icon = currentMeta.icon

  return (
    <header className="h-16 shrink-0 border-b border-[var(--border-secondary)] bg-[var(--bg-card)]/85 backdrop-blur-2xl sticky top-0 z-30 transition-colors">
      <div className="w-full h-full flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 lg:px-6">

        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-all border border-[var(--border-secondary)] active:scale-95 shrink-0"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 hidden sm:flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
              <Icon className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate tracking-tight leading-tight">
                {currentMeta.title}
              </h2>
              <p className="text-[11px] sm:text-xs font-medium text-[var(--text-tertiary)] truncate leading-tight mt-0.5 hidden sm:block">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Search, Actions, Theme Toggle, User */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

          {/* Quick Search Bar */}
          <button
            onClick={() => navigate('/documents')}
            className="hidden lg:flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] w-56 xl:w-64 cursor-pointer hover:border-primary-500/40 hover:bg-[var(--bg-card)] transition-all group"
          >
            <Search className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-primary-500 transition-colors shrink-0" />
            <span className="text-xs font-medium text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] select-none flex-1 text-left truncate">
              Tìm tài liệu...
            </span>
            <span className="hidden xl:inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--bg-card)] text-[var(--text-tertiary)] border border-[var(--border-secondary)] shrink-0">
              <Command className="w-2.5 h-2.5" />K
            </span>
          </button>

          {/* New Scan Quick Button */}
          {location.pathname !== '/scan' && (
            <button
              onClick={() => navigate('/scan')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold gradient-primary hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Scan mới</span>
            </button>
          )}

          {/* Notifications */}
          <button
            className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-primary-500 hover:bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-secondary)] transition-all active:scale-95"
            title="Thông báo"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-[var(--bg-card)]" />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={() => setMode(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-primary-500 hover:bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-secondary)] transition-all active:scale-95"
            title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <div className="w-px h-5 bg-[var(--border-secondary)] hidden md:block mx-0.5" />

          {/* User Badge */}
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors group"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-xl object-cover shadow-sm ring-2 ring-[var(--bg-card)] shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center font-bold text-white text-xs shadow-sm ring-2 ring-[var(--bg-card)] shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="hidden xl:block text-left min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight truncate max-w-[120px]">
                {user?.name || 'Người dùng'}
              </p>
              <p className="text-[10px] font-medium text-[var(--text-tertiary)] leading-tight">
                Pro Member
              </p>
            </div>
          </button>
        </div>

      </div>
    </header>
  )
}