import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';

import {
  addCartItem,
  addCartItems,
  cartTotalQuantity,
  cartStorageKey,
  readCartForOwner,
  removeCartItem,
  removeCartItems as removeSelectedCartItems,
  updateCartItemQuantity,
  writeCartForOwner,
} from './cartStorage.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const owner = user?.id || user?.email || 'guest';
  const [items, setItems] = useState([]);
  const [loadedOwner, setLoadedOwner] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    setItems(readCartForOwner(owner));
    setLoadedOwner(owner);
  }, [authLoading, owner]);

  useEffect(() => {
    if (loadedOwner === owner) writeCartForOwner(owner, items);
  }, [items, loadedOwner, owner]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === cartStorageKey(owner)) {
        setItems(readCartForOwner(owner));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [owner]);

  const addItem = useCallback((item, maxQuantity) => {
    setItems((currentItems) => addCartItem(currentItems, item, maxQuantity));
  }, []);

  const addItems = useCallback((additions) => {
    setItems((currentItems) => addCartItems(currentItems, additions));
  }, []);

  const updateQuantity = useCallback((key, quantity, maxQuantity, ages) => {
    setItems((currentItems) => updateCartItemQuantity(currentItems, key, quantity, maxQuantity, ages));
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
    addItems,
    updateQuantity,
    removeItem,
    removeItems,
    clearCart,
  }), [addItem, addItems, clearCart, items, removeItem, removeItems, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider.');
  }
  return context;
}
