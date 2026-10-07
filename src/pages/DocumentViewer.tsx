import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDocumentStore, useUIStore, useThemeStore } from '@/stores'
import { downloadBlob } from '@/utils/helpers'
import { pdfService } from '@/utils/pdf'

import { 
  ArrowLeft, Download, Trash2, Edit3, 
  ChevronLeft, ChevronRight, FileText, ImageIcon,
  Check, Sun, Moon
} from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'

export default function DocumentViewerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { getDocument, removeDocument, updateDocument } = useDocumentStore()
  const { showProcessing, hideProcessing } = useUIStore()
  const { resolved: theme, setMode } = useThemeStore()
  
  const [doc, setDoc] = useState(() => id ? getDocument(id) : undefined)
  const [currentPage, setCurrentPage] = useState(0)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')

  useEffect(() => {
    if (id) {
      const found = getDocument(id)
      if (found) {
        setDoc(found)
        setNameInput(found.name)
      } else {
        toast({ type: 'error', title: 'Lỗi', description: 'Tài liệu không tồn tại hoặc đã bị xóa.' })
        navigate('/documents')
      }
    }
  }, [id, getDocument, navigate, toast])

  if (!doc) return null

  const handleDelete = () => {
    removeDocument(doc.id)
    toast({ type: 'success', title: 'Thành công', description: 'Đã xóa tài liệu.' })
    navigate('/documents')
  }

  const handleSaveName = () => {
    if (nameInput.trim() && nameInput !== doc.name) {
      updateDocument(doc.id, { name: nameInput.trim() })
      setDoc({ ...doc, name: nameInput.trim() })
      toast({ type: 'success', title: 'Thành công', description: 'Đã cập nhật tên tài liệu.' })
    }
    setIsEditingName(false)
  }

  const handleExportPdf = async () => {
    showProcessing('Đang tạo file PDF chất lượng cao...')
    try {
      const pdfBytes = await pdfService.createPdfFromPages(doc.pages, {
        pageSize: 'a4',
        orientation: 'portrait',
        margin: 20,
        quality: 0.9,
        compression: true,
        searchable: false,
      })
      
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      downloadBlob(blob, `${doc.name}.pdf`)
      toast({ type: 'success', title: 'Thành công', description: 'Đã tải xuống file PDF.' })
    } catch (error) {
      console.error(error)
      toast({ type: 'error', title: 'Lỗi', description: 'Không thể tạo file PDF.' })
    } finally {
      hideProcessing()
    }
  }

  const handleExportImages = async () => {
    try {
      if (doc.pages.length === 1) {
        const res = await fetch(doc.pages[0].processedImage || doc.pages[0].originalImage)
        const blob = await res.blob()
        downloadBlob(blob, `${doc.name}.jpg`)
        toast({ type: 'success', title: 'Thành công', description: 'Đã tải ảnh về máy.' })
      } else {
        const page = doc.pages[currentPage]
        const res = await fetch(page.processedImage || page.originalImage)
        const blob = await res.blob()
        downloadBlob(blob, `${doc.name}_trang_${currentPage + 1}.jpg`)
        toast({ type: 'success', title: 'Thành công', description: `Đã tải trang ${currentPage + 1}.` })
      }
    } catch (error) {
      toast({ type: 'error', title: 'Lỗi', description: 'Không thể tải xuống hình ảnh.' })
    }
  }

  const currentDisplayImage = doc.pages[currentPage]?.processedImage || doc.pages[currentPage]?.originalImage

  return (
    <div className="h-full flex flex-col min-h-0 bg-[var(--bg-primary)] font-sans select-none overflow-hidden">
      
      {/* Top Workspace Toolbar (Integrated Single Header) */}
      <div className="h-16 shrink-0 border-b border-[var(--border-secondary)] bg-[var(--bg-card)]/80 backdrop-blur-xl z-20">
        <div className="w-full h-full px-4 sm:px-5 lg:px-6 flex items-center justify-between gap-3">
          
          {/* Left: Back & Document Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => navigate('/documents')}
              className="p-2 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-primary-500 hover:bg-primary-500/10 transition-all border border-[var(--border-secondary)]"
              title="Quay lại danh sách tài liệu"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20 shrink-0">
                {doc.type === 'scan' ? <FileText className="w-4 h-4 text-primary-500" /> : <ImageIcon className="w-4 h-4 text-accent-500" />}
              </div>
              
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                    onBlur={handleSaveName}
                    autoFocus
                    className="px-3 py-1 bg-[var(--bg-tertiary)] border border-primary-500 rounded-xl text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  <button 
                    onClick={handleSaveName}
                    className="p-1 rounded-lg bg-primary-500 text-white hover:bg-primary-600"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-2 group cursor-pointer min-w-0" 
                  onClick={() => setIsEditingName(true)}
                  title="Nhấn để đổi tên"
                >
                  <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate max-w-[160px] sm:max-w-sm">
                    {doc.name}
                  </h1>
                  <Edit3 className="w-3.5 h-3.5 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-secondary)] shrink-0">
                    {doc.pageCount} trang
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme switcher */}
            <button
              onClick={() => setMode(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-accent-500 hover:bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] transition-all"
              title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Delete button */}
            <button 
              onClick={() => setDeleteDialog(true)}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-error-500/10 hover:text-error-500 hover:border-error-500/30 border border-[var(--border-secondary)] transition-all"
              title="Xóa tài liệu"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <div className="h-5 w-px bg-[var(--border-secondary)] hidden sm:block" />
            
            {/* Download Image */}
            <button 
              onClick={handleExportImages}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-card)] hover:border-primary-500/30 text-[var(--text-primary)] text-xs font-bold transition-all shadow-xs"
            >
              <ImageIcon className="w-3.5 h-3.5 text-primary-500" /> 
              Tải Ảnh
            </button>
            
            {/* Export PDF */}
            <button 
              onClick={handleExportPdf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-xs font-bold hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> 
              <span>Xuất PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 min-h-0 flex p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full gap-4 overflow-hidden">
        
        {/* Thumbnails Sidebar */}
        {doc.pageCount > 1 && (
          <div className="w-24 sm:w-32 lg:w-40 flex flex-col shrink-0">
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-secondary)] p-2.5 flex-1 overflow-y-auto hidden-scrollbar flex flex-col gap-2.5 shadow-sm">
              <div className="text-center pb-2 border-b border-[var(--border-secondary)]/60">
                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                  {doc.pageCount} Trang
                </span>
              </div>
              
              {doc.pages.map((page, index) => (
                <div 
                  key={page.id}
                  onClick={() => setCurrentPage(index)}
                  className={`
                    relative cursor-pointer rounded-xl transition-all overflow-hidden group aspect-[3/4] bg-[var(--bg-tertiary)]
                    ${currentPage === index 
                      ? 'ring-2 ring-primary-500 shadow-md shadow-primary-500/20' 
                      : 'hover:ring-2 hover:ring-[var(--border-primary)] opacity-80 hover:opacity-100'
                    }
                  `}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center z-10 backdrop-blur-md transition-colors ${currentPage === index ? 'bg-primary-500 text-white' : 'bg-black/50 text-white'}`}>
                    {index + 1}
                  </div>
                  <img 
                    src={page.processedImage || page.originalImage} 
                    alt={`Trang ${index + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  {currentPage === index && (
                    <div className="absolute inset-0 border-2 border-primary-500 rounded-xl pointer-events-none" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Central Document Viewer */}
        <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-secondary)] rounded-2xl sm:rounded-3xl relative flex items-center justify-center p-3 sm:p-6 shadow-lg overflow-hidden group">
          <div className="relative z-10 w-full h-full flex items-center justify-center rounded-xl sm:rounded-2xl bg-[var(--bg-tertiary)]/70 border border-[var(--border-secondary)] shadow-inner p-2 sm:p-4 overflow-hidden">
            {currentDisplayImage ? (
              <img 
                src={currentDisplayImage} 
                alt={`Trang ${currentPage + 1}`}
                className="max-w-full max-h-full object-contain pointer-events-none rounded-lg shadow-2xl transition-all duration-200"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-[var(--bg-card)] flex items-center justify-center shadow-md border border-[var(--border-secondary)]">
                  <FileText className="w-8 h-8 text-[var(--text-tertiary)]" />
                </div>
                <p className="text-sm text-[var(--text-tertiary)] font-medium">Không thể hiển thị ảnh</p>
              </div>
            )}
          </div>
          
          {/* Navigation Controls Overlay */}
          {doc.pageCount > 1 && (
            <>
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-black/40 hover:bg-primary-500 text-white backdrop-blur-md border border-white/10 shadow-lg disabled:opacity-0 transition-all z-20 hover:-translate-x-0.5"
                title="Trang trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setCurrentPage(Math.min(doc.pageCount - 1, currentPage + 1))}
                disabled={currentPage === doc.pageCount - 1}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-black/40 hover:bg-primary-500 text-white backdrop-blur-md border border-white/10 shadow-lg disabled:opacity-0 transition-all z-20 hover:translate-x-0.5"
                title="Trang sau"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-md border border-white/10 shadow-lg z-20 flex items-center gap-1.5">
                <span>{currentPage + 1}</span>
                <span className="text-white/40">/</span>
                <span className="text-white/70">{doc.pageCount}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog 
        open={deleteDialog}
        title="Xóa tài liệu?"
        description="Tài liệu này sẽ bị xóa vĩnh viễn và không thể khôi phục."
        confirmText="Xóa"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog(false)}
      />
    </div>
  )
}
