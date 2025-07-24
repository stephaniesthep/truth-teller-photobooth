import { useState } from "react"

export type EmotionMode = "normal" | "fun"

interface ModeToggleProps {
  mode: EmotionMode
  onModeChange: (mode: EmotionMode) => void
}

const ModeToggle = ({ mode, onModeChange }: ModeToggleProps) => {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleToggle = () => {
    setIsAnimating(true)
    setTimeout(() => {
      onModeChange(mode === "normal" ? "fun" : "normal")
      setIsAnimating(false)
    }, 150)
  }

  return (
    <div className="flex items-center justify-center mb-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border-2 border-pink-200">
        <div className="flex items-center gap-4">
          <span 
            className={`text-sm font-medium transition-colors ${
              mode === "normal" ? "text-pink-700" : "text-gray-500"
            }`}
          >
            Normal Mode
          </span>
          
          <button
            onClick={handleToggle}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
              mode === "fun"
                ? "bg-pink-600"
                : "bg-pink-300"
            } ${isAnimating ? "scale-95" : "scale-100"}`}
            aria-label={`Switch to ${mode === "normal" ? "fun" : "normal"} mode`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
                mode === "fun" ? "translate-x-8" : "translate-x-1"
              }`}
            >
            </div>
          </button>
          
          <span
            className={`text-sm font-medium transition-colors ${
              mode === "fun" ? "text-pink-800" : "text-gray-500"
            }`}
          >
            Fun Mode
          </span>
        </div>
        
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-600">
            {mode === "normal" 
              ? "Boring but reliable 😐" 
              : "Sassy! 💅"
            }
          </p>
        </div>
      </div>
    </div>
  )
}

export default ModeToggle