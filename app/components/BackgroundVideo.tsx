import React from 'react';

interface BackgroundVideoProps {
  className?: string;
}

const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img
        src="/video/backgroundvideo.gif"
        alt=""
        className="max-w-full max-h-full object-contain rounded-lg"
        style={{
          maxWidth: '640px',
          maxHeight: '400px',
          width: 'auto',
          height: 'auto'
        }}
      />
    </div>
  );
};

export default BackgroundVideo;