import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScanStore, useUIStore, useDocumentStore } from '@/stores'
import { fileToCanvas, canvasToDataURL } from '@/utils/imageProcessing'
import { generateFileName, generateId } from '@/utils/helpers'
import type { DocumentInfo, ScanPage } from '@/types'
import type { PagePayload } from '@/services/api'

import UploadZone from '@/components/scan/UploadZone'
import CameraScanner from '@/components/scan/CameraScanner'
import ImageEditor from '@/components/scan/ImageEditor'

import {
  Camera, FileText, Trash2, Copy,
  ChevronLeft, ChevronRight, Settings,
  CheckCircle2, Undo, Redo, Sparkles,
  Layers, Save, X,
  FileSignature, Tag, Hash
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/utils/helpers'

export default function ScanPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  // Stores
  const {
    pages, currentPageIndex, addPage, removePage, duplicatePage,
    setCurrentPage, updatePage, clearPages, undo, redo,
    undoStack, redoStack
  } = useScanStore()

  const { showProcessing, hideProcessing, updateProgress } = useUIStore()
  const { addDocument } = useDocumentStore()

  // Local state
  const [showCamera, setShowCamera] = useState(false)
  const [editingPageId, setEditingPageId] = useState<string | null>(null)

  // Document metadata
  const [docName, setDocName] = useState<string>('')
  const [docTags, setDocTags] = useState<string>('')
  const [docDescription, setDocDescription] = useState<string>('')
  const [editingName, setEditingName] = useState(false)

  // Process uploaded files
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return

    showProcessing(`Đang xử lý ${files.length} ảnh...`)

    try {
      const newPages: Omit<ScanPage, 'id' | 'pageNumber' | 'rotation' | 'filters'>[] = []

      for (let i = 0; i < files.length; i++) {
        updateProgress((i / files.length) * 100)

        const file = files[i]
        const canvas = await fileToCanvas(file)
        const dataUrl = canvasToDataURL(canvas, 'image/jpeg', 0.95)

        newPages.push({
          originalImage: dataUrl,
          processedImage: dataUrl,
          width: canvas.width,
          height: canvas.height,
        })
      }

      useScanStore.getState().addPages(newPages)
      toast({ type: 'success', title: 'Thành công', description: `Đã thêm ${files.length} trang.` })

    } catch (error) {
      console.error(error)
      toast({ type: 'error', title: 'Lỗi', description: 'Có lỗi xảy ra khi xử lý ảnh.' })
    } finally {
      hideProcessing()
    }
  }

  const handleCameraCapture = async (file: File) => {
    setShowCamera(false)
    showProcessing('Đang xử lý ảnh chụp...')

    try {
      const canvas = await fileToCanvas(file)
      const dataUrl = canvasToDataURL(canvas, 'image/jpeg', 0.95)

      addPage({
        originalImage: dataUrl,
        processedImage: dataUrl,
        width: canvas.width,
        height: canvas.height,
      })

      setTimeout(() => {
        const state = useScanStore.getState()
        if (state.pages.length > 0) {
          setEditingPageId(state.pages[state.pages.length - 1].id)
        }
      }, 300)

    } catch (error) {
      console.error(error)
      toast({ type: 'error', title: 'Lỗi', description: 'Có lỗi xảy ra khi xử lý ảnh chụp.' })
    } finally {
      hideProcessing()
    }
  }

  const handleSaveEdit = (id: string, updates: Partial<ScanPage>) => {
    updatePage(id, updates)
    setEditingPageId(null)
  }

  const handleSaveDocument = async () => {
    if (pages.length === 0) return

    const { showProcessing, hideProcessing, updateProgress } = useUIStore.getState()
    showProcessing(`Đang upload ${pages.length} trang lên server...`)

    try {
      // Parse tags: "hóa đơn, lương" -> ["hóa đơn", "lương"]
      const parsedTags = docTags
        .split(/[,;\n]/)
        .map(t => t.replace(/^#+/, '').trim())
        .filter(Boolean)

      const finalName = docName.trim() || generateFileName('Scan', 'pdf').replace('.pdf', '')

      const doc: DocumentInfo = {
        id: generateId(),
        name: finalName,
        type: 'scan',
        pages: [...pages],
        pageCount: pages.length,
        size: 0,
        tags: parsedTags,
        description: docDescription.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Convert pages to API payload (PagePayload[])
      const pagesPayload: PagePayload[] = pages.map((p, i) => {
        updateProgress((i / pages.length) * 100)
        return {
          pageNumber: i + 1,
          width: p.width,
          height: p.height,
          // Gửi ảnh đã xử lý (hoặc ảnh gốc nếu chưa xử lý)
          originalImage: p.processedImage || p.originalImage,
          filters: p.filters,
          rotation: p.rotation,
          ocrText: '',
          ocrLanguage: 'vie',
        }
      })

      await addDocument(doc, pagesPayload)
      // Reset metadata
      setDocName('')
      setDocTags('')
      setDocDescription('')
      clearPages()
      toast({ type: 'success', title: 'Đã lưu', description: 'Tài liệu đã được lưu lên MongoDB.' })
      navigate('/documents')
    } catch (error: any) {
      console.error(error)
      toast({ type: 'error', title: 'Lỗi', description: error?.message || 'Có lỗi xảy ra khi lưu tài liệu.' })
    } finally {
      hideProcessing()
    }
  }

  // 1. EMPTY STATE
  if (pages.length === 0) {
    const defaultName = generateFileName('Scan', 'pdf').replace('.pdf', '')
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col items-center font-sans">

        {/* 📝 ĐẶT TÊN TÀI LIỆU - Hiển thị NGAY từ đầu */}
        <div className="w-full max-w-3xl mb-6 sm:mb-10">
          <div className="rounded-2xl bg-[var(--bg-card)] border-2 border-dashed border-[var(--border-secondary)] hover:border-primary-500/50 transition-colors p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                <FileSignature className="w-3.5 h-3.5 text-primary-500" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                Đặt tên tài liệu
              </h2>
              <span className="text-[11px] text-[var(--text-tertiary)] font-medium">
                (tùy chọn - dùng để tìm kiếm sau này)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Name input */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  <FileSignature className="w-3 h-3" /> Tên tài liệu
                </label>
                <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl pl-3 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all">
                  <input
                    type="text"
                    value={docName}
                    onChange={e => setDocName(e.target.value)}
                    placeholder={defaultName}
                    maxLength={120}
                    className="flex-1 min-w-0 bg-transparent py-2.5 text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
                  />
                  {docName && (
                    <button
                      onClick={() => setDocName('')}
                      className="p-1.5 rounded-lg mr-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]"
                      title="Xóa tên"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tags input */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  <Hash className="w-3 h-3" /> Tags <span className="text-[var(--text-tertiary)] font-medium normal-case tracking-normal">(phân cách bằng dấu phẩy)</span>
                </label>
                <input
                  type="text"
                  value={docTags}
                  onChange={e => setDocTags(e.target.value)}
                  placeholder="hóa đơn, điện, tháng 1"
                  maxLength={200}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                />
                {docTags && (
                  <div className="flex flex-wrap gap-1">
                    {docTags
                      .split(/[,;\n]/)
                      .map(t => t.replace(/^#+/, '').trim())
                      .filter(Boolean)
                      .slice(0, 6)
                      .map((t, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-500 text-[10px] font-bold border border-primary-500/20"
                        >
                          #{t}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* Description input */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  <FileText className="w-3 h-3" /> Mô tả <span className="text-[var(--text-tertiary)] font-medium normal-case tracking-normal">(tuỳ chọn)</span>
                </label>
                <input
                  type="text"
                  value={docDescription}
                  onChange={e => setDocDescription(e.target.value)}
                  placeholder="Hóa đơn tiền điện căn hộ..."
                  maxLength={500}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                />
              </div>
            </div>

            <p className="mt-3 text-[11px] text-[var(--text-tertiary)] font-medium flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Tên + tags sẽ giúp tìm kiếm tài liệu nhanh ở trang Thư viện.
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-500 font-semibold text-[11px] mb-5 border border-primary-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
            </span>
            <span>AI Scanner Pro · Trực tuyến</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-[1.1]">
            Số hóa tài liệu <br className="hidden sm:inline" />
            <span className="text-gradient-warm">
              nhanh chóng & sắc nét
            </span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-4 max-w-md mx-auto font-medium leading-relaxed">
            Sử dụng camera chụp trực tiếp hoặc tải ảnh có sẵn để tự động căn chỉnh và xuất file tài liệu tiêu chuẩn.
          </p>
        </div>

        {/* Action Choice Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full max-w-3xl">
          {/* Camera Button */}
          <button
            onClick={() => setShowCamera(true)}
            className="group relative flex flex-col items-center justify-center gap-4 p-8 sm:p-10 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-secondary)] hover:border-primary-500/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:scale-110 group-hover:rotate-[-4deg] transition-all duration-300">
              <Camera className="w-8 h-8 text-white" strokeWidth={2.2} />
            </div>
            <div className="text-center relative">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Mở Camera</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1.5 font-medium">Chụp trực tiếp từ webcam/camera</p>
            </div>
          </button>

          {/* Upload Zone */}
          <div className="h-full">
            <UploadZone
              onFilesSelected={handleFilesSelected}
              className="h-full min-h-[200px] rounded-3xl bg-[var(--bg-card)] border border-[var(--border-secondary)] hover:border-primary-500/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            />
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 mt-8 sm:mt-12 w-full max-w-3xl">
          {[
            { icon: Sparkles, label: 'AI tự động', desc: 'Căn chỉnh thông minh' },
            { icon: Layers, label: 'Đa trang', desc: 'Hỗ trợ nhiều trang' },
            { icon: CheckCircle2, label: 'Xuất PDF', desc: 'Định dạng chuẩn' },
          ].map((f, i) => (
            <div key={i} className="text-center p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-secondary)]">
              <div className="w-10 h-10 mx-auto rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-2.5">
                <f.icon className="w-4.5 h-4.5 text-primary-500" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">{f.label}</h4>
              <p className="text-[11px] font-medium text-[var(--text-tertiary)] mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>

        {showCamera && (
          <CameraScanner
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
          />
        )}
      </div>
    )
  }

  // 2. MULTI-PAGE WORKSPACE & EDITOR
  const currentPage = pages[currentPageIndex]
  const displayDocName = docName.trim() || generateFileName('Scan', 'pdf').replace('.pdf', '')

  return (
    <div className="h-full flex flex-col min-h-0 bg-[var(--bg-primary)] font-sans select-none overflow-hidden">

      {/* Editor Sub-Header Toolbar */}
      <div className="h-16 shrink-0 border-b border-[var(--border-secondary)] bg-[var(--bg-card)]/85 backdrop-blur-2xl flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-xl border border-[var(--border-secondary)] shrink-0">
            <Layers className="w-3.5 h-3.5 text-primary-500" />
            <span className="hidden sm:inline">Đang scan</span>
            <span className="text-primary-500">({pages.length})</span>
          </span>

          {/* Tên tài liệu (đã nhập từ đầu) - click để sửa nhanh */}
          <button
            onClick={() => setEditingName(true)}
            className="hidden md:flex items-center gap-2 min-w-0 flex-1 max-w-md bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] hover:border-primary-500/50 rounded-xl pl-3 pr-2 py-1 transition-colors group min-w-0"
            title="Nhấn để sửa tên"
          >
            <FileSignature className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
            <span className={cn(
              "flex-1 min-w-0 truncate text-left text-xs sm:text-sm font-semibold",
              docName.trim() ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] italic"
            )}>
              {docName.trim() || displayDocName}
            </span>
            {(docTags || docDescription) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-500 px-1.5 py-0.5 rounded-md bg-primary-500/10 border border-primary-500/20 shrink-0">
                <Tag className="w-2.5 h-2.5" />
                {docTags.split(/[,;\n]/).filter(t => t.trim()).length || '✦'}
              </span>
            )}
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center bg-[var(--bg-tertiary)] rounded-xl p-1 border border-[var(--border-secondary)] shrink-0">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-primary)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-[var(--border-secondary)] mx-1" />
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-primary)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Làm lại (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Nút sửa tên nhanh (mobile) */}
          <button
            onClick={() => setEditingName(true)}
            className="md:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-primary-500 hover:bg-primary-500/10 border border-[var(--border-secondary)]"
            title="Sửa tên"
          >
            <FileSignature className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => clearPages()}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-error-500 hover:bg-error-500/10 transition-colors flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hủy bỏ</span>
          </button>
          <button
            onClick={handleSaveDocument}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white gradient-primary hover:shadow-lg hover:shadow-primary-500/25 flex items-center gap-1.5 hover:-translate-y-0.5 transition-all shadow-sm active:scale-95"
          >
            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Lưu vào thư viện
          </button>
        </div>
      </div>

      {/* Modal sửa tên nhanh (chỉ hiện ở workspace) */}
      {editingName && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setEditingName(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-secondary)] shadow-2xl p-5 w-full max-w-md"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                <FileSignature className="w-4 h-4 text-primary-500" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Sửa tên tài liệu</h3>
            </div>
            <input
              type="text"
              value={docName}
              onChange={e => setDocName(e.target.value)}
              placeholder={displayDocName}
              maxLength={120}
              autoFocus
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingName(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              >
                Đóng
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white gradient-primary"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick view: tags + description (chỉ hiện khi đã nhập) */}
      {(docTags.trim() || docDescription.trim()) && (
        <div className="shrink-0 border-b border-[var(--border-secondary)] bg-[var(--bg-card)]/60 backdrop-blur px-4 sm:px-6 py-2 flex items-center gap-2 flex-wrap">
          <FileSignature className="w-3 h-3 text-[var(--text-tertiary)] shrink-0" />
          <span className="text-[11px] font-semibold text-[var(--text-tertiary)]">Đã thêm:</span>
          {docTags
            .split(/[,;\n]/)
            .map(t => t.replace(/^#+/, '').trim())
            .filter(Boolean)
            .map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-500 text-[10px] font-bold border border-primary-500/20"
              >
                #{t}
              </span>
            ))}
          {docDescription.trim() && (
            <span className="text-[11px] text-[var(--text-secondary)] font-medium truncate max-w-md" title={docDescription}>
              {docDescription}
            </span>
          )}
          <button
            onClick={() => {
              setDocTags('')
              setDocDescription('')
            }}
            className="ml-auto p-1 rounded text-[var(--text-tertiary)] hover:text-error-500"
            title="Xóa tags & mô tả"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 min-h-0 flex p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full gap-4 overflow-hidden">

        {/* Thumbnails Sidebar */}
        <div className="w-24 sm:w-36 lg:w-44 flex flex-col shrink-0">
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-secondary)] p-2.5 flex-1 overflow-y-auto hidden-scrollbar flex flex-col gap-2.5 shadow-sm">
            {pages.map((page, index) => (
              <div
                key={page.id}
                onClick={() => setCurrentPage(index)}
                className={cn(
                  "relative group cursor-pointer rounded-xl transition-all aspect-[3/4] bg-[var(--bg-tertiary)] overflow-hidden",
                  currentPageIndex === index
                    ? 'ring-2 ring-primary-500 shadow-md shadow-primary-500/20'
                    : 'hover:ring-2 hover:ring-primary-500/30 opacity-85 hover:opacity-100'
                )}
              >
                {/* Page Number */}
                <div className={cn(
                  "absolute top-1 left-1 w-5 h-5 rounded-md text-[9px] font-bold flex items-center justify-center z-10 transition-colors",
                  currentPageIndex === index ? 'bg-primary-500 text-white' : 'bg-black/60 text-white backdrop-blur-md'
                )}>
                  {index + 1}
                </div>

                {/* Actions overlay */}
                <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                    className="p-1 rounded bg-error-500 text-white hover:bg-error-600 shadow-xs"
                    title="Xóa trang"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicatePage(page.id); }}
                    className="p-1 rounded bg-black/70 text-white hover:bg-black/90 shadow-xs"
                    title="Nhân bản"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>

                <img
                  src={page.processedImage || page.originalImage}
                  alt={`Trang ${index + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                />
                {currentPageIndex === index && (
                  <div className="absolute inset-0 border-2 border-primary-500 rounded-xl pointer-events-none" />
                )}
              </div>
            ))}

            {/* Add more buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <UploadZone
                onFilesSelected={handleFilesSelected}
                compact
                className="w-full rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-card)]"
              />
              <button
                onClick={() => setShowCamera(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--bg-tertiary)] hover:bg-primary-500/10 hover:text-primary-500 border border-[var(--border-secondary)] transition-all text-xs font-semibold"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chụp thêm</span>
              </button>
            </div>
          </div>
        </div>

        {/* Current Page Preview & Controls */}
        <div className="flex-1 rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] border border-[var(--border-secondary)] relative flex items-center justify-center p-3 sm:p-6 shadow-lg overflow-hidden group">
          {currentPage ? (
            <div className="relative z-10 w-full h-full flex items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-secondary)] border border-[var(--border-secondary)] shadow-inner p-2 sm:p-4 overflow-hidden">
              <img
                src={currentPage.processedImage || currentPage.originalImage}
                alt="Current page"
                className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg"
              />

              {/* Floating Action Button for Edit */}
              <button
                onClick={() => setEditingPageId(currentPage.id)}
                className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 px-5 py-3 rounded-full gradient-primary text-white shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-xs sm:text-sm font-bold z-20 active:scale-95"
              >
                <Settings className="w-4 h-4 animate-[spin_5s_linear_infinite]" />
                Chỉnh sửa trang
              </button>

              {/* Navigation arrows overlay */}
              {pages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPageIndex - 1))}
                    disabled={currentPageIndex === 0}
                    className="absolute left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-black/40 hover:bg-primary-500 text-white backdrop-blur-md border border-white/10 shadow-lg disabled:opacity-0 transition-all z-20 hover:-translate-x-0.5"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPageIndex + 1))}
                    disabled={currentPageIndex === pages.length - 1}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-black/40 hover:bg-primary-500 text-white backdrop-blur-md border border-white/10 shadow-lg disabled:opacity-0 transition-all z-20 hover:translate-x-0.5"
                    title="Trang sau"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Page indicator */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/40 text-white text-xs font-semibold backdrop-blur-md border border-white/10">
                Trang {currentPageIndex + 1} / {pages.length}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-card)] flex items-center justify-center shadow-md border border-[var(--border-secondary)]">
                <FileText className="w-8 h-8 text-[var(--text-tertiary)]" />
              </div>
              <p className="text-sm text-[var(--text-tertiary)] font-medium">Chưa có trang nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Overlays */}
      {showCamera && (
        <CameraScanner
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {editingPageId && (
        <ImageEditor
          page={pages.find(p => p.id === editingPageId)!}
          onSave={handleSaveEdit}
          onCancel={() => setEditingPageId(null)}
        />
      )}
    </div>
  )
}