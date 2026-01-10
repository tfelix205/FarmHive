import { useContext } from "react";
import { CartContext } from "../context/CartContext";

export default function ProductCard({ product }) {
  const { addToCart, showNotification } = useContext(CartContext);

  const handleAddToCart = () => {
    addToCart(product);
    showNotification(`${product.name} added to cart!`);
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <svg
          className={`w-20 h-20 text-gray-400 group-hover:scale-110 transition-transform duration-300 ${product.imageUrl ? 'hidden' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
        </svg>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {product.stock < 10 && product.stock > 0 && (
            <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
              Low Stock
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
              Out of Stock
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
              Featured
            </span>
          )}
        </div>

        {/* Category Badge */}
        {product.category && (
          <div className="absolute top-2 right-2">
            <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold capitalize shadow-md">
              {product.category}
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-green-600 transition-colors line-clamp-2">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline mb-3">
          <span className="text-2xl font-bold text-green-600">
            N{product.price}
          </span>
          <span className="text-gray-500 ml-2 text-sm">/ {product.unit}</span>
        </div>

        {/* Stock Info */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>
            {product.stock > 0 ? (
              <>{product.stock} {product.unit} available</>
            ) : (
              <span className="text-red-600 font-semibold">Out of Stock</span>
            )}
          </span>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`w-full font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
            product.stock === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md'
          }`}
        >
          {product.stock === 0 ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Out of Stock
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}