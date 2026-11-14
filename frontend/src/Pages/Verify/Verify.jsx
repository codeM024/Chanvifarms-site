import { useEffect } from 'react'
import axios from 'axios'
import './Verify.css'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useContext } from 'react';
import { motion } from 'framer-motion';
import { StoreContext } from '../../Context/StoreContext';


const Verify = () => {

    const [searchParams] = useSearchParams();
    const success = searchParams.get("success")
    const orderId = searchParams.get("orderId")
    // console.log(success,orderId);
    const {url} = useContext(StoreContext);
    const navigate= useNavigate();

    const verifyPayment = async () => {
        const response = await axios.post(url+"/api/order/verify",{success,orderId});
        if(response.data.success){
           navigate("/myorders");
        }
        else{
            navigate("/");
        }
    }

    useEffect(()=>{
       verifyPayment();
    },[])

  return (
    <div className="verify" role="status" aria-live="polite">
      <motion.div
        className="verify-card"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="verify-orb" aria-hidden="true">
          <span className="verify-ring"></span>
          <span className="verify-ring verify-ring-2"></span>
          <span className="spinner"></span>
          <i className="fas fa-leaf verify-leaf"></i>
        </div>
        <h2>Confirming your payment</h2>
        <p>Hang tight, this only takes a moment. Please don&apos;t close or refresh this page.</p>
        <div className="verify-dots" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
      </motion.div>
    </div>
  )
}

export default Verify
