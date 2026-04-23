import Box from '../models/boxModel.js'
import Food from '../models/foodModel.js'

export const addBox = async (req, res) => {
  try {
    const { name, items, price, marketPrice } = req.body
    console.log('addBox called by', req.headers['admin-email'], 'payload:', JSON.stringify(req.body))
    // Basic validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Box name is required' })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' })
    }
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid box price is required' })
    }

    // Validate items refer to existing food items and size is available
    const sizesAllowed = ['g100','g150','g200','g250','g300','g400','g500','kg1']
    for (const it of items) {
      if (!it?.itemId) return res.status(400).json({ success: false, message: 'Each item must include itemId' })
      const food = await Food.findById(it.itemId)
      if (!food) {
        return res.status(400).json({ success: false, message: `Food item not found: ${it.itemId}` })
      }
      if (!it.size || !sizesAllowed.includes(it.size)) {
        return res.status(400).json({ success: false, message: `Invalid size for item ${it.itemId}` })
      }
      // ensure size is enabled for the food item (if quantityOptions exist)
      if (food.quantityOptions && food.quantityOptions[it.size] === false) {
        return res.status(400).json({ success: false, message: `Selected size ${it.size} is not available for product ${food._id}` })
      }
    }

    const box = new Box({ name: name.trim(), items, price: Number(price), marketPrice: marketPrice ? Number(marketPrice) : undefined })
    await box.save()
    const populated = await Box.findById(box._id).populate({ path: 'items.itemId', select: 'name image prices marketPrices quantityOptions category status' })
    res.json({ success: true, data: populated })
  } catch (error) {
    console.error('addBox error', error)
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
}

export const listBoxes = async (req, res) => {
  try {
    // populate item info
    const boxes = await Box.find().populate({
      path: 'items.itemId',
      select: 'name image prices marketPrices quantityOptions category status'
    })
    res.json({ success: true, data: boxes })
  } catch (error) {
    console.error('listBoxes error', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

export const updateBox = async (req, res) => {
  try {
    const { boxId, price, marketPrice } = req.body
    
    if (!boxId) {
      return res.status(400).json({ success: false, message: 'Box ID is required' })
    }
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid box price is required' })
    }

    const box = await Box.findById(boxId)
    if (!box) {
      return res.status(400).json({ success: false, message: 'Box not found' })
    }

    box.price = Number(price)
    if (marketPrice !== undefined) {
      box.marketPrice = marketPrice ? Number(marketPrice) : undefined
    }

    await box.save()
    const updated = await Box.findById(boxId).populate({
      path: 'items.itemId',
      select: 'name image prices marketPrices quantityOptions category status'
    })
    
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('updateBox error', error)
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
}

export const deleteBox = async (req, res) => {
  try {
    const { boxId } = req.params
    
    if (!boxId) {
      return res.status(400).json({ success: false, message: 'Box ID is required' })
    }

    const box = await Box.findById(boxId)
    if (!box) {
      return res.status(400).json({ success: false, message: 'Box not found' })
    }

    await box.deleteOne()
    res.json({ success: true, message: 'Box deleted successfully' })
  } catch (error) {
    console.error('deleteBox error', error)
    res.status(500).json({ success: false, message: error.message || 'Server error' })
  }
}
