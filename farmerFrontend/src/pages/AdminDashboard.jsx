import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    name: "",
    price: "",
    unit: "kg",
    stock: "",
    description: "",
    category: "vegetables"
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, ordersRes] = await Promise.all([
        api.get("/products"),
        api.get("/orders")
      ]);
      
      // Handle the response structure from backend
      const productsData = productsRes.data.products || productsRes.data;
      const ordersData = ordersRes.data.orders || ordersRes.data;
      
      setProducts(Array.isArray(productsData) ? productsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post("/products", {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        isAvailable: true
      });
      setForm({ 
        name: "", 
        price: "", 
        unit: "kg", 
        stock: "", 
        description: "",
        category: "vegetables"
      });
      fetchData();
    } catch (error) {
      console.error("Error adding product:", error);
      alert(error.response?.data?.message || "Failed to add product");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await api.delete(`/products/${id}`);
      fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      fetchData();
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order status");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/admin/login");
  };

  const stats = {
    totalProducts: products.length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === "Pending").length,
    totalRevenue: orders
      .filter(o => o.status !== "Cancelled")
      .reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm md:text-base"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left mb-2 md:mb-0">
                <p className="text-gray-600 text-xs md:text-sm mb-1">Total Products</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.totalProducts}</p>
              </div>
              <div className="bg-green-100 p-2 md:p-3 rounded-full">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left mb-2 md:mb-0">
                <p className="text-gray-600 text-xs md:text-sm mb-1">Total Orders</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
              </div>
              <div className="bg-blue-100 p-2 md:p-3 rounded-full">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left mb-2 md:mb-0">
                <p className="text-gray-600 text-xs md:text-sm mb-1">Pending</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.pendingOrders}</p>
              </div>
              <div className="bg-yellow-100 p-2 md:p-3 rounded-full">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left mb-2 md:mb-0">
                <p className="text-gray-600 text-xs md:text-sm mb-1">Revenue</p>
                <p className="text-xl md:text-3xl font-bold text-gray-800">${stats.totalRevenue.toFixed(0)}</p>
              </div>
              <div className="bg-purple-100 p-2 md:p-3 rounded-full">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-xl shadow-md">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab("products")}
              className={`flex-1 py-3 md:py-4 font-semibold transition-colors text-sm md:text-base whitespace-nowrap ${
                activeTab === "products"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-1 py-3 md:py-4 font-semibold transition-colors text-sm md:text-base whitespace-nowrap ${
                activeTab === "orders"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Orders
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl shadow-md p-4 md:p-6">
          {activeTab === "products" && (
            <div>
              {/* Add Product Form */}
              <div className="mb-6 md:mb-8 p-4 md:p-6 bg-green-50 rounded-xl">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Add New Product</h2>
                <form onSubmit={addProduct} className="grid md:grid-cols-2 gap-3 md:gap-4">
                  <input
                    type="text"
                    placeholder="Product Name"
                    className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    required
                  />
                  <select
                    className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="lb">Pound (lb)</option>
                    <option value="piece">Piece</option>
                    <option value="dozen">Dozen</option>
                    <option value="gram">Gram</option>
                    <option value="liter">Liter</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Stock Quantity"
                    className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    required
                  />
                  <select
                    className="px-3 py-2 md:px-4 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="grains">Grains</option>
                    <option value="dairy">Dairy</option>
                    <option value="meat">Meat</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea
                    placeholder="Description (optional)"
                    className="md:col-span-2 px-3 py-2 md:px-4 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    rows="2"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                  <button
                    type="submit"
                    className="md:col-span-2 bg-green-600 hover:bg-green-700 text-white py-2 md:py-3 text-sm md:text-base rounded-lg font-semibold transition-colors"
                  >
                    Add Product
                  </button>
                </form>
              </div>

              {/* Products List */}
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Current Products</h2>
              {products.length === 0 ? (
                <p className="text-gray-600 text-center py-8 text-sm md:text-base">No products yet. Add your first product above!</p>
              ) : (
                <div className="grid gap-3 md:gap-4">
                  {products.map(product => (
                    <div key={product._id} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base md:text-lg font-bold text-gray-800 truncate">{product.name}</h3>
                          {product.description && (
                            <p className="text-gray-600 text-xs md:text-sm mt-1 line-clamp-2">{product.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
                            <span className="text-green-600 font-semibold">${product.price} / {product.unit}</span>
                            <span className="text-gray-600">Stock: {product.stock} {product.unit}</span>
                            <span className="text-gray-600 capitalize">{product.category}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            product.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {product.isAvailable ? "Available" : "Unavailable"}
                          </span>
                          <button
                            onClick={() => deleteProduct(product._id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-semibold transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Order Management</h2>
              {orders.length === 0 ? (
                <p className="text-gray-600 text-center py-8 text-sm md:text-base">No orders yet.</p>
              ) : (
                <div className="grid gap-3 md:gap-4">
                  {orders.map(order => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                            <h3 className="text-base md:text-lg font-bold text-gray-800">{order.customerName}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              order.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                              order.status === "Delivered" ? "bg-green-100 text-green-700" :
                              order.status === "Cancelled" ? "bg-red-100 text-red-700" :
                              "bg-blue-100 text-blue-700"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="text-xs md:text-sm text-gray-600 space-y-1">
                            {order.orderNumber && <p><strong>Order #:</strong> {order.orderNumber}</p>}
                            <p><strong>Phone:</strong> {order.customerPhone}</p>
                            <p><strong>Address:</strong> {order.deliveryAddress?.fullAddress || order.deliveryAddress}</p>
                            <p><strong>Payment:</strong> {order.paymentMethod}</p>
                            <p><strong>Total:</strong> <span className="text-green-600 font-semibold">${(order.finalAmount || order.totalAmount)?.toFixed(2)}</span></p>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs md:text-sm font-semibold text-gray-700 mb-1">Items:</p>
                              <ul className="text-xs md:text-sm text-gray-600 space-y-1">
                                {order.items.map((item, idx) => (
                                  <li key={idx}>• {item.name} x {item.quantity} ({item.unit})</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        {order.status === "Pending" && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => updateOrderStatus(order._id, "Confirmed")}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors whitespace-nowrap"
                            >
                              Confirm Order
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order._id, "Delivered")}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors whitespace-nowrap"
                            >
                              Mark Delivered
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order._id, "Cancelled")}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors whitespace-nowrap"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {order.status === "Confirmed" && (
                          <button
                            onClick={() => updateOrderStatus(order._id, "Delivered")}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-colors"
                          >
                            Mark as Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}