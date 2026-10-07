import { createWorker, type Worker } from 'tesseract.js'
import type { OcrLanguage, OcrResult } from '@/types'

class OcrService {
  private worker: Worker | null = null
  private currentLang: OcrLanguage | null = null

  async initWorker(lang: OcrLanguage, onProgress?: (m: any) => void): Promise<Worker> {
    if (this.worker && this.currentLang === lang) {
      return this.worker
    }

    if (this.worker) {
      await this.worker.terminate()
    }

    // In tesseract.js v5+, createWorker takes languages as first argument
    this.worker = await createWorker(lang, 1, {
      logger: m => {
        if (onProgress) {
          onProgress(m)
        }
      },
      errorHandler: err => console.error(err)
    })
    
    this.currentLang = lang

    return this.worker
  }

  async recognize(
    imageUrl: string, 
    lang: OcrLanguage, 
    onProgress?: (progress: number) => void
  ): Promise<OcrResult> {
    try {
      const worker = await this.initWorker(lang, (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(m.progress * 100)
        }
      })

      const { data } = await worker.recognize(imageUrl)

      return {
        text: data.text,
        confidence: data.confidence,
        language: lang,
        progress: 100,
        status: 'done'
      }
    } catch (error: any) {
      console.error('OCR Error:', error)
      return {
        text: '',
        confidence: 0,
        language: lang,
        progress: 0,
        status: 'error',
        error: error.message || 'Lỗi nhận diện văn bản'
      }
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.currentLang = null
    }
  }
}

export const ocrService = new OcrService()
