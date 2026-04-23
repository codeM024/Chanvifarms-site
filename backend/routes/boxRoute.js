import express from 'express'
import { addBox, listBoxes, updateBox, deleteBox } from '../controllers/boxController.js'
import adminAuth from '../middleware/adminAuth.js'

const router = express.Router()

// Admin-only: add box
router.post('/add', adminAuth, addBox)

// Admin-only: update box
router.put('/update', adminAuth, updateBox)

// Public: list boxes
router.get('/list', listBoxes)

// Admin-only: delete box
router.delete('/delete/:boxId', adminAuth, deleteBox)

export default router
