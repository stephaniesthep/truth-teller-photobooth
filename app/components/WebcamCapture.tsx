import { useState, useRef, useEffect, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { useAdvancedFaceDetection } from '../hooks/useFaceApiDetection'
import FaceApiOverlay from './FaceApiOverlay'
import PhotoboothFrame from './PhotoboothFrame'

interface WebcamCaptureProps {
  onCameraStart: () => void
  onCameraStop: () => void
  onCameraError: (error: string) => void
  onScreenshot: (imageSrc: string) => void
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onCameraStart,
  onCameraStop,
  onCameraError,
  onScreenshot
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 })
  const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(true)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const {
    isDetecting,
    isModelLoading,
    modelsLoaded,
    detectedFaces,
    startDetection,
    stopDetection,
    error: faceDetectionError
  } = useAdvancedFaceDetection()

  const startCamera = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Check if we're in a secure context (required for camera access on mobile)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        throw new Error('Camera access requires HTTPS. Please access this site over HTTPS.')
      }
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback for older browsers
        const nav = navigator as any
        const getUserMedia = nav.getUserMedia ||
                           nav.webkitGetUserMedia ||
                           nav.mozGetUserMedia ||
                           nav.msGetUserMedia

        if (!getUserMedia) {
          throw new Error('Camera access is not supported on this device/browser. Please try using a modern browser like Chrome, Firefox, or Safari.')
        }

        // Use the fallback method
        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        }

        const stream = await new Promise<MediaStream>((resolve, reject) => {
          getUserMedia.call(navigator, constraints, resolve, reject)
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          streamRef.current = stream
          
          videoRef.current.onloadedmetadata = () => {
            const video = videoRef.current!
            setVideoSize({ width: video.videoWidth, height: video.videoHeight })
            setIsStreaming(true)
            setIsLoading(false)
            onCameraStart()
            
            setTimeout(async () => {
              if (faceDetectionEnabled) {
                await startDetection(video)
              }
            }, 1000)
          }
        }
        return
      }

      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front camera
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        videoRef.current.onloadedmetadata = () => {
          const video = videoRef.current!
          setVideoSize({ width: video.videoWidth, height: video.videoHeight })
          setIsStreaming(true)
          setIsLoading(false)
          onCameraStart()
          
          // Start face detection after a longer delay to ensure video and models are ready
          setTimeout(async () => {
            if (faceDetectionEnabled) {
              await startDetection(video)
            }
          }, 1000)
        }
      }
    } catch (error) {
      setIsLoading(false)
      let errorMessage = 'Failed to access camera'
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions and try again.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.'
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported by this browser.'
        } else {
          errorMessage = `Camera error: ${error.message}`
        }
      }
      
      onCameraError(errorMessage)
    }
  }, [onCameraStart, onCameraError])

  const stopCamera = useCallback(() => {
    stopDetection()
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsStreaming(false)
    setVideoSize({ width: 0, height: 0 })
    onCameraStop()
  }, [onCameraStop, stopDetection])

  const takeScreenshot = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) {
      onCameraError('Cannot take screenshot: camera not active')
      return
    }

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) {
        onCameraError('Cannot take screenshot: canvas context not available')
        return
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Save the context state
      context.save()
      
      // Flip the canvas horizontally to unreverse the camera
      context.scale(-1, 1)
      context.translate(-canvas.width, 0)
      
      // Draw the current video frame to canvas (now unmirrored)
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Restore the context state
      context.restore()

      // Draw the overlay on top if it exists
      if (overlayRef.current) {
        context.drawImage(overlayRef.current, 0, 0, canvas.width, canvas.height)
      }

      // Convert canvas to image data URL
      const capturedImageData = canvas.toDataURL('image/png')
      
      // Set the captured image to show in PhotoboothFrame
      setCapturedImage(capturedImageData)

      // Wait a bit for the PhotoboothFrame to render with the image
      setTimeout(async () => {
        if (frameRef.current) {
          try {
            // Capture the PhotoboothFrame with html2canvas
            const frameCanvas = await html2canvas(frameRef.current, {
              backgroundColor: null,
              width: 500,
              height: 500,
              scale: 1,
              useCORS: true,
              allowTaint: true,
              logging: false,
              removeContainer: true
            })
            
            // Convert to data URL
            const framedImageSrc = frameCanvas.toDataURL('image/png')
            onScreenshot(framedImageSrc)
            
            // Clear the captured image after a delay
            setTimeout(() => setCapturedImage(null), 1000)
          } catch (error) {
            console.error('Error capturing framed screenshot:', error)
            onCameraError('Failed to capture framed screenshot')
            setCapturedImage(null)
          }
        }
      }, 100)
    } catch (error) {
      console.error('Error taking screenshot:', error)
      onCameraError('Failed to take screenshot')
      setCapturedImage(null)
    }
  }, [isStreaming, onCameraError, onScreenshot])

  const toggleFaceDetection = useCallback(async () => {
    if (faceDetectionEnabled && isDetecting) {
      stopDetection()
      setFaceDetectionEnabled(false)
    } else if (!faceDetectionEnabled && isStreaming && videoRef.current) {
      setFaceDetectionEnabled(true)
      // Small delay to ensure state is updated
      setTimeout(async () => {
        if (videoRef.current) {
          await startDetection(videoRef.current)
        }
      }, 100)
    }
  }, [faceDetectionEnabled, isDetecting, isStreaming, startDetection, stopDetection])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <div className="camera-container">
      <div style={{
        position: 'relative',
        display: 'inline-block',
        overflow: 'hidden',
        maxWidth: '100%',
        maxHeight: '100vh'
      }}>
        <video
          ref={videoRef}
          className="video-feed"
          autoPlay
          playsInline
          muted
          style={{
            display: isStreaming ? 'block' : 'none',
            maxWidth: '100%',
            height: 'auto',
            transform: 'scaleX(-1)'
          }}
        />
        
        {isStreaming && videoSize.width > 0 && (
          <FaceApiOverlay
            ref={overlayRef}
            faces={faceDetectionEnabled ? detectedFaces : []}
            videoWidth={videoSize.width}
            videoHeight={videoSize.height}
            showLandmarks={false}
            showExpressions={false}
          />
        )}
      </div>
      
      {!isStreaming && !isLoading && (
        <div className="camera-placeholder" style={{
          width: '640px',
          height: '480px',
          backgroundColor: 'rgba(236, 72, 153, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          border: '2px dashed #ec4899',
          maxWidth: '100%'
        }}>
          <p style={{ color: '#be185d', fontSize: '1.2em', margin: '0 0 10px 0' }}>
            Click "Start Camera" to begin
          </p>
          <p style={{ color: '#7c2d12', fontSize: '0.9em', margin: 0 }}>
            Real-time face detection and emotion analysis ready!
          </p>
        </div>
      )}

      {isLoading && (
        <div className="camera-placeholder" style={{
          width: '640px',
          height: '480px',
          backgroundColor: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          maxWidth: '100%'
        }}>
          <p style={{ color: '#646cff', fontSize: '1.2em' }}>
            Loading camera...
          </p>
        </div>
      )}

      <div className="controls">
        {!isStreaming ? (
          <button
            className="btn btn-primary"
            onClick={startCamera}
            disabled={isLoading}
          >
            {isLoading ? 'Starting...' : 'Start Camera'}
          </button>
        ) : (
          <>
            <button
              className="btn btn-success"
              onClick={takeScreenshot}
            >
              📸 Take Screenshot
            </button>
            <button
              className={`btn ${faceDetectionEnabled ? 'btn-primary' : ''}`}
              onClick={toggleFaceDetection}
            >
              {faceDetectionEnabled ? '👤 Face Detection ON' : '👤 Face Detection OFF'}
            </button>
            <button
              className="btn"
              onClick={stopCamera}
            >
              Stop Camera
            </button>
          </>
        )}
      </div>

      {isStreaming && (
        <div className="detection-status" style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          borderRadius: '12px',
          border: '2px solid rgba(236, 72, 153, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <p style={{ margin: 0, color: '#be185d', fontWeight: '600' }}>
              🤖 AI Models: {isModelLoading ? '🟡 Loading...' : (modelsLoaded ? '🟢 Ready' : '🔴 Fallback Mode')}
            </p>
            <p style={{ margin: 0, color: '#be185d', fontWeight: '600' }}>
              👤 Detection: {faceDetectionEnabled ? (isDetecting ? '🟢 Active' : '🟡 Starting...') : '🔴 Disabled'}
            </p>
          </div>
          
          {faceDetectionError && (
            <p style={{ margin: '0.5rem 0 0 0', color: '#be185d', fontSize: '0.9em' }}>
              ⚠️ {faceDetectionError}
            </p>
          )}
        </div>
      )}

      {/* Hidden canvas for screenshot functionality */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />

      {/* Hidden PhotoboothFrame for screenshot capture */}
      {capturedImage && (
        <div
          ref={frameRef}
          style={{
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            zIndex: -1,
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }}
        >
          <PhotoboothFrame imageData={capturedImage} fixedSize={true} />
        </div>
      )}
    </div>
  )
}

export default WebcamCapture