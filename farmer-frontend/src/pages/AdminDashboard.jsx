import { useEffect, useState } from "react";
import api from "../services/api";

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", unit: "" });

  // 1️⃣ Fetch data inside useEffect using async function
  useEffect(() => {
    const getData = async () => {
      try {
        const productsRes = await api.get("/products");
        const ordersRes = await api.get("/orders");
        setProducts(productsRes.data);
        setOrders(ordersRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    getData();
  }, []); // only runs once on mount

  const addProduct = async () => {
    try {
      await api.post("/products", form);
      setForm({ name: "", price: "", unit: "" });
      // fetch latest products
      const productsRes = await api.get("/products");
      setProducts(productsRes.data);
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      const ordersRes = await api.get("/orders");
      setOrders(ordersRes.data);
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Add Product */}
      <div className="mb-8">
        <h2 className="font-bold mb-2">Add Product</h2>
        <input
          placeholder="Name"
          className="border p-2 mr-2 mb-2"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Price"
          className="border p-2 mr-2 mb-2"
          value={form.price}
          onChange={e => setForm({ ...form, price: e.target.value })}
        />
        <input
          placeholder="Unit (kg)"
          className="border p-2 mr-2 mb-2"
          value={form.unit}
          onChange={e => setForm({ ...form, unit: e.target.value })}
        />
        <button
          onClick={addProduct}
          className="bg-green-600 text-white px-4 py-2 mt-2"
        >
          Add
        </button>
      </div>

      {/* Display Products */}
      <h2 className="font-bold mb-2">Current Products</h2>
      {products.map(p => (
        <div key={p._id} className="border p-2 mb-1">
          {p.name} - ${p.price}/{p.unit}
        </div>
      ))}

      {/* Orders */}
      <h2 className="font-bold mb-2 mt-6">Orders</h2>
      {orders.map(order => (
        <div key={order._id} className="border p-4 mb-2">
          <p>
            <strong>{order.customerName}</strong> – {order.status}
          </p>
          <button
            onClick={() => updateOrderStatus(order._id, "Delivered")}
            className="bg-blue-600 text-white px-3 py-1 mt-2"
          >
            Mark Delivered
          </button>
        </div>
      ))}
    </div>
  );
}
