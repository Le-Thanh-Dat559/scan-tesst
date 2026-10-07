/* ===== Core Types ===== */

export interface ScanPage {
  id: string
  pageNumber: number
  originalImage: string     // data URL or object URL
  processedImage?: string   // data URL or object URL after processing
  ocrText?: string
  ocrConfidence?: number
  width: number
  height: number
  rotation: number
  filters: ImageFilters
}

export interface ImageFilters {
  brightness: number    // 0-200, default 100
  contrast: number      // 0-200, default 100
  sharpness: number     // 0-200, default 100
  grayscale: boolean
  blackAndWhite: boolean
  threshold: number     // 0-255, default 128
  denoise: boolean
  autoEnhance: boolean
}

export const defaultFilters: ImageFilters = {
  brightness: 100,
  contrast: 100,
  sharpness: 100,
  grayscale: false,
  blackAndWhite: false,
  threshold: 128,
  denoise: false,
  autoEnhance: false,
}

export type ScanPreset = 'original' | 'document' | 'blackwhite' | 'grayscale' | 'idcard' | 'photo'

export interface ScanPresetConfig {
  id: ScanPreset
  name: string
  description: string
  icon: string
  filters: Partial<ImageFilters>
}

export const scanPresets: ScanPresetConfig[] = [
  {
    id: 'original',
    name: 'Original',
    description: 'Giữ nguyên ảnh gốc',
    icon: '📷',
    filters: {},
  },
  {
    id: 'document',
    name: 'Document',
    description: 'Tối ưu cho văn bản',
    icon: '📄',
    filters: { contrast: 130, sharpness: 130, brightness: 110 },
  },
  {
    id: 'blackwhite',
    name: 'Black & White',
    description: 'Chuyển thành trắng đen',
    icon: '⬛',
    filters: { blackAndWhite: true, threshold: 128, contrast: 140 },
  },
  {
    id: 'grayscale',
    name: 'Grayscale',
    description: 'Scan dạng xám',
    icon: '🔲',
    filters: { grayscale: true, contrast: 120 },
  },
  {
    id: 'idcard',
    name: 'ID Card',
    description: 'Tối ưu cho CCCD/CMND/thẻ',
    icon: '🪪',
    filters: { contrast: 150, sharpness: 140, brightness: 105 },
  },
  {
    id: 'photo',
    name: 'Photo',
    description: 'Tối ưu cho ảnh',
    icon: '🖼️',
    filters: { brightness: 105, contrast: 110, sharpness: 110 },
  },
]

export interface DocumentInfo {
  id: string
  name: string
  type: 'scan' | 'pdf' | 'image' | 'ocr'
  pages: ScanPage[]
  pageCount: number
  thumbnail?: string
  size: number
  createdAt: string
  updatedAt: string
}

export interface Point {
  x: number
  y: number
}

export interface Corners {
  topLeft: Point
  topRight: Point
  bottomRight: Point
  bottomLeft: Point
}

export interface PdfOptions {
  pageSize: 'a4' | 'a5' | 'letter'
  orientation: 'portrait' | 'landscape'
  margin: number
  quality: number       // 0.1 - 1.0
  compression: boolean
  searchable: boolean   // include OCR text layer
}

export const defaultPdfOptions: PdfOptions = {
  pageSize: 'a4',
  orientation: 'portrait',
  margin: 20,
  quality: 0.85,
  compression: true,
  searchable: false,
}

export type ExportFormat = 'pdf' | 'jpg' | 'png' | 'txt' | 'docx'

export interface ExportOptions {
  format: ExportFormat
  filename: string
  quality: number
  pdfOptions?: PdfOptions
}

export interface OcrResult {
  text: string
  confidence: number
  language: string
  progress: number
  status: 'idle' | 'loading' | 'processing' | 'done' | 'error'
  error?: string
}

export type OcrLanguage = 'vie' | 'eng' | 'chi_sim' | 'jpn' | 'kor'

export interface OcrLanguageOption {
  code: OcrLanguage
  name: string
  nativeName: string
}

export const ocrLanguages: OcrLanguageOption[] = [
  { code: 'vie', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'eng', name: 'English', nativeName: 'English' },
  { code: 'chi_sim', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'jpn', name: 'Japanese', nativeName: '日本語' },
  { code: 'kor', name: 'Korean', nativeName: '한국어' },
]

export interface DashboardStats {
  totalDocuments: number
  scannedDocuments: number
  pdfFiles: number
  ocrCount: number
}

export type ThemeMode = 'light' | 'dark' | 'system'

export interface AppSettings {
  theme: ThemeMode
  language: string
  defaultScanPreset: ScanPreset
  defaultPdfOptions: PdfOptions
  autoEnhance: boolean
  defaultOcrLanguage: OcrLanguage
}

export const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'vi',
  defaultScanPreset: 'document',
  defaultPdfOptions: defaultPdfOptions,
  autoEnhance: true,
  defaultOcrLanguage: 'vie',
}
