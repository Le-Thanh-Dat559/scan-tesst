import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/utils/helpers'
import { Camera, RefreshCw, Zap, ZapOff, X } from 'lucide-react'

interface CameraScannerProps {
  onCapture: (file: File) => void
  onClose: () => void
}

export default function CameraScanner({ onCapture, onClose }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [activeCameraId, setActiveCameraId] = useState<string>('')
  
  const [hasFlash, setHasFlash] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string>('')

  // Initialize camera
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : 'environment', // Prefer back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      }

      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }
      
      setStream(newStream)
      
      // Check for flash (torch) capability
      const videoTrack = newStream.getVideoTracks()[0]
      const capabilities = videoTrack.getCapabilities() as any
      if (capabilities.torch) {
        setHasFlash(true)
      } else {
        setHasFlash(false)
        setFlashOn(false)
      }
      
      setError('')
    } catch (err: any) {
      console.error('Lỗi khi mở camera:', err)
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.')
    }
  }, [stream])

  // Get available cameras
  useEffect(() => {
    async function getCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(d => d.kind === 'videoinput')
        setCameras(videoDevices)
        
        if (videoDevices.length > 0 && !activeCameraId) {
          // Find back camera if possible, otherwise use first
          const backCamera = videoDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('sau'))
          const targetId = backCamera ? backCamera.deviceId : videoDevices[0].deviceId
          setActiveCameraId(targetId)
          startCamera(targetId)
        }
      } catch (err) {
        console.error('Lỗi khi lấy danh sách camera:', err)
      }
    }
    
    // Request permission first
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(tempStream => {
        getCameras()
        tempStream.getTracks().forEach(t => t.stop())
      })
      .catch(() => {
        setError('Không thể truy cập camera. Vui lòng cấp quyền.')
      })
      
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array to run only once on mount

  const switchCamera = useCallback(() => {
    if (cameras.length < 2) return
    const currentIndex = cameras.findIndex(c => c.deviceId === activeCameraId)
    const nextIndex = (currentIndex + 1) % cameras.length
    const nextId = cameras[nextIndex].deviceId
    setActiveCameraId(nextId)
    startCamera(nextId)
  }, [cameras, activeCameraId, startCamera])

  const toggleFlash = useCallback(async () => {
    if (!stream || !hasFlash) return
    const videoTrack = stream.getVideoTracks()[0]
    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: !flashOn } as any]
      })
      setFlashOn(!flashOn)
    } catch (err) {
      console.error('Lỗi khi bật/tắt flash:', err)
    }
  }, [stream, hasFlash, flashOn])

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return
    
    setIsCapturing(true)
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' })
          
          // Flash effect
          const flashDiv = document.createElement('div')
          flashDiv.className = 'fixed inset-0 bg-white z-[200] transition-opacity duration-300'
          document.body.appendChild(flashDiv)
          
          setTimeout(() => {
            flashDiv.style.opacity = '0'
            setTimeout(() => {
              document.body.removeChild(flashDiv)
              onCapture(file)
              setIsCapturing(false)
            }, 300)
          }, 50)
        } else {
          setIsCapturing(false)
        }
      }, 'image/jpeg', 0.95)
    } else {
      setIsCapturing(false)
    }
  }, [isCapturing, onCapture])

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/70 to-transparent">
        <button 
          onClick={onClose}
          className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex gap-4">
          {hasFlash && (
            <button 
              onClick={toggleFlash}
              className={cn(
                "p-3 rounded-full backdrop-blur-md transition-colors",
                flashOn ? "bg-yellow-400/90 text-black" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {flashOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
            </button>
          )}
          
          {cameras.length > 1 && (
            <button 
              onClick={switchCamera}
              className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-md transition-colors"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {error ? (
          <div className="text-white text-center p-6 bg-white/10 rounded-2xl backdrop-blur-md">
            <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Helper overlay (document outline) */}
        {!error && (
          <div className="absolute inset-8 border-2 border-white/30 border-dashed rounded-xl pointer-events-none flex flex-col justify-center items-center">
            <p className="text-white/50 bg-black/30 px-3 py-1 rounded-lg backdrop-blur-sm text-sm">
              Căn tài liệu vào khung hình
            </p>
          </div>
        )}
      </div>

      {/* Controls Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex items-center justify-center z-10 bg-gradient-to-t from-black/90 to-transparent">
        <div className="flex items-center gap-12">
          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
          
          <button 
            onClick={capture}
            disabled={isCapturing || !!error}
            className="w-20 h-20 rounded-full border-4 border-white/80 p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <div className="w-full h-full bg-white rounded-full" />
          </button>
        </div>
      </div>
    </div>
  )
}
