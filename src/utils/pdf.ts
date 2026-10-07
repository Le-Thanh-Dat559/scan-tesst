import { PDFDocument, PageSizes } from 'pdf-lib'
import type { ScanPage, PdfOptions } from '@/types'

export class PdfService {
  /**
   * Convert an image Data URL or Object URL to ArrayBuffer
   */
  private async fetchImageBytes(url: string): Promise<{ bytes: ArrayBuffer, isPng: boolean }> {
    const isPng = url.startsWith('data:image/png')
    const isJpeg = url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')
    
    if (isPng || isJpeg) {
      const res = await fetch(url)
      return { bytes: await res.arrayBuffer(), isPng }
    }
    
    // Convert WebP or others to JPEG using Canvas
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Cannot get canvas context'))
          return
        }
        // Fill white background just in case there's transparency
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob failed'))
            return
          }
          try {
            const bytes = await blob.arrayBuffer()
            resolve({ bytes, isPng: false })
          } catch (e) {
            reject(e)
          }
        }, 'image/jpeg', 0.95)
      }
      img.onerror = reject
      img.src = url
    })
  }

  /**
   * Create a PDF from a list of ScanPages
   */
  async createPdfFromPages(pages: ScanPage[], options: PdfOptions): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create()
    
    // Determine page size
    let width, height
    switch (options.pageSize) {
      case 'a5':
        [width, height] = PageSizes.A5
        break
      case 'letter':
        [width, height] = PageSizes.Letter
        break
      case 'a4':
      default:
        [width, height] = PageSizes.A4
        break
    }
    
    // Swap width/height if landscape
    if (options.orientation === 'landscape') {
      const temp = width
      width = height
      height = temp
    }
    
    for (const page of pages) {
      const { bytes: imageBytes, isPng } = await this.fetchImageBytes(page.processedImage || page.originalImage)
      
      let pdfImage
      if (isPng) {
        pdfImage = await pdfDoc.embedPng(imageBytes)
      } else {
        pdfImage = await pdfDoc.embedJpg(imageBytes)
      }
      
      const pdfPage = pdfDoc.addPage([width, height])
      
      // Calculate dimensions to fit inside page with margins
      const availableWidth = width - (options.margin * 2)
      const availableHeight = height - (options.margin * 2)
      
      const imgDims = pdfImage.scale(1)
      const ratio = Math.min(
        availableWidth / imgDims.width,
        availableHeight / imgDims.height
      )
      
      const finalWidth = imgDims.width * ratio
      const finalHeight = imgDims.height * ratio
      
      // Center the image on the page
      const x = (width - finalWidth) / 2
      const y = (height - finalHeight) / 2
      
      pdfPage.drawImage(pdfImage, {
        x,
        y,
        width: finalWidth,
        height: finalHeight,
      })
    }
    
    // Metadata
    pdfDoc.setTitle('ScanPro Document')
    pdfDoc.setProducer('ScanPro Web App')
    pdfDoc.setCreationDate(new Date())
    
    return await pdfDoc.save()
  }

  /**
   * Merge multiple PDF ArrayBuffers into one
   */
  async mergePdfs(pdfBytesList: ArrayBuffer[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create()

    for (const pdfBytes of pdfBytesList) {
      const pdf = await PDFDocument.load(pdfBytes)
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page)
      })
    }

    return await mergedPdf.save()
  }

  /**
   * Extract specific pages from a PDF
   */
  async extractPages(pdfBytes: ArrayBuffer, pageIndices: number[]): Promise<Uint8Array> {
    const originalPdf = await PDFDocument.load(pdfBytes)
    const newPdf = await PDFDocument.create()
    
    const copiedPages = await newPdf.copyPages(originalPdf, pageIndices)
    copiedPages.forEach((page) => {
      newPdf.addPage(page)
    })
    
    return await newPdf.save()
  }
}

export const pdfService = new PdfService()
