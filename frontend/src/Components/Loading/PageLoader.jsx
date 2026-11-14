import './Loading.css'

// Lightweight inline loader used while a route chunk downloads
const PageLoader = () => (
  <div className="page-loader" role="status" aria-label="Loading page">
    <span className="page-loader-dot" />
    <span className="page-loader-dot" />
    <span className="page-loader-dot" />
  </div>
)

export default PageLoader
