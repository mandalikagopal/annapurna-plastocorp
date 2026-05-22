import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiChevronLeft,FiChevronRight, FiShoppingCart } from 'react-icons/fi';
import { useCart } from './CartContext';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { cart } = useCart();

  // This sums up all quantities in the cart
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const categories = ['All', 'Plates', 'Cups', 'Carry Bags', 'Containers', 'Tissues', 'Pouches', 'Spoons'];

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(docs);
      setFiltered(docs);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (category === 'All') {
      setFiltered(products);
    } else {
      setFiltered(products.filter(p => p.category === category));
    }
  }, [category, products]);

  if (loading) return <div className="loader">Loading Annapurna Catalog...</div>;

  return (
    <div className="portal-container">
      <button className="back-link" onClick={() => navigate(`/customer`)}><FiChevronLeft /> Back</button>
      <header className="catalog-header">
        <h1>Our Products</h1>
        <div className="cart-icon-container" onClick={() => navigate('/cart')}>
        <FiShoppingCart size={24} />
        {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </div>
        <div className="category-scroll">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`filter-pill ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="product-grid">
        {filtered.map(product => (
          <div key={product.id} className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
            <div className="product-image">
              <img className="fill-mobile" src={product.imageUrl} alt={product.name} />
            </div>
            <div className="product-info">
              <span className="cat-tag">{product.category}</span>
              <h3>{product.name}</h3>
              <p>Starting from ₹{product.variants[0].price} <FiChevronRight className="go-icon" /></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;