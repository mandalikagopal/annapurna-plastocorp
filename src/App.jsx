import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './CartContext'; // Ensure the path and extension (.jsx) match
import Home from './Home';
import Register from './Register';
import Login from './Login';
import CustomerPortal from './CustomerPortal';
import Products from './Products';
import ProductDetail from './ProductDetail';
import Profile from './Profile';
import Cart from './Cart'; 
import Orders from './Orders';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    /* 1. Wrap everything in CartProvider */
    <CartProvider>
      <Toaster position="top-center" reverseOrder={false} /> 
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/customer" element={<CustomerPortal />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;