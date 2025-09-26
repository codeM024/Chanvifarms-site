import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    prices: {
    g100: { type: Number },
     g150: { type: Number },
        g200: { type: Number },   
     g250: { type: Number },
        g300: { type: Number },
      g500: { type: Number },
      kg1: { type: Number },
    },
    marketPrices: {
      g250: { type: Number },
      g500: { type: Number },
      kg1: { type: Number },
    },
    quantityOptions: {
      g250: { type: Boolean, default: false },
      g500: { type: Boolean, default: false },
      kg1: { type: Boolean, default: false },
    },
    image: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        "Vegetables",
        "Fruits",
        "Exotic Vegetables",
        "Exotic Fruits",
        "Meat",
        "Groceries",
      ],
    },
    status: {
      type: String,
      enum: ["in-stock", "out-of-stock", "coming-soon"],
      default: "in-stock",
    },
  },
  {
    timestamps: true,
  }
);

// Add middleware to set marketPrices if not provided
foodSchema.pre("save", function (next) {
  if (this.quantityOptions.g100 && !this.marketPrices.g100)
    this.marketPrices.g100 = this.prices.g100;
  if (this.quantityOptions.g150 && !this.marketPrices.g150)
    this.marketPrices.g150 = this.prices.g150;
  if (this.quantityOptions.g200 && !this.marketPrices.g200)
    this.marketPrices.g200 = this.prices.g200;
  if (this.quantityOptions.g250 && !this.marketPrices.g250)
    this.marketPrices.g250 = this.prices.g250;
  if (this.quantityOptions.g300 && !this.marketPrices.g300)
    this.marketPrices.g300 = this.prices.g300;
  if (this.quantityOptions.g400 && !this.marketPrices.g400)
    this.marketPrices.g400 = this.prices.g400;
  if (this.quantityOptions.g500 && !this.marketPrices.g500)
    this.marketPrices.g500 = this.prices.g500;
  if (this.quantityOptions.kg1 && !this.marketPrices.kg1)
    this.marketPrices.kg1 = this.prices.kg1;
  next();
});

const foodModel = mongoose.models.food || mongoose.model("food", foodSchema);

export default foodModel;
