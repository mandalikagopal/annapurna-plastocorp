import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Pass a function to useState so it evaluates synchronously on the absolute first frame
  const [cart, setCart] = useState(() => {
    const savedCart = sessionStorage.getItem('annapurna_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Keep this effect to dynamically sync updates going forward
  useEffect(() => {
    sessionStorage.setItem('annapurna_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, variant, quantity) => {
    setCart(prevCart => {
      const targetId = product.id;
      const existingItemIndex = prevCart.findIndex(
        item => item.id === targetId && item.size === variant.size
      );

      if (existingItemIndex > -1) {
        return prevCart.map((item, idx) => 
          idx === existingItemIndex 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
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
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};