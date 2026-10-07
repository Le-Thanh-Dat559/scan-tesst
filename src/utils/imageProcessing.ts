import type { ImageFilters } from '@/types'

/**
 * Apply filters to an image using Canvas API
 */
export function applyFilters(
  sourceCanvas: HTMLCanvasElement,
  filters: ImageFilters,
): HTMLCanvasElement {
  const { width, height } = sourceCanvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Build CSS filter string
  const cssFilters: string[] = []

  if (filters.brightness !== 100) {
    cssFilters.push(`brightness(${filters.brightness / 100})`)
  }
  if (filters.contrast !== 100) {
    cssFilters.push(`contrast(${filters.contrast / 100})`)
  }
  if (filters.grayscale && !filters.blackAndWhite) {
    cssFilters.push('grayscale(1)')
  }

  ctx.filter = cssFilters.length > 0 ? cssFilters.join(' ') : 'none'
  ctx.drawImage(sourceCanvas, 0, 0)
  ctx.filter = 'none'

  // Black & White (thresholding)
  if (filters.blackAndWhite) {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const threshold = filters.threshold

    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      const val = gray >= threshold ? 255 : 0
      data[i] = val
      data[i + 1] = val
      data[i + 2] = val
    }
    ctx.putImageData(imageData, 0, 0)
  }

  // Sharpening (unsharp mask)
  if (filters.sharpness > 100) {
    const amount = (filters.sharpness - 100) / 100
    sharpen(ctx, width, height, amount)
  }

  // Denoise (simple box blur)
  if (filters.denoise) {
    denoise(ctx, width, height)
  }

  return canvas
}

/**
 * Simple sharpen using convolution kernel
 */
function sharpen(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const copy = new Uint8ClampedArray(data)

  const factor = amount * 0.5
  // Sharpen kernel: [0, -f, 0, -f, 1+4f, -f, 0, -f, 0]
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c]
        const top = copy[((y - 1) * width + x) * 4 + c]
        const bottom = copy[((y + 1) * width + x) * 4 + c]
        const left = copy[(y * width + x - 1) * 4 + c]
        const right = copy[(y * width + x + 1) * 4 + c]

        data[idx + c] = Math.min(255, Math.max(0,
          center + factor * (4 * center - top - bottom - left - right)
        ))
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * Simple denoise using box blur (3x3)
 */
function denoise(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const copy = new Uint8ClampedArray(data)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            sum += copy[((y + dy) * width + (x + dx)) * 4 + c]
          }
        }
        data[idx + c] = Math.round(sum / 9)
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * Auto enhance: adjusts brightness, contrast, and sharpness automatically
 */
export function autoEnhance(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // Analyze image statistics
  let minLum = 255, maxLum = 0

  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    minLum = Math.min(minLum, lum)
    maxLum = Math.max(maxLum, lum)
  }

  const range = maxLum - minLum

  // Apply auto levels (stretch histogram)
  if (range > 10) {
    const scale = 255 / range
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - minLum) * scale))
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - minLum) * scale))
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - minLum) * scale))
    }
  }

  const result = document.createElement('canvas')
  result.width = canvas.width
  result.height = canvas.height
  const rctx = result.getContext('2d')!
  rctx.putImageData(imageData, 0, 0)

  // Apply subtle sharpening
  sharpen(rctx, result.width, result.height, 0.3)

  return result
}

/**
 * Rotate a canvas by given degrees
 */
export function rotateCanvas(canvas: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  const angle = (degrees * Math.PI) / 180
  const sin = Math.abs(Math.sin(angle))
  const cos = Math.abs(Math.cos(angle))

  const newWidth = Math.floor(canvas.width * cos + canvas.height * sin)
  const newHeight = Math.floor(canvas.width * sin + canvas.height * cos)

  const result = document.createElement('canvas')
  result.width = newWidth
  result.height = newHeight
  const ctx = result.getContext('2d')!

  ctx.translate(newWidth / 2, newHeight / 2)
  ctx.rotate(angle)
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)

  return result
}

/**
 * Crop canvas to given region
 */
export function cropCanvas(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
): HTMLCanvasElement {
  const result = document.createElement('canvas')
  result.width = width
  result.height = height
  const ctx = result.getContext('2d')!
  ctx.drawImage(canvas, x, y, width, height, 0, 0, width, height)
  return result
}

/**
 * Simple edge detection for document boundary detection
 * Returns approximate corners of the largest rectangular region
 */
export function detectDocumentEdges(canvas: HTMLCanvasElement): {
  topLeft: { x: number; y: number }
  topRight: { x: number; y: number }
  bottomRight: { x: number; y: number }
  bottomLeft: { x: number; y: number }
} | null {
  const { width, height } = canvas
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Convert to grayscale and apply edge detection (Sobel)
  const gray = new Float32Array(width * height)
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
  }

  // Sobel edge detection
  const edges = new Float32Array(width * height)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const gx =
        -gray[(y - 1) * width + x - 1] - 2 * gray[y * width + x - 1] - gray[(y + 1) * width + x - 1] +
        gray[(y - 1) * width + x + 1] + 2 * gray[y * width + x + 1] + gray[(y + 1) * width + x + 1]
      const gy =
        -gray[(y - 1) * width + x - 1] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + x + 1] +
        gray[(y + 1) * width + x - 1] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + x + 1]

      edges[idx] = Math.sqrt(gx * gx + gy * gy)
    }
  }

  // Find max edge value for threshold
  let maxEdge = 0
  for (let i = 0; i < edges.length; i++) {
    maxEdge = Math.max(maxEdge, edges[i])
  }

  const threshold = maxEdge * 0.3
  const margin = Math.min(width, height) * 0.05

  // Find bounding box of strong edges
  let minX = width, maxX = 0, minY = height, maxY = 0
  let found = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] > threshold) {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
        found = true
      }
    }
  }

  if (!found || (maxX - minX) < width * 0.2 || (maxY - minY) < height * 0.2) {
    // No significant document detected, return full image corners
    return {
      topLeft: { x: margin, y: margin },
      topRight: { x: width - margin, y: margin },
      bottomRight: { x: width - margin, y: height - margin },
      bottomLeft: { x: margin, y: height - margin },
    }
  }

  return {
    topLeft: { x: Math.max(0, minX), y: Math.max(0, minY) },
    topRight: { x: Math.min(width, maxX), y: Math.max(0, minY) },
    bottomRight: { x: Math.min(width, maxX), y: Math.min(height, maxY) },
    bottomLeft: { x: Math.max(0, minX), y: Math.min(height, maxY) },
  }
}

/**
 * Perspective correction using simple affine transformation
 * Maps the four corners to a rectangle
 */
export function perspectiveCorrection(
  canvas: HTMLCanvasElement,
  corners: {
    topLeft: { x: number; y: number }
    topRight: { x: number; y: number }
    bottomRight: { x: number; y: number }
    bottomLeft: { x: number; y: number }
  },
): HTMLCanvasElement {
  const { topLeft, topRight, bottomRight, bottomLeft } = corners

  const widthTop = Math.sqrt((topRight.x - topLeft.x) ** 2 + (topRight.y - topLeft.y) ** 2)
  const widthBottom = Math.sqrt((bottomRight.x - bottomLeft.x) ** 2 + (bottomRight.y - bottomLeft.y) ** 2)
  const heightLeft = Math.sqrt((bottomLeft.x - topLeft.x) ** 2 + (bottomLeft.y - topLeft.y) ** 2)
  const heightRight = Math.sqrt((bottomRight.x - topRight.x) ** 2 + (bottomRight.y - topRight.y) ** 2)

  const newWidth = Math.round(Math.max(widthTop, widthBottom))
  const newHeight = Math.round(Math.max(heightLeft, heightRight))

  const result = document.createElement('canvas')
  result.width = newWidth
  result.height = newHeight
  const ctx = result.getContext('2d')!

  // Use scanline-based perspective correction
  const srcCtx = canvas.getContext('2d')!

  for (let y = 0; y < newHeight; y++) {
    const t = y / newHeight
    const leftX = topLeft.x + t * (bottomLeft.x - topLeft.x)
    const leftY = topLeft.y + t * (bottomLeft.y - topLeft.y)
    const rightX = topRight.x + t * (bottomRight.x - topRight.x)
    const rightY = topRight.y + t * (bottomRight.y - topRight.y)

    for (let x = 0; x < newWidth; x++) {
      const s = x / newWidth
      const srcX = leftX + s * (rightX - leftX)
      const srcY = leftY + s * (rightY - leftY)

      // Get pixel from source
      const ix = Math.floor(srcX)
      const iy = Math.floor(srcY)
      if (ix >= 0 && ix < canvas.width && iy >= 0 && iy < canvas.height) {
        const pixel = srcCtx.getImageData(ix, iy, 1, 1).data
        ctx.fillStyle = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  return result
}

/**
 * Load image file to canvas
 */
export function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Limit max dimension for performance
        const MAX_DIM = 4096
        let w = img.naturalWidth
        let h = img.naturalHeight
        if (w > MAX_DIM || h > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / w, MAX_DIM / h)
          w = Math.round(w * ratio)
          h = Math.round(h * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas)
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Canvas to data URL
 */
export function canvasToDataURL(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.92): string {
  return canvas.toDataURL(type, quality)
}
