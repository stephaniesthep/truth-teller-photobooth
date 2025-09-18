import React from 'react';

interface BackgroundVideoProps {
  className?: string;
}

const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center w-full crystal-ball-container ${className}`}>
      <img
        src="/video/backgroundvideo.gif"
        alt=""
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
};

export default BackgroundVideo;