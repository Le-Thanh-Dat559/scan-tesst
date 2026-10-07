import mongoose from 'mongoose'

/**
 * Document schema
 * - Lưu metadata tài liệu + danh sách pages
 * - Mỗi page chứa:
 *    + imageId: tham chiếu đến fileảnh trong GridFS
 *    + thumbnailId: tham chiếu đến thumbnail trong GridFS
 *    + filter/filter các thông số đã áp dụng (để tái tạo)
 */
const pageSchema = new mongoose.Schema({
  pageNumber: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },

  // GridFS file ID choảnh gốc
  imageId: { type: mongoose.Schema.Types.ObjectId, required: true },
  // GridFS file ID cho thumbnail (optional)
  thumbnailId: { type: mongoose.Schema.Types.ObjectId },

  // Filter metadata
  filters: {
    brightness: { type: Number, default: 100 },
    contrast: { type: Number, default: 100 },
    sharpness: { type: Number, default: 100 },
    denoise: { type: Boolean, default: false },
    grayscale: { threshold: { type: Number, default: 128 } },
    blackAndWhite: { type: Boolean, default: false },
    threshold: { type: Number, default: 128 },
    autoEnhance: { type: Boolean, default: false },
  },
  rotation: { type: Number, default: 0 },

  ocrText: { type: String, default: '' },
  ocrLanguage: { type: String, default: 'vie' },

  createdAt: { type: Date, default: Date.now },
}, { _id: true })

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['scan', 'ocr', 'pdf'], default: 'scan' },
  pageCount: { type: Number, default: 0 },

  // Lưu trực tiếp pages vào document để query nhanh
  pages: [pageSchema],

  // GridFS file ID cho PDF xuất ra (nếu có)
  pdfFileId: { type: mongoose.Schema.Types.ObjectId },

  // Metadata
  size: { type: Number, default: 0 },
  tags: [{ type: String }],
  description: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true })

// Index cho tìm kiếm nhanh
documentSchema.index({ userId: 1, createdAt: -1 })
documentSchema.index({ name: 'text', description: 'text', tags: 'text' })

// Auto-update updatedAt (đã có timestamps: true tự động, nhưng giữ để chắc chắn)
documentSchema.pre('save', function () {
  this.updatedAt = new Date()
})

export default mongoose.model('Document', documentSchema)