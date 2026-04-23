import express from "express";
import { addToCart, removeFromCart, getCart, clearCart } from "../controllers/cartController.js";
import authMiddleware from "../middleware/auth.js";
import { addBoxToCart } from '../controllers/cartController.js'

const cartRouter = express.Router();

cartRouter.post("/add", authMiddleware, addToCart);
cartRouter.post("/remove", authMiddleware, removeFromCart);
cartRouter.get("/get", authMiddleware, getCart);
cartRouter.post("/clear", authMiddleware, clearCart);
cartRouter.post('/box/add', authMiddleware, addBoxToCart);

export default cartRouter;
