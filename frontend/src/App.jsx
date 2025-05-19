import {useState} from 'react'
import Navbar from "./Components/Navbar/Navbar"
import { Routes,Route } from 'react-router-dom'
import Cart from './Pages/Cart/Cart'
import Home from './Pages/Home/Home'
import Shop from './Pages/Shop/Shop'
import About from './Pages/About/About'
import FAQ from './Pages/FAQ/FAQ'
import Contact from './Pages/Contact/Contact'
import PlaceOrder from './Pages/PlaceOrder/PlaceOrder'
import Footer from './Components/Footer/Footer'
import LoginPopup from './Components/LoginPopup/LoginPopup'
import FloatingMessage from './Components/FloatingMessage/FloatingMessage'
import Verify from './Pages/Verify/Verify'
import MyOrders from "./Pages/MyOrders/MyOrders"
import Terms from './Pages/Terms/Terms'
import Privacy from './Pages/Privacy/Privacy'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const App = () => {
  const [showLogin,setShowLogin] = useState(false)

  return (
   <>
   <ToastContainer />
   {showLogin ? <LoginPopup setShowLogin={setShowLogin}/> : null}
    <div className="app">
      <Navbar setShowLogin={setShowLogin}/>
      <FloatingMessage position="top-right" />
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/about' element={<About/>}/>
        <Route path='/shop' element={<Shop/>}/>
        <Route path='/faq' element={<FAQ/>}/>
        <Route path='/contact' element={<Contact/>}/>
        <Route path='/cart' element={<Cart/>}/>
        <Route path='/order' element={<PlaceOrder/>}/>
        <Route path='/verify' element={<Verify/>}/>
        <Route path='/myorders' element={<MyOrders/>} />
        <Route path='/terms' element={<Terms/>} />
        <Route path='/privacy' element={<Privacy/>} />
      </Routes>
    </div>
    <Footer/>
   </>
  )
}

export default App