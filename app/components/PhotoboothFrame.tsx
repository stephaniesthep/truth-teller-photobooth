interface PhotoboothFrameProps {
  imageData?: string;
  className?: string;
  fixedSize?: boolean;
}

export default function PhotoboothFrame({ imageData, className = '', fixedSize = false }: PhotoboothFrameProps) {
  if (fixedSize) {
    return (
      <div className="relative p-6 w-[500px] h-[500px] overflow-hidden" style={{ backgroundColor: 'transparent' }}>
        {/* Main frame with transparent background and rounded corners */}
        <div className="absolute inset-0 rounded-xl border-4 border-pink-400 bg-pink-100" style={{ backgroundColor: 'rgba(251, 207, 232, 0.9)' }}>
          {/* Pattern overlay with reduced opacity */}
          <div
            className="absolute inset-0 rounded-xl opacity-20 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/frame-background.jpg')" }}
          />
        </div>

        {/* Logo at the top */}
        <div className="text-center mb-4 relative z-10">
          <h1 className="text-2xl leading-7 font-bold text-pink-700 font-serif italic m-0">
            Truth Teller
          </h1>
        </div>

        {/* Photo container */}
        <div className="relative p-3 bg-white rounded-lg shadow-inner z-10 h-[340px]">
          <div className="w-full h-full overflow-hidden rounded-lg border-4 border-pink-400 relative flex items-center justify-center bg-gray-100 box-border aspect-square">
            {imageData && (
              <img
                src={imageData}
                alt="Captured photo"
                className="w-full h-full object-cover object-center"
              />
            )}
          </div>
        </div>

        {/* Bottom logo */}
        <div className="text-center mt-4 relative z-10"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${className}`}>
      {/* Main photobooth frame */}
      <div className="relative p-6 rounded-lg shadow-2xl border-4 border-pink-400 max-w-md w-full overflow-hidden bg-pink-100">
        {/* Pattern overlay with reduced opacity */}
        <div
          className="absolute inset-0 rounded-lg opacity-20 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/frame-background.jpg')" }}
        />

        {/* Logo at the top */}
        <div className="text-center mb-4 relative z-10">
          <h1 className="text-2xl leading-8 font-bold text-pink-700 font-serif italic">
            Truth Teller
          </h1>
        </div>

        {/* Photo container */}
        <div className="relative p-3 bg-white rounded-lg shadow-inner z-10">
          <div className="aspect-[4/3] overflow-hidden rounded-lg border-4 border-pink-400 relative flex items-center justify-center bg-gray-100 max-h-[300px]">
            {imageData && (
              <img
                src={imageData}
                alt="Captured photo"
                className="w-full h-full object-contain object-center"
              />
            )}
          </div>
        </div>

        {/* Bottom logo */}
        <div className="text-center mt-4 relative z-10"></div>
      </div>
    </div>
  )
}
