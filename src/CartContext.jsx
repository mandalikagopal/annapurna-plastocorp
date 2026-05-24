import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('annapurna_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem('annapurna_cart', JSON.stringify(cart));
  }, [cart]);

 const addToCart = (product, variant, quantity) => {
  setCart(prevCart => {
    // 1. Identify the unique target ID reliably (fallback to product.id)
    const targetId = product.id;

    // 2. Find if the exact same product ID with the exact same size variant is already in the cart
    const existingItemIndex = prevCart.findIndex(
      item => item.id === targetId && item.size === variant.size
    );

    // 3. If it exists, map through and update only that item's quantity
    if (existingItemIndex > -1) {
      return prevCart.map((item, idx) => 
        idx === existingItemIndex 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    }
    
    // 4. If it's brand new, append it as a clean new item entry
    return [...prevCart, { 
      id: targetId, 
      name: product.name, 
      size: variant.size, 
      price: variant.price, 
      image: product.imageUrl,
      quantity 
    }];
  });
};

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};