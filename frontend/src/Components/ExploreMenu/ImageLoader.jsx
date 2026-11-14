import { useState } from 'react';
import PropTypes from 'prop-types';

// Native lazy-loaded image with a shimmer placeholder and fade-in
const ImageLoader = ({ src, alt, className = '', eager = false }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`image-loader ${loaded ? 'loaded' : 'skeleton'}`}>
      <img
        src={src}
        alt={alt}
        className={`${className} img-fade ${loaded ? 'is-loaded' : ''}`}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </div>
  );
};

ImageLoader.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  eager: PropTypes.bool
};

export default ImageLoader;
