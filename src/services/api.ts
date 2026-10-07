/**
 * API client cho backend Express + MongoDB
 *
 * - Lưu JWT token vào localStorage
 * - Tự động thêm Authorization header
 * - Handle errors
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'

// ============== Token Storage ==============
const TOKEN_KEY = 'scanpro-token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

// ============== Fetch Wrapper ==============
interface ApiOptions extends RequestInit {
  /** Skip auth header (for public endpoints) */
  noAuth?: boolean
}

async function request<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { noAuth = false, headers = {}, ...rest } = options

  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  }

  // Auto Content-Type nếu có body và không phải FormData
  if (rest.body && !(rest.body instanceof FormData) && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  // Auth header
  if (!noAuth) {
    const token = getToken()
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`

  let response: Response
  try {
    response = await fetch(url, { ...rest, headers: finalHeaders })
  } catch (err: any) {
    throw new ApiError('Không thể kết nối server. Vui lòng kiểm tra backend đang chạy.', 0)
  }

  // 401 → auto logout
  if (response.status === 401) {
    setToken(null)
    // Có thể dispatch event để AuthContext xử lý
    window.dispatchEvent(new CustomEvent('auth:logout'))
  }

  // Parse response
  const contentType = response.headers.get('Content-Type') || ''
  let data: any
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => ({}))
  } else {
    data = await response.text().catch(() => '')
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message || `HTTP ${response.status}`,
      response.status,
      data
    )
  }

  return data as T
}

export class ApiError extends Error {
  status: number
  data?: any
  constructor(message: string, status: number, data?: any) {
    super(message)
    this.status = status
    this.data = data
    this.name = 'ApiError'
  }
}

// ============== Auth API ==============
export const authApi = {
  async register(payload: { name: string; email: string; phone?: string; password: string }) {
    const data = await request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      noAuth: true,
    })
    setToken(data.token)
    return data
  },

  async login(payload: { email: string; password: string }) {
    const data = await request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      noAuth: true,
    })
    setToken(data.token)
    return data
  },

  logout() {
    setToken(null)
  },
}

// ============== Documents API ==============
export interface PagePayload {
  pageNumber: number
  width: number
  height: number
  originalImage: string   // base64 data URL
  filters?: any
  rotation?: number
  ocrText?: string
  ocrLanguage?: string
}

export interface DocumentPayload {
  name: string
  type?: 'scan' | 'ocr' | 'pdf'
  description?: string
  tags?: string[]
  pages: PagePayload[]
}

export interface DocumentDto {
  id: string
  name: string
  type: 'scan' | 'ocr' | 'pdf'
  pageCount: number
  size: number
  tags: string[]
  description: string
  createdAt: string
  updatedAt: string
  hasPdf: boolean
  pages: Array<{
    pageNumber: number
    width: number
    height: number
    imageUrl: string       // relative URL, cần prefix API_BASE
    filters: any
    rotation: number
    ocrText?: string
    ocrLanguage?: string
  }>
}

export const documentsApi = {
  /** Tạo document mới + upload tất cả pages */
  async create(payload: DocumentPayload) {
    return request<{ message: string; document: DocumentDto }>('/documents', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /** Lấy danh sách documents (metadata only) */
  async list(params?: { search?: string; type?: string; limit?: number; skip?: number }) {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.type) query.set('type', params.type)
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.skip !== undefined) query.set('skip', String(params.skip))
    const q = query.toString()
    return request<{ documents: DocumentDto[]; total: number }>(
      `/documents${q ? '?' + q : ''}`
    )
  },

  /** Lấy chi tiết document (bao gồm pages) */
  async get(id: string) {
    return request<{ document: DocumentDto }>(`/documents/${id}`)
  },

  /** Cập nhật metadata + filters */
  async update(id: string, updates: {
    name?: string
    description?: string
    tags?: string[]
    pageUpdates?: Array<{
      pageNumber: number
      filters?: any
      rotation?: number
      ocrText?: string
      ocrLanguage?: string
    }>
  }) {
    return request<{ message: string; document: DocumentDto }>(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  /** Thay thế ảnh 1 trang */
  async updatePageImage(id: string, pageNumber: number, image: string, width: number, height: number) {
    return request(`/documents/${id}/pages/${pageNumber}/image`, {
      method: 'PUT',
      body: JSON.stringify({ image, width, height }),
    })
  },

  /** Xóa document */
  async remove(id: string) {
    return request<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    })
  },

  /** Lấy URL đầy đủ cho image (cần auth token) */
  getImageUrl(documentId: string, pageNumber: number): string {
    return `${API_BASE}/documents/${documentId}/pages/${pageNumber}/image`
  },

  /** Fetch ảnh với auth header, trả về blob URL để hiển thị */
  async fetchImageBlob(documentId: string, pageNumber: number): Promise<string> {
    const token = getToken()
    const response = await fetch(`${API_BASE}/documents/${documentId}/pages/${pageNumber}/image`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) throw new Error('Không thể tải ảnh')
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  },

  /** Thống kê */
  async stats() {
    return request<{ stats: {
      totalDocuments: number
      scannedDocuments: number
      pdfFiles: number
      ocrCount: number
      totalSize: number
      totalPages: number
    } }>('/documents/stats/summary')
  },
}

// ============== Auth check ==============
export function isAuthenticated(): boolean {
  return !!getToken()
}