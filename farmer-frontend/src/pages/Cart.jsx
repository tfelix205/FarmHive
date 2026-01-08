import { useContext } from "react";
import { CartContext } from "../context/CartContext";

export default function Cart() {
  const { cart, removeFromCart } = useContext(CartContext);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          {cart.map((item) => (
            <div key={item._id} className="border p-2 mb-2 flex justify-between">
              <div>
                <strong>{item.name}</strong> x {item.quantity} <br />
                ${item.price} / {item.unit}
              </div>
              <button
                onClick={() => removeFromCart(item._id)}
                className="bg-red-600 text-white px-2 py-1 rounded"
              >
                Remove
              </button>
            </div>
          ))}
          <h2 className="font-bold mt-4">Total: ${total.toFixed(2)}</h2>
        </div>
      )}
    </div>
  );
}
