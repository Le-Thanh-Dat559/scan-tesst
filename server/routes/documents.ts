import express from 'express'
import mongoose from 'mongoose'
import Document from '../models/Document'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import { uploadBuffer, downloadToBuffer, deleteFile } from '../utils/gridfs'
import { generateId } from '../../src/utils/helpers'

const router = express.Router()

// Tất cả routes đều cần auth
router.use(authMiddleware)

/**
 * Helper: lấy document và đảm bảo thuộc user hiện tại
 */
async function findUserDocument(userId: string, docId: string) {
  if (!mongoose.Types.ObjectId.isValid(docId)) return null
  return Document.findOne({ _id: docId, userId })
}

/**
 * Helper: parse base64 data URL thành Buffer + contentType
 */
function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  }
}

/**
 * POST /api/documents
 * Tạo document mới + upload tất cả pages
 *
 * Body:
 * {
 *   name: string,
 *   type: 'scan' | 'ocr' | 'pdf',
 *   description?: string,
 *   tags?: string[],
 *   pages: Array<{
 *     pageNumber, width, height,
 *     originalImage: dataURL,
 *     filters, rotation,
 *     ocrText?, ocrLanguage?
 *   }>
 * }
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const { name, type = 'scan', description = '', tags = [], pages = [] } = req.body

    if (!name || !Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ message: 'Thiếu name hoặc pages.' })
    }

    // 1. Upload từng page lên GridFS
    const uploadedPages = []
    let totalSize = 0

    for (const p of pages) {
      const parsed = parseDataUrl(p.originalImage)
      if (!parsed) {
        return res.status(400).json({ message: `Page ${p.pageNumber}: ảnh không hợp lệ.` })
      }

      const filename = `page-${p.pageNumber}-${generateId()}.jpg`
      const imageId = await uploadBuffer(parsed.buffer, {
        filename,
        contentType: parsed.contentType,
        metadata: {
          userId,
          pageNumber: p.pageNumber,
          width: p.width,
          height: p.height,
        },
      })
      totalSize += parsed.buffer.length

      uploadedPages.push({
        pageNumber: p.pageNumber,
        width: p.width,
        height: p.height,
        imageId: new mongoose.Types.ObjectId(imageId),
        filters: p.filters || {},
        rotation: p.rotation || 0,
        ocrText: p.ocrText || '',
        ocrLanguage: p.ocrLanguage || 'vie',
      })
    }

    // 2. Tạo document trong MongoDB
    const doc = new Document({
      userId,
      name,
      type,
      description,
      tags,
      pageCount: uploadedPages.length,
      pages: uploadedPages,
      size: totalSize,
    })

    await doc.save()

    res.status(201).json({
      message: 'Đã lưu tài liệu.',
      document: serializeDocument(doc),
    })
  } catch (err: any) {
    console.error('POST /documents error:', err)
    res.status(500).json({ message: 'Lỗi server: ' + (err.message || 'unknown') })
  }
})

/**
 * GET /api/documents
 * Lấy danh sách documents (KHÔNG bao gồm pages, chỉ metadata)
 */
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const { search, type, limit = '50', skip: skipStr = '0' } = req.query

    const query: any = { userId }
    if (type) query.type = type
    if (search && typeof search === 'string') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ]
    }

    const skip = parseInt(skipStr as string)
    const lim = parseInt(limit as string)

    const documents = await Document.find(query)
      .select('-pages')   // exclude pages for list view (tiết kiệm bandwidth)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim)

    const total = await Document.countDocuments(query)

    res.json({
      documents: documents.map(serializeDocument),
      total,
      skip,
      limit: lim,
    })
  } catch (err: any) {
    console.error('GET /documents error:', err)
    res.status(500).json({ message: 'Lỗi server: ' + (err.message || 'unknown') })
  }
})

/**
 * GET /api/documents/:id
 * Lấy chi tiết 1 document (KHÔNG có ảnh, chỉ metadata)
 */
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const doc = await findUserDocument(req.userId!, req.params.id)
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu.' })

    res.json({ document: serializeDocument(doc) })
  } catch (err: any) {
    console.error('GET /documents/:id error:', err)
    res.status(500).json({ message: 'Lỗi server.' })
  }
})

/**
 * GET /api/documents/:id/pages/:pageNumber/image
 * Stream ảnh từ GridFS
 */
router.get('/:id/pages/:pageNumber/image', async (req: AuthRequest, res) => {
  try {
    const doc = await findUserDocument(req.userId!, req.params.id)
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu.' })

    const pageNum = parseInt(req.params.pageNumber)
    const page = doc.pages.find(p => p.pageNumber === pageNum)
    if (!page) return res.status(404).json({ message: 'Không tìm thấy trang.' })

    const { buffer, contentType } = await downloadToBuffer(page.imageId.toString())
    res.set('Content-Type', contentType)
    res.set('Cache-Control', 'private, max-age=86400')
    res.send(buffer)
  } catch (err: any) {
    console.error('GET image error:', err)
    res.status(err.message === 'File không tồn tại' ? 404 : 500).json({ message: err.message })
  }
})

/**
 * PUT /api/documents/:id
 * Cập nhật metadata + filters/rotation (không thay ảnh)
 */
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const doc = await findUserDocument(req.userId!, req.params.id)
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu.' })

    const { name, description, tags, pageUpdates } = req.body

    if (name !== undefined) doc.name = name
    if (description !== undefined) doc.description = description
    if (tags !== undefined) doc.tags = tags

    // Cập nhật filter/rotation cho từng page (không thay ảnh gốc)
    if (Array.isArray(pageUpdates)) {
      for (const upd of pageUpdates) {
        const page = doc.pages.find(p => p.pageNumber === upd.pageNumber)
        if (page) {
          if (upd.filters) page.filters = { ...page.filters.toObject(), ...upd.filters }
          if (upd.rotation !== undefined) page.rotation = upd.rotation
          if (upd.ocrText !== undefined) page.ocrText = upd.ocrText
          if (upd.ocrLanguage !== undefined) page.ocrLanguage = upd.ocrLanguage
        }
      }
    }

    await doc.save()
    res.json({ message: 'Đã cập nhật.', document: serializeDocument(doc) })
  } catch (err: any) {
    console.error('PUT /documents/:id error:', err)
    res.status(500).json({ message: 'Lỗi server.' })
  }
})

/**
 * PUT /api/documents/:id/pages/:pageNumber/image
 * Thay thế ảnh 1 trang (upload ảnh mới vào GridFS, xóa ảnh cũ)
 */
router.put('/:id/pages/:pageNumber/image', async (req: AuthRequest, res) => {
  try {
    const doc = await findUserDocument(req.userId!, req.params.id)
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu.' })

    const pageNum = parseInt(req.params.pageNumber)
    const page = doc.pages.find(p => p.pageNumber === pageNum)
    if (!page) return res.status(404).json({ message: 'Không tìm thấy trang.' })

    const { image: dataUrl } = req.body
    if (!dataUrl) return res.status(400).json({ message: 'Thiếu image.' })

    const parsed = parseDataUrl(dataUrl)
    if (!parsed) return res.status(400).json({ message: 'Ảnh không hợp lệ.' })

    // Xóa ảnh cũ
    const oldImageId = page.imageId.toString()

    // Upload ảnh mới
    const filename = `page-${pageNum}-${generateId()}.jpg`
    const newImageId = await uploadBuffer(parsed.buffer, {
      filename,
      contentType: parsed.contentType,
      metadata: { userId: req.userId, pageNumber: pageNum, width: page.width, height: page.height },
    })

    page.imageId = new mongoose.Types.ObjectId(newImageId)
    page.width = req.body.width || page.width
    page.height = req.body.height || page.height
    doc.markModified('pages')
    await doc.save()

    // Xóa ảnh cũ SAU khi save thành công
    await deleteFile(oldImageId).catch(() => {})

    res.json({ message: 'Đã cập nhật trang.', pageNumber: pageNum })
  } catch (err: any) {
    console.error('PUT page image error:', err)
    res.status(500).json({ message: 'Lỗi server.' })
  }
})

/**
 * DELETE /api/documents/:id
 * Xóa document + tất cả fileảnh trong GridFS
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const doc = await findUserDocument(req.userId!, req.params.id)
    if (!doc) return res.status(404).json({ message: 'Không tìm thấy tài liệu.' })

    // Xóa tất cả ảnh + PDF trong GridFS
    const fileIds: string[] = []
    for (const p of doc.pages) {
      if (p.imageId) fileIds.push(p.imageId.toString())
      if (p.thumbnailId) fileIds.push(p.thumbnailId.toString())
    }
    if (doc.pdfFileId) fileIds.push(doc.pdfFileId.toString())

    await doc.deleteOne()
    await Promise.all(fileIds.map(id => deleteFile(id).catch(() => {})))

    res.json({ message: 'Đã xóa tài liệu.' })
  } catch (err: any) {
    console.error('DELETE /documents/:id error:', err)
    res.status(500).json({ message: 'Lỗi server.' })
  }
})

/**
 * GET /api/documents/stats
 * Thống kê: tổng documents, scan, pdf, ocr, totalSize
 */
router.get('/stats/summary', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const stats = await Document.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
          totalPages: { $sum: '$pageCount' },
        }
      }
    ])

    const summary = {
      totalDocuments: 0,
      scannedDocuments: 0,
      pdfFiles: 0,
      ocrCount: 0,
      totalSize: 0,
      totalPages: 0,
    }

    for (const s of stats) {
      summary.totalDocuments += s.count
      summary.totalSize += s.totalSize
      summary.totalPages += s.totalPages
      if (s._id === 'scan') summary.scannedDocuments = s.count
      if (s._id === 'pdf') summary.pdfFiles = s.count
      if (s._id === 'ocr') summary.ocrCount = s.count
    }

    res.json({ stats: summary })
  } catch (err: any) {
    console.error('GET stats error:', err)
    res.status(500).json({ message: 'Lỗi server.' })
  }
})

/**
 * Helper: serialize document để gửi về client
 * - imageId -> imageUrl để client có thể load
 */
function serializeDocument(doc: any) {
  const obj = doc.toObject ? doc.toObject() : doc
  return {
    id: obj._id?.toString() || obj.id,
    userId: obj.userId?.toString(),
    name: obj.name,
    type: obj.type,
    pageCount: obj.pageCount,
    size: obj.size,
    tags: obj.tags || [],
    description: obj.description || '',
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    hasPdf: !!obj.pdfFileId,
    pages: (obj.pages || []).map((p: any) => ({
      pageNumber: p.pageNumber,
      width: p.width,
      height: p.height,
      imageUrl: `/api/documents/${obj._id}/pages/${p.pageNumber}/image`,
      filters: p.filters,
      rotation: p.rotation,
      ocrText: p.ocrText,
      ocrLanguage: p.ocrLanguage,
    })),
  }
}

export default router