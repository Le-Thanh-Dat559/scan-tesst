import { useSettingsStore, useDocumentStore } from '@/stores'
import { ocrLanguages, scanPresets } from '@/types'
import {
  Moon, Sun, Monitor,
  Languages, Image as ImageIcon, FileText, Trash2,
  RefreshCw, Settings as SettingsIcon, Palette, ScanText, HardDrive, Sparkles
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useState } from 'react'
import { cn } from '@/utils/helpers'

export default function SettingsPage() {
  const { toast } = useToast()
  const settings = useSettingsStore()
  const { documents, removeDocument } = useDocumentStore()

  const [showClearData, setShowClearData] = useState(false)

  const handleClearData = () => {
    documents.forEach(doc => removeDocument(doc.id))
    setShowClearData(false)
    toast({ type: 'success', title: 'Thành công', description: 'Đã xóa tất cả dữ liệu tài liệu.' })
  }

  const handleResetSettings = () => {
    settings.resetSettings()
    toast({ type: 'success', title: 'Thành công', description: 'Đã khôi phục cài đặt gốc.' })
  }

  return (
    <div className="page-container space-y-5 sm:space-y-6 font-sans">

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-500 font-semibold text-[11px] mb-3 border border-primary-500/20">
          <SettingsIcon className="w-3 h-3" />
          <span>Tùy chỉnh hệ thống</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
          Cài đặt hệ thống
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 font-medium">
          Tùy chỉnh cấu hình scan, OCR, hiển thị và dữ liệu cá nhân
        </p>
      </div>

      <div className="space-y-5">

        {/* Giao diện */}
        <SettingsCard
          icon={<Palette className="w-4 h-4" />}
          title="Giao diện người dùng"
          subtitle="Tùy chỉnh tông màu và hiển thị"
        >
          <SettingRow
            title="Chế độ hiển thị"
            description="Chọn tông màu Sáng / Tối hoặc theo Hệ thống"
          >
            <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-secondary)]">
              <ThemeButton
                active={settings.theme === 'light'}
                onClick={() => settings.setTheme('light')}
                icon={<Sun className="w-3.5 h-3.5" />}
                label="Sáng"
              />
              <ThemeButton
                active={settings.theme === 'dark'}
                onClick={() => settings.setTheme('dark')}
                icon={<Moon className="w-3.5 h-3.5" />}
                label="Tối"
              />
              <ThemeButton
                active={settings.theme === 'system'}
                onClick={() => settings.setTheme('system')}
                icon={<Monitor className="w-3.5 h-3.5" />}
                label="Hệ thống"
              />
            </div>
          </SettingRow>
        </SettingsCard>

        {/* Scan & Ảnh */}
        <SettingsCard
          icon={<ImageIcon className="w-4 h-4" />}
          title="Scan & Xử lý hình ảnh"
          subtitle="Cấu hình bộ lọc và chất lượng"
        >
          <SettingRow
            title="Bộ lọc mặc định khi quét"
            description="Áp dụng bộ lọc tối ưu tự động cho ảnh mới"
            icon={<ImageIcon className="w-4 h-4 text-primary-500" />}
          >
            <select
              value={settings.defaultScanPreset}
              onChange={e => settings.setDefaultPreset(e.target.value as any)}
              className="bg-[var(--bg-card)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer hover:border-primary-500/40"
            >
              {scanPresets.map(p => (
                <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
              ))}
            </select>
          </SettingRow>

          <Divider />

          <SettingRow
            title="Tự động làm nét (Auto-Enhance)"
            description="Tăng cường độ tương phản và độ sáng tự động"
          >
            <ToggleSwitch
              checked={settings.autoEnhance}
              onChange={(v) => settings.setAutoEnhance(v)}
            />
          </SettingRow>
        </SettingsCard>

        {/* OCR & PDF */}
        <SettingsCard
          icon={<ScanText className="w-4 h-4" />}
          title="Cấu hình OCR & Xuất PDF"
          subtitle="Ngôn ngữ và định dạng đầu ra"
        >
          <SettingRow
            title="Ngôn ngữ OCR ưu tiên"
            description="Ngôn ngữ mặc định khi khởi động nhận dạng văn bản"
            icon={<Languages className="w-4 h-4 text-warning-500" />}
          >
            <select
              value={settings.defaultOcrLanguage}
              onChange={e => settings.setDefaultOcrLang(e.target.value as any)}
              className="bg-[var(--bg-card)] border border-[var(--border-secondary)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer hover:border-primary-500/40"
            >
              {ocrLanguages.map(l => (
                <option key={l.code} value={l.code}>{l.name} ({l.nativeName})</option>
              ))}
            </select>
          </SettingRow>

          <Divider />

          <SettingRow
            title="Khổ giấy xuất PDF tiêu chuẩn"
            description="Kích thước trang tài liệu khi xuất file PDF"
            icon={<FileText className="w-4 h-4 text-success-500" />}
          >
            <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-secondary)]">
              {(['a4', 'a5', 'letter'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => settings.setPdfOptions({ pageSize: size })}
                  className={cn(
                    "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all",
                    settings.defaultPdfOptions.pageSize === size
                      ? 'bg-[var(--bg-card)] text-primary-500 shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </SettingRow>
        </SettingsCard>

        {/* Quản lý dữ liệu */}
        <SettingsCard
          icon={<HardDrive className="w-4 h-4" />}
          title="Quản lý bộ nhớ & Dữ liệu"
          subtitle="Cài đặt và bộ nhớ lưu trữ"
        >
          <SettingRow
            title="Khôi phục cài đặt gốc"
            description="Đưa toàn bộ thông số cấu hình về trạng thái ban đầu"
          >
            <button
              onClick={handleResetSettings}
              className="px-3.5 py-2 rounded-xl border border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-primary-500/40 text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Khôi phục
            </button>
          </SettingRow>

          <Divider />

          <SettingRow
            title={<span className="text-error-500">Xóa toàn bộ tài liệu lưu trữ</span>}
            description={`Xóa vĩnh viễn ${documents.length} tài liệu đã lưu trên trình duyệt`}
          >
            <button
              onClick={() => setShowClearData(true)}
              disabled={documents.length === 0}
              className="px-3.5 py-2 rounded-xl bg-error-500/10 text-error-500 hover:bg-error-500 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa dữ liệu
            </button>
          </SettingRow>
        </SettingsCard>

        <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-tertiary)] pt-2 pb-6 font-medium">
          <Sparkles className="w-3 h-3 text-primary-500" />
          <span>ScanPro Workspace • Hoạt động 100% Client-side • Bảo mật cao</span>
        </div>
      </div>

      <ConfirmDialog
        open={showClearData}
        title="Xóa tất cả tài liệu?"
        description="Bạn có chắc chắn muốn xóa tất cả tài liệu không? Thao tác này sẽ giải phóng bộ nhớ và không thể khôi phục."
        confirmText="Xóa tất cả"
        variant="danger"
        onConfirm={handleClearData}
        onCancel={() => setShowClearData(false)}
      />
    </div>
  )
}

function SettingsCard({ icon, subtitle, title, children }: {
  icon: React.ReactNode,
  title: string,
  subtitle?: string,
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-secondary)] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="px-5 py-4 border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500">
          {icon}
        </div>
        <div>
          <h2 className="font-bold text-sm text-[var(--text-primary)] leading-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-[var(--text-tertiary)] font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5 space-y-4">
        {children}
      </div>
    </section>
  )
}

function SettingRow({ title, description, icon, children }: {
  title: React.ReactNode,
  description?: string,
  icon?: React.ReactNode,
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-2.5">
        {icon && <div className="mt-0.5">{icon}</div>}
        <div>
          <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)] leading-tight">{title}</p>
          {description && <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium leading-relaxed">{description}</p>}
        </div>
      </div>
      <div className="shrink-0 self-start sm:self-center">{children}</div>
    </div>
  )
}

function ThemeButton({ active, onClick, icon, label }: {
  active: boolean,
  onClick: () => void,
  icon: React.ReactNode,
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
        active
          ? 'bg-[var(--bg-card)] text-primary-500 shadow-sm'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-[var(--bg-tertiary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500 transition-colors" />
    </label>
  )
}

function Divider() {
  return <div className="h-px bg-[var(--border-secondary)]/60" />
}