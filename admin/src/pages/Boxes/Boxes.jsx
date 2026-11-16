import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import { imageUrl } from '../../utils/imageUrl'
import { toast } from 'react-toastify'
import { CardSkeleton, EmptyState } from '../../components/Feedback/Feedback'
import './Boxes.css'

const SIZE_LABELS = {
  g100: '100 gm', g150: '150 gm', g200: '200 gm', g250: '250 gm',
  g300: '300 gm', g400: '400 gm', g500: '500 gm', kg1: '1 kg'
}
const sizeLabel = (s) => SIZE_LABELS[s] || s

const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm, boxName, busy }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay dialog-overlay">
      <div className="modal dialog-content" role="dialog" aria-modal="true">
        <div className="modal-icon danger"><i className="fas fa-trash" /></div>
        <h3>Delete Box?</h3>
        <p>Are you sure you want to delete <strong>{boxName}</strong>?</p>
        <p className="dialog-warning">This action cannot be undone.</p>
        <div className="modal-actions dialog-buttons">
          <button className="btn btn-secondary dialog-cancel" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-danger dialog-delete" onClick={onConfirm} disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {busy ? 'Deleting...' : 'Delete Box'}
          </button>
        </div>
      </div>
    </div>
  );
};
DeleteConfirmDialog.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  boxName: PropTypes.string,
  busy: PropTypes.bool,
};

const Boxes = () => {
  const [name, setName] = useState('')
  const [items, setItems] = useState([]) // { itemId, size }
  const [allItems, setAllItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [price, setPrice] = useState('')
  const [marketPrice, setMarketPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [message] = useState(null)
  const [error, setError] = useState(null)
  const [boxes, setBoxes] = useState([])
  const [editBox, setEditBox] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [listLoading, setListLoading] = useState(true) // UI-only: initial fetch in progress
  const [deleteDialog, setDeleteDialog] = useState({ open: false, boxId: null, boxName: '' })
  const url = import.meta.env.VITE_BACKEND_URL

  useEffect(() => {
    const load = async () => {
      try {
        const [foodRes, boxesRes] = await Promise.all([
          axios.get(url + '/api/food/list'),
          axios.get(url + '/api/box/list')
        ])
        if (foodRes.data.success) {
          setAllItems(foodRes.data.data)
          setFilteredItems(foodRes.data.data)
        }
        if (boxesRes.data.success) setBoxes(boxesRes.data.data)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load products or boxes')
      } finally {
        setListLoading(false)
      }
    }
    load()
  }, [url])

  // Filter items based on search query
  useEffect(() => {
    const filtered = allItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredItems(filtered)
  }, [searchQuery, allItems])

  const handleAddItem = (e) => {
    const id = e.target.value
    if (!id) return
    const exists = items.find(i => i.itemId === id)
    if (!exists) {
      // pick a default size available for that product or g250
      const product = allItems.find(p => p._id === id)
      let defaultSize = 'g250'
      if (product?.quantityOptions) {
        const sizes = ['g100','g150','g200','g250','g300','g400','g500','kg1']
        const found = sizes.find(s => product.quantityOptions[s])
        if (found) defaultSize = found
      }
      setItems(prev => [...prev, { itemId: id, size: defaultSize }])
    }
    // reset select
    e.target.value = ''
  }

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSizeChange = (index, newSize) => {
    setItems(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], size: newSize }
      return copy
    })
  }

  const validate = () => {
    setError(null)
    if (!name.trim()) return 'Please enter a box name'
    if (!items.length) return 'Please add at least one item to the box'
    if (!price || isNaN(Number(price)) || Number(price) <= 0) return 'Please enter a valid box price'
    return null
  }

  const handleCreate = async () => {
    const v = validate()
    if (v) { toast.error(v); return }

    setLoading(true)
    try {
      const payload = { name, items, price: Number(price), marketPrice: marketPrice ? Number(marketPrice) : undefined }
      const res = await axios.post(url + '/api/box/add', payload)
      if (res.data?.success) {
        toast.success('Box created successfully')
        setName(''); setItems([]); setPrice(''); setMarketPrice('')
        // Refresh boxes list
        const boxesRes = await axios.get(url + '/api/box/list')
        if (boxesRes.data?.success) setBoxes(boxesRes.data.data)
      } else {
        toast.error(res.data?.message || 'Failed to create box')
      }
    } catch (err) {
      console.error('create box error', err)
      const serverMsg = err?.response?.data?.message
      toast.error(serverMsg || 'Error creating box')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBox = async (boxId, newPrice, newMarketPrice) => {
    setLoading(true)
    try {
      const payload = { 
        boxId, 
        price: Number(newPrice),
        marketPrice: newMarketPrice ? Number(newMarketPrice) : undefined 
      }
      const res = await axios.put(url + '/api/box/update', payload)
      if (res.data?.success) {
        toast.success('Box updated successfully')
        setEditBox(null)
        // Refresh boxes list
        const boxesRes = await axios.get(url + '/api/box/list')
        if (boxesRes.data?.success) setBoxes(boxesRes.data.data)
      } else {
        toast.error(res.data?.message || 'Failed to update box')
      }
    } catch (err) {
      console.error('update box error', err)
      const serverMsg = err?.response?.data?.message
      toast.error(serverMsg || 'Error updating box')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBox = async () => {
    const boxId = deleteDialog.boxId;
    if (!boxId) return;

    setLoading(true);
    try {
      const res = await axios.delete(`${url}/api/box/delete/${boxId}`)
      if (res.data?.success) {
        toast.success('Box deleted successfully')
        // Refresh boxes list
        const boxesRes = await axios.get(url + '/api/box/list')
        if (boxesRes.data?.success) setBoxes(boxesRes.data.data)
        setDeleteDialog({ open: false, boxId: null, boxName: '' })
      } else {
        toast.error(res.data?.message || 'Failed to delete box')
      }
    } catch (err) {
      console.error('delete box error', err)
      const serverMsg = err?.response?.data?.message
      toast.error(serverMsg || 'Error deleting box')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="boxes-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Weekly Boxes</h1>
          <p className="page-subtitle">Bundle products into curated boxes and manage their prices.</p>
        </div>
      </div>

      <div className="boxes-layout">
      <section className="card card-pad box-form">
        <h2 className="section-title">Create Weekly Box</h2>
        {error && <div className="form-error">{error}</div>}
        {message && <div className="form-success">{message}</div>}

        <div className="field">
          <label className="label" htmlFor="box-name">Box name</label>
          <input
            id="box-name"
            placeholder="e.g. Family Veggie Box"
            value={name}
            onChange={e => setName(e.target.value)}
            className="input form-input"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="box-search">Items</label>
          <div className="searchable-dropdown">
            <i className="fas fa-search dropdown-search-icon" aria-hidden="true" />
            <input
              id="box-search"
              type="text"
              placeholder={listLoading ? 'Loading products...' : 'Search and select item to add...'}
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setShowDropdown(false)}
              className="input form-input"
              autoComplete="off"
            />
            {showDropdown && (
              <div className="dropdown-list" onMouseDown={e => e.preventDefault()}>
                {listLoading ? (
                  <div className="dropdown-empty"><span className="spinner" aria-hidden="true" /> Loading products...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="dropdown-empty">No products match &ldquo;{searchQuery}&rdquo;</div>
                ) : filteredItems.map(it => (
                  <div
                    key={it._id}
                    className={`dropdown-item ${items.some(i => i.itemId === it._id) ? 'is-selected' : ''}`}
                    onClick={() => {
                      handleAddItem({ target: { value: it._id } })
                      setSearchQuery('')
                      setShowDropdown(false)
                    }}
                  >
                    <img src={imageUrl(it.image)} alt={it.name} className="dropdown-item-image" loading="lazy" />
                    <span>{it.name}</span>
                    {items.some(i => i.itemId === it._id) && <i className="fas fa-check dropdown-check" aria-hidden="true" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="selected-items">
          {items.length === 0 && (
            <p className="selected-empty">No items added yet. Search above to add products to this box.</p>
          )}
          {items.map((it, idx) => {
            const product = allItems.find(a => a._id === it.itemId)
            const availableSizes = product?.quantityOptions ? Object.keys(product.quantityOptions).filter(k => product.quantityOptions[k]) : ['g250']
            return (
              <div key={idx} className="selected-item">
                <img src={imageUrl(product?.image)} alt={product?.name} />
                <div className="selected-meta">
                  <div className="selected-name">{product?.name || it.itemId}</div>
                  <select className="select" value={it.size} onChange={e => handleSizeChange(idx, e.target.value)} aria-label={`Size for ${product?.name || 'item'}`}>
                    {availableSizes.map(s => (
                      <option key={s} value={s}>{sizeLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <button className="icon-btn remove-btn" onClick={() => handleRemoveItem(idx)} title="Remove" aria-label={`Remove ${product?.name || 'item'}`}>
                  <i className="fas fa-times" />
                </button>
              </div>
            )
          })}
        </div>

        <div className="box-price-row">
          <div className="field">
            <label className="label" htmlFor="box-price">Box price (₹)</label>
            <input
              id="box-price"
              type="number"
              placeholder="Box price"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="input form-input"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="box-market">Market price (₹)</label>
            <input
              id="box-market"
              type="number"
              placeholder="Market price"
              value={marketPrice}
              onChange={e => setMarketPrice(e.target.value)}
              className="input form-input"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="btn btn-primary btn-lg btn-block primary-button"
        >
          {loading && <span className="spinner" aria-hidden="true" />}
          {loading ? 'Creating...' : 'Add Box'}
        </button>
      </section>

      <section className="boxes-existing">
      <div className="boxes-existing-header">
        <h2 className="section-title">Existing Boxes</h2>
        {!listLoading && <span className="count-chip">{boxes.length} {boxes.length === 1 ? 'box' : 'boxes'}</span>}
      </div>
      {listLoading ? (
        <CardSkeleton count={2} minWidth={300} />
      ) : boxes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<i className="fas fa-box-open" />}
            title="No boxes yet"
            text="Create your first weekly box using the form."
          />
        </div>
      ) : (
      <div className="boxes-list">
        {boxes.map(box => (
          <div key={box._id} className="card box-item">
            <h3>{box.name}</h3>
            <div className="box-items-grid">
              {box.items.map((item, idx) => {
                const product = item.itemId
                return (
                  <div key={idx} className="box-product">
                    <img src={imageUrl(product?.image)} alt={product?.name} loading="lazy" />
                    <div className="box-product-meta">
                      <div className="box-product-name">{product?.name}</div>
                      <div className="box-product-size">{sizeLabel(item.size)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {editBox === box._id ? (
              <div className="box-edit">
                <div className="edit-inputs">
                  <div className="edit-input-group">
                    <label htmlFor={`price-${box._id}`}>Price</label>
                    <input
                      type="number"
                      placeholder="New price"
                      defaultValue={box.price}
                      onChange={e => e.target.value = e.target.value.replace(/[^0-9.]/g, '')}
                      className="input edit-input"
                      id={`price-${box._id}`}
                    />
                  </div>
                  <div className="edit-input-group">
                    <label htmlFor={`market-${box._id}`}>Market Price</label>
                    <input
                      type="number"
                      placeholder="New market price"
                      defaultValue={box.marketPrice}
                      onChange={e => e.target.value = e.target.value.replace(/[^0-9.]/g, '')}
                      className="input edit-input"
                      id={`market-${box._id}`}
                    />
                  </div>
                </div>
                <div className="edit-actions">
                  <button onClick={() => setEditBox(null)} className="btn btn-secondary btn-sm cancel-btn">Cancel</button>
                  <button
                    onClick={() => {
                      const priceInput = document.getElementById(`price-${box._id}`)
                      const marketInput = document.getElementById(`market-${box._id}`)
                      handleUpdateBox(box._id, priceInput.value, marketInput.value)
                    }}
                    disabled={loading}
                    className="btn btn-primary btn-sm save-btn"
                  >
                    {loading && <span className="spinner" aria-hidden="true" />}
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="box-meta">
                <div className="box-price">
                  <span className="price">₹{box.price}</span>
                  {box.marketPrice && <span className="market-price">₹{box.marketPrice}</span>}
                </div>
                <div className="box-actions">
                  <button
                    onClick={() => setEditBox(box._id)}
                    className="btn btn-soft btn-sm edit-btn"
                  >
                    <i className="fas fa-pen" aria-hidden="true" /> Edit Prices
                  </button>
                  <button
                    onClick={() => setDeleteDialog({
                      open: true,
                      boxId: box._id,
                      boxName: box.name
                    })}
                    className="btn btn-danger-soft btn-sm delete-btn"
                  >
                    <i className="fas fa-trash" aria-hidden="true" /> Delete Box
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      )}
      </section>
      </div>
      <DeleteConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, boxId: null, boxName: '' })}
        onConfirm={handleDeleteBox}
        boxName={deleteDialog.boxName}
        busy={loading}
      />
    </div>
  )
}

export default Boxes
