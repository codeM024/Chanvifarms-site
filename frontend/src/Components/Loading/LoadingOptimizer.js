/**
 * LoadingOptimizer.js
 * Utility to optimize loading performance and provide better user experience
 */

// List of critical assets to preload
const criticalAssets = [
  '/Chanvifarm_lcon.svg',
  '/header_img.png',
  // Add other critical images/assets here
];

/**
 * Preload critical assets to improve loading performance
 * @returns {Promise} Promise that resolves when all assets are loaded
 */
export const preloadCriticalAssets = () => {
  const promises = criticalAssets.map(asset => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(asset);
      img.onerror = () => {
        console.warn(`Failed to preload asset: ${asset}`);
        resolve(null); // Resolve anyway to not block loading
      };
      img.src = asset;
    });
  });

  return Promise.all(promises);
};

/**
 * Calculate and update loading progress
 * @param {Function} updateProgressCallback - Callback to update progress in UI
 * @returns {Promise} Promise that resolves when loading is complete
 */
export const trackLoadingProgress = (updateProgressCallback) => {
  return new Promise((resolve) => {
    // Start with initial progress
    let progress = 10;
    updateProgressCallback(progress);

    // Simulate or track actual loading progress
    const interval = setInterval(() => {
      // Increment progress
      progress += Math.floor(Math.random() * 10) + 5;
      
      if (progress >= 100) {
        progress = 100;
        updateProgressCallback(progress);
        clearInterval(interval);
        
        // Add a small delay before resolving to ensure animations complete
        setTimeout(() => resolve(), 500);
      } else {
        updateProgressCallback(progress);
      }
    }, 300);
  });
};

/**
 * Optimize page loading by prioritizing critical resources
 */
export const optimizePageLoading = () => {
  // Add resource hints
  const addResourceHint = (rel, href) => {
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    document.head.appendChild(link);
  };

  // Preconnect to important domains
  addResourceHint('preconnect', window.location.origin);
  
  // Prefetch important assets
  criticalAssets.forEach(asset => {
    addResourceHint('prefetch', asset);
  });
};

/**
 * Initialize loading optimization
 * Call this function early in your application bootstrap
 */
export const initLoadingOptimizer = () => {
  // Start optimizing as soon as possible
  optimizePageLoading();
  
  // Return preloading promise for critical assets
  return preloadCriticalAssets();
};