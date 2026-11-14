import PropTypes from 'prop-types'
import { motion } from 'framer-motion'

/**
 * Fades + slides children in when they scroll into view (once).
 * Usage: <Reveal delay={0.1}><Card/></Reveal>
 */
const Reveal = ({ children, delay = 0, y = 24, as = 'div', className, ...rest }) => {
  const MotionTag = motion[as] || motion.div
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}

Reveal.propTypes = {
  children: PropTypes.node,
  delay: PropTypes.number,
  y: PropTypes.number,
  as: PropTypes.string,
  className: PropTypes.string,
}

export default Reveal
