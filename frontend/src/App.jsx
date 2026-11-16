import { useState, useEffect, lazy, Suspense } from 'react'
import PropTypes from 'prop-types'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import Navbar from './Components/Navbar/Navbar'
import Footer from './Components/Footer/Footer'
import FloatingMessage from './Components/FloatingMessage/FloatingMessage'
import PageLoader from './Components/Loading/PageLoader'
import Home from './Pages/Home/Home'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Route-level code splitting: only the home page ships in the initial bundle
const Cart = lazy(() => import('./Pages/Cart/Cart'))
const Shop = lazy(() => import('./Pages/Shop/Shop'))
const About = lazy(() => import('./Pages/About/About'))
const Contact = lazy(() => import('./Pages/Contact/Contact'))
const PlaceOrder = lazy(() => import('./Pages/PlaceOrder/PlaceOrder'))
const Verify = lazy(() => import('./Pages/Verify/Verify'))
const MyOrders = lazy(() => import('./Pages/MyOrders/MyOrders'))
const Terms = lazy(() => import('./Pages/Terms/Terms'))
const Privacy = lazy(() => import('./Pages/Privacy/Privacy'))
const LoginPopup = lazy(() => import('./Components/LoginPopup/LoginPopup'))
const Tiffins = lazy(() => import('./Pages/Tiffins/Tiffins'))
const TiffinCheckout = lazy(() => import('./Pages/TiffinCheckout/TiffinCheckout'))
const TiffinOrders = lazy(() => import('./Pages/TiffinOrders/TiffinOrders'))

// Warm up the most visited pages once the browser is idle
const prefetchRoutes = () => {
  import('./Pages/Shop/Shop')
  import('./Pages/Cart/Cart')
  import('./Pages/About/About')
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
}

const Page = ({ children }) => (
  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
    {children}
  </motion.div>
)

Page.propTypes = { children: PropTypes.node }

const App = () => {
  const [showLogin, setShowLogin] = useState(false)
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  useEffect(() => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500))
    idle(prefetchRoutes)
  }, [])

  const routes = [
    ['/', Home], ['/about', About], ['/shop', Shop], ['/contact', Contact],
    ['/cart', Cart], ['/order', PlaceOrder], ['/verify', Verify],
    ['/myorders', MyOrders], ['/terms', Terms], ['/privacy', Privacy],
    ['/tiffins', Tiffins],
    // Pages that can open the login popup themselves
    ['/tiffins/checkout', TiffinCheckout, true], ['/tiffins/orders', TiffinOrders, true],
  ]

  return (
    <MotionConfig reducedMotion="user">
      <ToastContainer position="top-right" autoClose={2500} newestOnTop theme="light" />
      {showLogin && (
        <Suspense fallback={null}>
          <LoginPopup setShowLogin={setShowLogin} />
        </Suspense>
      )}
      <div className="app">
        <Navbar setShowLogin={setShowLogin} />
        <FloatingMessage position="top-right" />
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              {routes.map(([path, Component, needsLogin]) => (
                <Route
                  key={path}
                  path={path}
                  element={<Page>{needsLogin ? <Component setShowLogin={setShowLogin} /> : <Component />}</Page>}
                />
              ))}
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
      <Footer />
    </MotionConfig>
  )
}

export default App
