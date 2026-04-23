import userModel from "../models/userModel.js"
import Box from '../models/boxModel.js'

const addBoxToCart = async (req, res) => {
  try {
    const { boxId } = req.body;
    if (!boxId) {
      return res.status(400).json({
        success: false,
        message: "Box ID is required"
      });
    }

    let userData = await userModel.findById(req.userId);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get box details
    const box = await Box.findById(boxId).populate({
      path: 'items.itemId',
      select: 'name image prices marketPrices quantityOptions category status'
    });

    if (!box) {
      return res.status(404).json({
        success: false,
        message: "Box not found"
      });
    }

    let cartData = userData.cartData || {};
    const cartKey = `box_${boxId}`;

    if(!cartData[cartKey]) {
      cartData[cartKey] = {
        type: 'box',
        quantity: 1,
        boxData: box
      };
    } else {
      cartData[cartKey].quantity += 1;
    }

    await userModel.findByIdAndUpdate(req.userId, { cartData });
    res.json({ success: true, message: "Box added to cart" });
  } catch(error) {
    console.error("Error adding box to cart:", error);
    res.status(500).json({ success: false, message: "Error adding box to cart" });
  }
};

//add item to the user cart
const addToCart = async (req,res)=>{
    try{
        let userData = await userModel.findById(req.userId);
        if (!userData) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        let cartData = userData.cartData || {};
        const cartKey = `${req.body.itemId}_${req.body.selectedQuantity || 'g250'}`;

        if(!cartData[cartKey]) {
            cartData[cartKey] = 1;
        } else {
            cartData[cartKey] += 1;
        }
        
        await userModel.findByIdAndUpdate(req.userId, {cartData});
        res.json({success:true,message:"Added To Cart"})
    }catch(error){
        console.error("Error adding to cart:", error);
        res.status(500).json({success:false,message:"Error adding item to cart"})
    }
}

//remove items from user cart
const removeFromCart = async (req,res) => {
    try{
        let userData = await userModel.findById(req.userId);
        if (!userData) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        let cartData = userData.cartData || {};
        const cartKey = `${req.body.itemId}_${req.body.selectedQuantity || 'g250'}`;

        if(cartData[cartKey] > 0){
            cartData[cartKey] -= 1;
            if(cartData[cartKey] === 0) {
                delete cartData[cartKey];
            }
        }
        
        await userModel.findByIdAndUpdate(req.userId, {cartData});
        res.json({success:true,message:"Removed From Cart"})
    }
    catch(error){
        console.error("Error removing from cart:", error);
        res.status(500).json({success:false,message:"Error removing item from cart"})
    }
}

// fetch user cart data
const getCart = async (req,res) => {
    try{
        let userData = await userModel.findById(req.userId);
        if (!userData) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        let cartData = userData.cartData || {};
        res.json({success:true,cartData})
    }catch(error){
        console.error("Error fetching cart:", error);
        res.status(500).json({success:false,message:"Error fetching cart data"})
    }
}

// clear user's cart
const clearCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.userId);
        if (!userData) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await userModel.findByIdAndUpdate(req.userId, { cartData: {} });
        res.json({ success: true, message: "Cart cleared successfully" });
    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ success: false, message: "Error clearing cart" });
    }
};

export { addToCart, removeFromCart, getCart, clearCart, addBoxToCart }