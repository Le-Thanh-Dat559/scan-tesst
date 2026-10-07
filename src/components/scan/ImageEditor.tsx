import { useState, useRef, useEffect, useCallback } from 'react'
import { cn, imageToCanvas } from '@/utils/helpers'
import { canvasToDataURL } from '@/utils/imageProcessing'
import { 
  applyFilters, 
  rotateCanvas, 
  detectDocumentEdges, 
  perspectiveCorrection 
} from '@/utils/imageProcessing'
import type { ScanPage, ImageFilters, Corners } from '@/types'
import { defaultFilters } from '@/types'
import { 
  Crop, RotateCcw, RotateCw, Wand2, Sun, Contrast, 
  Droplet, Image as ImageIcon, Check, X,
  Sparkles
} from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface ImageEditorProps {
  page: ScanPage
  onSave: (id: string, updates: Partial<ScanPage>) => void
  onCancel: () => void
}

export default function ImageEditor({ page, onSave, onCancel }: ImageEditorProps) {
  const { toast } = useToast()
  
  // States
  const [originalCanvas, setOriginalCanvas] = useState<HTMLCanvasElement | null>(null)
  const [currentCanvas, setCurrentCanvas] = useState<HTMLCanvasElement | null>(null)
  const [filters, setFilters] = useState<ImageFilters>(page.filters)
  const [rotation, setRotation] = useState<number>(page.rotation || 0)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Canvas refs for display
  const displayCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Crop & Perspective states
  const [isCropping, setIsCropping] = useState(false)
  const [corners, setCorners] = useState<Corners | null>(null)
  const [activeCorner, setActiveCorner] = useState<keyof Corners | null>(null)

  // Initialize
  useEffect(() => {
    async function loadOriginal() {
      try {
        setIsProcessing(true)
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const canvas = imageToCanvas(img)
          setOriginalCanvas(canvas)
          
          // Apply initial filters/rotation
          let result = canvas
          if (page.rotation) {
            result = rotateCanvas(result, page.rotation)
          }
          result = applyFilters(result, page.filters)
          setCurrentCanvas(result)
          setIsProcessing(false)
        }
        img.onerror = () => {
          toast({ type: 'error', title: 'Lỗi', description: 'Không thể tải ảnh gốc' })
          setIsProcessing(false)
        }
        img.src = page.originalImage
      } catch (err) {
        console.error(err)
        setIsProcessing(false)
      }
    }
    loadOriginal()
  }, [page.originalImage, page.filters, page.rotation, toast])

  // Update display when currentCanvas changes
  useEffect(() => {
    if (!currentCanvas || !displayCanvasRef.current || !containerRef.current) return
    
    const displayCanvas = displayCanvasRef.current
    const ctx = displayCanvas.getContext('2d')
    if (!ctx) return
    
    // Calculate display dimensions to fit container
    const container = containerRef.current
    const padding = 40 // px
    const maxWidth = container.clientWidth - padding * 2
    const maxHeight = container.clientHeight - padding * 2
    
    const ratio = Math.min(maxWidth / currentCanvas.width, maxHeight / currentCanvas.height)
    const displayWidth = currentCanvas.width * ratio
    const displayHeight = currentCanvas.height * ratio
    
    displayCanvas.width = displayWidth
    displayCanvas.height = displayHeight
    
    ctx.drawImage(currentCanvas, 0, 0, displayWidth, displayHeight)
    
  }, [currentCanvas, isCropping]) // Re-render when switching crop mode too

  // Handle filter changes
  useEffect(() => {
    if (!originalCanvas || isCropping) return
    
    const applyChanges = async () => {
      setIsProcessing(true)
      // Small timeout to allow UI to update loading state
      await new Promise(r => setTimeout(r, 10))
      
      try {
        let result = originalCanvas
        if (rotation) {
          result = rotateCanvas(result, rotation)
        }
        result = applyFilters(result, filters)
        setCurrentCanvas(result)
      } catch (err) {
        console.error('Lỗi khi áp dụng bộ lọc:', err)
      } finally {
        setIsProcessing(false)
      }
    }
    
    const timer = setTimeout(applyChanges, 300) // Debounce
    return () => clearTimeout(timer)
  }, [filters, rotation, originalCanvas, isCropping])

  // Actions
  const handleRotate = (deg: number) => {
    setRotation(prev => (prev + deg) % 360)
  }
  
  const handleAutoEnhance = () => {
    setFilters(prev => ({
      ...prev,
      autoEnhance: !prev.autoEnhance,
      contrast: prev.autoEnhance ? 100 : 130,
      sharpness: prev.autoEnhance ? 100 : 130,
      brightness: prev.autoEnhance ? 100 : 110,
    }))
  }

  const handleDetectEdges = () => {
    if (!originalCanvas) return
    setIsProcessing(true)
    
    setTimeout(() => {
      let processCanvas = originalCanvas
      if (rotation) {
        processCanvas = rotateCanvas(processCanvas, rotation)
      }
      
      const detectedCorners = detectDocumentEdges(processCanvas)
      if (detectedCorners) {
        setCorners(detectedCorners)
        setIsCropping(true)
        toast({ type: 'success', title: 'Thành công', description: 'Đã phát hiện biên tài liệu' })
      } else {
        // Fallback to full image
        const w = processCanvas.width
        const h = processCanvas.height
        const m = Math.min(w, h) * 0.1
        setCorners({
          topLeft: { x: m, y: m },
          topRight: { x: w - m, y: m },
          bottomRight: { x: w - m, y: h - m },
          bottomLeft: { x: m, y: h - m }
        })
        setIsCropping(true)
        toast({ type: 'info', title: 'Không tìm thấy biên', description: 'Vui lòng điều chỉnh thủ công' })
      }
      setIsProcessing(false)
    }, 100)
  }

  const handleApplyCrop = () => {
    if (!originalCanvas || !corners) return
    
    setIsProcessing(true)
    setTimeout(() => {
      try {
        let processCanvas = originalCanvas
        if (rotation) {
          processCanvas = rotateCanvas(processCanvas, rotation)
        }
        
        const corrected = perspectiveCorrection(processCanvas, corners)
        
        // Cập nhật original canvas để các filter áp dụng lên ảnh đã crop
        setOriginalCanvas(corrected)
        setRotation(0) // Reset rotation vì đã apply vào original
        setIsCropping(false)
        setCorners(null)
        
        // Re-apply filters directly
        const final = applyFilters(corrected, filters)
        setCurrentCanvas(final)
        
      } catch (err) {
        console.error('Lỗi khi cắt ảnh:', err)
        toast({ type: 'error', title: 'Lỗi', description: 'Không thể cắt ảnh' })
      } finally {
        setIsProcessing(false)
      }
    }, 100)
  }

  const handleSave = () => {
    if (!currentCanvas) return
    
    setIsProcessing(true)
    setTimeout(() => {
      const dataUrl = canvasToDataURL(currentCanvas, 'image/webp', 0.9)
      onSave(page.id, {
        processedImage: dataUrl,
        filters,
        rotation,
        width: currentCanvas.width,
        height: currentCanvas.height
      })
      setIsProcessing(false)
    }, 100)
  }

  // Crop interaction helpers
  const getDisplayScale = () => {
    if (!currentCanvas || !displayCanvasRef.current) return 1
    // Lấy original không có filter để crop, nhưng phải rotate nếu có
    let sourceW = originalCanvas?.width || 0
    
    if (rotation === 90 || rotation === 270 || rotation === -90 || rotation === -270) {
      sourceW = originalCanvas?.height || 0
    }
    
    return displayCanvasRef.current.width / sourceW
  }

  const handleCornerDragStart = (e: React.MouseEvent | React.TouchEvent, corner: keyof Corners) => {
    e.preventDefault()
    setActiveCorner(corner)
  }

  const handleCornerDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!activeCorner || !corners || !containerRef.current || !displayCanvasRef.current) return
    
    const containerRect = displayCanvasRef.current.getBoundingClientRect()
    let clientX, clientY
    
    if (e instanceof MouseEvent) {
      clientX = e.clientX
      clientY = e.clientY
    } else {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    }
    
    // Calculate position relative to canvas
    const x = clientX - containerRect.left
    const y = clientY - containerRect.top
    
    const scale = getDisplayScale()
    
    // Update corner position in original image coordinates
    setCorners({
      ...corners,
      [activeCorner]: {
        x: Math.max(0, Math.min((originalCanvas?.width || 0), x / scale)),
        y: Math.max(0, Math.min((originalCanvas?.height || 0), y / scale))
      }
    })
  }, [activeCorner, corners, originalCanvas])

  const handleCornerDragEnd = useCallback(() => {
    setActiveCorner(null)
  }, [])

  useEffect(() => {
    if (activeCorner) {
      window.addEventListener('mousemove', handleCornerDrag)
      window.addEventListener('mouseup', handleCornerDragEnd)
      window.addEventListener('touchmove', handleCornerDrag)
      window.addEventListener('touchend', handleCornerDragEnd)
    }
    return () => {
      window.removeEventListener('mousemove', handleCornerDrag)
      window.removeEventListener('mouseup', handleCornerDragEnd)
      window.removeEventListener('touchmove', handleCornerDrag)
      window.removeEventListener('touchend', handleCornerDragEnd)
    }
  }, [activeCorner, handleCornerDrag, handleCornerDragEnd])

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--bg-primary)] flex flex-col md:flex-row">
      {/* Main Preview Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center bg-[var(--bg-tertiary)] overflow-hidden"
      >
        {isProcessing && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-white font-medium text-sm drop-shadow-md">Đang xử lý...</p>
          </div>
        )}
        
        <div className="relative">
          <canvas 
            ref={displayCanvasRef}
            className={cn(
              "shadow-2xl rounded-sm transition-opacity duration-300",
              isCropping ? "opacity-50" : "opacity-100"
            )}
            style={{
              maxHeight: 'calc(100vh - 180px)',
              maxWidth: '100%'
            }}
          />
          
          {/* Crop Overlay */}
          {isCropping && corners && displayCanvasRef.current && (
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              <polygon
                points={`
                  ${corners.topLeft.x * getDisplayScale()},${corners.topLeft.y * getDisplayScale()} 
                  ${corners.topRight.x * getDisplayScale()},${corners.topRight.y * getDisplayScale()} 
                  ${corners.bottomRight.x * getDisplayScale()},${corners.bottomRight.y * getDisplayScale()} 
                  ${corners.bottomLeft.x * getDisplayScale()},${corners.bottomLeft.y * getDisplayScale()}
                `}
                fill="rgba(99, 102, 241, 0.2)"
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              
              {/* Handles */}
              {(Object.keys(corners) as Array<keyof Corners>).map((key) => {
                const corner = corners[key]
                const x = corner.x * getDisplayScale()
                const y = corner.y * getDisplayScale()
                
                return (
                  <circle
                    key={key}
                    cx={x}
                    cy={y}
                    r="12"
                    fill="#ffffff"
                    stroke="#6366f1"
                    strokeWidth="3"
                    className="cursor-move pointer-events-auto hover:r-14 transition-all"
                    onMouseDown={(e) => handleCornerDragStart(e, key)}
                    onTouchStart={(e) => handleCornerDragStart(e, key)}
                  />
                )
              })}
            </svg>
          )}
        </div>
      </div>

      {/* Toolbar / Sidebar */}
      <div className="w-full md:w-[320px] bg-[var(--bg-card)] border-l border-[var(--border-secondary)] flex flex-col h-[40vh] md:h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-secondary)]">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {isCropping ? 'Cắt & Căn lề' : 'Chỉnh sửa ảnh'}
          </h2>
          <button 
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isCropping ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Kéo các điểm góc để khớp với mép tài liệu.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsCropping(false)
                    setCorners(null)
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-secondary)] text-sm font-medium hover:bg-[var(--bg-tertiary)]"
                >
                  Hủy
                </button>
                <button
                  onClick={handleApplyCrop}
                  className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Presets */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">Cài đặt sẵn</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setFilters({ ...defaultFilters, autoEnhance: false })}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl text-sm font-medium border transition-colors",
                      !filters.grayscale && !filters.blackAndWhite && !filters.autoEnhance
                        ? "border-primary-500 bg-primary-500/10 text-primary-500" 
                        : "border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)]"
                    )}
                  >
                    <ImageIcon className="w-4 h-4" /> Gốc
                  </button>
                  <button 
                    onClick={handleAutoEnhance}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl text-sm font-medium border transition-colors",
                      filters.autoEnhance
                        ? "border-primary-500 bg-primary-500/10 text-primary-500" 
                        : "border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)]"
                    )}
                  >
                    <Sparkles className="w-4 h-4" /> Tự động
                  </button>
                  <button 
                    onClick={() => setFilters({ ...filters, grayscale: true, blackAndWhite: false })}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl text-sm font-medium border transition-colors",
                      filters.grayscale && !filters.blackAndWhite
                        ? "border-primary-500 bg-primary-500/10 text-primary-500" 
                        : "border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)]"
                    )}
                  >
                    <Droplet className="w-4 h-4" /> Ảnh Xám
                  </button>
                  <button 
                    onClick={() => setFilters({ ...filters, blackAndWhite: true, threshold: 128 })}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl text-sm font-medium border transition-colors",
                      filters.blackAndWhite
                        ? "border-primary-500 bg-primary-500/10 text-primary-500" 
                        : "border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)]"
                    )}
                  >
                    <Contrast className="w-4 h-4" /> Trắng Đen
                  </button>
                </div>
              </div>

              <hr className="border-[var(--border-secondary)]" />

              {/* Tools */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">Công cụ</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={handleDetectEdges}
                    className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <Crop className="w-5 h-5 text-[var(--text-primary)]" />
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Cắt ảnh</span>
                  </button>
                  <button 
                    onClick={() => handleRotate(-90)}
                    className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <RotateCcw className="w-5 h-5 text-[var(--text-primary)]" />
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Xoay Trái</span>
                  </button>
                  <button 
                    onClick={() => handleRotate(90)}
                    className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <RotateCw className="w-5 h-5 text-[var(--text-primary)]" />
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Xoay Phải</span>
                  </button>
                </div>
              </div>

              <hr className="border-[var(--border-secondary)]" />

              {/* Sliders */}
              <div className="space-y-5">
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">Điều chỉnh</h3>
                
                {/* Brightness */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5" /> Sáng
                    </label>
                    <span className="text-xs text-[var(--text-tertiary)]">{filters.brightness}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" 
                    value={filters.brightness}
                    onChange={(e) => setFilters({...filters, brightness: parseInt(e.target.value)})}
                    className="w-full accent-primary-500 h-1.5 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                      <Contrast className="w-3.5 h-3.5" /> Tương phản
                    </label>
                    <span className="text-xs text-[var(--text-tertiary)]">{filters.contrast}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="200" 
                    value={filters.contrast}
                    onChange={(e) => setFilters({...filters, contrast: parseInt(e.target.value)})}
                    className="w-full accent-primary-500 h-1.5 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Sharpness */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" /> Sắc nét
                    </label>
                    <span className="text-xs text-[var(--text-tertiary)]">{filters.sharpness}%</span>
                  </div>
                  <input 
                    type="range" min="100" max="300" 
                    value={filters.sharpness}
                    onChange={(e) => setFilters({...filters, sharpness: parseInt(e.target.value)})}
                    className="w-full accent-primary-500 h-1.5 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                {/* BW Threshold (only if B&W is active) */}
                {filters.blackAndWhite && (
                  <div className="space-y-2 pt-2 border-t border-[var(--border-secondary)]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[var(--text-primary)]">Ngưỡng (Threshold)</label>
                      <span className="text-xs text-[var(--text-tertiary)]">{filters.threshold}</span>
                    </div>
                    <input 
                      type="range" min="0" max="255" 
                      value={filters.threshold}
                      onChange={(e) => setFilters({...filters, threshold: parseInt(e.target.value)})}
                      className="w-full accent-primary-500 h-1.5 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[var(--border-secondary)] bg-[var(--bg-card)]">
          <button
            onClick={handleSave}
            disabled={isProcessing || isCropping}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl gradient-primary text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Check className="w-5 h-5" />
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  )
}
