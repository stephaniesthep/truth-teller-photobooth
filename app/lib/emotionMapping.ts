export type EmotionMode = "normal" | "fun"

export const funEmotionMap: Record<string, string[]> = {
  neutral: ["SEEKING ATTENTION"],
  happy: ["YASS"],
  sad: ["SALTY"],
  angry: ["REALLYYY"],
  fearful: ["SHOOKETH"],
  disgusted: ["CRINGE"],
  surprised: ["LIKE WHATT"]
}

export const getEmotionLabel = (emotion: string, mode: EmotionMode): string => {
  if (mode === "normal") {
    return emotion.toUpperCase()
  }
  
  // Fun mode - get the mapped emotion or fallback to original
  const funLabels = funEmotionMap[emotion.toLowerCase()]
  if (funLabels && funLabels.length > 0) {
    // For now, just return the first label. Could randomize in the future
    return funLabels[0]
  }
  
  // Fallback to original emotion if not mapped
  return emotion.toUpperCase()
}

export const getEmotionColor = (emotion: string, mode: EmotionMode): string => {
  // Both modes use pink theme now
  return "#ec4899"
}

export const getEmotionGradient = (emotion: string, mode: EmotionMode): string => {
  if (mode === "fun") {
    const funGradients: Record<string, string> = {
      neutral: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
      happy: "linear-gradient(135deg, #f59e0b, #d97706)",
      sad: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
      angry: "linear-gradient(135deg, #ef4444, #dc2626)",
      fearful: "linear-gradient(135deg, #10b981, #059669)",
      disgusted: "linear-gradient(135deg, #84cc16, #65a30d)",
      surprised: "linear-gradient(135deg, #ec4899, #db2777)"
    }
    return funGradients[emotion.toLowerCase()] || "linear-gradient(135deg, #ec4899, #db2777)"
  }
  
  // Normal mode - consistent pink gradient
  return "linear-gradient(135deg, #ec4899, #db2777)"
}