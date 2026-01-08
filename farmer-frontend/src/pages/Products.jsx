import { useEffect, useState, useContext } from "react";
import api from "../services/api";
import { CartContext } from "../context/CartContext";

export default function Products() {
  const [products, setProducts] = useState([]);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    api.get("/products").then(res => setProducts(res.data));
  }, []);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map(product => (
        <div key={product._id} className="border p-4 rounded">
          <h2 className="font-bold">{product.name}</h2>
          <p>${product.price} / {product.unit}</p>
          <button
            onClick={() => addToCart(product)}
            className="bg-green-600 text-white px-4 py-2 mt-2"
          >
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}
