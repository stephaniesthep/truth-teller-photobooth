import { useCallback, useEffect, useRef, useState } from 'react'

interface PhotoGalleryProps {
  photos: string[]
  onDownload?: (photo: string, index: number) => void
  onDelete?: (photo: string) => void
  className?: string
}

export default function PhotoGallery({
  photos,
  onDownload,
  onDelete,
  className = ''
}: PhotoGalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Check scroll position and update arrow visibility
  const updateScrollButtons = useCallback(() => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const { scrollLeft, scrollWidth, clientWidth } = container

    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }, [])

  // Smooth scroll function
  const smoothScroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollAmount = container.clientWidth * 0.8 // Scroll 80% of visible width
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
  }, [])

  // Touch/mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    
    setIsDragging(true)
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
    setScrollLeft(scrollContainerRef.current.scrollLeft)
    
    // Prevent text selection during drag
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    
    e.preventDefault()
    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX) * 2 // Multiply by 2 for faster scrolling
    scrollContainerRef.current.scrollLeft = scrollLeft - walk
  }, [isDragging, startX, scrollLeft])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return
    
    setIsDragging(true)
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft)
    setScrollLeft(scrollContainerRef.current.scrollLeft)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft
    const walk = (x - startX) * 1.5 // Slightly less sensitive for touch
    scrollContainerRef.current.scrollLeft = scrollLeft - walk
  }, [isDragging, startX, scrollLeft])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      smoothScroll('left')
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      smoothScroll('right')
    }
  }, [smoothScroll])

  // Handle photo tap for mobile
  const handlePhotoTap = useCallback((index: number) => {
    if (isTouchDevice) {
      setActivePhotoIndex(activePhotoIndex === index ? null : index)
    }
  }, [activePhotoIndex, isTouchDevice])

  // Handle click outside to close mobile actions
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (isTouchDevice && activePhotoIndex !== null) {
      const target = e.target as Element
      if (!target.closest('.photo-container')) {
        setActivePhotoIndex(null)
      }
    }
  }, [activePhotoIndex, isTouchDevice])

  // Set up event listeners
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Detect touch device
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)

    // Initial scroll button state
    updateScrollButtons()

    // Add scroll listener
    container.addEventListener('scroll', updateScrollButtons)
    
    // Add keyboard listener to document
    document.addEventListener('keydown', handleKeyDown)
    
    // Add click outside listener for mobile
    document.addEventListener('click', handleClickOutside)

    return () => {
      container.removeEventListener('scroll', updateScrollButtons)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [updateScrollButtons, handleKeyDown, handleClickOutside])

  // Update scroll buttons when photos change
  useEffect(() => {
    updateScrollButtons()
  }, [photos, updateScrollButtons])

  if (photos.length === 0) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      {/* Gallery Header */}
      <div className="flex items-center justify-center mb-6">
        <h3 className="text-2xl font-semibold text-center" style={{ color: "#2d1b2e" }}>
          🖼️ Recent Photos
        </h3>
      </div>

      {/* Navigation Arrows */}
      {canScrollLeft && (
        <button
          onClick={() => smoothScroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-pink-600 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 backdrop-blur-sm"
          aria-label="Scroll left"
        >
          ←
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() => smoothScroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-pink-600 rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110 backdrop-blur-sm"
          aria-label="Scroll right"
        >
          →
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className={`
          flex gap-4 overflow-x-auto scrollbar-hide pb-4 pt-4
          ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}
        `}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {photos.map((photo, index) => {
          const isActive = activePhotoIndex === index
          const showActions = !isTouchDevice || isActive
          
          return (
            <div
              key={`${photo}-${index}`}
              className="flex-shrink-0 relative group photo-container"
              style={{ width: '280px', height: '280px', padding: '8px' }}
            >
              {/* Photo Frame */}
              <div
                className="relative w-full h-full bg-white rounded-lg border-2 border-pink-200 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer"
                style={{ transformOrigin: 'center center' }}
                onClick={() => handlePhotoTap(index)}
              >
                {/* Photo */}
                <img
                  src={photo}
                  alt={`Captured photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />
                
                {/* Photo number badge */}
                <div className="absolute top-2 right-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  #{index + 1}
                </div>

                {/* Desktop hover overlay with actions */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
                  isTouchDevice
                    ? (isActive ? 'opacity-100' : 'opacity-0')
                    : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2 justify-center">
                    {onDownload && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDownload(photo, index)
                          if (isTouchDevice) setActivePhotoIndex(null)
                        }}
                        className="bg-white text-gray-800 px-3 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm flex items-center gap-1 shadow-md"
                      >
                        📥 Download
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(photo)
                          if (isTouchDevice) setActivePhotoIndex(null)
                        }}
                        className="bg-pink-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-pink-600 transition-colors text-sm flex items-center gap-1 shadow-md"
                        title="Delete photo"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile tap indicator */}
                {isTouchDevice && !isActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-white/90 rounded-full p-2 text-gray-700 text-sm font-medium">
                      Tap for actions
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Scroll Indicators */}
      <div className="flex justify-center mt-4 gap-1">
        {photos.length > 1 && (
          <div className="flex gap-1">
            {Array.from({ length: Math.min(photos.length, 10) }, (_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-pink-300 opacity-50"
              />
            ))}
            {photos.length > 10 && (
              <div className="text-xs text-pink-600 ml-2">
                +{photos.length - 10} more
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}