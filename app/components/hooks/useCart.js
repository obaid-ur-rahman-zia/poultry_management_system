// hooks/useCart.js
import { useState } from "react";
import { toast } from "sonner";

export default function useCart() {
  const [cart, setCart] = useState([]);

  function addToCart(product) {
    const exists = cart.some((item) => item.product_id === product.product_id);

    if (exists) {
      toast.error("Item Already Added");
      return false;
    }

    setCart((prev) => [...prev, product]);
    return true;
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((item) => item.product_id !== id));
  }

  function clearCart() {
    setCart([]);
  }

  function replaceCart(items) {
    setCart(items);
  }

  // ADD THIS NEW FUNCTION
  function updateCartItem(productId, updatedItem) {
    setCart((prev) =>
      prev.map((item) => (item.product_id === productId ? updatedItem : item))
    );
  }

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    replaceCart,
    updateCartItem,
  };
}
