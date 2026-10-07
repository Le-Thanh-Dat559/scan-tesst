import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11)
}

export function generateFileName(prefix: string, ext: string): string {
  const now = new Date()
  const date = now.toISOString().split('T')[0]
  return `${prefix}_${date}.${ext}`
}

export function isValidImageType(type: string): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return validTypes.includes(type)
}

export function isValidPdfType(type: string): boolean {
  return type === 'application/pdf'
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function validateFile(file: File, allowPdf = false): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File "${file.name}" quá lớn. Kích thước tối đa là 50MB.` }
  }
  if (allowPdf) {
    if (!isValidImageType(file.type) && !isValidPdfType(file.type)) {
      return { valid: false, error: `File "${file.name}" không hợp lệ. Chỉ hỗ trợ JPG, PNG, WEBP, PDF.` }
    }
  } else {
    if (!isValidImageType(file.type)) {
      return { valid: false, error: `File "${file.name}" không hợp lệ. Chỉ hỗ trợ JPG, PNG, WEBP.` }
    }
  }
  return { valid: true }
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function imageToCanvas(
  img: HTMLImageElement | HTMLCanvasElement,
  width?: number,
  height?: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const w = width || (img instanceof HTMLImageElement ? img.naturalWidth : img.width)
  const h = height || (img instanceof HTMLImageElement ? img.naturalHeight : img.height)
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  return canvas
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Cannot convert canvas to blob'))
      },
      type,
      quality,
    )
  })
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
