import { lazy, Suspense } from 'react';
import Loading from './Loading';

/**
 * Creates a lazy-loaded component with the Chanvi Farms custom loading screen
 * @param {Function} importFunc - The import function for the component
 * @returns {React.LazyExoticComponent} - The lazy-loaded component with loading screen
 */
export const lazyWithLoading = (importFunc) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={<Loading />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * HOC to add loading state to any component
 * @param {React.Component} Component - The component to wrap
 * @returns {React.Component} - The wrapped component with loading functionality
 */
export const withLoading = (Component) => {
  return (props) => {
    // You can add additional loading logic here if needed
    return (
      <Suspense fallback={<Loading />}>
        <Component {...props} />
      </Suspense>
    );
  };
};

/**
 * Utility to preload a component before it's needed
 * @param {Function} importFunc - The import function for the component
 */
export const preloadComponent = (importFunc) => {
  const componentPromise = importFunc();
  return componentPromise;
};

/**
 * Example usage in your app:
 * 
 * // Instead of:
 * // import HeavyComponent from './HeavyComponent';
 * 
 * // Use:
 * const HeavyComponent = lazyWithLoading(() => import('./HeavyComponent'));
 * 
 * // To preload a component before it's needed:
 * // useEffect(() => {
 * //   preloadComponent(() => import('./SoonNeededComponent'));
 * // }, []);
 */