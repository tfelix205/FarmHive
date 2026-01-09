const router = require("express").Router();
const Order = require("../models/order");
const Product = require("../models/product");
const auth = require("../middleware/auth.middleware");

// POST create order (public)
router.post("/", async (req, res) => {
  try {
    const { items, customerName, customerPhone, deliveryAddress, customerEmail, notes } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item" });
    }

    // Calculate totals and validate stock
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item._id || item.productId);
      
      if (!product) {
        return res.status(404).json({ message: `Product ${item.name} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        unit: product.unit,
        subtotal
      });
    }

    // Create order
    const order = await Order.create({
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress: {
        fullAddress: deliveryAddress
      },
      paymentMethod: req.body.paymentMethod || "Pay on Delivery",
      items: orderItems,
      totalAmount,
      finalAmount: totalAmount,
      notes
    });

    // Decrease stock for each product
    for (const item of items) {
      const product = await Product.findById(item._id || item.productId);
      if (product) {
        await product.decreaseStock(item.quantity);
      }
    }

    res.status(201).json({ 
      message: "Order placed successfully",
      order 
    });
  } catch (error) {
    console.error("Error creating order:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: "Validation error", errors });
    }
    
    res.status(500).json({ message: "Error creating order", error: error.message });
  }
});

// GET all orders (admin only) with filters
router.get("/", auth, async (req, res) => {
  try {
    const { 
      status, 
      startDate, 
      endDate, 
      phone,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (phone) {
      query.customerPhone = { $regex: phone, $options: "i" };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("items.productId", "name imageUrl category");

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
});

// GET single order by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.productId", "name imageUrl category");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Error fetching order" });
  }
});

// GET order by order number (public - for tracking)
router.get("/track/:orderNumber", async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .select("orderNumber customerName status statusHistory estimatedDeliveryTime trackingNumber createdAt");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error tracking order:", error);
    res.status(500).json({ message: "Error tracking order" });
  }
});

// PATCH update order status (admin only)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await order.updateStatus(status, req.user.id, notes);

    res.json({ 
      message: "Order status updated successfully",
      order 
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Error updating order status" });
  }
});

// PATCH cancel order (admin only)
router.patch("/:id/cancel", auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "Delivered") {
      return res.status(400).json({ message: "Cannot cancel delivered order" });
    }

    // Restore stock for cancelled order
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        await product.increaseStock(item.quantity);
      }
    }

    await order.cancelOrder(reason, req.user.id);

    res.json({ 
      message: "Order cancelled successfully",
      order 
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Error cancelling order" });
  }
});

// GET order statistics (admin only)
router.get("/admin/statistics", auth, async (req, res) => {
  try {
    const stats = await Order.getRevenueStats();
    
    const statusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const todayOrders = await Order.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    const monthOrders = await Order.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    res.json({
      ...stats,
      statusBreakdown,
      todayOrders,
      monthOrders
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ message: "Error fetching statistics" });
  }
});

// GET recent orders (admin only)
router.get("/admin/recent", auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("orderNumber customerName status totalAmount createdAt");

    res.json(orders);
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    res.status(500).json({ message: "Error fetching recent orders" });
  }
});

// GET orders by customer phone (admin only)
router.get("/customer/:phone", auth, async (req, res) => {
  try {
    const orders = await Order.find({ customerPhone: req.params.phone })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(orders);
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({ message: "Error fetching customer orders" });
  }
});

// PUT update delivery details (admin only)
router.put("/:id/delivery", auth, async (req, res) => {
  try {
    const { deliveryDate, estimatedDeliveryTime, trackingNumber } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryDate, estimatedDeliveryTime, trackingNumber },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error updating delivery details:", error);
    res.status(500).json({ message: "Error updating delivery details" });
  }
});

module.exports = router;