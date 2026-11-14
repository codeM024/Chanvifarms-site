import { useState, useEffect } from 'react';
import './List.css';
import axios from 'axios';
import { imageUrl } from '../../utils/imageUrl';
import { toast } from 'react-toastify';
import { TableSkeleton, EmptyState } from '../../components/Feedback/Feedback';

const List = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, itemId: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all'
  });
  const url = import.meta.env.VITE_BACKEND_URL;

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
      name: item.name,
      prices: item.prices || { g100: 0, g150: 0, g200: 0, g250: 0, g300: 0, g400: 0, g500: 0, kg1: 0 },
      marketPrices: item.marketPrices || { g100: 0, g150: 0, g200: 0, g250: 0, g300: 0, g400: 0, g500: 0, kg1: 0 },
      quantityOptions: item.quantityOptions || { g100: false, g150: false, g200: false, g250: false, g300: false, g400: false, g500: false, kg1: false }
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

    // Validate name
    if (!editingItem.name?.trim()) {
      toast.error("Product name cannot be empty");
      return;
    }

    await updateFood(editingItem._id, {
      name: editingItem.name.trim(),
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

  // UI-only busy flags for button spinners (do not affect what is sent).
  const handleSaveClick = async () => {
    setSaving(true);
    try {
      await handleSave();
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteClick = async () => {
    setDeleting(true);
    try {
      await confirmDelete();
    } finally {
      setDeleting(false);
    }
  };

  const sizeLabel = (size) => (
    size === 'g100' ? '100g' :
    size === 'g150' ? '150g' :
    size === 'g200' ? '200g' :
    size === 'g250' ? '250g' :
    size === 'g300' ? '300g' :
    size === 'g400' ? '400g' :
    size === 'g500' ? '500g' : '1kg'
  );

  const statusPill = {
    'in-stock': 'pill-success',
    'out-of-stock': 'pill-danger',
    'coming-soon': 'pill-warning',
  };

  // Full skeleton only on first load; later refreshes keep the table visible.
  if (loading && list.length === 0) {
    return (
      <div className="list">
        <div className="page-header">
          <div>
            <h1 className="page-title">Products</h1>
            <p className="page-subtitle">Loading your catalogue...</p>
          </div>
        </div>
        <div className="card list-toolbar">
          <span className="skeleton" style={{ height: 42, flex: 1, minWidth: 200 }} />
          <span className="skeleton" style={{ height: 42, width: 150 }} />
          <span className="skeleton" style={{ height: 42, width: 150 }} />
        </div>
        <TableSkeleton rows={7} columns="64px 1.4fr 1fr 2fr 1fr 96px" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="list">
        <div className="card">
          <EmptyState
            error
            icon={<i className="fas fa-exclamation-triangle" />}
            title="Couldn't load products"
            text={`Error: ${error}`}
            action={
              <button onClick={fetchList} className="btn btn-primary retry-btn">
                <i className="fas fa-redo" aria-hidden="true" /> Retry Loading
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="list">
      {deleteConfirmation.show && (
        <div className="modal-overlay delete-confirmation-overlay" onClick={deleting ? undefined : cancelDelete}>
          <div className="modal delete-confirmation-dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className="modal-icon danger"><i className="fas fa-trash" /></div>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this item?</p>
            <div className="modal-actions dialog-buttons">
              <button onClick={cancelDelete} className="btn btn-secondary" disabled={deleting}>Cancel</button>
              <button onClick={handleConfirmDeleteClick} className="btn btn-danger" disabled={deleting}>
                {deleting && <span className="spinner" aria-hidden="true" />}
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="list-title">
          <h1 className="page-title">Products</h1>
          <span className="count-chip product-count" title="Total number of products">
            {filteredList.length} {filteredList.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      <div className="card list-toolbar list-header">
        <div className="search-bar">
          <i className="fas fa-search search-icon" aria-hidden="true" />
          <input
            className="input"
            type="text"
            placeholder="Search products by name ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            aria-label="Search products"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
              aria-label="Clear search"
            >
              <i className="fas fa-times" />
            </button>
          )}
        </div>
        <div className="filters">
          <select
            className="select"
            aria-label="Filter by category"
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
            className="select"
            aria-label="Filter by status"
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

      <div className={`card list-card ${loading ? 'is-refreshing' : ''}`} aria-busy={loading}>
        {loading && <div className="refresh-bar" aria-hidden="true" />}
        {filteredList.length === 0 ? (
          <EmptyState
            icon={<i className="fas fa-seedling" />}
            title={list.length === 0 ? 'No products yet' : 'No matching products'}
            text={list.length === 0
              ? 'Products you add will show up here.'
              : 'Try a different search term or clear the filters.'}
            action={list.length !== 0 && (searchQuery || filters.category !== 'all' || filters.status !== 'all') ? (
              <button
                className="btn btn-secondary"
                onClick={() => { setSearchQuery(''); setFilters({ category: 'all', status: 'all' }); }}
              >
                Clear filters
              </button>
            ) : null}
          />
        ) : (
        <div className="table-wrap list-table">
          <div className="list-table-inner">
            <div className="list-table-format title" role="row">
              <p>Image</p>
              <p>Name</p>
              <p>Category</p>
              <p>Quantities & Prices</p>
              <p>Status</p>
              <p className="actions-head">Actions</p>
            </div>
            {filteredList.map((item) => (
              <div key={item._id} className={`list-table-format ${item.status !== 'in-stock' ? 'disabled' : ''} ${editingItem?._id === item._id ? 'editing' : ''}`}>
                <img
                  src={imageUrl(item.image)}
                  alt={item.name}
                  loading="lazy"
                  className={item.status !== 'in-stock' ? 'grayscale' : ''}
                />
                {editingItem?._id === item._id ? (
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => {
                      setEditingItem(prev => ({
                        ...prev,
                        name: e.target.value
                      }));
                    }}
                    className="input edit-name-input"
                    placeholder="Enter product name"
                  />
                ) : (
                  <p className="item-name">{item.name}</p>
                )}
                <p className="item-category">{item.category}</p>

                {editingItem?._id === item._id ? (
                  <div className="edit-prices">
                    {['g100', 'g150', 'g200', 'g250', 'g300', 'g400', 'g500', 'kg1'].map(size => (
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
                          {sizeLabel(size)}
                        </label>
                        {editingItem.quantityOptions[size] && (
                          <div className="price-inputs">
                            <input
                              className="input"
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
                              className="input"
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
                        <span className="qty">{sizeLabel(size)}</span>
                        <span className="price">₹{item.prices[size]}</span>
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
                      className="select"
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
                    <span className={`pill status-badge ${statusPill[item.status] || ''} ${item.status}`}>
                      {item.status.replace(/-/g, ' ')}
                    </span>
                  )}
                </div>

                <div className="actions">
                  {editingItem?._id === item._id ? (
                    <>
                      <button onClick={handleSaveClick} className="icon-btn save-btn" title="Save Changes" aria-label="Save changes" disabled={saving}>
                        {saving ? <span className="spinner" aria-hidden="true" /> : <i className="fas fa-check"></i>}
                      </button>
                      <button
                        onClick={() => setEditingItem(null)}
                        className="icon-btn cancel-btn"
                        title="Cancel"
                        aria-label="Cancel editing"
                        disabled={saving}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(item)}
                        className="icon-btn edit-btn"
                        title="Edit Item"
                        aria-label={`Edit ${item.name}`}
                      >
                        <i className="fas fa-pen"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="icon-btn remove-btn"
                        title="Delete Item"
                        aria-label={`Delete ${item.name}`}
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
        )}
      </div>
    </div>
  );
};

export default List;
