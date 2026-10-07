import { useEffect, useState, useRef } from 'react'
import { documentsApi, isAuthenticated, getToken } from '@/services/api'

/**
 * Hook load ảnh từ backend API (qua GridFS streaming)
 *
 * Flow:
 * 1. Fetch ảnh với Authorization header
 * 2. Convert Blob -> Object URL
 * 3. Có thể cache trong IndexedDB (optional)
 *
 * @param documentId - ID document
 * @param pageNumber - số trang (1-indexed)
 * @returns { src, loading, error }
 */
export function useDocumentImage(documentId: string | undefined, pageNumber: number | undefined) {
  const [src, setSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!documentId || pageNumber === undefined) {
      setSrc(null)
      return
    }

    // Chưa đăng nhập -> không fetch
    if (!isAuthenticated()) {
      setError('Chưa đăng nhập')
      return
    }

    const controller = new AbortController()
    abortRef.current?.abort()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    const url = documentsApi.getImageUrl(documentId, pageNumber)
    const token = getToken()

    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.message || `HTTP ${res.status}`)
        }
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError(err.message || 'Không thể tải ảnh')
        setLoading(false)
      })

    return () => {
      controller.abort()
      // Cleanup object URL
      setSrc(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [documentId, pageNumber])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (src) URL.revokeObjectURL(src)
    }
    // eslint-disable-next-line
  }, [])

  return { src, loading, error }
}

/**
 * Hook preload nhiều ảnh (cache trong memory)
 */
const imageCache = new Map<string, string>()

export function useDocumentImageCached(documentId: string | undefined, pageNumber: number | undefined) {
  const [src, setSrc] = useState<string | null>(() => {
    if (!documentId || pageNumber === undefined) return null
    return imageCache.get(`${documentId}:${pageNumber}`) || null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!documentId || pageNumber === undefined) return
    const cacheKey = `${documentId}:${pageNumber}`
    const cached = imageCache.get(cacheKey)
    if (cached) {
      setSrc(cached)
      return
    }

    if (!isAuthenticated()) return

    setLoading(true)
    const controller = new AbortController()

    const url = documentsApi.getImageUrl(documentId, pageNumber)
    const token = getToken()

    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        imageCache.set(cacheKey, objectUrl)
        setSrc(objectUrl)
        setLoading(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setLoading(false)
      })

    return () => controller.abort()
  }, [documentId, pageNumber])

  return { src, loading }
}

/**
 * Clear cache khi logout
 */
export function clearImageCache() {
  for (const url of imageCache.values()) {
    URL.revokeObjectURL(url)
  }
  imageCache.clear()
}