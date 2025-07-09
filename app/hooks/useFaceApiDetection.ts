import { useRef, useCallback, useState, useEffect } from 'react'
import * as faceapi from 'face-api.js'

interface FaceDetection {
  x: number
  y: number
  width: number
  height: number
  confidence: number
  emotion: string
  emotionConfidence: number
  landmarks?: faceapi.FaceLandmarks68
  expressions?: faceapi.FaceExpressions
}

interface UseAdvancedFaceDetectionReturn {
  isDetecting: boolean
  isModelLoading: boolean
  modelsLoaded: boolean
  detectedFaces: FaceDetection[]
  startDetection: (video: HTMLVideoElement) => void
  stopDetection: () => void
  error: string | null
}

export const useAdvancedFaceDetection = (): UseAdvancedFaceDetectionReturn => {
  const [isDetecting, setIsDetecting] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [detectedFaces, setDetectedFaces] = useState<FaceDetection[]>([])
  const [error, setError] = useState<string | null>(null)
  const lastUpdateTime = useRef<number>(0)
  const animationFrameRef = useRef<number>()
  const videoRef = useRef<HTMLVideoElement>()

  // Load face-api.js models
  const loadModels = useCallback(async () => {
    if (modelsLoaded) return

    setIsModelLoading(true)
    setError(null)

    try {
      const MODEL_URL = '/models' // We'll need to add models to public folder
      
      // Load required models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ])

      setModelsLoaded(true)
      setError(null)
      console.log('Face-api.js models loaded successfully')
    } catch (err) {
      console.error('Failed to load face-api.js models:', err)
      setError('Failed to load AI models. Using fallback detection.')
      // Don't throw - we'll use fallback detection
    } finally {
      setIsModelLoading(false)
    }
  }, [modelsLoaded])

  // Advanced face detection using face-api.js
  const detectFaces = useCallback(async () => {
    if (!videoRef.current) {
      console.log('No video ref, stopping detection')
      return
    }

    const video = videoRef.current
    
    try {
      if (modelsLoaded) {
        console.log('Using face-api.js models for detection')
        // Use face-api.js for advanced detection
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.5
          }))
          .withFaceLandmarks()
          .withFaceExpressions()

        console.log(`Detected ${detections.length} faces with face-api.js`)

        const faces: FaceDetection[] = detections.map((detection) => {
          const box = detection.detection.box
          const expressions = detection.expressions
          
          // Get the dominant emotion
          const emotionEntries = Object.entries(expressions).sort(([,a], [,b]) => b - a)
          const [dominantEmotion, confidence] = emotionEntries[0]

          return {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            confidence: detection.detection.score,
            emotion: dominantEmotion,
            emotionConfidence: confidence,
            landmarks: detection.landmarks,
            expressions: expressions
          }
        })

        // Throttle updates to prevent blinking (max 10 FPS for overlay updates)
        const now = Date.now()
        if (now - lastUpdateTime.current > 100) {
          setDetectedFaces(faces)
          lastUpdateTime.current = now
        }
      } else {
        console.log('Models not loaded, using fallback detection')
        // Fallback to simple detection if models aren't loaded
        await fallbackDetection(video)
      }
      
      setError(null)
    } catch (err) {
      console.error('Face detection error:', err)
      // Try fallback detection
      await fallbackDetection(video)
    }

    // Continue the detection loop
    if (videoRef.current) {
      animationFrameRef.current = requestAnimationFrame(detectFaces)
    }
  }, [modelsLoaded])

  // Fallback detection method (improved version of our simple detection)
  const fallbackDetection = useCallback(async (video: HTMLVideoElement) => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const faces = performImprovedFaceDetection(imageData, canvas.width, canvas.height)
      
      // Throttle updates to prevent blinking (max 10 FPS for overlay updates)
      const now = Date.now()
      if (now - lastUpdateTime.current > 100) {
        setDetectedFaces(faces)
        lastUpdateTime.current = now
      }
    } catch (err) {
      console.error('Fallback detection error:', err)
      setDetectedFaces([])
    }
  }, [])

  // Improved fallback face detection
  const performImprovedFaceDetection = useCallback((
    imageData: ImageData,
    width: number,
    height: number
  ): FaceDetection[] => {
    const data = imageData.data
    const faces: FaceDetection[] = []

    // More sophisticated parameters
    const regionSize = 120
    const step = 40
    const maxFaces = 1

    // Multi-scale detection
    const scales = [1.0, 0.8, 1.2]

    for (const scale of scales) {
      const scaledRegionSize = Math.floor(regionSize * scale)
      const scaledStep = Math.floor(step * scale)

      for (let y = 0; y < height - scaledRegionSize && faces.length < maxFaces; y += scaledStep) {
        for (let x = 0; x < width - scaledRegionSize && faces.length < maxFaces; x += scaledStep) {
          const analysis = analyzeRegionAdvanced(data, x, y, scaledRegionSize, width, height)
          
          if (analysis.isFaceCandidate && analysis.confidence > 0.6) {
            // Check for overlaps
            const centerX = x + scaledRegionSize / 2
            const centerY = y + scaledRegionSize / 2
            
            const overlaps = faces.some(face => {
              const faceCenterX = face.x + face.width / 2
              const faceCenterY = face.y + face.height / 2
              const distance = Math.sqrt(
                Math.pow(centerX - faceCenterX, 2) + Math.pow(centerY - faceCenterY, 2)
              )
              return distance < scaledRegionSize
            })

            if (!overlaps) {
              faces.push({
                x: Math.max(0, x - 20),
                y: Math.max(0, y - 20),
                width: Math.min(width - x, scaledRegionSize + 40),
                height: Math.min(height - y, scaledRegionSize + 50),
                confidence: analysis.confidence,
                emotion: analysis.emotion,
                emotionConfidence: analysis.emotionConfidence
              })
            }
          }
        }
      }
    }

    return faces
  }, [])

  // Advanced region analysis
  const analyzeRegionAdvanced = useCallback((
    data: Uint8ClampedArray,
    startX: number,
    startY: number,
    size: number,
    width: number,
    height: number
  ) => {
    let skinPixels = 0
    let totalPixels = 0
    let avgR = 0, avgG = 0, avgB = 0
    let brightness = 0
    let edgePixels = 0

    // Sample pixels with edge detection
    for (let dy = 0; dy < size; dy += 2) {
      for (let dx = 0; dx < size; dx += 2) {
        const x = startX + dx
        const y = startY + dy
        
        if (x >= width || y >= height) continue
        
        const pixelIndex = (y * width + x) * 4
        const r = data[pixelIndex]
        const g = data[pixelIndex + 1]
        const b = data[pixelIndex + 2]

        avgR += r
        avgG += g
        avgB += b
        brightness += (r + g + b) / 3
        totalPixels++

        // Enhanced skin tone detection
        if (isAdvancedSkinTone(r, g, b)) {
          skinPixels++
        }

        // Simple edge detection
        if (dx > 0 && dy > 0) {
          const prevPixelIndex = ((y-1) * width + (x-1)) * 4
          const prevR = data[prevPixelIndex]
          const diff = Math.abs(r - prevR)
          if (diff > 30) edgePixels++
        }
      }
    }

    if (totalPixels === 0) {
      return { isFaceCandidate: false, confidence: 0, emotion: 'neutral', emotionConfidence: 0 }
    }

    avgR /= totalPixels
    avgG /= totalPixels
    avgB /= totalPixels
    brightness /= totalPixels

    const skinRatio = skinPixels / totalPixels
    const edgeRatio = edgePixels / totalPixels
    
    // More sophisticated face detection criteria
    const isFaceCandidate = 
      skinRatio > 0.3 && 
      skinRatio < 0.8 && 
      brightness > 60 && 
      brightness < 200 &&
      edgeRatio > 0.1 &&  // Some edge structure
      skinPixels > 80

    // Improved emotion estimation
    const emotion = estimateAdvancedEmotion(avgR, avgG, avgB, brightness, edgeRatio)
    
    // Calculate confidence based on multiple factors
    const confidence = Math.min(0.95, 
      (skinRatio * 0.4) + 
      (Math.min(brightness / 120, 1) * 0.3) + 
      (edgeRatio * 0.3)
    )

    return {
      isFaceCandidate,
      confidence,
      emotion: emotion.name,
      emotionConfidence: emotion.confidence
    }
  }, [])

  // Advanced skin tone detection
  const isAdvancedSkinTone = useCallback((r: number, g: number, b: number): boolean => {
    // Multiple skin tone detection methods
    const methods = [
      // RGB method
      r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15,
      // YCbCr method approximation
      r > 80 && g > 50 && b > 30 && r >= g && g >= b,
      // HSV method approximation
      r > 60 && g > 40 && b > 25 && (r - Math.min(g, b)) > 15
    ]
    
    return methods.filter(Boolean).length >= 2
  }, [])

  // Advanced emotion estimation
  const estimateAdvancedEmotion = useCallback((
    r: number, 
    g: number, 
    b: number, 
    brightness: number, 
    edgeRatio: number
  ) => {
    // More sophisticated emotion detection based on multiple factors
    const warmth = (r - b) / 255
    const saturation = (Math.max(r, g, b) - Math.min(r, g, b)) / 255
    
    if (brightness > 130 && warmth > 0.1) {
      return { name: 'happy', confidence: 0.7 + Math.min(0.2, warmth) }
    } else if (brightness < 90 && edgeRatio > 0.15) {
      return { name: 'focused', confidence: 0.6 + Math.min(0.3, edgeRatio) }
    } else if (saturation > 0.3 && brightness > 100) {
      return { name: 'surprised', confidence: 0.6 + Math.min(0.2, saturation) }
    } else {
      return { name: 'neutral', confidence: 0.5 + Math.min(0.3, brightness / 200) }
    }
  }, [])

  const startDetection = useCallback(async (video: HTMLVideoElement) => {
    try {
      console.log('Starting detection...', { modelsLoaded, isModelLoading })
      
      // Stop any existing detection first
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
      
      videoRef.current = video
      setIsDetecting(true)
      setError(null)
      
      // Load models if not already loaded
      if (!modelsLoaded && !isModelLoading) {
        console.log('Loading models...')
        await loadModels()
      }
      
      console.log('Starting detection loop...', { modelsLoaded })
      
      // Start detection - the useEffect will restart it when models load
      if (videoRef.current) {
        detectFaces()
      }
    } catch (err) {
      console.error('Start detection error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start detection')
      setIsDetecting(false)
    }
  }, [detectFaces, loadModels, modelsLoaded, isModelLoading])

  const stopDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    setIsDetecting(false)
    setDetectedFaces([])
  }, [])

  // Auto-load models on mount
  useEffect(() => {
    loadModels()
  }, [loadModels])

  // Restart detection when models become available
  useEffect(() => {
    if (modelsLoaded && isDetecting && videoRef.current && !animationFrameRef.current) {
      console.log('Models loaded, restarting detection loop')
      detectFaces()
    }
  }, [modelsLoaded, isDetecting, detectFaces])

  return {
    isDetecting,
    isModelLoading,
    modelsLoaded,
    detectedFaces,
    startDetection,
    stopDetection,
    error
  }
}