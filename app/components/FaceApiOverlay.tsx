import { useEffect, useRef, forwardRef, useMemo, useCallback } from 'react'
import * as faceapi from 'face-api.js'
import { getEmotionLabel, getEmotionColor, type EmotionMode } from '../lib/emotionMapping'

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
  // Additional properties for responsive scaling
  originalWidth?: number
  originalHeight?: number
  deviceType?: string
  scalingFactors?: {
    sizeMultiplier: number
    cornerSize: number
    lineWidth: number
    fontSize: number
    labelHeight: number
    padding: number
  }
}

interface AdvancedEmotionOverlayProps {
  faces: FaceDetection[]
  videoWidth: number
  videoHeight: number
  className?: string
  showLandmarks?: boolean
  showExpressions?: boolean
  mode?: EmotionMode
}

const AdvancedEmotionOverlay = forwardRef<HTMLCanvasElement, AdvancedEmotionOverlayProps>(({
  faces,
  videoWidth,
  videoHeight,
  className = '',
  showLandmarks = true,
  showExpressions = true,
  mode = 'normal'
}, ref) => {
  // Suppress unused parameter warnings - these are kept for future functionality
  void showLandmarks;
  void showExpressions;
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Use the forwarded ref if provided, otherwise use internal ref
  const canvasElement = (ref as React.RefObject<HTMLCanvasElement>)?.current || canvasRef.current

  // Device detection for responsive scaling
  const getDeviceType = useCallback(() => {
    if (typeof window === 'undefined') return 'desktop'
    
    const width = window.innerWidth
    const height = window.innerHeight
    const isPortrait = height > width
    
    if (width <= 640) {
      return isPortrait ? 'mobile-portrait' : 'mobile-landscape'
    } else if (width <= 1024) {
      return isPortrait ? 'tablet-portrait' : 'tablet-landscape'
    }
    return 'desktop'
  }, [])

  // Get scaling factors based on device type
  const getScalingFactors = useCallback((deviceType: string) => {
    switch (deviceType) {
      case 'mobile-portrait':
        return {
          sizeMultiplier: 1.4, // 40% larger squares on mobile portrait
          cornerSize: 30,
          lineWidth: 4,
          fontSize: 20,
          labelHeight: 45,
          padding: 28
        }
      case 'mobile-landscape':
        return {
          sizeMultiplier: 1.3, // 30% larger squares on mobile landscape
          cornerSize: 28,
          lineWidth: 4,
          fontSize: 18,
          labelHeight: 42,
          padding: 26
        }
      case 'tablet-portrait':
        return {
          sizeMultiplier: 1.25, // 25% larger squares on tablet portrait
          cornerSize: 26,
          lineWidth: 4,
          fontSize: 18,
          labelHeight: 40,
          padding: 24
        }
      case 'tablet-landscape':
        return {
          sizeMultiplier: 1.2, // 20% larger squares on tablet landscape
          cornerSize: 24,
          lineWidth: 3,
          fontSize: 17,
          labelHeight: 38,
          padding: 22
        }
      default: // desktop
        return {
          sizeMultiplier: 1.0, // Original size on desktop
          cornerSize: mode === 'fun' ? 25 : 20,
          lineWidth: mode === 'fun' ? 5 : 4,
          fontSize: mode === 'fun' ? 18 : 16,
          labelHeight: mode === 'fun' ? 40 : 35,
          padding: mode === 'fun' ? 24 : 20
        }
    }
  }, [mode])

  // Enhanced emotion colors and emojis
  // Emotion configuration for future use
  // const emotionConfig: Record<string, { color: string; emoji: string; gradient: string }> = {
  //   happy: { color: '#22c55e', emoji: '😊', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
  //   sad: { color: '#3b82f6', emoji: '😢', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
  //   angry: { color: '#ef4444', emoji: '😠', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  //   surprised: { color: '#f59e0b', emoji: '😲', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  //   fearful: { color: '#8b5cf6', emoji: '😨', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
  //   disgusted: { color: '#84cc16', emoji: '🤢', gradient: 'linear-gradient(135deg, #84cc16, #65a30d)' },
  //   neutral: { color: '#6b7280', emoji: '😐', gradient: 'linear-gradient(135deg, #6b7280, #4b5563)' },
  //   focused: { color: '#ec4899', emoji: '🤔', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' }
  // }

  // Memoize face data with responsive scaling to prevent unnecessary re-renders
  const stableFaces = useMemo(() => {
    const deviceType = getDeviceType()
    const scalingFactors = getScalingFactors(deviceType)
    
    return faces.map(face => {
      // Calculate scaled dimensions for better visibility on mobile/tablet
      const scaledWidth = Math.round(face.width * scalingFactors.sizeMultiplier)
      const scaledHeight = Math.round(face.height * scalingFactors.sizeMultiplier)
      
      // Center the scaled square on the original face position
      const offsetX = Math.round((scaledWidth - face.width) / 2)
      const offsetY = Math.round((scaledHeight - face.height) / 2)
      
      return {
        ...face,
        // Round coordinates to prevent micro-movements causing flicker
        x: Math.max(0, Math.round(face.x - offsetX)),
        y: Math.max(0, Math.round(face.y - offsetY)),
        width: scaledWidth,
        height: scaledHeight,
        // Store original dimensions and scaling info for reference
        originalWidth: face.width,
        originalHeight: face.height,
        deviceType,
        scalingFactors
      }
    })
  }, [faces, getDeviceType, getScalingFactors])

  useEffect(() => {
    const canvas = canvasElement || canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size only if it changed
    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth
      canvas.height = videoHeight
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Only draw if we have faces to avoid unnecessary renders
    if (stableFaces.length === 0) return

    // Draw face detection with responsive and mode-aware styling
    stableFaces.forEach((face) => {
      const emotionColor = getEmotionColor(face.emotion, mode)
      const scalingFactors = face.scalingFactors || getScalingFactors('desktop')
      
      // Square outline with responsive and mode-aware styling
      ctx.strokeStyle = emotionColor
      ctx.lineWidth = scalingFactors.lineWidth
      ctx.setLineDash([])
      ctx.strokeRect(face.x, face.y, face.width, face.height)

      // Corner markers with responsive styling
      const cornerSize = scalingFactors.cornerSize
      ctx.strokeStyle = emotionColor
      ctx.lineWidth = scalingFactors.lineWidth
      ctx.lineCap = 'round'

      // Top-left corner
      ctx.beginPath()
      ctx.moveTo(face.x, face.y + cornerSize)
      ctx.lineTo(face.x, face.y)
      ctx.lineTo(face.x + cornerSize, face.y)
      ctx.stroke()

      // Top-right corner
      ctx.beginPath()
      ctx.moveTo(face.x + face.width - cornerSize, face.y)
      ctx.lineTo(face.x + face.width, face.y)
      ctx.lineTo(face.x + face.width, face.y + cornerSize)
      ctx.stroke()

      // Bottom-left corner
      ctx.beginPath()
      ctx.moveTo(face.x, face.y + face.height - cornerSize)
      ctx.lineTo(face.x, face.y + face.height)
      ctx.lineTo(face.x + cornerSize, face.y + face.height)
      ctx.stroke()

      // Bottom-right corner
      ctx.beginPath()
      ctx.moveTo(face.x + face.width - cornerSize, face.y + face.height)
      ctx.lineTo(face.x + face.width, face.y + face.height)
      ctx.lineTo(face.x + face.width, face.y + face.height - cornerSize)
      ctx.stroke()

      // Responsive emotion label
      const emotionText = getEmotionLabel(face.emotion, mode)
      
      const fontSize = scalingFactors.fontSize
      ctx.font = `bold ${fontSize}px Inter, sans-serif`
      const emotionMetrics = ctx.measureText(emotionText)
      
      // Responsive background styling
      const labelHeight = scalingFactors.labelHeight
      const labelY = face.y - labelHeight - 5
      const padding = scalingFactors.padding
      
      // Background with mode-aware color and opacity
      ctx.fillStyle = emotionColor + (mode === 'fun' ? 'ee' : 'dd')
      ctx.fillRect(face.x, labelY, emotionMetrics.width + padding, labelHeight)

      // Add extra styling for fun mode
      if (mode === 'fun') {
        // Add a subtle border to the label
        ctx.strokeStyle = emotionColor
        ctx.lineWidth = 2
        ctx.strokeRect(face.x, labelY, emotionMetrics.width + padding, labelHeight)
      }

      // Emotion text with responsive positioning
      ctx.fillStyle = 'white'
      ctx.font = `bold ${fontSize}px Inter, sans-serif`
      const textY = face.y - (labelHeight * 0.3) // Responsive text positioning
      const textX = face.x + (padding / 2)
      ctx.fillText(emotionText, textX, textY)
    })
  }, [stableFaces, videoWidth, videoHeight, canvasElement])


  return (
    <canvas
      ref={ref || canvasRef}
      className={`advanced-emotion-overlay emotion-overlay-responsive ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain'
      }}
    />
  )
})

AdvancedEmotionOverlay.displayName = 'AdvancedEmotionOverlay'

export default AdvancedEmotionOverlay