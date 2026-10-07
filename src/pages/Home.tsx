import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentStore } from '@/stores'
import { formatDate } from '@/utils/helpers'
import { documentsApi } from '@/services/api'
import {
  ScanLine, Image as ImageIcon, FileText, Languages,
  FileStack, ArrowRight, Zap, FolderOpen,
  Plus, Clock, TrendingUp, Shield, ChevronRight,
  Activity, BarChart3
} from 'lucide-react'
import { cn } from '@/utils/helpers'

export default function Home() {
  const navigate = useNavigate()
  const { documents, stats, loadDocuments } = useDocumentStore()

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const recentDocs = documents.slice(0, 4)

  // Fetch thumbnails cho recent docs
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  useEffect(() => {
    let cancelled = false
    const fetchThumbs = async () => {
      const next: Record<string, string> = {}
      for (const doc of recentDocs) {
        if (thumbs[doc.id]) continue
        try {
          const url = await documentsApi.fetchImageBlob(doc.id, 1)
          next[doc.id] = url
        } catch {
          // ignore
        }
      }
      if (!cancelled && Object.keys(next).length > 0) {
        setThumbs(prev => ({ ...prev, ...next }))
      }
    }
    if (recentDocs.length > 0) fetchThumbs()
    return () => { cancelled = true }
    // eslint-disable-next-line
  }, [documents])

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      Object.values(thumbs).forEach(url => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line
  }, [])

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-5 lg:px-8 py-5 sm:py-6 lg:py-8 space-y-6 sm:space-y-8 font-sans">

      {/* Hero Banner - Professional, warm amber */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--border-secondary)] bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-primary-500/5 shadow-lg">
        {/* Decorative gradients */}
        <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-primary-500/10 via-primary-500/5 to-transparent pointer-events-none" />
        <div className="absolute -top-20 -right-10 w-72 h-72 bg-primary-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 left-20 w-64 h-64 bg-accent-500/8 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 lg:p-10">
          <div className="max-w-xl min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-500 font-semibold text-[11px] mb-3 border border-primary-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
              </span>
              <span>AI Scanner Suite · Phiên bản 2024</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--text-primary)] tracking-tight leading-[1.1]">
              Chào mừng trở lại,<br />
              <span className="text-gradient-warm">
                bắt đầu số hóa tài liệu!
              </span>
            </h1>
            <p className="text-[var(--text-secondary)] mt-3 text-sm leading-relaxed font-medium max-w-md">
              Số hóa, trích xuất văn bản OCR tự động và tạo file PDF tiêu chuẩn — tất cả chỉ trong vài giây.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
            <button
              onClick={() => navigate('/scan')}
              className="group inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <ScanLine className="w-4 h-4" />
              <span>Scan Tài Liệu Ngay</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-card)]/80 border border-[var(--border-secondary)] backdrop-blur-sm">
              <Shield className="w-3 h-3 text-success-500" />
              <span className="text-[10px] font-semibold text-[var(--text-secondary)]">Bảo mật E2E · Miễn phí</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />}
          label="Tổng tài liệu"
          value={stats.totalDocuments}
          trend="+12%"
          color="primary"
        />
        <StatCard
          icon={<ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-info-500" />}
          label="Đã scan"
          value={stats.scannedDocuments}
          trend="+24%"
          color="info"
        />
        <StatCard
          icon={<FileText className="w-4 h-4 sm:w-5 sm:h-5 text-success-500" />}
          label="File PDF"
          value={stats.pdfFiles}
          trend="+8%"
          color="success"
        />
        <StatCard
          icon={<Languages className="w-4 h-4 sm:w-5 sm:h-5 text-warning-500" />}
          label="Lần OCR"
          value={stats.ocrCount}
          trend="+18%"
          color="warning"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/15 to-primary-500/5 flex items-center justify-center border border-primary-500/20">
              <Zap className="w-4 h-4 text-primary-500" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="section-title">Thao tác nhanh</h2>
              <p className="text-[11px] text-[var(--text-tertiary)] font-medium mt-0.5">Truy cập các công cụ phổ biến</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <QuickActionCard
            icon={<ScanLine className="w-5 h-5" />}
            title="Scan Camera"
            subtitle="Chụp & tự động căn chỉnh"
            onClick={() => navigate('/scan')}
            color="primary"
            badge="Hot"
          />
          <QuickActionCard
            icon={<Languages className="w-5 h-5" />}
            title="Trích xuất OCR"
            subtitle="Chuyển ảnh thành văn bản"
            onClick={() => navigate('/ocr')}
            color="warning"
          />
          <QuickActionCard
            icon={<FileStack className="w-5 h-5" />}
            title="Gộp file PDF"
            subtitle="Ghép nhiều PDF thành một"
            onClick={() => navigate('/pdf-tools?tool=merge')}
            color="success"
          />
          <QuickActionCard
            icon={<ImageIcon className="w-5 h-5" />}
            title="Ảnh sang PDF"
            subtitle="Xuất ảnh JPG/PNG ra PDF"
            onClick={() => navigate('/pdf-tools?tool=img2pdf')}
            color="info"
          />
        </div>
      </div>

      {/* Recent Documents + Activity (3 cols, balanced) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 pb-6">
        {/* Recent documents - 2 cols */}
        <div className="lg:col-span-2 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/15 to-primary-500/5 flex items-center justify-center border border-primary-500/20">
                <Clock className="w-4 h-4 text-primary-500" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="section-title">Tài liệu gần đây</h2>
                <p className="text-[11px] text-[var(--text-tertiary)] font-medium mt-0.5">Các tài liệu bạn vừa xử lý</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/documents')}
              className="text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1 group px-2.5 py-1.5 rounded-lg hover:bg-primary-500/5 shrink-0"
            >
              Xem tất cả
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {recentDocs.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {recentDocs.map(doc => {
                const thumb = thumbs[doc.id]
                return (
                <div
                  key={doc.id}
                  className="group flex flex-col rounded-xl sm:rounded-2xl bg-[var(--bg-card)] border border-[var(--border-secondary)] hover:border-primary-500/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-secondary)] relative overflow-hidden p-3 flex items-center justify-center">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={doc.name}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <FileText className="w-10 h-10 text-[var(--text-tertiary)] group-hover:text-primary-500 transition-colors" />
                    )}
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[9px] font-bold bg-primary-500/90 text-white backdrop-blur-md uppercase tracking-wider shadow-sm">
                      {doc.type}
                    </div>
                  </div>

                  <div className="p-3 border-t border-[var(--border-secondary)]">
                    <h3 className="font-semibold text-xs sm:text-sm text-[var(--text-primary)] truncate mb-1.5">
                      {doc.name}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-tertiary)]">
                      <span>{formatDate(doc.createdAt).split(',')[0]}</span>
                      <span className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-semibold">
                        {doc.pageCount} trang
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          ) : (
            <div className="text-center py-10 px-4 rounded-2xl bg-[var(--bg-card)] border border-dashed border-[var(--border-primary)]">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mx-auto mb-3 border border-primary-500/20">
                <FolderOpen className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Chưa có tài liệu nào</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-4 max-w-xs mx-auto">
                Scan hoặc tải lên hình ảnh đầu tiên để bắt đầu.
              </p>
              <button
                onClick={() => navigate('/scan')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-primary text-white text-xs font-bold hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo tài liệu mới
              </button>
            </div>
          )}
        </div>

        {/* Activity Sidebar - 1 col */}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/15 to-primary-500/5 flex items-center justify-center border border-primary-500/20">
              <Activity className="w-4 h-4 text-primary-500" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="section-title">Hoạt động</h2>
              <p className="text-[11px] text-[var(--text-tertiary)] font-medium mt-0.5">Lịch sử xử lý</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-secondary)] p-3 space-y-1">
            {documents.length > 0 ? (
              documents.slice(0, 4).map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0 border border-primary-500/20">
                    <FileText className="w-3.5 h-3.5 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate group-hover:text-primary-500 transition-colors">
                      {doc.name}
                    </p>
                    <p className="text-[10px] font-medium text-[var(--text-tertiary)] mt-0.5 truncate">
                      {formatDate(doc.createdAt).split(',')[1]?.trim() || formatDate(doc.createdAt)}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 px-2">
                <BarChart3 className="w-7 h-7 text-[var(--text-tertiary)] mx-auto mb-2 opacity-40" />
                <p className="text-[11px] text-[var(--text-tertiary)] font-medium">
                  Chưa có hoạt động nào
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] font-medium mt-0.5 opacity-70">
                  Hãy scan tài liệu đầu tiên
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, trend, color }: {
  icon: React.ReactNode,
  label: string,
  value: number,
  trend?: string,
  color: 'primary' | 'warning' | 'success' | 'info'
}) {
  const iconBg = {
    primary: 'bg-primary-500/10 border-primary-500/20',
    warning: 'bg-warning-500/10 border-warning-500/20',
    success: 'bg-success-500/10 border-success-500/20',
    info: 'bg-info-500/10 border-info-500/20',
  }

  return (
    <div className="group relative p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-card)] border border-[var(--border-secondary)] hover:border-primary-500/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      {/* Accent corner glow */}
      <div className={cn(
        "absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        color === 'primary' && "bg-primary-500/15",
        color === 'warning' && "bg-warning-500/15",
        color === 'success' && "bg-success-500/15",
        color === 'info' && "bg-info-500/15",
      )} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2.5">
          <div className={cn("p-2 rounded-lg border", iconBg[color])}>
            {icon}
          </div>
          {trend && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-success-500 bg-success-500/10 px-1.5 py-0.5 rounded-md border border-success-500/20">
              <TrendingUp className="w-2.5 h-2.5" />
              {trend}
            </span>
          )}
        </div>
        <div>
          <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">{label}</p>
          <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  )
}

function QuickActionCard({ icon, title, subtitle, onClick, color, badge }: {
  icon: React.ReactNode,
  title: string,
  subtitle: string,
  onClick: () => void,
  color: 'primary' | 'warning' | 'success' | 'info',
  badge?: string
}) {
  const iconColors = {
    primary: 'bg-primary-500/10 text-primary-600 border-primary-500/20 group-hover:bg-primary-500 group-hover:text-white',
    warning: 'bg-warning-500/10 text-warning-600 border-warning-500/20 group-hover:bg-warning-500 group-hover:text-white',
    success: 'bg-success-500/10 text-success-600 border-success-500/20 group-hover:bg-success-500 group-hover:text-white',
    info: 'bg-info-500/10 text-info-600 border-info-500/20 group-hover:bg-info-500 group-hover:text-white',
  }

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col text-left p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[var(--bg-card)] border border-[var(--border-secondary)] hover:border-primary-500/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
    >
      {badge && (
        <span className="absolute top-3 right-3 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-accent-500 text-white shadow-sm z-10">
          {badge}
        </span>
      )}

      <div className={cn(
        "p-2.5 rounded-xl border mb-3 w-fit transition-all duration-300 group-hover:rotate-[-4deg]",
        iconColors[color]
      )}>
        {icon}
      </div>
      <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] mb-0.5 leading-tight">{title}</h3>
      <p className="text-xs text-[var(--text-tertiary)] font-medium leading-relaxed">{subtitle}</p>

      <ArrowRight className="absolute bottom-3.5 right-3.5 w-3.5 h-3.5 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </button>
  )
}