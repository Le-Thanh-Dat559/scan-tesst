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

  // Display dimensions (calculated from currentCanvas & container)
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0, scale: 1 })
  const [sourceSize, setSourceSize] = useState({ width: 0, height: 0 }) // size of original (rotated) source

  // Refs
  const displayCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Crop & Perspective states
  const [isCropping, setIsCropping] = useState(false)
  const [corners, setCorners] = useState<Corners | null>(null)
  const [activeCorner, setActiveCorner] = useState<keyof Corners | null>(null)

  // 1. Load original image once
  useEffect(() => {
    async function loadOriginal() {
      try {
        setIsProcessing(true)
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const canvas = imageToCanvas(img)
          setOriginalCanvas(canvas)
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
  }, [page.originalImage, toast])

  // 2. Apply filters / rotation -> produce currentCanvas + remember source size
  useEffect(() => {
    if (!originalCanvas) return

    const applyChanges = async () => {
      setIsProcessing(true)
      // small async delay to let UI update
      await new Promise(r => setTimeout(r, 10))
      try {
        let result = originalCanvas
        if (rotation) {
          result = rotateCanvas(result, rotation)
        }
        // Save the un-filtered, rotated source for crop/perspective
        setSourceSize({ width: result.width, height: result.height })
        // Apply visible filters
        const filtered = applyFilters(result, filters)
        setCurrentCanvas(filtered)
      } catch (err) {
        console.error('Lỗi khi áp dụng bộ lọc:', err)
      } finally {
        setIsProcessing(false)
      }
    }

    const timer = setTimeout(applyChanges, 200) // debounce
    return () => clearTimeout(timer)
  }, [filters, rotation, originalCanvas])

  // 3. Calculate display size based on currentCanvas & container
  useEffect(() => {
    if (!currentCanvas || !containerRef.current) return

    function recalc() {
      if (!containerRef.current || !currentCanvas) return
      const container = containerRef.current
      const padding = 40
      const maxWidth = container.clientWidth - padding * 2
      const maxHeight = container.clientHeight - padding * 2

      const ratio = Math.min(
        maxWidth / currentCanvas.width,
        maxHeight / currentCanvas.height,
        1
      )
      const w = Math.max(1, Math.floor(currentCanvas.width * ratio))
      const h = Math.max(1, Math.floor(currentCanvas.height * ratio))
      setDisplaySize({ width: w, height: h, scale: ratio })
    }

    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [currentCanvas])

  // 4. Draw to display canvas when currentCanvas or displaySize changes
  useEffect(() => {
    if (!currentCanvas || !displayCanvasRef.current) return
    if (displaySize.width === 0 || displaySize.height === 0) return

    const displayCanvas = displayCanvasRef.current
    const ctx = displayCanvas.getContext('2d')
    if (!ctx) return

    displayCanvas.width = displaySize.width
    displayCanvas.height = displaySize.height
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.clearRect(0, 0, displaySize.width, displaySize.height)
    ctx.drawImage(currentCanvas, 0, 0, displaySize.width, displaySize.height)
  }, [currentCanvas, displaySize])

  // Convert source coords -> display coords
  // Corners are stored in source coordinates (rotated, not filtered)
  const sourceToDisplay = useCallback((px: number, py: number) => {
    return {
      x: px * displaySize.scale,
      y: py * displaySize.scale,
    }
  }, [displaySize.scale])

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

        setOriginalCanvas(corrected)
        setRotation(0)
        setIsCropping(false)
        setCorners(null)

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

  // Drag handlers
  const overlayRef = useRef<SVGSVGElement>(null)
  const dragOriginRef = useRef<{ startX: number; startY: number; startCorner: { x: number; y: number } } | null>(null)

  const handleCornerPointerDown = (e: React.PointerEvent<SVGCircleElement>, corner: keyof Corners) => {
    e.preventDefault()
    e.stopPropagation()
    if (!corners) return
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    setActiveCorner(corner)
    const c = corners[corner]
    dragOriginRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startCorner: { x: c.x, y: c.y }
    }
  }

  const handleCornerPointerMove = useCallback((e: PointerEvent) => {
    if (!activeCorner || !dragOriginRef.current || !corners) return
    const dx = e.clientX - dragOriginRef.current.startX
    const dy = e.clientY - dragOriginRef.current.startY
    const newPos = {
      x: dragOriginRef.current.startCorner.x + dx / displaySize.scale,
      y: dragOriginRef.current.startCorner.y + dy / displaySize.scale,
    }
    // Clamp to source bounds
    newPos.x = Math.max(0, Math.min(sourceSize.width, newPos.x))
    newPos.y = Math.max(0, Math.min(sourceSize.height, newPos.y))
    setCorners({ ...corners, [activeCorner]: newPos })
  }, [activeCorner, corners, displaySize.scale, sourceSize.width, sourceSize.height])

  const handleCornerPointerUp = useCallback(() => {
    setActiveCorner(null)
    dragOriginRef.current = null
  }, [])

  useEffect(() => {
    if (activeCorner) {
      window.addEventListener('pointermove', handleCornerPointerMove)
      window.addEventListener('pointerup', handleCornerPointerUp)
    }
    return () => {
      window.removeEventListener('pointermove', handleCornerPointerMove)
      window.removeEventListener('pointerup', handleCornerPointerUp)
    }
  }, [activeCorner, handleCornerPointerMove, handleCornerPointerUp])

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--bg-primary)] flex flex-col md:flex-row">
      {/* Main Preview Area */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center bg-[var(--bg-tertiary)] overflow-hidden p-4"
      >
        {isProcessing && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-white font-medium text-sm drop-shadow-md">Đang xử lý...</p>
          </div>
        )}

        {displaySize.width > 0 && displaySize.height > 0 ? (
          // Wrapper has EXACT display size - canvas and SVG overlay share this
          <div
            className="relative shadow-2xl"
            style={{
              width: displaySize.width,
              height: displaySize.height,
            }}
          >
            <canvas
              ref={displayCanvasRef}
              className={cn(
                "block rounded-sm transition-opacity duration-300",
                isCropping ? "opacity-60" : "opacity-100"
              )}
              style={{
                width: displaySize.width,
                height: displaySize.height,
              }}
            />

            {/* Crop Overlay - same exact size as canvas */}
            {isCropping && corners && (
              <svg
                ref={overlayRef}
                className="absolute inset-0 pointer-events-none"
                width={displaySize.width}
                height={displaySize.height}
                viewBox={`0 0 ${displaySize.width} ${displaySize.height}`}
                style={{ overflow: 'visible' }}
              >
                <polygon
                  points={(() => {
                    const tl = sourceToDisplay(corners.topLeft.x, corners.topLeft.y)
                    const tr = sourceToDisplay(corners.topRight.x, corners.topRight.y)
                    const br = sourceToDisplay(corners.bottomRight.x, corners.bottomRight.y)
                    const bl = sourceToDisplay(corners.bottomLeft.x, corners.bottomLeft.y)
                    return `${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`
                  })()}
                  fill="rgba(99, 102, 241, 0.18)"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />

                {/* Dim outside */}
                <polygon
                  points={(() => {
                    const tl = sourceToDisplay(corners.topLeft.x, corners.topLeft.y)
                    const tr = sourceToDisplay(corners.topRight.x, corners.topRight.y)
                    const br = sourceToDisplay(corners.bottomRight.x, corners.bottomRight.y)
                    const bl = sourceToDisplay(corners.bottomLeft.x, corners.bottomLeft.y)
                    return `${tl.x},${tl.y} ${tr.x},${tr.y} ${br.x},${br.y} ${bl.x},${bl.y}`
                  })()}
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1"
                />

                {(Object.keys(corners) as Array<keyof Corners>).map((key) => {
                  const corner = corners[key]
                  const pos = sourceToDisplay(corner.x, corner.y)
                  return (
                    <g key={key}>
                      {/* Outer ring */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="14"
                        fill="rgba(99, 102, 241, 0.2)"
                        stroke="#6366f1"
                        strokeWidth="2"
                        className="pointer-events-auto cursor-move"
                        onPointerDown={(e) => handleCornerPointerDown(e, key)}
                      />
                      {/* Inner dot */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="6"
                        fill="#ffffff"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                        className="pointer-events-none"
                      />
                    </g>
                  )
                })}
              </svg>
            )}
          </div>
        ) : (
          !isProcessing && (
            <div className="text-center text-[var(--text-tertiary)]">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Đang tải ảnh...</p>
            </div>
          )
        )}
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
