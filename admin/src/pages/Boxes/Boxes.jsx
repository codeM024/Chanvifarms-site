import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import './Boxes.css'

const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm, boxName }) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h3>Delete Box?</h3>
        <p>Are you sure you want to delete <strong>{boxName}</strong>?</p>
        <p className="dialog-warning">This action cannot be undone.</p>
        <div className="dialog-buttons">
          <button className="dialog-cancel" onClick={onClose}>Cancel</button>
          <button className="dialog-delete" onClick={onConfirm}>Delete Box</button>
        </div>
      </div>
    </div>
  );
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
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [boxes, setBoxes] = useState([])
  const [editBox, setEditBox] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
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
      const admin = JSON.parse(localStorage.getItem('adminAuth'))
      const adminEmail = admin?.email
      const payload = { name, items, price: Number(price), marketPrice: marketPrice ? Number(marketPrice) : undefined }
      const res = await axios.post(url + '/api/box/add', payload, { headers: { 'admin-email': adminEmail } })
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
      const admin = JSON.parse(localStorage.getItem('adminAuth'))
      const adminEmail = admin?.email
      const payload = { 
        boxId, 
        price: Number(newPrice),
        marketPrice: newMarketPrice ? Number(newMarketPrice) : undefined 
      }
      const res = await axios.put(url + '/api/box/update', payload, { headers: { 'admin-email': adminEmail } })
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
      const admin = JSON.parse(localStorage.getItem('adminAuth'))
      const adminEmail = admin?.email
      const res = await axios.delete(`${url}/api/box/delete/${boxId}`, { headers: { 'admin-email': adminEmail } })
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
      <h2>Create Weekly Box</h2>
      <div className="box-form">
        {error && <div className="form-error">{error}</div>}
        {message && <div className="form-success">{message}</div>}

        <input 
          placeholder="Box name" 
          value={name} 
          onChange={e => setName(e.target.value)}
          className="form-input" 
        />

        <div className="searchable-dropdown">
          <input
            type="text"
            placeholder="Search and select item to add..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            className="form-input"
          />
          {showDropdown && (
            <div className="dropdown-list">
              {filteredItems.map(it => (
                <div
                  key={it._id}
                  className="dropdown-item"
                  onClick={() => {
                    handleAddItem({ target: { value: it._id } })
                    setSearchQuery('')
                    setShowDropdown(false)
                  }}
                >
                  <img src={`${url}/images/${it.image}`} alt={it.name} className="dropdown-item-image" />
                  <span>{it.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="selected-items">
          {items.map((it, idx) => {
            const product = allItems.find(a => a._id === it.itemId)
            const availableSizes = product?.quantityOptions ? Object.keys(product.quantityOptions).filter(k => product.quantityOptions[k]) : ['g250']
            return (
              <div key={idx} className="selected-item">
                <img src={`${url}/images/${product?.image}`} alt={product?.name} />
                <div className="selected-meta">
                  <div className="selected-name">{product?.name || it.itemId}</div>
                  <select value={it.size} onChange={e => handleSizeChange(idx, e.target.value)}>
                    {availableSizes.map(s => (
                      <option key={s} value={s}>{s === 'g100' ? '100 gm' : s === 'g150' ? '150 gm' : s === 'g200' ? '200 gm' : s === 'g250' ? '250 gm' : s === 'g300' ? '300 gm' : s === 'g400' ? '400 gm' : s === 'g500' ? '500 gm' : '1 kg'}</option>
                    ))}
                  </select>
                </div>
                <button className="remove-btn" onClick={() => handleRemoveItem(idx)}>Remove</button>
              </div>
            )
          })}
        </div>

        <input 
          type="number" 
          placeholder="Box price" 
          value={price} 
          onChange={e => setPrice(e.target.value)} 
          className="form-input"
        />
        <input 
          type="number" 
          placeholder="Market price" 
          value={marketPrice} 
          onChange={e => setMarketPrice(e.target.value)} 
          className="form-input"
        />

        <button 
          onClick={handleCreate} 
          disabled={loading}
          className="primary-button"
        >
          {loading ? 'Creating...' : 'Add Box'}
        </button>
      </div>

      <h2>Existing Boxes</h2>
      <div className="boxes-list">
        {boxes.map(box => (
          <div key={box._id} className="box-item">
            <h3>{box.name}</h3>
            <div className="box-items-grid">
              {box.items.map((item, idx) => {
                const product = item.itemId
                return (
                  <div key={idx} className="box-product">
                    <img src={`${url}/images/${product?.image}`} alt={product?.name} />
                    <div className="box-product-meta">
                      <div className="box-product-name">{product?.name}</div>
                      <div className="box-product-size">{item.size}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {editBox === box._id ? (
              <div className="box-edit">
                <div className="edit-inputs">
                  <div className="edit-input-group">
                    <label>Price</label>
                    <input 
                      type="number"
                      placeholder="New price"
                      defaultValue={box.price}
                      onChange={e => e.target.value = e.target.value.replace(/[^0-9.]/g, '')}
                      className="edit-input"
                      id={`price-${box._id}`}
                    />
                  </div>
                  <div className="edit-input-group">
                    <label>Market Price</label>
                    <input 
                      type="number"
                      placeholder="New market price"
                      defaultValue={box.marketPrice}
                      onChange={e => e.target.value = e.target.value.replace(/[^0-9.]/g, '')}
                      className="edit-input"
                      id={`market-${box._id}`}
                    />
                  </div>
                </div>
                <div className="edit-actions">
                  <button 
                    onClick={() => {
                      const priceInput = document.getElementById(`price-${box._id}`)
                      const marketInput = document.getElementById(`market-${box._id}`)
                      handleUpdateBox(box._id, priceInput.value, marketInput.value)
                    }} 
                    disabled={loading}
                    className="save-btn"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button onClick={() => setEditBox(null)} className="cancel-btn">Cancel</button>
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
                    className="edit-btn"
                  >
                    Edit Prices
                  </button>
                  <button 
                    onClick={() => setDeleteDialog({ 
                      open: true, 
                      boxId: box._id, 
                      boxName: box.name 
                    })} 
                    className="delete-btn"
                  >
                    Delete Box
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <DeleteConfirmDialog 
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, boxId: null, boxName: '' })}
        onConfirm={handleDeleteBox}
        boxName={deleteDialog.boxName}
      />
    </div>
  )
}

export default Boxes
