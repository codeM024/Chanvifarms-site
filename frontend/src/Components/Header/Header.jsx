import './Header.css'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

const Header = () => {
  return (
    <div className="header">
      <motion.div
        className="header-contents"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.span className="header-eyebrow" variants={item}>
          <i className="fas fa-leaf"></i> 100% Organic &middot; Farm Fresh
        </motion.span>
        <motion.h2 variants={item}>
          Farm-Fresh Organic Vegetables & Fruits Delivered to Your Doorstep
        </motion.h2>
        <motion.p variants={item}>
          Order online and enjoy the freshest organic vegetables and tiffins, sourced directly from trusted local farmers. Experience quality, taste, and nutrition delivered right to your home.
        </motion.p>
        <motion.div variants={item}>
          <Link to="/shop" className="header-cta">
            <span>Explore Products</span>
            <i className="fas fa-arrow-right"></i>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Header
