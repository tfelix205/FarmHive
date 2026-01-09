const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    maxlength: [100, "Product name cannot exceed 100 characters"]
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"]
  },
  unit: {
    type: String,
    required: [true, "Unit is required"],
    enum: ["kg", "lb", "piece", "dozen", "gram", "liter"],
    default: "kg"
  },
  stock: {
    type: Number,
    required: [true, "Stock quantity is required"],
    min: [0, "Stock cannot be negative"],
    default: 0
  },
  description: {
    type: String,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  category: {
    type: String,
    enum: ["vegetables", "fruits", "grains", "dairy", "meat", "other"],
    default: "vegetables"
  },
  imageUrl: {
    type: String,
    default: null
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  discount: {
    type: Number,
    min: [0, "Discount cannot be negative"],
    max: [100, "Discount cannot exceed 100%"],
    default: 0
  },
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  origin: {
    type: String,
    maxlength: [100, "Origin cannot exceed 100 characters"]
  },
  harvestDate: Date,
  expiryDate: Date,
  tags: [String],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for final price after discount
productSchema.virtual("finalPrice").get(function() {
  if (this.discount > 0) {
    return this.price - (this.price * this.discount / 100);
  }
  return this.price;
});

// Virtual to check if product is in stock
productSchema.virtual("inStock").get(function() {
  return this.stock > 0;
});

// Index for text search
productSchema.index({ name: "text", description: "text", tags: "text" });

// Index for category filtering
productSchema.index({ category: 1, isAvailable: 1 });

// Pre-save middleware to update availability based on stock
productSchema.pre("save", function(next) {
  if (this.stock === 0) {
    this.isAvailable = false;
  }
  next();
});

// Static method to find low stock products
productSchema.statics.findLowStock = function(threshold = 10) {
  return this.find({ stock: { $lte: threshold }, isAvailable: true });
};

// Instance method to decrease stock
productSchema.methods.decreaseStock = function(quantity) {
  if (this.stock >= quantity) {
    this.stock -= quantity;
    if (this.stock === 0) {
      this.isAvailable = false;
    }
    return this.save();
  }
  throw new Error("Insufficient stock");
};

// Instance method to increase stock
productSchema.methods.increaseStock = function(quantity) {
  this.stock += quantity;
  if (this.stock > 0) {
    this.isAvailable = true;
  }
  return this.save();
};

module.exports = mongoose.model("Product", productSchema);