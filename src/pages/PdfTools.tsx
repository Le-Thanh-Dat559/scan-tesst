import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { pdfService } from '@/utils/pdf'
import { downloadBlob, generateFileName, formatFileSize } from '@/utils/helpers'
import { useUIStore } from '@/stores'

import UploadZone from '@/components/scan/UploadZone'
import {
  FileStack, FileText, Image as ImageIcon,
  Download, Trash2, CheckCircle2, Sparkles, Shield, ChevronRight, Zap
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/utils/helpers'

type ToolType = 'merge' | 'img2pdf'

export default function PdfToolsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTool = (searchParams.get('tool') as ToolType) || 'merge'

  const setTool = (tool: ToolType) => {
    setSearchParams({ tool })
  }

  return (
    <div className="page-container space-y-5 sm:space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-500 font-semibold text-[11px] mb-3 border border-primary-500/20">
            <FileStack className="w-3 h-3" />
            <span>Bộ công cụ PDF</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
            Công cụ PDF
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 font-medium">
            Gộp file PDF và chuyển đổi hàng loạt hình ảnh sang định dạng PDF trực tiếp trên trình duyệt
          </p>
        </div>
      </div>

      <div className="flex gap-5 flex-col lg:flex-row items-start">
        {/* Tool Sidebar */}
        <div className="w-full lg:w-72 shrink-0 space-y-3">
          <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider px-1">
            Công cụ
          </p>
          <ToolButton
            active={currentTool === 'merge'}
            onClick={() => setTool('merge')}
            icon={<FileStack className="w-5 h-5" />}
            title="Gộp file PDF"
            desc="Ghép nhiều PDF thành một"
            color="success"
          />
          <ToolButton
            active={currentTool === 'img2pdf'}
            onClick={() => setTool('img2pdf')}
            icon={<ImageIcon className="w-5 h-5" />}
            title="Ảnh sang PDF"
            desc="Chuyển JPG/PNG thành PDF"
            color="primary"
          />

          {/* Info card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-success-500/10 to-success-500/5 border border-success-500/20 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-success-500/15 border border-success-500/30 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-success-500" />
              </div>
              <h3 className="font-bold text-xs text-[var(--text-primary)]">Xử lý an toàn</h3>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed">
              100% dữ liệu xử lý cục bộ trên máy của bạn. Không gửi file lên server.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-secondary)]">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary-500" />
              <p className="text-[11px] font-semibold text-[var(--text-secondary)]">
                Xử lý cực nhanh với WebAssembly
              </p>
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 w-full rounded-2xl bg-[var(--bg-card)] border border-[var(--border-secondary)] overflow-hidden shadow-md">
          {currentTool === 'merge' && <MergeTool />}
          {currentTool === 'img2pdf' && <ImgToPdfTool />}
        </div>
      </div>
    </div>
  )
}

function ToolButton({ active, onClick, icon, title, desc, color }: {
  active: boolean,
  onClick: () => void,
  icon: React.ReactNode,
  title: string,
  desc: string,
  color: 'success' | 'primary'
}) {
  const activeBorder = color === 'success'
    ? 'border-success-500 bg-success-500/5'
    : 'border-primary-500 bg-primary-500/5'

  const iconActive = color === 'success'
    ? 'bg-success-500 text-white shadow-lg shadow-success-500/25'
    : 'gradient-primary text-white shadow-lg shadow-primary-500/25'

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-start gap-3 hover:shadow-md hover:-translate-y-0.5",
        active
          ? activeBorder
          : 'bg-[var(--bg-card)] border-[var(--border-secondary)] hover:border-primary-500/40'
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-all duration-200 shrink-0",
        active ? iconActive : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-secondary)]'
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className={cn(
            "font-bold text-xs sm:text-sm leading-tight",
            active ? 'text-primary-600 dark:text-primary-500' : 'text-[var(--text-primary)]'
          )}>
            {title}
          </h3>
          {active && <ChevronRight className="w-3.5 h-3.5 text-primary-500" />}
        </div>
        <p className="text-[11px] mt-1 font-medium text-[var(--text-tertiary)] leading-relaxed">
          {desc}
        </p>
      </div>
    </button>
  )
}

// --- MERGE TOOL ---
function MergeTool() {
  const { toast } = useToast()
  const { showProcessing, hideProcessing, updateProgress } = useUIStore()
  
  const [files, setFiles] = useState<File[]>([])
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)

  const handleFilesSelected = (newFiles: File[]) => {
    const pdfs = newFiles.filter(f => f.type === 'application/pdf')
    if (pdfs.length < newFiles.length) {
      toast({ type: 'warning', title: 'Cảnh báo', description: 'Chỉ chấp nhận file định dạng PDF.' })
    }
    setFiles(prev => [...prev, ...pdfs])
    setResultBlob(null)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setResultBlob(null)
  }

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({ type: 'warning', title: 'Cảnh báo', description: 'Vui lòng chọn ít nhất 2 file PDF để gộp.' })
      return
    }

    showProcessing('Đang gộp file PDF...')
    try {
      const buffers: ArrayBuffer[] = []
      
      for (let i = 0; i < files.length; i++) {
        updateProgress((i / files.length) * 50)
        const buffer = await files[i].arrayBuffer()
        buffers.push(buffer)
      }
      
      updateProgress(60)
      const mergedPdfBytes = await pdfService.mergePdfs(buffers)
      updateProgress(100)
      
      const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' })
      setResultBlob(blob)
      toast({ type: 'success', title: 'Thành công', description: 'Đã gộp file PDF.' })
      
    } catch (error) {
      console.error(error)
      toast({ type: 'error', title: 'Lỗi', description: 'Không thể gộp file PDF.' })
    } finally {
      hideProcessing()
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, generateFileName('Merged', 'pdf'))
  }

  return (
    <div className="flex flex-col">
      <div className="h-14 px-5 border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)] flex items-center justify-between shrink-0">
        <h2 className="font-bold text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-success-500 rounded-full" />
          Gộp file PDF
        </h2>
        {files.length > 0 && !resultBlob && (
          <button
            onClick={handleMerge}
            disabled={files.length < 2}
            className="px-4 py-1.5 rounded-xl bg-success-500 text-white text-xs font-bold hover:bg-success-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 shadow-sm hover:shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Thực hiện gộp ({files.length} file)
          </button>
        )}
        {resultBlob && (
          <div className="flex gap-2">
            <button
              onClick={() => { setFiles([]); setResultBlob(null); }}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border-secondary)] hover:border-primary-500/40 transition-colors"
            >
              Làm mới
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 rounded-xl gradient-primary text-white text-xs font-bold hover:shadow-lg hover:shadow-primary-500/25 transition-all flex items-center gap-1.5 hover:-translate-y-0.5"
            >
              <Download className="w-3.5 h-3.5" /> Tải file PDF
            </button>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6">
        {resultBlob ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-success-500/20 blur-2xl rounded-full" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-success-500/20 to-success-500/5 flex items-center justify-center border border-success-500/30">
                <CheckCircle2 className="w-10 h-10 text-success-500" strokeWidth={2.2} />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mb-2 tracking-tight">Gộp file thành công!</h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 max-w-sm">
              Đã gộp <span className="font-bold text-success-500">{files.length} file</span> thành công. Dung lượng: <span className="font-bold text-[var(--text-primary)]">{formatFileSize(resultBlob.size)}</span>
            </p>
            <button
              onClick={handleDownload}
              className="px-6 py-3 rounded-xl gradient-primary text-white font-bold text-xs hover:shadow-lg hover:shadow-primary-500/30 flex items-center gap-2 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" /> Tải file kết quả ngay
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <UploadZone
              onFilesSelected={handleFilesSelected}
              allowPdf
              accept=""
              className="min-h-[180px] rounded-2xl"
            />

            {files.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                    Danh sách file ({files.length})
                  </h3>
                  <button
                    onClick={() => setFiles([])}
                    className="text-[11px] font-semibold text-error-500 hover:bg-error-500/10 px-2 py-1 rounded-lg transition-colors"
                  >
                    Xóa tất cả
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-card)] hover:border-primary-500/40 transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-success-500/10 flex items-center justify-center shrink-0 border border-success-500/20">
                          <FileText className="w-4 h-4 text-success-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">{file.name}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)] font-medium mt-0.5">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(i)}
                        className="p-1.5 rounded-lg text-error-500 hover:bg-error-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// --- IMAGES TO PDF TOOL ---
function ImgToPdfTool() {
  const { toast } = useToast()
  const { showProcessing, hideProcessing } = useUIStore()
  
  const [files, setFiles] = useState<File[]>([])
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles])
    setResultBlob(null)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setResultBlob(null)
  }

  const handleConvert = async () => {
    if (files.length === 0) return

    showProcessing('Đang tạo file PDF từ ảnh...')
    try {
      const mockPages = await Promise.all(files.map(async (f) => {
        return new Promise<any>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              originalImage: e.target?.result as string,
              processedImage: e.target?.result as string,
            })
          }
          reader.readAsDataURL(f)
        })
      }))

      const pdfBytes = await pdfService.createPdfFromPages(mockPages, {
        pageSize: 'a4',
        orientation: 'portrait',
        margin: 20,
        quality: 0.85,
        compression: true,
        searchable: false,
      })
      
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      setResultBlob(blob)
      toast({ type: 'success', title: 'Thành công', description: 'Đã tạo file PDF.' })
      
    } catch (error) {
      console.error(error)
      toast({ type: 'error', title: 'Lỗi', description: 'Không thể tạo file PDF.' })
    } finally {
      hideProcessing()
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    downloadBlob(resultBlob, generateFileName('ImagesToPdf', 'pdf'))
  }

  return (
    <div className="flex flex-col">
      <div className="h-14 px-5 border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)] flex items-center justify-between shrink-0">
        <h2 className="font-bold text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
          Chuyển Ảnh sang PDF
        </h2>
        {files.length > 0 && !resultBlob && (
          <button
            onClick={handleConvert}
            className="px-4 py-1.5 rounded-xl gradient-primary text-white text-xs font-bold hover:shadow-lg hover:shadow-primary-500/25 transition-all flex items-center gap-1.5 hover:-translate-y-0.5 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Tạo file PDF ({files.length} ảnh)
          </button>
        )}
        {resultBlob && (
          <div className="flex gap-2">
            <button
              onClick={() => { setFiles([]); setResultBlob(null); }}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border-secondary)] hover:border-primary-500/40 transition-colors"
            >
              Làm mới
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 rounded-xl gradient-primary text-white text-xs font-bold hover:shadow-lg hover:shadow-primary-500/25 transition-all flex items-center gap-1.5 hover:-translate-y-0.5"
            >
              <Download className="w-3.5 h-3.5" /> Tải file PDF
            </button>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6">
        {resultBlob ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-primary-500/20 blur-2xl rounded-full" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-500/5 flex items-center justify-center border border-primary-500/30">
                <CheckCircle2 className="w-10 h-10 text-primary-500" strokeWidth={2.2} />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mb-2 tracking-tight">Tạo file PDF thành công!</h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-6 max-w-sm">
              Đã gộp <span className="font-bold text-primary-500">{files.length} ảnh</span> thành 1 file PDF sắc nét.
            </p>
            <button
              onClick={handleDownload}
              className="px-6 py-3 rounded-xl gradient-primary text-white font-bold text-xs hover:shadow-lg hover:shadow-primary-500/30 flex items-center gap-2 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" /> Tải file ngay
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <UploadZone
              onFilesSelected={handleFilesSelected}
              allowPdf={false}
              className="min-h-[180px] rounded-2xl"
            />

            {files.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                    Ảnh đã chọn ({files.length})
                  </h3>
                  <button
                    onClick={() => setFiles([])}
                    className="text-[11px] font-semibold text-error-500 hover:bg-error-500/10 px-2 py-1 rounded-lg transition-colors"
                  >
                    Xóa tất cả
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-80 overflow-y-auto p-1">
                  {files.map((file, i) => (
                    <div key={i} className="aspect-[3/4] rounded-xl border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] overflow-hidden relative group hover:border-primary-500/40 transition-colors">
                      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center z-10 shadow-sm">
                        {i + 1}
                      </div>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <button
                          onClick={() => removeFile(i)}
                          className="p-2 rounded-lg bg-error-500 text-white hover:bg-error-600 transition-colors shadow-md"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
