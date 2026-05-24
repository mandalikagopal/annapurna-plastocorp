import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiChevronLeft, FiChevronRight, FiShoppingCart } from 'react-icons/fi';
import { useCart } from './CartContext';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [category, setCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { cart } = useCart();

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const categories = ['All', 'Plates', 'Cups', 'Carry Bags', 'Containers', 'Tissues', 'Pouches', 'Spoons'];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(docs);
        setFiltered(docs);
      } catch (error) {
        console.error("Error fetching catalog products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let result = products;
    if (category !== 'All') {
      result = result.filter(p => p.category === category);
    }
    if (searchTerm.trim() !== '') {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFiltered(result);
  }, [category, searchTerm, products]);

  if (loading) {
    return <div className="loading">Loading our complete catalog dashboard...</div>;
  }

  return (
    <div className="portal-container animate-fadeIn" style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
      
      {/* TOP HEADER NAVIGATION ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button className="back-link" onClick={() => navigate(`/customer`)} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FiChevronLeft /> Back
        </button>
        
        {/* BALANCED CART ICON AXIS */}
        <div className="cart-icon-container" onClick={() => navigate('/cart')} style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>
          <FiShoppingCart size={24} color="#1e293b" />
          {itemCount > 0 && <span className="cart-badge" style={{ position: 'absolute', top: '-2px', right: '-2px' }}>{itemCount}</span>}
        </div>
      </div>

      {/* TITLE & SEARCH PANEL BLOCK */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 16px 0' }}>Our Products</h1>
        
        {/* CLEAN, SELF-CONTAINED SEARCH BLOCK */}
        <div className="search-bar-wrapper" style={{ position: 'relative', width: '100%' }}>
          <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
          <input 
            type="text" 
            placeholder="Search matching items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontSize: '14px',
              outline: 'none',
              background: '#f8fafc',
              color: '#1e293b',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* HORIZONTAL CATEGORY SCROLL LIST */}
      <div className="category-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '10px', width: '100%' }}>
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`filter-pill ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              background: category === cat ? '#10b981' : '#fff',
              color: category === cat ? '#fff' : '#475569',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              fontWeight: category === cat ? 'bold' : 'normal',
              transition: 'all 0.2s ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PRODUCT DATA GRID CONTAINER */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
          No catalog assets found matching your criteria.
        </div>
      ) : (
        <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', marginTop: '10px' }}>
          {filtered.map(product => (
            <div 
              key={product.id} 
              className="product-card" 
              onClick={() => navigate(`/product/${product.id}`)}
              style={{
                background: '#fff',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s'
              }}
            >
              <div className="product-image" style={{ width: '100%', height: '140px', overflow: 'hidden', background: '#f1f5f9' }}>
                <img 
                  className="fill-mobile" 
                  src={product.imageUrl} 
                  alt={product.name} 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>

              <div className="product-info" style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <span className="cat-tag" style={{ fontSize: '10px', textTransform: 'uppercase', color: '#2563eb', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                    {product.category}
                  </span>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '36px' }}>
                    {product.name}
                  </h3>
                </div>
                <p style={{ fontSize: '12px', margin: 0, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: '500' }}>
                  From ₹{product.variants && product.variants.length > 0 ? product.variants[0].price : 'N/A'}
                  <FiChevronRight className="go-icon" color="#2563eb" />
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;