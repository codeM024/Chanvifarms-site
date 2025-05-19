import { memo } from 'react'
import './Loading.css'

const Loading = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  )
}

// Memoize the Loading component since it doesn't need to re-render
export default memo(Loading)