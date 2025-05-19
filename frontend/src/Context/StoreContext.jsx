import { createContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import PropTypes from 'prop-types';
import Loading from '../Components/Loading/Loading';

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
    const [cartItems, setCartItems] = useState({});
    const url = "http://localhost:4000"
    const [token, setToken] = useState(() => localStorage.getItem('token') || "")
    const [food_list, setFoodList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

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
            console.error("Error loading cart:", error);
            const localCart = localStorage.getItem('cartItems');
            if (localCart) {
                setCartItems(JSON.parse(localCart));
            }
        }
    }, [url, food_list]);

    const addToCart = useCallback(async (itemId, selectedQuantity = 'g250') => {
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

    const removeFromCart = useCallback(async (itemId, selectedQuantity = 'g250') => {
        const cartKey = `${itemId}_${selectedQuantity}`;
        
        const newCartItems = { ...cartItems };
        if (newCartItems[cartKey]) {
            newCartItems[cartKey] = {
                ...newCartItems[cartKey],
                quantity: newCartItems[cartKey].quantity - 1
            };
            
            if (newCartItems[cartKey].quantity <= 0) {
                delete newCartItems[cartKey];
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

    const getTotalCartAmount = useCallback(() => {
        let totalAmount = 0;
        for (const cartKey in cartItems) {
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
        cartItems,
        setCartItems,
        addToCart,
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
