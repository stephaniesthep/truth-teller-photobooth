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
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [leftShadowOpacity, setLeftShadowOpacity] = useState(0)
  const [rightShadowOpacity, setRightShadowOpacity] = useState(0)

  // Responsive breakpoints
  const getScreenSize = useCallback(() => {
    if (typeof window === 'undefined') return 'desktop'
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }, [])

  // Update screen size on resize
  useEffect(() => {
    const handleResize = () => {
      setScreenSize(getScreenSize())
    }

    // Set initial screen size
    setScreenSize(getScreenSize())

    // Add resize listener with debounce
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 150)
    }

    window.addEventListener('resize', debouncedResize)
    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [getScreenSize])

  // Get responsive photo dimensions
  const getPhotoDimensions = useCallback(() => {
    switch (screenSize) {
      case 'mobile':
        return { width: 'w-64', height: 'h-64', padding: 'p-1' } // 256px
      case 'tablet':
        return { width: 'w-72', height: 'h-72', padding: 'p-1.5' } // 288px
      case 'desktop':
        return { width: 'w-80', height: 'h-80', padding: 'p-2' } // 320px
      default:
        return { width: 'w-80', height: 'h-80', padding: 'p-2' }
    }
  }, [screenSize])

  // Get responsive gap and spacing
  const getSpacing = useCallback(() => {
    switch (screenSize) {
      case 'mobile':
        return { gap: 'gap-2', padding: 'px-1', margin: 'mb-3' }
      case 'tablet':
        return { gap: 'gap-3', padding: 'px-2', margin: 'mb-4' }
      case 'desktop':
        return { gap: 'gap-4', padding: 'px-3', margin: 'mb-4' }
      default:
        return { gap: 'gap-4', padding: 'px-3', margin: 'mb-4' }
    }
  }, [screenSize])

  // Dynamic shadow tracking with content clipping detection
  const updateScrollShadows = useCallback(() => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const { scrollLeft, scrollWidth, clientWidth } = container
    
    // Only show shadows if content actually overflows (is scrollable)
    const hasOverflow = scrollWidth > clientWidth
    const maxScroll = scrollWidth - clientWidth
    const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0
    setScrollProgress(progress)

    // If no overflow, hide all shadows
    if (!hasOverflow || maxScroll <= 0) {
      setLeftShadowOpacity(0)
      setRightShadowOpacity(0)
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    // Calculate shadow opacities based on actual content clipping
    const fadeDistance = 50 // pixels to fade over
    const leftFadeStart = 10 // start fading when 10px from edge
    const rightFadeStart = 10

    // Left shadow: only visible when there's actually clipped content to the left
    let leftOpacity = 0
    if (scrollLeft > leftFadeStart) {
      leftOpacity = Math.min(1, (scrollLeft - leftFadeStart) / fadeDistance)
    }

    // Right shadow: only visible when there's actually clipped content to the right
    let rightOpacity = 0
    const remainingScroll = maxScroll - scrollLeft
    if (remainingScroll > rightFadeStart) {
      rightOpacity = Math.min(1, (remainingScroll - rightFadeStart) / fadeDistance)
    }

    setLeftShadowOpacity(leftOpacity)
    setRightShadowOpacity(rightOpacity)

    // Update scroll button visibility (existing functionality)
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }, [])

  // Keep the old function name for compatibility
  const updateScrollButtons = updateScrollShadows

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

  const photoDimensions = getPhotoDimensions()
  const spacing = getSpacing()

  return (
    <div className={`relative w-full max-w-full transition-all duration-300 ease-in-out ${className}`}>
      {/* Gallery Header - Responsive */}
      <div className={`flex items-center justify-center ${spacing.margin}`}>
        <h3
          className={`font-semibold text-center transition-all duration-300 ${
            screenSize === 'mobile' ? 'text-lg' : screenSize === 'tablet' ? 'text-xl' : 'text-2xl'
          }`}
          style={{ color: "#2d1b2e" }}
        >
          Recent Photos
        </h3>
      </div>

      {/* Gallery Container - Clean without background shadows */}
      <div className="relative w-full max-w-full overflow-hidden">
        {/* Natural Lighting Shadow System - Warm Tones & Realistic Physics */}
        
        {/* Left Contact Shadow - Natural warm gray with light source angle */}
        <div
          className="absolute left-0 z-10 pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: '12px', // Offset for natural light angle
            bottom: '36px', // Avoid scrollbar area
            width: screenSize === 'mobile' ? '14px' : '20px',
            opacity: leftShadowOpacity * 0.6, // Reduced opacity for realism
            background: screenSize === 'mobile'
              ? 'linear-gradient(95deg, rgba(101,85,74,0.18) 0%, rgba(101,85,74,0.12) 30%, rgba(101,85,74,0.08) 55%, rgba(101,85,74,0.04) 75%, rgba(101,85,74,0.01) 90%, transparent 100%)'
              : 'linear-gradient(95deg, rgba(101,85,74,0.22) 0%, rgba(101,85,74,0.16) 25%, rgba(101,85,74,0.11) 45%, rgba(101,85,74,0.06) 65%, rgba(101,85,74,0.03) 80%, rgba(101,85,74,0.01) 92%, transparent 100%)',
            filter: 'blur(4px)', // Increased blur for softer edges
            transform: `skewY(-2deg) translateX(${scrollProgress * 1.5}px) translateY(${scrollProgress * 0.5}px)` // Natural perspective
          }}
        />
        
        {/* Left Ambient Shadow - Warm brown ambient light */}
        <div
          className="absolute left-0 z-9 pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: '8px',
            bottom: '40px',
            width: screenSize === 'mobile' ? '24px' : '32px',
            opacity: leftShadowOpacity * 0.4, // Very subtle ambient
            background: screenSize === 'mobile'
              ? 'linear-gradient(92deg, rgba(120,102,88,0.12) 0%, rgba(120,102,88,0.07) 40%, rgba(120,102,88,0.03) 70%, rgba(120,102,88,0.01) 85%, transparent 100%)'
              : 'linear-gradient(92deg, rgba(120,102,88,0.15) 0%, rgba(120,102,88,0.09) 35%, rgba(120,102,88,0.05) 60%, rgba(120,102,88,0.02) 80%, rgba(120,102,88,0.005) 92%, transparent 100%)',
            filter: 'blur(8px)', // Heavy blur for ambient diffusion
            transform: `skewY(-1deg) translateX(${scrollProgress * 0.8}px) translateY(${scrollProgress * 0.3}px)` // Gentle perspective
          }}
        />
        
        {/* Right Contact Shadow - Natural warm gray with light source angle */}
        <div
          className="absolute right-0 z-10 pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: '12px', // Offset for natural light angle
            bottom: '36px', // Avoid scrollbar area
            width: screenSize === 'mobile' ? '14px' : '20px',
            opacity: rightShadowOpacity * 0.6, // Reduced opacity for realism
            background: screenSize === 'mobile'
              ? 'linear-gradient(265deg, rgba(101,85,74,0.18) 0%, rgba(101,85,74,0.12) 30%, rgba(101,85,74,0.08) 55%, rgba(101,85,74,0.04) 75%, rgba(101,85,74,0.01) 90%, transparent 100%)'
              : 'linear-gradient(265deg, rgba(101,85,74,0.22) 0%, rgba(101,85,74,0.16) 25%, rgba(101,85,74,0.11) 45%, rgba(101,85,74,0.06) 65%, rgba(101,85,74,0.03) 80%, rgba(101,85,74,0.01) 92%, transparent 100%)',
            filter: 'blur(4px)', // Increased blur for softer edges
            transform: `skewY(2deg) translateX(${-scrollProgress * 1.5}px) translateY(${scrollProgress * 0.5}px)` // Natural perspective
          }}
        />
        
        {/* Right Ambient Shadow - Warm brown ambient light */}
        <div
          className="absolute right-0 z-9 pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: '8px',
            bottom: '40px',
            width: screenSize === 'mobile' ? '24px' : '32px',
            opacity: rightShadowOpacity * 0.4, // Very subtle ambient
            background: screenSize === 'mobile'
              ? 'linear-gradient(268deg, rgba(120,102,88,0.12) 0%, rgba(120,102,88,0.07) 40%, rgba(120,102,88,0.03) 70%, rgba(120,102,88,0.01) 85%, transparent 100%)'
              : 'linear-gradient(268deg, rgba(120,102,88,0.15) 0%, rgba(120,102,88,0.09) 35%, rgba(120,102,88,0.05) 60%, rgba(120,102,88,0.02) 80%, rgba(120,102,88,0.005) 92%, transparent 100%)',
            filter: 'blur(8px)', // Heavy blur for ambient diffusion
            transform: `skewY(1deg) translateX(${-scrollProgress * 0.8}px) translateY(${scrollProgress * 0.3}px)` // Gentle perspective
          }}
        />
        {/* Scrollable Container - With custom scrollbar */}
        <div
          ref={scrollContainerRef}
          className={`
            photo-gallery-scroll
            flex ${spacing.gap} overflow-x-auto pt-2 ${spacing.padding}
            ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}
            transition-all duration-300 ease-in-out
          `}
          style={{
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '20px', // Space for scrollbar
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
                className={`flex-shrink-0 relative group photo-container ${photoDimensions.width} ${photoDimensions.height} ${photoDimensions.padding} transition-all duration-300 ease-in-out`}
              >
                {/* Photo Frame - Clean without individual shadows, only overlay shadows */}
                <div
                  className="relative w-full h-full bg-white rounded-lg border-2 border-pink-200 overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer"
                  style={{
                    transformOrigin: 'center center',
                    // No individual photo shadows - only the overlay shadows will be visible
                    boxShadow: 'none'
                  }}
                  onClick={() => handlePhotoTap(index)}
                >
                  {/* Photo */}
                  <img
                    src={photo}
                    alt={`Captured photo ${index + 1}`}
                    className="w-full h-full object-cover transition-all duration-300"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                  
                  {/* Photo number badge - Responsive */}
                  <div className={`absolute bg-pink-500 text-white rounded-full font-medium transition-all duration-300 ${
                    screenSize === 'mobile'
                      ? 'top-1 right-1 text-xs px-1.5 py-0.5'
                      : 'top-2 right-2 text-sm px-2 py-1'
                  }`}>
                    #{index + 1}
                  </div>

                  {/* Responsive hover overlay with actions */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
                    isTouchDevice
                      ? (isActive ? 'opacity-100' : 'opacity-0')
                      : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <div className={`absolute flex justify-center transition-all duration-300 ${
                      screenSize === 'mobile'
                        ? 'bottom-2 left-2 right-2 gap-1'
                        : 'bottom-3 left-3 right-3 gap-2'
                    }`}>
                      {onDownload && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDownload(photo, index)
                            if (isTouchDevice) setActivePhotoIndex(null)
                          }}
                          className={`bg-white text-gray-800 rounded font-medium hover:bg-gray-100 transition-colors flex items-center gap-1 shadow-md ${
                            screenSize === 'mobile'
                              ? 'px-2 py-1 text-xs rounded-md'
                              : 'px-3 py-2 text-sm rounded-lg'
                          }`}
                        >
                          {screenSize === 'mobile' ? 'DL' : 'Download'}
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(photo)
                            if (isTouchDevice) setActivePhotoIndex(null)
                          }}
                          className={`bg-pink-500 text-white rounded font-medium hover:bg-pink-600 transition-colors flex items-center gap-1 shadow-md ${
                            screenSize === 'mobile'
                              ? 'px-2 py-1 text-xs rounded-md'
                              : 'px-3 py-2 text-sm rounded-lg'
                          }`}
                          title="Delete photo"
                        >
                          {screenSize === 'mobile' ? '×' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile tap indicator - Responsive */}
                  {isTouchDevice && !isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200">
                      <div className={`bg-white/90 rounded-full text-gray-700 font-medium transition-all duration-300 ${
                        screenSize === 'mobile'
                          ? 'p-1 text-xs'
                          : 'p-2 text-sm'
                      }`}>
                        {screenSize === 'mobile' ? 'Tap' : 'Tap for actions'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}