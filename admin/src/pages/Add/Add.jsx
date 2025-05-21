import { useState } from 'react';
import './Add.css';
import upload_area from '../../assets/upload_area.png';
import axios from 'axios';
import { toast } from 'react-toastify';

const Add = () => {
  const [data, setData] = useState({
    name: "",
    description: "",
    category: "",
    prices: {
      g250: "",
      g500: "",
      kg1: ""
    },
    marketPrices: {
      g250: "",
      g500: "",
      kg1: ""
    },
    status: "in-stock",
    quantityOptions: {
      g250: true,
      g500: false,
      kg1: false
    }
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const inputHandler = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('price_') || name.startsWith('marketPrice_')) {
      const [type, quantity] = name.split('_');
      setData(prev => ({
        ...prev,
        [type === 'price' ? 'prices' : 'marketPrices']: {
          ...prev[type === 'price' ? 'prices' : 'marketPrices'],
          [quantity]: value ? Number(value) : ""
        }
      }));
    } else {
      setData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateImage = (file) => {
    setImageError("");
    
    if (!file) {
      setImageError("Please select an image");
      return false;
    }

    if (!file.type.startsWith('image/')) {
      setImageError("Please upload a valid image file");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size should be less than 5MB");
      return false;
    }

    return true;
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (validateImage(file)) {
      setImage(file);
    } else {
      toast.error(imageError);
    }
  };

  const imageHandler = (e) => {
    const file = e.target.files[0];
    if (validateImage(file)) {
      setImage(file);
    } else {
      toast.error(imageError);
    }
  };

  const validateForm = () => {
    // Reset any previous errors
    setImageError("");

    if (!image) {
      setImageError("Please upload a product image");
      return false;
    }

    if (!data.name.trim()) {
      toast.error("Please enter a product name");
      return false;
    }

    if (!data.description.trim()) {
      toast.error("Please enter a product description");
      return false;
    }

    if (!data.category) {
      toast.error("Please select a category");
      return false;
    }

    // Validate at least one quantity option is selected and has a valid price
    const hasValidQuantity = Object.entries(data.quantityOptions)
      .some(([key, enabled]) => {
        if (!enabled) return false;
        const price = data.prices[key];
        return typeof price === 'number' && price > 0;
      });

    if (!hasValidQuantity) {
      toast.error("Please select at least one quantity option and set a valid price");
      return false;
    }

    // Validate prices for enabled quantities
    for (const [key, enabled] of Object.entries(data.quantityOptions)) {
      if (enabled) {
        const price = data.prices[key];
        if (typeof price !== 'number' || price <= 0) {
          toast.error(`Please enter a valid price for ${key === 'g250' ? '250g' : key === 'g500' ? '500g' : '1kg'}`);
          return false;
        }
      }
    }

    return true;
  };

  const addProduct = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('category', data.category);
    
    // Only include enabled quantities and their prices
    const enabledPrices = {};
    const enabledMarketPrices = {};
    const enabledQuantities = {};
    
    Object.entries(data.quantityOptions).forEach(([key, enabled]) => {
      if (enabled) {
        enabledPrices[key] = data.prices[key];
        enabledMarketPrices[key] = data.marketPrices[key] || data.prices[key];
        enabledQuantities[key] = true;
      }
    });

    formData.append('prices', JSON.stringify(enabledPrices));
    formData.append('marketPrices', JSON.stringify(enabledMarketPrices));
    formData.append('quantityOptions', JSON.stringify(enabledQuantities));
    formData.append('status', data.status);

    try {
      const response = await axios.post('https://chanvifarms-site-backend.onrender.com/api/food/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success('Product Added Successfully');
        // Reset form
        setData({
          name: "",
          description: "",
          category: "",
          prices: { g250: "", g500: "", kg1: "" },
          marketPrices: { g250: "", g500: "", kg1: "" },
          status: "in-stock",
          quantityOptions: { g250: true, g500: false, kg1: false }
        });
        setImage(null);
      } else {
        toast.error(response.data.message || 'Failed to add product');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product">
      <div className="addproduct-itemfield">
        <p>Product Image <span className="required">*</span></p>
        <label 
          htmlFor="file-input" 
          className={`image-upload ${dragOver ? 'drag-over' : ''} ${imageError ? 'error' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={handleImageDrop}
        >
          <img 
            src={image ? URL.createObjectURL(image) : upload_area} 
            className="addproduct-thumbnail-img" 
            alt={image ? "Product preview" : "Upload area"} 
          />
          {!image && (
            <div className="upload-overlay">
              <i className="fas fa-cloud-upload-alt"></i>
              <p>Drag and drop an image here or click to browse</p>
              <small>Maximum file size: 5MB</small>
            </div>
          )}
          {imageError && <div className="error-message">{imageError}</div>}
        </label>
        <input
          onChange={imageHandler}
          type="file"
          name="image"
          id="file-input"
          accept="image/*"
          hidden
        />
      </div>

      <div className="addproduct-itemfield">
        <p>Product Name <span className="required">*</span></p>
        <input
          value={data.name}
          onChange={inputHandler}
          type="text"
          name="name"
          placeholder="Enter product name"
        />
      </div>

      <div className="addproduct-itemfield">
        <p>Description <span className="required">*</span></p>
        <textarea
          value={data.description}
          onChange={inputHandler}
          name="description"
          placeholder="Enter product description"
          rows="4"
        />
      </div>

      <div className="addproduct-itemfield">
        <p>Product Category <span className="required">*</span></p>
        <select value={data.category} onChange={inputHandler} name="category">
          <option value="">Select Category</option>
          <option value="Vegetables">Vegetables</option>
          <option value="Fruits">Fruits</option>
          <option value="Exotic Vegetables">Exotic Vegetables</option>
          <option value="Exotic Fruits">Exotic Fruits</option>
          <option value="Meat">Meat</option>
        </select>
      </div>

      <div className="quantity-options">
        <p>Available Quantities & Prices <span className="required">*</span></p>
        <div className="quantity-price-grid">
          <div className="quantity-row header">
            <span>Quantity</span>
            <span>Enable</span>
            <span>Price (₹)</span>
            <span>Market Price (₹)</span>
          </div>
          {[
            { key: 'g250', label: '250 gm' },
            { key: 'g500', label: '500 gm' },
            { key: 'kg1', label: '1 kg' }
          ].map(({ key, label }) => (
            <div key={key} className="quantity-row">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={data.quantityOptions[key]}
                onChange={() => {
                  const newEnabled = !data.quantityOptions[key];
                  setData(prev => ({
                    ...prev,
                    quantityOptions: {
                      ...prev.quantityOptions,
                      [key]: newEnabled
                    },
                    prices: {
                      ...prev.prices,
                      [key]: newEnabled ? prev.prices[key] : ""
                    },
                    marketPrices: {
                      ...prev.marketPrices,
                      [key]: newEnabled ? prev.marketPrices[key] : ""
                    }
                  }));
                }}
              />
              <input
                type="number"
                name={`price_${key}`}
                value={data.prices[key]}
                onChange={inputHandler}
                placeholder="Enter price"
                disabled={!data.quantityOptions[key]}
                min="0"
                step="0.01"
              />
              <input
                type="number"
                name={`marketPrice_${key}`}
                value={data.marketPrices[key]}
                onChange={inputHandler}
                placeholder="Optional"
                disabled={!data.quantityOptions[key]}
                min="0"
                step="0.01"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="addproduct-itemfield">
        <p>Status</p>
        <select value={data.status} onChange={inputHandler} name="status">
          <option value="in-stock">In Stock</option>
          <option value="out-of-stock">Out of Stock</option>
          <option value="coming-soon">Coming Soon</option>
        </select>
      </div>

      <button 
        className="addproduct-btn" 
        onClick={addProduct}
        disabled={loading}
      >
        {loading ? (
          <>
            <i className="fas fa-spinner fa-spin"></i> ADDING PRODUCT...
          </>
        ) : (
          'ADD PRODUCT'
        )}
      </button>
    </div>
  );
};

export default Add;
