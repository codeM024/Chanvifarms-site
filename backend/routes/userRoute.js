import express from "express"
import {loginUser, registerUser, getUserAddresses, saveAddress, deleteAddress, updateAddress, googleAuth} from "../controllers/userController.js"
import authMiddleware from "../middleware/auth.js"

const userRouter = express.Router()

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/google-auth", googleAuth);
userRouter.get("/addresses", authMiddleware, getUserAddresses);
userRouter.post("/address", authMiddleware, saveAddress);
userRouter.delete("/address/:addressId", authMiddleware, deleteAddress);
userRouter.put("/address/:addressId", authMiddleware, updateAddress);

export default userRouter;