import { createContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import PropTypes from 'prop-types';
import Loading from '../Components/Loading/Loading';

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
    const [cartItems, setCartItems] = useState({});
  const url = import.meta.env.VITE_BACKEND_URL;
    const [token, setToken] = useState(() => localStorage.getItem('token') || "")
    const [food_list, setFoodList] = useState([]);
    const [box_list, setBoxList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const handleTokenExpiration = useCallback(() => {
        localStorage.removeItem('token');
        setToken("");
        // Save cart items to local storage before logging out
        if (Object.keys(cartItems).length > 0) {
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
        }
        window.location.href = '/'; // Redirect to home or login page
    }, [cartItems]);

    const loadCartData = useCallback(async (tokenValue) => {
        if (!tokenValue) {
            const localCart = localStorage.getItem('cartItems');
            if (localCart) {
                setCartItems(JSON.parse(localCart));
            }
            return;
        }
        
        try {
            const response = await axios.get(url + "/api/cart/get", { 
                headers: { token: tokenValue } 
            });
            
            // Check for new token in response headers
            const newToken = response.headers['new-token'];
            if (newToken) {
                localStorage.setItem('token', newToken);
                setToken(newToken);
            }
            
            if (response.data.success && response.data.cartData) {
                const validCartItems = {};
                Object.entries(response.data.cartData).forEach(([key, quantity]) => {
                    const [itemId] = key.split('_');
                    const item = food_list.find(item => item._id === itemId);
                    if (item && item.status === 'in-stock' && !item.outOfStock) {
                        validCartItems[key] = {
                            quantity,
                            size: key.split('_')[1] || 'g250'
                        };
                    }
                });
                setCartItems(validCartItems);
                localStorage.setItem('cartItems', JSON.stringify(validCartItems));
            }
        } catch (error) {
            if (error.response?.data?.tokenExpired || error.response?.status === 401) {
                handleTokenExpiration();
                return;
            }
            console.error("Error loading cart:", error);
            const localCart = localStorage.getItem('cartItems');
            if (localCart) {
                setCartItems(JSON.parse(localCart));
            }
        }
    }, [url, food_list]);

    const addToCart = useCallback(async (itemId, selectedQuantity = 'g250', boxData = null) => {
        // Handle box items
        if (selectedQuantity === 'box') {
            const cartKey = `box_${itemId}`;
            const newCartItems = { ...cartItems };
            
            if (!newCartItems[cartKey]) {
                newCartItems[cartKey] = {
                    quantity: 1,
                    type: 'box',
                    boxData: boxData
                };
            } else {
                newCartItems[cartKey] = {
                    ...newCartItems[cartKey],
                    quantity: newCartItems[cartKey].quantity + 1
                };
            }
            
            setCartItems(newCartItems);
            localStorage.setItem('cartItems', JSON.stringify(newCartItems));

            if (token) {
                try {
                    await axios.post(url + "/api/cart/box/add", { 
                        boxId: itemId,
                        quantity: 1
                    }, { headers: { token } });
                } catch (error) {
                    console.error("Error syncing box with server:", error);
                }
            }
            return;
        }

        // Handle regular items
        const item = food_list.find(item => item._id === itemId);
        if (item?.outOfStock || item?.status !== 'in-stock') return;

        const cartKey = `${itemId}_${selectedQuantity}`;
        
        const newCartItems = { ...cartItems };
        if (!newCartItems[cartKey]) {
            newCartItems[cartKey] = { quantity: 1, size: selectedQuantity };
        } else {
            newCartItems[cartKey] = {
                ...newCartItems[cartKey],
                quantity: newCartItems[cartKey].quantity + 1
            };
        }
        
        setCartItems(newCartItems);
        localStorage.setItem('cartItems', JSON.stringify(newCartItems));

        if (token) {
            try {
                await axios.post(url + "/api/cart/add", { 
                    itemId,
                    selectedQuantity 
                }, { headers: { token } });
            } catch (error) {
                console.error("Error syncing cart with server:", error);
            }
        }
    }, [food_list, cartItems, token, url]);

    const removeFromCart = useCallback(async (itemId, selectedQuantity = 'g250', removeAll = false) => {
        let cartKey;
        if (selectedQuantity === 'box') {
            cartKey = `box_${itemId}`;
        } else {
            cartKey = `${itemId}_${selectedQuantity}`;
        }
        
        const newCartItems = { ...cartItems };
        if (newCartItems[cartKey]) {
            if (removeAll) {
                delete newCartItems[cartKey];
            } else {
                newCartItems[cartKey] = {
                    ...newCartItems[cartKey],
                    quantity: newCartItems[cartKey].quantity - 1
                };
                
                if (newCartItems[cartKey].quantity <= 0) {
                    delete newCartItems[cartKey];
                }
            }
            
            setCartItems(newCartItems);
            localStorage.setItem('cartItems', JSON.stringify(newCartItems));
        }

        if (token) {
            try {
                await axios.post(url + "/api/cart/remove", { 
                    itemId,
                    selectedQuantity 
                }, { headers: { token } });
            } catch (error) {
                console.error("Error syncing cart with server:", error);
            }
        }
    }, [cartItems, token, url]);

    const clearCart = useCallback(async () => {
        setCartItems({});
        localStorage.removeItem('cartItems');
        
        if (token) {
            try {
                // You'll need to add this endpoint to your backend
                await axios.post(url + "/api/cart/clear", {}, { headers: { token } });
            } catch (error) {
                console.error("Error clearing cart on server:", error);
            }
        }
    }, [token, url]);

    const addBoxToCart = useCallback(async (boxId, quantity = 1) => {
        // Get box details from box_list
        const box = box_list.find(b => b._id === boxId);
        if (!box) return;

        // Add box as a single unit to cart
        const cartKey = `box_${boxId}`;
        const newCart = { ...cartItems };
        
        if (!newCart[cartKey]) {
            newCart[cartKey] = {
                quantity: quantity,
                type: 'box',
                boxData: box
            };
        } else {
            newCart[cartKey] = {
                ...newCart[cartKey],
                quantity: newCart[cartKey].quantity + quantity
            };
        }
        
        setCartItems(newCart);
        localStorage.setItem('cartItems', JSON.stringify(newCart));

        // If authenticated, sync with server
        if (token) {
            try {
                await axios.post(url + '/api/cart/box/add', { boxId, quantity }, { headers: { token } });
                // reload cart from server
                await loadCartData(token);
            } catch (err) {
                console.error('Error adding box to cart', err);
            }
        }

        try {
            await axios.post(url + '/api/cart/box/add', { boxId, quantity }, { headers: { token } })
            // reload cart from server
            await loadCartData(token)
        } catch (err) {
            console.error('Error adding box to cart', err)
        }
    }, [box_list, cartItems, loadCartData, token, url])

    const getTotalCartAmount = useCallback(() => {
        let totalAmount = 0;
        for (const cartKey in cartItems) {
            // Handle box items
            if (cartKey.startsWith('box_')) {
                const boxItem = cartItems[cartKey];
                if (boxItem.boxData) {
                    totalAmount += boxItem.boxData.price * boxItem.quantity;
                }
                continue;
            }
            if (cartItems[cartKey].quantity > 0) {
                const [itemId, size] = cartKey.split('_');
                const item = food_list.find((product) => product._id === itemId);
                
                if (item && !item.outOfStock && item.status === 'in-stock') {
                    const price = item.prices?.[size] || item.price;
                    totalAmount += price * cartItems[cartKey].quantity;
                }
            }
        }
        return totalAmount;
    }, [cartItems, food_list]);

    const getTotalCartSavings = useCallback(() => {
        let totalSavings = 0;
        for (const cartKey in cartItems) {
            // Handle box items
            if (cartKey.startsWith('box_')) {
                const boxItem = cartItems[cartKey];
                if (boxItem.boxData) {
                    const marketPrice = boxItem.boxData.marketPrice || boxItem.boxData.price;
                    totalSavings += (marketPrice - boxItem.boxData.price) * boxItem.quantity;
                }
                continue;
            }
            if (cartItems[cartKey].quantity > 0) {
                const [itemId, size] = cartKey.split('_');
                const item = food_list.find((product) => product._id === itemId);
                
                if (item && !item.outOfStock && item.status === 'in-stock') {
                    const price = item.prices?.[size] || item.price;
                    const marketPrice = item.marketPrices?.[size] || item.marketPrice || price;
                    totalSavings += (marketPrice - price) * cartItems[cartKey].quantity;
                }
            }
        }
        return totalSavings;
    }, [cartItems, food_list]);

    const loadFoodList = useCallback(async () => {
        try {
            const response = await axios.get(url + "/api/food/list");
            
            if (response.data.success) {
                const processedList = response.data.data.map(item => ({
                    ...item,
                    prices: item.prices || { g250: item.price },
                    marketPrices: item.marketPrices || { g250: item.marketPrice || item.price },
                    quantityOptions: item.quantityOptions || { g250: true },
                    status: item.status || 'in-stock'
                }));
                setFoodList(processedList);
            } else {
                setError(response.data.message || "Failed to fetch products");
                setFoodList([]);
            }
        } catch (error) {
            setError(error.message || "Error loading products");
            setFoodList([]);
        }
    }, [url]);

    const loadBoxList = useCallback(async () => {
        try {
            const res = await axios.get(url + '/api/box/list')
            if (res.data.success) {
                // normalize boxes: ensure each item's itemId is the full product object and has prices/marketPrices/quantityOptions
                const normalized = res.data.data.map(box => ({
                    ...box,
                    items: (box.items || []).map(it => {
                        // if backend populated itemId, use it; otherwise try to find in food_list
                        let product = it.itemId && typeof it.itemId === 'object' ? it.itemId : food_list.find(f => f._id === it.itemId)
                        if (!product) product = { _id: it.itemId, name: 'Unknown', image: '', prices: {}, marketPrices: {}, quantityOptions: {} }
                        const prices = product.prices || { g250: product.price }
                        const marketPrices = product.marketPrices || { g250: product.marketPrice || product.price }
                        const quantityOptions = product.quantityOptions || { g250: true }
                        return { ...it, itemId: { ...product, prices, marketPrices, quantityOptions } }
                    })
                }))
                setBoxList(normalized)
            }
        } catch (err) {
            console.error('Error loading boxes', err)
        }
    }, [url, food_list])

    // Update cart when food list changes to remove any invalid items
    useEffect(() => {
        if (food_list.length > 0 && Object.keys(cartItems).length > 0) {
            const validCartItems = {};
            Object.entries(cartItems).forEach(([key, value]) => {
                const [itemId] = key.split('_');
                const item = food_list.find(item => item._id === itemId);
                if (item && item.status === 'in-stock' && !item.outOfStock) {
                    validCartItems[key] = value;
                }
            });
            setCartItems(validCartItems);
            localStorage.setItem('cartItems', JSON.stringify(validCartItems));
        }
    }, [food_list]);

    useEffect(() => {
        const initializeData = async () => {
            setLoading(true);
            try {
                await loadFoodList();
                await loadBoxList();
                await loadCartData(token);
            } finally {
                setLoading(false);
                setIsInitialized(true);
            }
        };

        if (!isInitialized) {
            initializeData();
        }
    }, [loadFoodList, loadCartData, token, isInitialized]);

    // Don't show loading screen after initial load
    if (loading && !isInitialized) {
        return <Loading />;
    }

    const contextValue = {
        food_list,
        box_list,
        cartItems,
        setCartItems,
        addToCart,
            addBoxToCart,
        removeFromCart,
        getTotalCartAmount,
        getTotalCartSavings,
        clearCart,
        url,
        token,
        setToken,
        loading,
        error
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    );
};

StoreContextProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default StoreContextProvider;
