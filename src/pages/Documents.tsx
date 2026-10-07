import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentStore, useUIStore } from '@/stores'
import { formatDate, downloadBlob } from '@/utils/helpers'
import { pdfService } from '@/utils/pdf'
import {
  FileText, Search, Trash2, Download,
  ExternalLink, FolderOpen,
  Sparkles, X,
  LayoutGrid, List, Filter, Plus
} from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/utils/helpers'
import { documentsApi } from '@/services/api'

export default function DocumentsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { documents, removeDocument, loadDocuments } = useDocumentStore()
  const { showProcessing, hideProcessing } = useUIStore()

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'scan' | 'ocr'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Load documents từ MongoDB khi mount (debounce search query)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDocuments(search)
    }, 250)
    return () => clearTimeout(timer)
  }, [search, loadDocuments])

  // Cache thumbnail blob URLs cho mỗi document (page 1)
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    const fetchThumbs = async () => {
      const newUrls: Record<string, string> = {}
      for (const doc of documents) {
        const key = `${doc.id}-1`
        if (thumbUrls[key]) continue
        try {
          const url = await documentsApi.fetchImageBlob(doc.id, 1)
          newUrls[key] = url
        } catch {
          // ignore - sẽ hiển thị icon mặc định
        }
      }
      if (!cancelled && Object.keys(newUrls).length > 0) {
        setThumbUrls(prev => ({ ...prev, ...newUrls }))
      }
    }
    if (documents.length > 0) fetchThumbs()
    return () => { cancelled = true }
    // eslint-disable-next-line
  }, [documents])

  // Cleanup object URLs khi unmount
  useEffect(() => {
    return () => {
      Object.values(thumbUrls).forEach(url => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line
  }, [])

  const filteredDocs = documents.filter(doc => {
    const q = search.toLowerCase().trim()
    const matchesSearch = !q
      || doc.name.toLowerCase().includes(q)
      || (doc.description || '').toLowerCase().includes(q)
      || (doc.tags || []).some(t => t.toLowerCase().includes(q))
    const matchesFilter = filterType === 'all' || doc.type === filterType
    return matchesSearch && matchesFilter
  })

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await removeDocument(deleteId)
      toast({ type: 'success', title: 'Thành công', description: 'Đã xóa tài liệu.' })
    } catch (err: any) {
      toast({ type: 'error', title: 'Lỗi', description: err?.message || 'Không thể xóa.' })
    }
    setDeleteId(null)
  }

  const handleQuickDownloadPdf = async (e: React.MouseEvent, doc: any) => {
    e.stopPropagation()
    showProcessing('Đang tải ảnh từ server và tạo PDF...')
    try {
      // Lấy ảnh từ MongoDB cho tất cả các trang
      const pagesWithImages = await Promise.all(
        doc.pages.map(async (p: any) => {
          try {
            const url = await documentsApi.fetchImageBlob(doc.id, p.pageNumber)
            return { ...p, originalImage: await blobUrlToDataUrl(url) }
          } catch {
            return { ...p, originalImage: '' }
          }
        })
      )
      const pdfBytes = await pdfService.createPdfFromPages(pagesWithImages, {
        pageSize: 'a4',
        orientation: 'portrait',
        margin: 20,
        quality: 0.85,
        compression: true,
        searchable: false,
      })
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      downloadBlob(blob, `${doc.name}.pdf`)
      toast({ type: 'success', title: 'Thành công', description: 'Đã tải xuống file PDF.' })
    } catch {
      toast({ type: 'error', title: 'Lỗi', description: 'Không thể tạo file PDF.' })
    } finally {
      hideProcessing()
    }
  }

  async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
    const response = await fetch(blobUrl)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  return (
    <div className="page-container space-y-5 sm:space-y-6 font-sans">

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-500 font-semibold text-[11px] mb-3 border border-primary-500/20">
              <FileText className="w-3 h-3" />
              <span>Thư viện tài liệu</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
              Tài liệu của tôi
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 font-medium">
              Quản lý và xuất bản <span className="font-bold text-primary-500">{documents.length}</span> tài liệu trong thư viện
            </p>
          </div>

          <button
            onClick={() => navigate('/scan')}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white text-xs sm:text-sm font-bold hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Tạo tài liệu mới
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2.5 w-full flex-wrap">
          <div className="relative flex-1 min-w-[200px] sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none text-sm font-medium transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-secondary)]">
            <Filter className="w-3.5 h-3.5 text-[var(--text-tertiary)] ml-2 mr-1" />
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filterType === 'all'
                  ? 'bg-[var(--bg-card)] text-primary-500 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType('scan')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filterType === 'scan'
                  ? 'bg-[var(--bg-card)] text-primary-500 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              Scan
            </button>
            <button
              onClick={() => setFilterType('ocr')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filterType === 'ocr'
                  ? 'bg-[var(--bg-card)] text-primary-500 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              OCR
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-secondary)] ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === 'grid'
                  ? 'bg-[var(--bg-card)] text-primary-500 shadow-sm'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              )}
              title="Xem dạng lưới"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === 'list'
                  ? 'bg-[var(--bg-card)] text-primary-500 shadow-sm'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              )}
              title="Xem dạng danh sách"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Grid/List */}
      {filteredDocs.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 pb-6">
            {filteredDocs.map(doc => {
              const thumb = thumbUrls[`${doc.id}-1`]
              return (
              <div
                key={doc.id}
                className="group flex flex-col rounded-2xl bg-[var(--bg-card)] border border-[var(--border-secondary)] hover:border-primary-500/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => navigate(`/documents/${doc.id}`)}
              >
                {/* Thumbnail Container */}
                <div className="aspect-[3/4] bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-secondary)] relative overflow-hidden flex items-center justify-center p-2.5">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={doc.name}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <FileText className="w-12 h-12 text-[var(--text-tertiary)] group-hover:text-primary-500 transition-colors" />
                  )}

                  {/* Type Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-primary-500/90 text-white text-[9px] font-bold backdrop-blur-md uppercase tracking-wider shadow-sm">
                    {doc.type}
                  </div>

                  {/* Quick Action Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc.id}`); }}
                      className="p-2.5 rounded-full bg-white text-black hover:bg-primary-500 hover:text-white shadow-lg transition-transform hover:scale-110"
                      title="Mở tài liệu"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleQuickDownloadPdf(e, doc)}
                      className="p-2.5 rounded-full bg-white text-black hover:bg-success-500 hover:text-white shadow-lg transition-transform hover:scale-110"
                      title="Tải nhanh PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(doc.id); }}
                      className="p-2.5 rounded-full bg-error-500 text-white hover:bg-error-600 shadow-lg transition-transform hover:scale-110"
                      title="Xóa tài liệu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-3 border-t border-[var(--border-secondary)]">
                  <h3 className="font-semibold text-xs sm:text-sm text-[var(--text-primary)] truncate mb-1.5" title={doc.name}>
                    {doc.name}
                  </h3>
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {doc.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-500 text-[10px] font-bold border border-primary-500/20 truncate max-w-[100px]"
                          title={`#${tag}`}
                        >
                          #{tag}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] px-1">
                          +{doc.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
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
          // List view
          <div className="space-y-2 pb-6">
            {filteredDocs.map(doc => {
              const thumb = thumbUrls[`${doc.id}-1`]
              return (
              <div
                key={doc.id}
                className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-secondary)] hover:border-primary-500/40 hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(`/documents/${doc.id}`)}
              >
                <div className="w-12 h-16 sm:w-14 sm:h-20 bg-[var(--bg-tertiary)] rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-[var(--border-secondary)]">
                  {thumb ? (
                    <img src={thumb} alt={doc.name} className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-5 h-5 text-[var(--text-tertiary)]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-[var(--text-primary)] truncate group-hover:text-primary-500 transition-colors">
                    {doc.name}
                  </h3>
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {doc.tags.slice(0, 4).map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-500 text-[10px] font-bold border border-primary-500/20 truncate max-w-[120px]"
                          title={`#${tag}`}
                        >
                          #{tag}
                        </span>
                      ))}
                      {doc.tags.length > 4 && (
                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] px-1">
                          +{doc.tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                  {doc.description && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-1 font-medium">
                      {doc.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-[var(--text-tertiary)]">
                    <span className="text-xs font-medium">{formatDate(doc.createdAt)}</span>
                    <span className="w-1 h-1 bg-[var(--text-tertiary)] rounded-full" />
                    <span className="text-xs font-medium">{doc.pageCount} trang</span>
                    <span className="w-1 h-1 bg-[var(--text-tertiary)] rounded-full" />
                    <span className="text-xs font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-500">{doc.type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc.id}`); }}
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-primary-500 hover:bg-primary-500/10"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleQuickDownloadPdf(e, doc)}
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-success-500 hover:bg-success-500/10"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(doc.id); }}
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-error-500 hover:bg-error-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              )
            })}
          </div>
        )
      ) : (
        <div className="text-center py-20 px-4 rounded-3xl bg-[var(--bg-card)] border border-dashed border-[var(--border-primary)]">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4 border border-primary-500/20">
            <FolderOpen className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1.5">
            {search ? 'Không tìm thấy kết quả' : 'Thư viện chưa có tài liệu'}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 max-w-sm mx-auto font-medium">
            {search ? `Không có tài liệu nào chứa từ khóa "${search}".` : 'Hãy scan hoặc trích xuất chữ OCR để tạo tài liệu mới.'}
          </p>
          {!search && (
            <button
              onClick={() => navigate('/scan')}
              className="px-6 py-2.5 rounded-xl gradient-primary text-white font-bold text-xs hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 transition-all inline-flex items-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Tạo tài liệu mới
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Xóa tài liệu?"
        description="Tài liệu này sẽ bị xóa vĩnh viễn và không thể khôi phục."
        confirmText="Xóa"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}