/**
 * LoadingTest.jsx
 * A simple component to test the Loading component
 * 
 * To use this test component:
 * 1. Import it in a page where you want to test the loading component
 * 2. Render it with <LoadingTest duration={5000} /> (duration in ms)
 */

import { useState, useEffect } from 'react'
import Loading from './Loading'

const LoadingTest = ({ duration = 3000, children }) => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading for the specified duration
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  return isLoading ? <Loading /> : children || <div className="test-content">Loading Complete!</div>
}

export default LoadingTest

/**
 * Example usage:
 * 
 * import LoadingTest from './Components/Loading/LoadingTest'
 * 
 * function MyPage() {
 *   return (
 *     <LoadingTest duration={5000}>
 *       <div>My page content after loading</div>
 *     </LoadingTest>
 *   )
 * }
 */