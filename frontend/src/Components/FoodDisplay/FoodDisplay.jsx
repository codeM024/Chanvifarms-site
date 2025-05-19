import { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import "./FoodDisplay.css"
import { StoreContext } from '../../Context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'
import { useNavigate } from 'react-router-dom'

const FoodDisplay = ({ category }) => {
    const { food_list } = useContext(StoreContext)
    const navigate = useNavigate()
    const [selectedTab, setSelectedTab] = useState('All Products')

    const tabs = ['All Products', 'Vegetables', 'Fruits', 'Exotic Vegetables', 'Exotic Fruits', 'Meat']
    const displayCategory = selectedTab === 'All Products' ? category : selectedTab

    const filteredItems = food_list
        .filter(item => item.status === 'in-stock')  // Only show in-stock items
        .filter(item => displayCategory === "All" || displayCategory === item.category)
        .sort((a, b) => a.price - b.price);  // Sort by price
    
    const displayItems = filteredItems.slice(0, 5)

    if (food_list.length === 0) {
        return (
            <div className="food-display">
                <div className="food-display-header">
                    <h2>Loading products...</h2>
                    <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
            </div>
        );
    }

    if (filteredItems.length === 0) {
        return (
            <div className="food-display">
                <div className="food-display-header">
                    <h2>Choose the best!</h2>
                    <div className="category-tabs">
                        {tabs.map(tab => (
                            <button 
                                key={tab}
                                className={`category-tab ${selectedTab === tab ? 'active' : ''}`}
                                onClick={() => setSelectedTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="no-items-message">
                    <p>No items available in this category at the moment.</p>
                    <p>Please check back later or try another category.</p>
                </div>
            </div>
        );
    }

    const handleViewAll = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Convert category to URL format
        const categoryToUrl = (cat) => {
            if (cat === 'All Products') return 'all';
            return cat.toLowerCase().replace(/\s+/g, '-');
        };
        navigate(`/shop?category=${categoryToUrl(selectedTab)}`);
    };

    return (
        <div className="food-display" id="food-display">
            <div className="food-display-header">
                <h2>Choose the best!</h2>
                <div className="category-tabs">
                    {tabs.map(tab => (
                        <button 
                            key={tab}
                            className={`category-tab ${selectedTab === tab ? 'active' : ''}`}
                            onClick={() => setSelectedTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="food-display-list">
                {displayItems.map((item) => (
                    <FoodItem 
                        key={item._id}
                        id={item._id}
                        name={item.name}
                        description={item.description}
                        prices={item.prices || { g250: item.price }}
                        marketPrices={item.marketPrices || { g250: item.marketPrice || item.price }}
                        image={item.image}
                        quantityOptions={item.quantityOptions || { g250: true }}
                        status={item.status}
                    />
                ))}
                <div className="view-all-card" onClick={handleViewAll}>
                    <div className="view-all-content">
                        <i className="fas fa-arrow-right"></i>
                        <h3>View All Products</h3>
                        <p>Explore our complete collection</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

FoodDisplay.propTypes = {
    category: PropTypes.string
}

export default FoodDisplay