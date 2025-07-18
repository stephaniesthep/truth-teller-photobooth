import html2canvas from 'html2canvas-pro'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAdvancedFaceDetection } from '../hooks/useFaceApiDetection'
import FaceApiOverlay from './FaceApiOverlay'
import PhotoboothFrame from './PhotoboothFrame'
import type { EmotionMode } from '../lib/emotionMapping'

interface WebcamCaptureProps {
  onCameraStart: () => void
  onCameraStop: () => void
  onCameraError: (error: string) => void
  onScreenshot: (imageSrc: string) => void
  mode?: EmotionMode
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  onCameraStart,
  onCameraStop,
  onCameraError,
  onScreenshot,
  mode = 'normal'
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

      // Wait for the PhotoboothFrame to render with the image
      setTimeout(async () => {
        if (frameRef.current) {
          try {
            // Temporarily move the frame to visible area for html2canvas
            const frameElement = frameRef.current
            frameElement.style.position = 'fixed'
            frameElement.style.top = '0px'
            frameElement.style.left = '0px'
            frameElement.style.zIndex = '9999'
            frameElement.style.visibility = 'visible'
            
            // Wait a bit more for any background images to load
            await new Promise(resolve => setTimeout(resolve, 200))
            
            // Capture the PhotoboothFrame with html2canvas
            const frameCanvas = await html2canvas(frameElement, {
              backgroundColor: null,
              width: 500,
              height: 500,
              scale: 1,
              useCORS: true,
              allowTaint: true,
              logging: false,
              removeContainer: false,
              foreignObjectRendering: false,
              imageTimeout: 5000
            })

            // Move the frame back off-screen
            frameElement.style.position = 'fixed'
            frameElement.style.top = '-9999px'
            frameElement.style.left = '-9999px'
            frameElement.style.zIndex = '-10'
            frameElement.style.visibility = 'hidden'

            // Convert to data URL
            const framedImageSrc = frameCanvas.toDataURL('image/png', 0.9)
            onScreenshot(framedImageSrc)

            // Clear the captured image after a delay
            setTimeout(() => setCapturedImage(null), 1000)
          } catch (error) {
            console.error('Error capturing framed screenshot:', error)
            onCameraError(`Failed to capture framed screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`)
            setCapturedImage(null)
          }
        } else {
          onCameraError('Frame reference not available for screenshot')
          setCapturedImage(null)
        }
      }, 300)
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

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        if (!isStreaming && !isLoading) {
          // Start camera if not streaming
          startCamera()
        } else if (isStreaming) {
          // Take screenshot if streaming
          takeScreenshot()
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [isStreaming, isLoading, startCamera, takeScreenshot])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative inline-block overflow-hidden max-w-full max-h-screen">
        <video
          ref={videoRef}
          className={`rounded-lg border-2 border-pink-200 shadow-lg max-w-full h-auto ${isStreaming ? 'block' : 'hidden'}`}
          autoPlay
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
        />

        {isStreaming && videoSize.width > 0 && (
          <FaceApiOverlay
            ref={overlayRef}
            faces={faceDetectionEnabled ? detectedFaces : []}
            videoWidth={videoSize.width}
            videoHeight={videoSize.height}
            showLandmarks={false}
            showExpressions={false}
            mode={mode}
          />
        )}
      </div>

      {!isStreaming && !isLoading && (
        <div className="w-full max-w-[640px] h-[480px] bg-pink-50 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-pink-500">
          <p className="text-pink-700 text-xl mb-2">
            Click "Start Camera" or press Enter to begin
          </p>
          <p className="text-amber-800 text-sm">
            Real-time face detection and emotion analysis ready!
          </p>
        </div>
      )}

      {isLoading && (
        <div className="w-full max-w-[640px] h-[480px] bg-gray-900 flex items-center justify-center rounded-lg">
          <p className="text-indigo-400 text-xl">
            Loading camera...
          </p>
        </div>
      )}

      <div className="flex gap-3 flex-wrap justify-center">
        {!isStreaming ? (
          <button
            className="bg-pink-500 text-white border-2 border-pink-500 px-5 py-3 text-base font-medium rounded-xl transition-all duration-200 shadow-md hover:bg-pink-600 hover:border-pink-600 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={startCamera}
            disabled={isLoading}
          >
            {isLoading ? 'Starting...' : 'Start Camera (Press Enter)'}
          </button>
        ) : (
          <>
            <button
              className="bg-pink-400 text-white border-2 border-pink-400 px-5 py-3 text-base font-medium rounded-xl transition-all duration-200 shadow-md hover:bg-pink-500 hover:border-pink-500 hover:-translate-y-0.5 hover:shadow-lg"
              onClick={takeScreenshot}
            >
              📸 Take a photo (Press Enter)
            </button>
            <button
              className={`px-5 py-3 text-base font-medium rounded-xl transition-all duration-200 shadow-md hover:-translate-y-0.5 hover:shadow-lg border-2 ${
                faceDetectionEnabled
                  ? 'bg-pink-500 text-white border-pink-500 hover:bg-pink-600 hover:border-pink-600'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-400'
              }`}
              onClick={toggleFaceDetection}
            >
              {faceDetectionEnabled ? 'Face Detection ON' : 'Face Detection OFF'}
            </button>
            <button
              className="bg-gray-100 text-gray-700 border-2 border-gray-300 px-5 py-3 text-base font-medium rounded-xl transition-all duration-200 shadow-md hover:bg-gray-200 hover:border-gray-400 hover:-translate-y-0.5 hover:shadow-lg"
              onClick={stopCamera}
            >
              Stop Camera
            </button>
          </>
        )}
      </div>

      {isStreaming && (
        <div className="mt-4 p-4 bg-pink-50 rounded-xl border-2 border-pink-200">
          <div className="flex justify-between items-center mb-2 gap-10">
            <p className="m-0 text-pink-700 font-semibold">
              🤖 AI Models: {isModelLoading ? '🟡 Loading...' : (modelsLoaded ? '💕 Ready' : '❤ Fallback Mode')}
            </p>
            <p className="m-0 text-pink-700 font-semibold">
              👤 Detection: {faceDetectionEnabled ? (isDetecting ? '💕 Active' : '🟡 Starting...') : '❤ Disabled'}
            </p>
          </div>

          {faceDetectionError && (
            <p className="mt-2 mb-0 text-pink-700 text-sm">
              ⚠️ {faceDetectionError}
            </p>
          )}
        </div>
      )}

      {/* Hidden canvas for screenshot functionality */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* Hidden PhotoboothFrame for screenshot capture */}
      {capturedImage && (
        <div
          ref={frameRef}
          className="fixed -top-[9999px] -left-[9999px] -z-10 scale-100 origin-top-left"
          style={{
            visibility: 'hidden',
            width: '500px',
            height: '500px'
          }}
        >
          <PhotoboothFrame imageData={capturedImage} fixedSize={true} />
        </div>
      )}
    </div>
  )
}

export default WebcamCapture
