/**
 * Example of how to use the enhanced Loading component in your App.jsx
 * This is just a reference - do not replace your actual App.jsx with this file
 */

import { useState, useEffect, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Loading from './Components/Loading/Loading'
import { lazyWithLoading } from './Components/Loading/LazyLoadHelper'
import { initLoadingOptimizer } from './Components/Loading/LoadingOptimizer'

// Lazy load non-critical pages for better performance
const Home = lazyWithLoading(() => import('./Pages/Home'))
const About = lazyWithLoading(() => import('./Pages/About'))
const Products = lazyWithLoading(() => import('./Pages/Products'))
const Contact = lazyWithLoading(() => import('./Pages/Contact'))

// Regular import for critical components that should load immediately
import Navbar from './Components/Navbar/Navbar'
import Footer from './Components/Footer/Footer'

function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    // Initialize loading optimization
    initLoadingOptimizer()
      .then(() => {
        // Simulate or wait for initial app data to load
        setTimeout(() => {
          setIsInitialLoading(false)
        }, 2000) // Adjust timing as needed or replace with actual data loading
      })
  }, [])

  // Show the loading screen during initial app load
  if (isInitialLoading) {
    return <Loading />
  }

  return (
    <Router>
      <div className="app">
        <Navbar />
        <main>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/products" element={<Products />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App