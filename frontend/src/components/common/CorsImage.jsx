import React, { useState, useEffect } from 'react';
import { convertImageToBase64 } from '../../utils/imageUtils';

const CorsImage = ({ 
  src, 
  alt, 
  className, 
  onError,
  onLoad,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [_isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        
        const base64Url = await convertImageToBase64(src);
        if (base64Url) {
          setImageSrc(base64Url);
          setIsLoading(false);
          onLoad?.();
          return;
        }

        
        setImageSrc(src);
        setIsLoading(false);
        onLoad?.();
      } catch (error) {
        console.error('Failed to load image:', error);
        setHasError(true);
        setIsLoading(false);
        onError?.(error);
      }
    };

    loadImage();
  }, [src, onLoad, onError]);

  const handleImageError = (e) => {
    console.log("Image failed to load:", src);
    setHasError(true);
    setIsLoading(false);
    onError?.(e);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
      {...props}
    />
  );
};

export default CorsImage;