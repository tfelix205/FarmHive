const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customerName: {
    type: String,
    required: [true, "Customer name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
  },
  customerPhone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    fullAddress: {
      type: String,
      required: [true, "Delivery address is required"]
    }
  },
  paymentMethod: {
    type: String,
    enum: ["Pay on Delivery", "Online", "Card", "UPI"],
    default: "Pay on Delivery"
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Pending"
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled"],
    default: "Pending"
  },
  notes: {
    type: String,
    maxlength: [500, "Notes cannot exceed 500 characters"]
  },
  deliveryDate: Date,
  estimatedDeliveryTime: String,
  trackingNumber: String,
  cancellationReason: String,
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: String,
    notes: String
  }]
}, {
  timestamps: true
});

// Generate unique order number before saving
orderSchema.pre("save", async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Find last order of the day
    const lastOrder = await this.constructor
      .findOne({ orderNumber: new RegExp(`^ORD${year}${month}${day}`) })
      .sort({ orderNumber: -1 });
    
    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }
    
    this.orderNumber = `ORD${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
    
    // Calculate final amount
    this.finalAmount = this.totalAmount - this.discount + this.deliveryFee;
    
    // Add initial status to history
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      notes: "Order created"
    });
  }
  next();
});

// Index for faster queries
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customerPhone: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

// Static method to get orders by date range
orderSchema.statics.getOrdersByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

// Static method to get revenue statistics
orderSchema.statics.getRevenueStats = async function() {
  const stats = await this.aggregate([
    {
      $match: {
        status: { $ne: "Cancelled" }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$finalAmount" },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: "$finalAmount" }
      }
    }
  ]);
  
  return stats[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
};

// Instance method to update status
orderSchema.methods.updateStatus = function(newStatus, updatedBy, notes) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy,
    notes
  });
  return this.save();
};

// Instance method to cancel order
orderSchema.methods.cancelOrder = function(reason, updatedBy) {
  this.status = "Cancelled";
  this.cancellationReason = reason;
  this.statusHistory.push({
    status: "Cancelled",
    timestamp: new Date(),
    updatedBy,
    notes: reason
  });
  return this.save();
};

module.exports = mongoose.model("Order", orderSchema);