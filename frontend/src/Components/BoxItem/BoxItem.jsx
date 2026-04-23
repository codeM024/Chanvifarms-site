import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import './BoxItem.css'
import { StoreContext } from '../../Context/StoreContext'

const BoxItem = ({ box }) => {
  const { name, items, price, marketPrice } = box;
  const { addToCart } = useContext(StoreContext);
  const [adding, setAdding] = useState(false);

  const formatSizeLabel = (s) => s === 'g100' ? '100 gm' : s === 'g150' ? '150 gm' : s === 'g200' ? '200 gm' : s === 'g250' ? '250 gm' : s === 'g300' ? '300 gm' : s === 'g400' ? '400 gm' : s === 'g500' ? '500 gm' : '1 kg';

  const handleAddBox = async () => {
    try {
      setAdding(true);
      await addToCart(box._id, 'box', box);
    } catch (error) {
      console.error('Error adding box:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="box-item">
      <div className="box-header">
        <h3>{name}</h3>
      </div>

      <div className="box-contents">
        {items.map((it, idx) => {
          const product = it.itemId || {}
          const ourPrice = product.prices?.[it.size] ?? product.price ?? 0
          const market = product.marketPrices?.[it.size] ?? product.marketPrice ?? ourPrice
          return (
            <div key={idx} className="box-content-row">
              {product.image ? (
                <img src={`${import.meta.env.VITE_BACKEND_URL}/images/${product.image}`} alt={product.name || 'product'} />
              ) : (
                <div style={{width:64,height:64,background:'#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8}}>{product.name ? product.name.charAt(0) : '?'}</div>
              )}
              <div className="box-content-info">
                <div className="name">{product.name}</div>
                <div className="size">{formatSizeLabel(it.size)}</div>
              </div>
              <div className="item-prices">
                {market > ourPrice && <span className="item-market">₹{market}</span>}
                <span className="item-price">₹{ourPrice}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="box-prices">
        <span className="total-label">Total:</span>
        {marketPrice > price && <span className="market">₹{marketPrice}</span>}
        <span className="price">₹{price}</span>
        <button 
          className="box-add-btn" 
          onClick={handleAddBox} 
          disabled={adding}
        >
          {adding ? 'Adding...' : 'Add Box'}
        </button>
      </div>
    </div>
  )
}

BoxItem.propTypes = {
  box: PropTypes.object.isRequired
}

export default BoxItem
