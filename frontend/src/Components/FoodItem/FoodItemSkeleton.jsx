import PropTypes from 'prop-types'
import './FoodItem.css'

// Placeholder card shown while products are loading
const FoodItemSkeleton = ({ count = 6 }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div className="food-item food-item-skeleton" key={i} aria-hidden="true">
        <div className="food-item-img-container skeleton" />
        <div className="product-details">
          <div className="skeleton sk-line sk-line-lg" />
          <div className="skeleton sk-line sk-line-sm" />
          <div className="sk-row">
            <div className="skeleton sk-line sk-line-price" />
            <div className="skeleton sk-line sk-line-select" />
          </div>
          <div className="skeleton sk-btn" />
        </div>
      </div>
    ))}
  </>
)

FoodItemSkeleton.propTypes = {
  count: PropTypes.number,
}

export default FoodItemSkeleton
