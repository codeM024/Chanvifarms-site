import { useState, useEffect } from 'react';
import './List.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const List = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, itemId: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all'
  });
  const url = "https://chanvifarms-site-backend.onrender.com";

  // Get unique categories from the list
  const categories = ['all', ...new Set(list.map(item => item.category))];
  const statuses = ['all', 'in-stock', 'out-of-stock', 'coming-soon'];

  // Filter list based on search query and filters
  const filteredList = list.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = filters.category === 'all' || item.category === filters.category;
    const matchesStatus = filters.status === 'all' || item.status === filters.status;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${url}/api/food/list`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success) {
        setList(response.data.data || []);
      } else {
        throw new Error(response.data?.message || "Failed to fetch food items");
      }
    } catch (error) {
      console.error("Error fetching food list:", error);
      setError(error.message || "Error loading food items");
      toast.error(error.message || "Error loading food items");
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFood = async (id) => {
    try {
      const response = await axios.post(url + "/api/food/delete", { id });
      if (response.data.success) {
        toast.success("Item removed successfully");
        fetchList();
      } else {
        toast.error(response.data.message || "Failed to remove item");
      }
    } catch (error) {
      console.error("Error removing food:", error);
      toast.error(error.response?.data?.message || "Error removing item");
    }
  };

  const updateFood = async (id, updates) => {
    try {
      const response = await axios.post(url + "/api/food/update", { id, ...updates });
      if (response.data.success) {
        toast.success("Item updated successfully");
        setEditingItem(null);
        fetchList();
      } else {
        toast.error(response.data.message || "Failed to update item");
      }
    } catch (error) {
      console.error("Error updating food:", error);
      toast.error("Error updating item");
    }
  };

  const handleEdit = (item) => {
    setEditingItem({
      ...item,
      prices: item.prices || { g250: 0, g500: 0, kg1: 0 },
      marketPrices: item.marketPrices || { g250: 0, g500: 0, kg1: 0 },
      quantityOptions: item.quantityOptions || { g250: true, g500: false, kg1: false }
    });
  };

  const handleSave = async () => {
    if (!editingItem) return;

    // Validate prices for enabled quantities
    const hasValidPrice = Object.entries(editingItem.quantityOptions)
      .some(([key, enabled]) => enabled && editingItem.prices[key] > 0);

    if (!hasValidPrice) {
      toast.error("Please set at least one valid price for enabled quantities");
      return;
    }

    await updateFood(editingItem._id, {
      prices: editingItem.prices,
      marketPrices: editingItem.marketPrices,
      quantityOptions: editingItem.quantityOptions,
      status: editingItem.status
    });
  };

  const handleDelete = (id) => {
    setDeleteConfirmation({ show: true, itemId: id });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.itemId) {
      await removeFood(deleteConfirmation.itemId);
    }
    setDeleteConfirmation({ show: false, itemId: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, itemId: null });
  };

  useEffect(() => {
    fetchList();
  }, []);

  if (loading) {
    return (
      <div className="list add flex-col loading-state">
        <p>Loading food items...</p>
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="list add flex-col error-state">
        <p>Error: {error}</p>
        <button onClick={fetchList} className="retry-btn">
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="list add flex-col">
      {deleteConfirmation.show && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-dialog">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this item?</p>
            <div className="dialog-buttons">
              <button onClick={confirmDelete} className="confirm-btn">Yes, Delete</button>
              <button onClick={cancelDelete} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="list-header">
        <div className="list-title">
          <p>Products</p>
          <span className="product-count" title="Total number of products">
            {filteredList.length} {filteredList.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products by name ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          {searchQuery && (
            <i 
              className="fas fa-times" 
              style={{ cursor: 'pointer', marginLeft: '8px' }}
              onClick={() => setSearchQuery('')}
              title="Clear search"
            />
          )}
        </div>
        <div className="filters">
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="list-table">
        <div className="list-table-format title">
          <p>Image</p>
          <p>Name</p>
          <p>Category</p>
          <p>Quantities & Prices</p>
          <p>Status</p>
          <p>Actions</p>
        </div>
        {filteredList.map((item) => (
          <div key={item._id} className={`list-table-format ${item.status !== 'in-stock' ? 'disabled' : ''}`}>
            <img 
              src={`${url}/images/${item.image}`} 
              alt={item.name} 
              className={item.status !== 'in-stock' ? 'grayscale' : ''}
            />
            <p>{item.name}</p>
            <p>{item.category}</p>
            
            {editingItem?._id === item._id ? (
              <div className="edit-prices">
                {['g250', 'g500', 'kg1'].map(size => (
                  <div key={size} className="price-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={editingItem.quantityOptions[size]}
                        onChange={e => {
                          setEditingItem(prev => ({
                            ...prev,
                            quantityOptions: {
                              ...prev.quantityOptions,
                              [size]: e.target.checked
                            }
                          }));
                        }}
                      />
                      {size === 'g250' ? '250g' : size === 'g500' ? '500g' : '1kg'}
                    </label>
                    {editingItem.quantityOptions[size] && (
                      <div className="price-inputs">
                        <input
                          type="number"
                          value={editingItem.prices[size] || ''}
                          onChange={e => {
                            setEditingItem(prev => ({
                              ...prev,
                              prices: {
                                ...prev.prices,
                                [size]: parseFloat(e.target.value) || 0
                              }
                            }));
                          }}
                          placeholder="Price"
                          min="0"
                          step="0.01"
                        />
                        <input
                          type="number"
                          value={editingItem.marketPrices[size] || ''}
                          onChange={e => {
                            setEditingItem(prev => ({
                              ...prev,
                              marketPrices: {
                                ...prev.marketPrices,
                                [size]: parseFloat(e.target.value) || 0
                              }
                            }));
                          }}
                          placeholder="Market Price"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="quantity-prices">
                {Object.entries(item.quantityOptions || {}).map(([size, enabled]) => enabled && (
                  <div key={size} className="quantity-price-badge">
                    <span>{size === 'g250' ? '250g' : size === 'g500' ? '500g' : '1kg'}</span>
                    <span>₹{item.prices[size]}</span>
                    {item.marketPrices[size] > item.prices[size] && (
                      <span className="market-price">₹{item.marketPrices[size]}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="status-selector">
              {editingItem?._id === item._id ? (
                <select 
                  value={editingItem.status}
                  onChange={e => {
                    setEditingItem(prev => ({
                      ...prev,
                      status: e.target.value
                    }));
                  }}
                >
                  <option value="in-stock">In Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="coming-soon">Coming Soon</option>
                </select>
              ) : (
                <span className={`status-badge ${item.status}`}>
                  {item.status.replace(/-/g, ' ')}
                </span>
              )}
            </div>

            <div className="actions">
              {editingItem?._id === item._id ? (
                <>
                  <button onClick={handleSave} className="save-btn" title="Save Changes">
                    <i className="fas fa-check"></i>
                  </button>
                  <button 
                    onClick={() => setEditingItem(null)} 
                    className="cancel-btn" 
                    title="Cancel"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => handleEdit(item)} 
                    className="edit-btn"
                    title="Edit Item"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    onClick={() => handleDelete(item._id)} 
                    className="remove-btn"
                    title="Delete Item"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default List;
