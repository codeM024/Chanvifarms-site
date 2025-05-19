import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ImageLoader = ({ src, alt, className }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
    };
  }, [src]);

  return (
    <>
      <div className={`image-loader ${imageLoaded ? 'loaded' : ''}`}>
        {!imageLoaded && <div className="image-placeholder pulse" />}
        {imageSrc && (
          <img
            src={imageSrc}
            alt={alt}
            className={className}
            loading="lazy"
          />
        )}
      </div>
    </>
  );
};
ImageLoader.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string
};

export default ImageLoader;
