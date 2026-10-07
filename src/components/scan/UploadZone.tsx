import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'
import { cn, validateFile } from '@/utils/helpers'
import { Upload, Image as ImageIcon, FileText, X, Plus } from 'lucide-react'

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  multiple?: boolean
  allowPdf?: boolean
  compact?: boolean
  className?: string
}

export default function UploadZone({
  onFilesSelected,
  accept = 'image/jpeg,image/png,image/webp',
  multiple = true,
  allowPdf = false,
  compact = false,
  className,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const newErrors: string[] = []

    fileArray.forEach(file => {
      const result = validateFile(file, allowPdf)
      if (result.valid) {
        validFiles.push(file)
      } else if (result.error) {
        newErrors.push(result.error)
      }
    })

    setErrors(newErrors)
    if (validFiles.length > 0) {
      onFilesSelected(validFiles)
    }
  }, [allowPdf, onFilesSelected])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files.length) {
      processFiles(e.dataTransfer.files)
    }
  }, [processFiles])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files)
      e.target.value = ''
    }
  }, [processFiles])

  const fullAccept = allowPdf ? `${accept},application/pdf` : accept

  if (compact) {
    return (
      <button
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl',
          'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]',
          'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          'border border-[var(--border-secondary)] hover:border-[var(--border-primary)]',
          'transition-all duration-200 text-sm font-medium',
          className,
        )}
      >
        <Plus className="w-4 h-4" />
        <span>Thêm file</span>
        <input
          ref={inputRef}
          type="file"
          accept={fullAccept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
      </button>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'upload-zone relative cursor-pointer group',
          isDragging && 'dragover',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={fullAccept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          {/* Icon */}
          <div className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center',
            'bg-primary-500/10 group-hover:bg-primary-500/15',
            'transition-colors duration-200',
          )}>
            <Upload className="w-8 h-8 text-primary-500" />
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="text-base font-semibold text-[var(--text-primary)] mb-1">
              {isDragging ? 'Thả file tại đây' : 'Kéo thả file vào đây'}
            </p>
            <p className="text-sm text-[var(--text-tertiary)]">
              hoặc <span className="text-primary-500 font-medium">chọn file</span> từ máy tính
            </p>
          </div>

          {/* Supported formats */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-tertiary)] text-xs text-[var(--text-tertiary)]">
              <ImageIcon className="w-3 h-3" /> JPG
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-tertiary)] text-xs text-[var(--text-tertiary)]">
              <ImageIcon className="w-3 h-3" /> PNG
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-tertiary)] text-xs text-[var(--text-tertiary)]">
              <ImageIcon className="w-3 h-3" /> WEBP
            </span>
            {allowPdf && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-tertiary)] text-xs text-[var(--text-tertiary)]">
                <FileText className="w-3 h-3" /> PDF
              </span>
            )}
          </div>

          <p className="text-xs text-[var(--text-tertiary)]">Tối đa 50MB mỗi file</p>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-error-500/10 text-error-500 text-xs"
            >
              <X className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
