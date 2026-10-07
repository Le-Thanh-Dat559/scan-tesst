import { useState, useEffect } from 'react'
import { ocrService } from '@/utils/ocr'
import { fileToCanvas, canvasToDataURL } from '@/utils/imageProcessing'
import { generateFileName, downloadBlob } from '@/utils/helpers'
import { ocrLanguages, type OcrLanguage, defaultFilters } from '@/types'
import { useSettingsStore, useDocumentStore } from '@/stores'
import { generateId } from '@/utils/helpers'

import UploadZone from '@/components/scan/UploadZone'
import {
  Languages, Copy, Download, FileText, Check,
  Play, RefreshCw, ChevronDown, Sparkles, Wand2,
  AlertCircle, Zap
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function OCRPage() {
  const { toast } = useToast()
  const { defaultOcrLanguage, setDefaultOcrLang } = useSettingsStore()
  const { addDocument } = useDocumentStore()

  const [image, setImage] = useState<string | null>(null)
  const [lang, setLang] = useState<OcrLanguage>(defaultOcrLanguage)
  const [text, setText] = useState<string>('')

  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [isCopied, setIsCopied] = useState(false)

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      ocrService.terminate()
    }
  }, [])

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return
    const file = files[0]

    setStatus('loading')
    try {
      const canvas = await fileToCanvas(file)
      const dataUrl = canvasToDataURL(canvas, 'image/jpeg', 0.9)
      setImage(dataUrl)
      setStatus('idle')
      setText('')
      setProgress(0)
    } catch (error) {
      console.error(error)
      toast({ type: 'error', title: 'Lỗi', description: 'Không thể đọc file ảnh.' })
      setStatus('idle')
    }
  }

  const handleRecognize = async () => {
    if (!image) return

    setStatus('processing')
    setProgress(0)

    try {
      const result = await ocrService.recognize(image, lang, (p) => setProgress(p))

      if (result.status === 'error') {
        throw new Error(result.error)
      }

      setText(result.text)
      setStatus('done')

      // Auto save to MongoDB
      await addDocument(
        {
          id: generateId(),
          name: generateFileName('OCR', 'txt').replace('.txt', ''),
          type: 'ocr',
          pages: [{
            id: generateId(),
            pageNumber: 1,
            originalImage: image,
            processedImage: image,
            width: 800,
            height: 1000,
            rotation: 0,
            filters: defaultFilters,
            ocrText: result.text,
          }],
          pageCount: 1,
          size: result.text.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        [{
          pageNumber: 1,
          width: 800,
          height: 1000,
          originalImage: image,
          filters: defaultFilters,
          rotation: 0,
          ocrText: result.text,
          ocrLanguage: lang,
        }]
      )

      toast({ type: 'success', title: 'Hoàn tất', description: 'Đã nhận dạng văn bản thành công.' })

    } catch (error) {
      console.error(error)
      setStatus('error')
      toast({ type: 'error', title: 'Lỗi', description: 'Không thể nhận dạng văn bản. Vui lòng thử lại.' })
    }
  }

  const handleCopy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      toast({ type: 'success', title: 'Đã sao chép', description: 'Văn bản đã được lưu vào clipboard.' })
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast({ type: 'error', title: 'Lỗi', description: 'Không thể sao chép văn bản.' })
    }
  }

  const handleDownload = (format: 'txt' | 'doc') => {
    if (!text) return

    let blob: Blob
    let filename = generateFileName('OCR', format)

    if (format === 'txt') {
      blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    } else {
      const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Document</title></head><body>${text.replace(/\n/g, '<br>')}</body></html>`
      blob = new Blob(['\ufeff', html], { type: 'application/msword' })
    }

    downloadBlob(blob, filename)
    toast({ type: 'success', title: 'Thành công', description: `Đã tải xuống file ${format.toUpperCase()}.` })
  }

  return (
    <div className="page-container flex-1 flex flex-col min-h-0 font-sans">

      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-500 font-semibold text-[11px] mb-3 border border-primary-500/20">
            <Wand2 className="w-3 h-3" />
            <span>AI OCR Engine · Powered by Tesseract</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
            Trích xuất chữ (OCR)
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 font-medium">
            Tự động nhận diện và chuyển đổi hình ảnh thành văn bản có thể chỉnh sửa
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-secondary)] shrink-0 self-start md:self-auto shadow-sm">
          <div className="pl-2 pr-1 flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-primary-500" />
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Ngôn ngữ:</span>
          </div>
          <div className="relative group cursor-pointer bg-[var(--bg-tertiary)] rounded-lg px-2.5 py-1.5 border border-[var(--border-secondary)] hover:border-primary-500 transition-colors">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              {ocrLanguages.find(l => l.code === lang)?.name}
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </div>
            <select
              value={lang}
              onChange={(e) => {
                setLang(e.target.value as OcrLanguage)
                setDefaultOcrLang(e.target.value as OcrLanguage)
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            >
              {ocrLanguages.map(l => (
                <option key={l.code} value={l.code}>{l.name} ({l.nativeName})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Area */}
      {!image ? (
        /* Empty Upload State */
        <div className="flex-1 flex items-center justify-center py-6">
          <div className="w-full max-w-xl">
            <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-secondary)] p-6 sm:p-10 shadow-xl">
              <UploadZone onFilesSelected={handleFilesSelected} multiple={false} />
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <StatBlock icon={<Zap className="w-3.5 h-3.5" />} label="Tốc độ" value="3-5s" />
              <StatBlock icon={<Languages className="w-3.5 h-3.5" />} label="Ngôn ngữ" value="50+" />
              <StatBlock icon={<Sparkles className="w-3.5 h-3.5" />} label="Độ chính xác" value="98%" />
            </div>
          </div>
        </div>
      ) : (
        /* Workspace Split Grid */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-0 pb-6">

          {/* Left: Original Image Preview */}
          <div className="flex flex-col rounded-2xl bg-[var(--bg-card)] border border-[var(--border-secondary)] overflow-hidden shadow-md">
            <div className="h-12 border-b border-[var(--border-secondary)] flex items-center justify-between px-4 bg-[var(--bg-tertiary)] shrink-0">
              <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                Ảnh gốc
              </span>
              <button
                onClick={() => { setImage(null); setText(''); setStatus('idle'); }}
                className="text-xs font-semibold text-error-500 hover:bg-error-500/10 px-2.5 py-1 rounded-lg transition-colors"
              >
                Đổi ảnh khác
              </button>
            </div>

            <div className="flex-1 p-3 bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-secondary)] relative flex items-center justify-center min-h-[300px] overflow-hidden">
              <img
                src={image}
                alt="Original Scan"
                className="max-w-full max-h-full object-contain rounded-lg shadow-md"
              />

              {/* Laser Scanning Animation */}
              {(status === 'processing' || status === 'loading') && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                  <div className="rounded-2xl bg-black/60 border border-white/10 p-6 flex flex-col items-center max-w-xs text-center backdrop-blur-xl">
                    <Wand2 className="w-8 h-8 text-primary-400 mb-3 animate-bounce" />
                    <p className="font-bold text-sm">
                      {status === 'loading' ? 'Đang phân tích ảnh...' : 'AI đang trích xuất chữ...'}
                    </p>
                    {status === 'processing' && (
                      <div className="w-48 mt-4">
                        <div className="flex justify-between text-xs mb-1.5 font-medium text-white/80">
                          <span>Tiến trình</span>
                          <span className="text-primary-400 font-bold">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-primary transition-all duration-300 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: OCR Text Result */}
          <div className="flex flex-col rounded-2xl bg-[var(--bg-card)] border border-[var(--border-secondary)] overflow-hidden shadow-md">
            <div className="h-12 border-b border-[var(--border-secondary)] flex items-center justify-between px-4 bg-[var(--bg-tertiary)] shrink-0">
              <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-success-500 rounded-full" />
                <FileText className="w-3.5 h-3.5 text-primary-500" />
                Văn bản trích xuất
              </span>

              {status === 'done' && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-primary-500 hover:border-primary-500 transition-colors"
                    title="Sao chép toàn bộ"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDownload('doc')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white gradient-primary text-xs font-bold hover:shadow-md shadow-sm transition-all hover:-translate-y-0.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Word
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 p-4 flex flex-col relative min-h-[300px]">
              {status === 'idle' || status === 'error' ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-4 border border-primary-500/20">
                    {status === 'error' ? (
                      <AlertCircle className="w-7 h-7 text-error-500" />
                    ) : (
                      <Sparkles className="w-7 h-7 text-primary-500" />
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-1.5">
                    {status === 'error' ? 'Không thể trích xuất' : 'Sẵn sàng nhận diện'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] max-w-xs mb-5 font-medium leading-relaxed">
                    {status === 'error'
                      ? 'Vui lòng thử lại với ảnh rõ nét hơn hoặc chọn đúng ngôn ngữ.'
                      : 'Hệ thống AI đã nạp ảnh xong. Nhấn nút bên dưới để bắt đầu đọc văn bản.'}
                  </p>
                  <button
                    onClick={handleRecognize}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-white text-xs sm:text-sm font-bold hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 transition-all shadow-sm active:scale-95"
                  >
                    {status === 'error' ? <RefreshCw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {status === 'error' ? 'Thử lại ngay' : 'Bắt đầu quét chữ'}
                  </button>
                </div>
              ) : status === 'done' ? (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 w-full resize-none p-4 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-secondary)] focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 text-[var(--text-primary)] outline-none text-xs sm:text-sm font-medium leading-relaxed transition-all"
                  placeholder="Văn bản trích xuất sẽ hiển thị tại đây..."
                />
              ) : (
                <div className="flex-1 flex flex-col gap-2.5 opacity-70">
                  <div className="w-3/4 shimmer rounded h-3" />
                  <div className="w-full shimmer rounded h-3" />
                  <div className="w-5/6 shimmer rounded h-3" />
                  <div className="w-2/3 shimmer rounded h-3" />
                  <div className="w-full shimmer rounded h-3" />
                  <div className="w-4/5 shimmer rounded h-3" />
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

function StatBlock({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-secondary)]">
      <div className="w-9 h-9 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider leading-tight">{label}</p>
        <p className="text-sm font-black text-[var(--text-primary)] mt-0.5">{value}</p>
      </div>
    </div>
  )
}