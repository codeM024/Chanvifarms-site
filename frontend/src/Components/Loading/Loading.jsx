import { memo, useEffect, useState, useRef } from 'react'
import './Loading.css'
import Chanvifarm_logo1 from '../../assets/Chanvifarm_logo1.png' // Update path as per your project structure
import { preloadCriticalAssets, trackLoadingProgress } from './LoadingOptimizer'

const Loading = () => {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('Growing Nature\'s Best...')
  const progressFillRef = useRef(null)
  
  useEffect(() => {
    preloadCriticalAssets().then(() => {
      setLoadingText('Almost ready...')
    })
    trackLoadingProgress((progressValue) => {
      setProgress(progressValue)
      if (progressFillRef.current) {
        progressFillRef.current.style.width = `${progressValue}%`
      }
      if (progressValue > 80) {
        setLoadingText('Ready to harvest!')
      } else if (progressValue > 50) {
        setLoadingText('Nurturing fresh produce...')
      }
    })
  }, [])

  return (
    <div className="loading-container enhanced-bg">
      <div className="loading-content enhanced-content">
        <div className="logo-wrapper">
          <div className="spinner-ring"></div>
          <div className="logo-container enhanced-logo-container">
            <img 
              src={Chanvifarm_logo1} 
              alt="Chanvi Farms" 
              className="logo-svg enhanced-logo"
              style={{
                transform: `scale(${1.8 + progress/200}) rotate(${progress * 1.8}deg)`,
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
        </div>
        
        <div className="loading-text enhanced-loading-text">
          <h2 className="brand-title">CHANVI FARMS</h2>
          <p className="animated-loading-text">
            {loadingText}
          </p>
          <div className="progress-container">
            <div className="progress-bar enhanced-progress-bar">
              <div 
                className="progress-fill enhanced-progress-fill" 
                ref={progressFillRef}
                style={{ width: `${progress}%` }}
              >
                <div className="progress-glow"></div>
              </div>
            </div>
            <div className="progress-percentage enhanced-percentage">
              {progress}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(Loading)