import mongoose from 'mongoose'

const boxSchema = new mongoose.Schema({
  name: { type: String, required: true },
  items: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'food', required: true },
      size: { type: String, required: true } // e.g. 'g250'
    }
  ],
  price: { type: Number, required: true },
  marketPrice: { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
}, { timestamps: true })

const boxModel = mongoose.models.box || mongoose.model('box', boxSchema)
export default boxModel
