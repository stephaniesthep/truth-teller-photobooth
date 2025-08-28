import React from 'react';

interface BackgroundVideoProps {
  className?: string;
}

const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center w-full max-w-[640px] h-[480px] ${className}`}>
      <img
        src="/video/backgroundvideo.gif"
        alt=""
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
};

export default BackgroundVideo;