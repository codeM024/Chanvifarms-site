import { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import "./FoodDisplay.css"
import { StoreContext } from '../../Context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'
import FoodItemSkeleton from '../FoodItem/FoodItemSkeleton'
import StatusState from '../FoodItem/StatusState'
import Reveal from '../Motion/Reveal'
import { useNavigate } from 'react-router-dom'

const tabs = ['All Products', 'Vegetables', 'Fruits', 'Exotic Vegetables', 'Exotic Fruits', 'Groceries']

// ✅ Function to modify tab display names only for UI
const getDisplayTabTitle = (tab) => {
  if (tab.toLowerCase().includes('vegetables')) {
    return `Organic ${tab}`
  } else if (tab.toLowerCase().includes('fruits')) {
    return `Organic ${tab}`
  } else if (tab.toLowerCase() === 'groceries') {
    return 'Organic Groceries'
  }
  return tab
}

const reload = () => window.location.reload()

const FoodDisplay = ({ category }) => {
  const { food_list, loading, error } = useContext(StoreContext)
  const navigate = useNavigate()
  const [selectedTab, setSelectedTab] = useState('All Products')

  const displayCategory = selectedTab === 'All Products' ? category : selectedTab

  const filteredItems = food_list
    .filter(item => item.status === 'in-stock')
    .filter(item => displayCategory === "All" || displayCategory === item.category)
    .sort((a, b) => a.price - b.price)

  const displayItems = filteredItems.slice(0, 5)

  const handleViewAll = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const categoryToUrl = (cat) => {
      if (cat === 'All Products') return 'all';
      return cat.toLowerCase().replace(/\s+/g, '-');
    };
    navigate(`/shop?category=${categoryToUrl(selectedTab)}`);
  };

  const isLoading = loading && food_list.length === 0
  const hasFailed = !loading && (error || food_list.length === 0)

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="food-display-list" aria-busy="true">
          <FoodItemSkeleton count={6} />
        </div>
      )
    }

    if (hasFailed) {
      return (
        <StatusState
          icon={error ? 'fa-cloud-sun-rain' : 'fa-seedling'}
          title={error ? "We couldn't load our produce" : 'Our shelves are being restocked'}
          message={error
            ? 'Please check your connection and try again.'
            : 'Fresh products will be back shortly. Please try again in a moment.'}
          onRetry={reload}
        />
      )
    }

    if (filteredItems.length === 0) {
      return (
        <StatusState
          icon="fa-leaf"
          title="No items available in this category at the moment."
          message="Please check back later or try another category."
        />
      )
    }

    return (
      <div className="food-display-list" key={selectedTab}>
        {displayItems.map((item, index) => (
          <Reveal key={item._id} className="food-item-wrap" delay={Math.min(index * 0.05, 0.25)} y={16}>
            <FoodItem
              id={item._id}
              name={item.name}
              description={item.description}
              prices={item.prices || { g250: item.price }}
              marketPrices={item.marketPrices || { g250: item.marketPrice || item.price }}
              image={item.image}
              quantityOptions={item.quantityOptions || { g250: true }}
              status={item.status}
            />
          </Reveal>
        ))}
        <Reveal className="food-item-wrap" delay={Math.min(displayItems.length * 0.05, 0.3)} y={16}>
          <div
            className="view-all-card"
            onClick={handleViewAll}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleViewAll() }}
          >
            <div className="view-all-content">
              <span className="view-all-icon"><i className="fas fa-arrow-right"></i></span>
              <h3>View All Products</h3>
              <p>Explore our complete collection</p>
            </div>
          </div>
        </Reveal>
      </div>
    )
  }

  return (
    <section className="food-display" id="food-display">
      <Reveal className="food-display-header">
        <h2>Choose the best!</h2>
        <div className="category-tabs" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={selectedTab === tab}
              className={`category-tab ${selectedTab === tab ? 'active' : ''}`}
              onClick={() => setSelectedTab(tab)}
            >
              {selectedTab === tab && (
                <motion.span
                  layoutId="food-tab-pill"
                  className="category-tab-pill"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <span className="category-tab-label">{getDisplayTabTitle(tab)}</span>
            </button>
          ))}
        </div>
      </Reveal>

      {renderBody()}
    </section>
  )
}

FoodDisplay.propTypes = {
  category: PropTypes.string
}

export default FoodDisplay
