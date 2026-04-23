import { useContext, useState, memo, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import './Shop.css'
import { StoreContext } from '../../Context/StoreContext'
import FoodItem from '../../Components/FoodItem/FoodItem'
import BoxItem from '../../Components/BoxItem/BoxItem'
import { NavContext } from '../../Context/NavContext'

const ShopComponent = () => {
  const { food_list, box_list, loading } = useContext(StoreContext)
  const { setActiveNav } = useContext(NavContext)
  const [searchParams] = useSearchParams()
  const [expandedItem, setExpandedItem] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 21

  // Set active nav to 'shop' when component mounts
  useEffect(() => {
    setActiveNav('shop')
  }, [setActiveNav])

  // Handle category from URL parameters
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category')
    if (categoryFromUrl) {
      // Convert URL category to match exact category names
      const formattedCategory = categoryFromUrl === 'all' ? 'all' : 
        categoryFromUrl.split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      setSelectedCategory(formattedCategory)
    }
  }, [searchParams])

  const categories = ['all', 'Boxes', ...new Set(food_list.map(item => item.category))]

  const getLowestAvailablePrice = (item) => {
    if (!item.quantityOptions || !item.prices) return 0;
    
    const quantities = [
      'g100', 'g150', 'g200', 'g250', 
      'g300', 'g400', 'g500', 'kg1'
    ];
    
    let lowestPrice = Infinity;
    quantities.forEach(size => {
      if (item.quantityOptions[size] && item.prices[size] !== undefined) {
        lowestPrice = Math.min(lowestPrice, item.prices[size]);
      }
    });
    
    return lowestPrice === Infinity ? 0 : lowestPrice;
  };

  const filteredAndSortedItems = useMemo(() => {
    let items = []
    if (selectedCategory === 'all') items = food_list
    else if (selectedCategory === 'Boxes') items = [] // boxes handled separately
    else items = food_list.filter(item => 
          item.category.toLowerCase() === selectedCategory.toLowerCase()
        )

    // Apply search filter
    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply sorting
    return items.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return getLowestAvailablePrice(a) - getLowestAvailablePrice(b);
        case 'price-high':
          return getLowestAvailablePrice(b) - getLowestAvailablePrice(a);
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })
  }, [food_list, selectedCategory, searchQuery, sortBy])

  // For boxes, derive list to display
  const displayedBoxes = useMemo(() => {
    if (selectedCategory !== 'Boxes') return []
    // sort boxes by name for now
    return box_list.slice().sort((a,b) => a.name.localeCompare(b.name))
  }, [box_list, selectedCategory])

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage)
  const paginatedItems = filteredAndSortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Reset to first page and scroll to top when filters change
  useEffect(() => {
    setCurrentPage(1)
    scrollToTop()
  }, [selectedCategory, searchQuery, sortBy])

  // Handle page change with smooth scroll
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Add a small delay before scrolling to ensure the new items are rendered
    setTimeout(scrollToTop, 100);
  };

  // Don't render anything while initial data is loading
  if (loading) return null

  return (
    <div className="shop">
      <div className="shop-banner">
        <h1 className="banner-title">Our Products</h1>
      </div>
      <div className="shop-container">
        {/* Left Sidebar */}
        <div className="categories-sidebar">
          <h2>Select from Categories below</h2>
          <div className="categories-list">
  {categories.map((category, index) => {
    // 📝 Create display name mapping
    let displayName = category;
    if (category.toLowerCase().includes('vegetables')) {
      displayName = `Organic ${category}`;
    } else if (category.toLowerCase().includes('fruits')) {
      displayName = `Organic ${category}`;
    } else if (category.toLowerCase() === 'groceries') {
      displayName = 'Organic Groceries';
    } else if (category.toLowerCase() === 'all') {
      displayName = 'All Products';
    }

    return (
      <div
        key={index}
        className={`category-item ${selectedCategory === category ? 'active' : ''}`}
        onClick={() => setSelectedCategory(category)}
      >
        <i
          className={`fas fa-${
            category === 'all'
              ? 'th-large'
              : category.toLowerCase().includes('exotic vegetables')
              ? 'seedling'
              : category.toLowerCase().includes('exotic fruits')
              ? 'lemon'
              : category.toLowerCase().includes('vegetables')
              ? 'carrot'
              : category.toLowerCase().includes('fruits')
              ? 'apple-alt'
              : category.toLowerCase() === 'meat'
              ? 'drumstick-bite'
              : category.toLowerCase() === 'groceries'
              ? 'shopping-basket'
              : 'utensils'
          }`}
        ></i>

        {/* ✅ Display modified name on UI */}
        <span>{displayName}</span>

        <span className="category-count">
          {category === 'Boxes' ? box_list.length : food_list.filter(item =>
            category === 'all' ? true : item.category === category
          ).length}
        </span>
      </div>
    );
  })}
</div>

        </div>

        {/* Main Content */}
        <div className="shop-content">
          <div className="shop-controls">
            <p className="products-count">
              Showing {selectedCategory === 'Boxes' ? displayedBoxes.length : paginatedItems.length} of {selectedCategory === 'Boxes' ? displayedBoxes.length : filteredAndSortedItems.length} products
            </p>
            <div className="controls-right">
              <div className="search-bar">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
          
          <div className="food-display-list">
            {selectedCategory === 'Boxes' ? (
              displayedBoxes.map(box => (
                <BoxItem key={box._id} box={box} />
              ))
            ) : (
              paginatedItems.map((item) => (
                <FoodItem
                  key={item._id}
                  id={item._id}
                  {...item}
                  isExpanded={expandedItem === item._id}
                  onExpand={() => {
                    // Close any open item before expanding the new one
                    if (expandedItem === item._id) {
                      setExpandedItem(null);
                    } else {
                      setExpandedItem(item._id);
                    }
                  }}
                />
              ))
            )}
            {(selectedCategory === 'Boxes' ? displayedBoxes.length === 0 : paginatedItems.length === 0) && (
              <div className="no-results">
                <i className="fas fa-search"></i>
                <p>No products found</p>
                <p>Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              
              <div className="page-numbers">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => handlePageChange(index + 1)}
                    className={`page-number ${currentPage === index + 1 ? 'active' : ''}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Shop = memo(ShopComponent)
export default Shop