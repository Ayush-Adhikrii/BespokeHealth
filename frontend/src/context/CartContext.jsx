import { createContext, useContext, useEffect, useState } from "react";
import { getCookie, setCookie } from "../utils/cookie";

const CartContext = createContext();

const COOKIE_KEY = "bespokehealth_medicine_cart";

const loadCart = () => {
  try {
    const raw = getCookie(COOKIE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    setCookie(COOKIE_KEY, JSON.stringify(items), 7);
  }, [items]);

  const addItem = (medicine, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.medicine_id === medicine.id);
      const maxQuantity = medicine.quantity;

      if (existing) {
        const newQuantity = Math.min(existing.quantity + quantity, maxQuantity);
        return prev.map((i) =>
          i.medicine_id === medicine.id ? { ...i, quantity: newQuantity } : i
        );
      }

      return [
        ...prev,
        {
          medicine_id: medicine.id,
          name: medicine.name,
          price: medicine.price,
          discount_price: medicine.discount_price,
          image_url: medicine.image_url,
          prescription_required: medicine.prescription_required,
          max_quantity: maxQuantity,
          quantity: Math.min(quantity, maxQuantity),
        },
      ];
    });
  };

  const removeItem = (medicineId) => {
    setItems((prev) => prev.filter((i) => i.medicine_id !== medicineId));
  };

  const updateQuantity = (medicineId, quantity) => {
    setItems((prev) =>
      prev.map((i) =>
        i.medicine_id === medicineId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.max_quantity)) }
          : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce(
    (sum, i) => sum + (i.discount_price && i.discount_price < i.price ? i.discount_price : i.price) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, cartCount, cartTotal }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
