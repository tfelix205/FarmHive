const router = require("express").Router();
const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const auth = require("../middleware/auth.middleware");

// All routes are admin only
router.use(auth);

// GET dashboard overview statistics
router.get("/dashboard", async (req, res) => {
  try {
    // Date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // Total counts
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: "customer" });

    // Today's stats
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today }
    });

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          status: { $ne: "Cancelled" }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$finalAmount" }
        }
      }
    ]);

    // This month's stats
    const monthOrders = await Order.countDocuments({
      createdAt: { $gte: thisMonth }
    });

    const monthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thisMonth },
          status: { $ne: "Cancelled" }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$finalAmount" }
        }
      }
    ]);

    // Last month's revenue for comparison
    const lastMonthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: lastMonth, $lte: lastMonthEnd },
          status: { $ne: "Cancelled" }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$finalAmount" }
        }
      }
    ]);

    // Order status breakdown
    const orderStatusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    // Low stock alerts
    const lowStockProducts = await Product.find({
      stock: { $lte: 10, $gt: 0 },
      isAvailable: true
    }).select("name stock unit");

    const outOfStockProducts = await Product.countDocuments({
      stock: 0
    });

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderNumber customerName status finalAmount createdAt");

    res.json({
      overview: {
        totalProducts,
        totalOrders,
        totalCustomers,
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
        monthOrders,
        monthRevenue: monthRevenue[0]?.total || 0,
        lastMonthRevenue: lastMonthRevenue[0]?.total || 0,
        revenueGrowth: lastMonthRevenue[0]?.total 
          ? (((monthRevenue[0]?.total || 0) - lastMonthRevenue[0].total) / lastMonthRevenue[0].total * 100).toFixed(2)
          : 0
      },
      orderStatusBreakdown,
      topProducts,
      inventory: {
        lowStockProducts,
        outOfStockProducts
      },
      recentOrders
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard statistics" });
  }
});

// GET sales report by date range
router.get("/sales-report", async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let groupFormat;
    switch (groupBy) {
      case "hour":
        groupFormat = { $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" } };
        break;
      case "day":
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case "month":
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        break;
      default:
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: "Cancelled" }
        }
      },
      {
        $group: {
          _id: groupFormat,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$finalAmount" },
          averageOrderValue: { $avg: "$finalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const summary = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: "Cancelled" }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$finalAmount" },
          averageOrderValue: { $avg: "$finalAmount" },
          totalItems: { $sum: { $size: "$items" } }
        }
      }
    ]);

    res.json({
      period: { startDate, endDate, groupBy },
      summary: summary[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, totalItems: 0 },
      salesData
    });
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({ message: "Error generating sales report" });
  }
});

// GET product performance report
router.get("/product-performance", async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const productPerformance = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.name" },
          totalQuantitySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
          orderCount: { $sum: 1 },
          averagePrice: { $avg: "$items.price" }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Get current stock info
    const productIds = productPerformance.map(p => p._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id stock isAvailable");

    const productsMap = products.reduce((acc, p) => {
      acc[p._id] = { stock: p.stock, isAvailable: p.isAvailable };
      return acc;
    }, {});

    const enrichedPerformance = productPerformance.map(p => ({
      ...p,
      currentStock: productsMap[p._id]?.stock || 0,
      isAvailable: productsMap[p._id]?.isAvailable || false
    }));

    res.json(enrichedPerformance);
  } catch (error) {
    console.error("Error generating product performance report:", error);
    res.status(500).json({ message: "Error generating product performance report" });
  }
});

// GET customer insights
router.get("/customer-insights", async (req, res) => {
  try {
    // Top customers by order count
    const topCustomersByOrders = await Order.aggregate([
      {
        $group: {
          _id: "$customerPhone",
          customerName: { $first: "$customerName" },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$finalAmount" },
          averageOrderValue: { $avg: "$finalAmount" }
        }
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 }
    ]);

    // Top customers by spending
    const topCustomersBySpending = await Order.aggregate([
      {
        $group: {
          _id: "$customerPhone",
          customerName: { $first: "$customerName" },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$finalAmount" },
          averageOrderValue: { $avg: "$finalAmount" }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    // New customers (first order in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newCustomers = await Order.aggregate([
      {
        $group: {
          _id: "$customerPhone",
          firstOrder: { $min: "$createdAt" },
          customerName: { $first: "$customerName" }
        }
      },
      {
        $match: {
          firstOrder: { $gte: thirtyDaysAgo }
        }
      },
      { $sort: { firstOrder: -1 } }
    ]);

    res.json({
      topCustomersByOrders,
      topCustomersBySpending,
      newCustomers: newCustomers.length,
      newCustomersList: newCustomers.slice(0, 10)
    });
  } catch (error) {
    console.error("Error generating customer insights:", error);
    res.status(500).json({ message: "Error generating customer insights" });
  }
});

// GET inventory report
router.get("/inventory", async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const availableProducts = await Product.countDocuments({ isAvailable: true });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });
    const lowStockProducts = await Product.countDocuments({ 
      stock: { $lte: 10, $gt: 0 } 
    });

    const categoryBreakdown = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalStock: { $sum: "$stock" },
          averagePrice: { $avg: "$price" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalInventoryValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ["$price", "$stock"] } }
        }
      }
    ]);

    const lowStockList = await Product.find({
      stock: { $lte: 10, $gt: 0 }
    })
      .select("name stock unit price category")
      .sort({ stock: 1 });

    const outOfStockList = await Product.find({ stock: 0 })
      .select("name unit price category")
      .sort({ name: 1 });

    res.json({
      summary: {
        totalProducts,
        availableProducts,
        outOfStockProducts,
        lowStockProducts,
        totalInventoryValue: totalInventoryValue[0]?.totalValue || 0
      },
      categoryBreakdown,
      lowStockList,
      outOfStockList
    });
  } catch (error) {
    console.error("Error generating inventory report:", error);
    res.status(500).json({ message: "Error generating inventory report" });
  }
});

// GET order trends (last 30 days)
router.get("/order-trends", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$finalAmount" },
          averageOrderValue: { $avg: "$finalAmount" },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(dailyOrders);
  } catch (error) {
    console.error("Error generating order trends:", error);
    res.status(500).json({ message: "Error generating order trends" });
  }
});

module.exports = router;