import express from 'express';
import { getCustomers } from '../controllers/customerController.js';
import authMiddleware from "../middleware/auth.js"

const router = express.Router();

// Protected route - only accessible by admin
router.get('/customers', authMiddleware, getCustomers);

export default router;
