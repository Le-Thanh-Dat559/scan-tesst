import mongoose from 'mongoose'
import { Readable } from 'stream'
import { GridFSBucket, GridFSFile } from 'mongodb'

let _bucket: GridFSBucket | null = null

/**
 * Lazy-init GridFS bucket (cần kết nối MongoDB active)
 */
export function getGridFSBucket(): GridFSBucket {
  if (!_bucket) {
    const db = mongoose.connection.db
    if (!db) throw new Error('MongoDB chưa kết nối.')
    _bucket = new GridFSBucket(db, { bucketName: 'fs' })
  }
  return _bucket
}

export interface UploadOptions {
  filename: string
  contentType: string
  metadata?: Record<string, any>
}

/**
 * Upload Buffer thành file trong GridFS
 * @returns GridFS file ID
 */
export function uploadBuffer(
  buffer: Buffer,
  options: UploadOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket()
    const uploadStream = bucket.openUploadStream(options.filename, {
      contentType: options.contentType,
      metadata: options.metadata,
    })

    const readable = new Readable()
    readable.push(buffer)
    readable.push(null)
    readable.pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        resolve(uploadStream.id.toString())
      })
  })
}

/**
 * Đọc file GridFS thành Buffer
 */
export function downloadToBuffer(fileId: string): Promise<{ buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket()
    let _id: mongoose.Types.ObjectId
    try {
      _id = new mongoose.Types.ObjectId(fileId)
    } catch {
      reject(new Error('Invalid file ID'))
      return
    }

    bucket.find({ _id }).limit(1).next()
      .then((file: GridFSFile | null) => {
        if (!file) {
          reject(new Error('File không tồn tại'))
          return
        }
        const chunks: Buffer[] = []
        bucket.openDownloadStream(_id)
          .on('data', (chunk: Buffer) => chunks.push(chunk))
          .on('error', reject)
          .on('end', () => {
            resolve({
              buffer: Buffer.concat(chunks),
              // GridFS file document có contentType ở root hoặc trong metadata
              contentType:
                (file as any).contentType
                || file.metadata?.contentType
                || 'application/octet-stream',
            })
          })
      })
      .catch(reject)
  })
}

/**
 * Xóa file trong GridFS
 */
export async function deleteFile(fileId: string): Promise<void> {
  const bucket = getGridFSBucket()
  let _id: mongoose.Types.ObjectId
  try {
    _id = new mongoose.Types.ObjectId(fileId)
  } catch {
    return // Invalid ID, skip
  }
  try {
    await bucket.delete(_id)
  } catch (err: any) {
    // Ignore if not found
    if (err.code !== 'FileNotFound') console.warn('GridFS delete warning:', err.message)
  }
}