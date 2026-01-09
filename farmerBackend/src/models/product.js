const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  unit: String,
  stock: Number,
  description: String,
  isAvailable: { type: Boolean, default: true }
});

module.exports = mongoose.model("Product", productSchema);
