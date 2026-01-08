import { useContext, useState } from "react";
import { CartContext } from "../context/CartContext";
import api from "../services/api";

export default function Checkout() {
  const { cart } = useContext(CartContext);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    deliveryAddress: ""
  });

  const placeOrder = async () => {
    await api.post("/orders", {
      ...form,
      paymentMethod: "Pay on Delivery",
      items: cart
    });
    alert("Order placed successfully!");
  };

  return (
    <div className="p-6">
      <input placeholder="Name" className="border p-2 w-full mb-2"
        onChange={e => setForm({ ...form, customerName: e.target.value })} />
      <input placeholder="Phone" className="border p-2 w-full mb-2"
        onChange={e => setForm({ ...form, customerPhone: e.target.value })} />
      <input placeholder="Address" className="border p-2 w-full mb-2"
        onChange={e => setForm({ ...form, deliveryAddress: e.target.value })} />
      <button
        onClick={placeOrder}
        className="bg-green-700 text-white px-4 py-2"
      >
        Place Order
      </button>
    </div>
  );
}
