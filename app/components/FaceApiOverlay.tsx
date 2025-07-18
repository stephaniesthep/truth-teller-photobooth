import { useEffect, useRef, forwardRef, useMemo } from 'react'
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

  // Memoize face data to prevent unnecessary re-renders
  const stableFaces = useMemo(() => {
    return faces.map(face => ({
      ...face,
      // Round coordinates to prevent micro-movements causing flicker
      x: Math.round(face.x),
      y: Math.round(face.y),
      width: Math.round(face.width),
      height: Math.round(face.height)
    }))
  }, [faces])

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

    // Draw face detection with mode-aware styling
    stableFaces.forEach((face) => {
      const emotionColor = getEmotionColor(face.emotion, mode)
      
      // Square outline with mode-aware color
      ctx.strokeStyle = emotionColor
      ctx.lineWidth = mode === 'fun' ? 4 : 3
      ctx.setLineDash([])
      ctx.strokeRect(face.x, face.y, face.width, face.height)

      // Corner markers with mode-aware styling
      const cornerSize = mode === 'fun' ? 25 : 20
      ctx.strokeStyle = emotionColor
      ctx.lineWidth = mode === 'fun' ? 5 : 4
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

      // Mode-aware emotion label
      const emotionText = getEmotionLabel(face.emotion, mode)
      
      const fontSize = mode === 'fun' ? 18 : 16
      ctx.font = `bold ${fontSize}px Inter, sans-serif`
      const emotionMetrics = ctx.measureText(emotionText)
      
      // Mode-aware background styling
      const labelHeight = mode === 'fun' ? 40 : 35
      const labelY = face.y - labelHeight - 5
      const padding = mode === 'fun' ? 24 : 20
      
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

      // Emotion text with mode-aware positioning
      ctx.fillStyle = 'white'
      ctx.font = `bold ${fontSize}px Inter, sans-serif`
      const textY = mode === 'fun' ? face.y - 12 : face.y - 15
      const textX = face.x + (padding / 2)
      ctx.fillText(emotionText, textX, textY)
    })
  }, [stableFaces, videoWidth, videoHeight, canvasElement])


  return (
    <canvas
      ref={ref || canvasRef}
      className={`advanced-emotion-overlay ${className}`}
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