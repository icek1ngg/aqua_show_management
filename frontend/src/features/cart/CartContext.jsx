import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  CART_STORAGE_KEY,
  addCartItem,
  cartTotalQuantity,
  readCart,
  removeCartItem,
  removeCartItems as removeSelectedCartItems,
  updateCartItemQuantity,
  writeCart,
} from './cartStorage.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readCart());

  useEffect(() => {
    writeCart(items);
  }, [items]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === CART_STORAGE_KEY) {
        setItems(readCart());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const addItem = useCallback((item, maxQuantity) => {
    setItems((currentItems) => addCartItem(currentItems, item, maxQuantity));
  }, []);

  const updateQuantity = useCallback((key, quantity, maxQuantity) => {
    setItems((currentItems) => updateCartItemQuantity(currentItems, key, quantity, maxQuantity));
  }, []);

  const removeItem = useCallback((key) => {
    setItems((currentItems) => removeCartItem(currentItems, key));
  }, []);

  const removeItems = useCallback((keys) => {
    setItems((currentItems) => removeSelectedCartItems(currentItems, keys));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const value = useMemo(() => ({
    items,
    totalQuantity: cartTotalQuantity(items),
    addItem,
    updateQuantity,
    removeItem,
    removeItems,
    clearCart,
  }), [addItem, clearCart, items, removeItem, removeItems, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider.');
  }
  return context;
}
