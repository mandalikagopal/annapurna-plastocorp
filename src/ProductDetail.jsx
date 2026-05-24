import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FiChevronLeft, FiShoppingCart, FiPlus, FiMinus, FiChevronRight } from 'react-icons/fi';
import { useCart } from './CartContext';
import toast from 'react-hot-toast';
import './App.css'; 

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [currentImgIndex, setCurrentImgIndex] = useState(0); 

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const getProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct(data);
          setSelectedVariant(data.variants[0]); 
          setCurrentImgIndex(0); 
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };
    getProduct();
  }, [id]);

  const handleVariantChange = (v) => {
    setSelectedVariant(v);
    setCurrentImgIndex(0);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    const imagesList = selectedVariant?.images || [product?.imageUrl];
    setCurrentImgIndex((prev) => (prev + 1) % imagesList.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    const imagesList = selectedVariant?.images || [product?.imageUrl];
    setCurrentImgIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    
    const variantImg = selectedVariant.images && selectedVariant.images.length > 0 
      ? selectedVariant.images[0] 
      : product.imageUrl;

    const modifiedProductObj = {
      ...product,
      imageUrl: variantImg 
    };

    addToCart(modifiedProductObj, selectedVariant, qty);
    toast.success(`${qty}x ${product.name} (${selectedVariant.size}) added!`);
  };

  if (!product || !selectedVariant) {
    return <div className="loading">Loading product detail view...</div>;
  }

  const currentImagesArray = selectedVariant.images && selectedVariant.images.length > 0
    ? selectedVariant.images
    : [product.imageUrl];

  return (
    <div className="portal-container animate-fadeIn">
      <header className="catalog-header" style={{ marginBottom: '20px' }}>
        <button className="back-link" onClick={() => navigate(-1)}>
          <FiChevronLeft /> Back
        </button>
        <div className="cart-icon-container" onClick={() => navigate('/cart')}>
          <FiShoppingCart size={24} />
          {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </div>
      </header>

      <div className="product-detail-layout">
        {/* CAROUSEL IMAGE CONTAINER WITH FIXED ASPECT RATIO */}
        <div className="detail-image-side" style={{ width: '100%', maxWidth: '450px', margin: '0 auto' }}>
          <div className="carousel-wrapper" style={{ position: 'relative', width: '100%', height: '400px', overflow: 'hidden', borderRadius: '12px', background: '#f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            
            <img 
              src={currentImagesArray[currentImgIndex]} 
              alt={`${product.name}`} 
              className="carousel-main-image"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', // This cuts and stretches all input images into the same strict dimension boundaries
                display: 'block',
                transition: 'all 0.3s ease'
              }}
            />
            
            {currentImagesArray.length > 1 && (
              <>
                <button className="carousel-arrow left" onClick={prevImage} style={arrowStyles.left}>
                  <FiChevronLeft size={20} color="#1e293b" />
                </button>
                <button className="carousel-arrow right" onClick={nextImage} style={arrowStyles.right}>
                  <FiChevronRight size={20} color="#1e293b" />
                </button>
                
                {/* Dots indicator */}
                <div className="carousel-dots" style={arrowStyles.dotsContainer}>
                  {currentImagesArray.map((_, idx) => (
                    <span 
                      key={idx} 
                      onClick={() => setCurrentImgIndex(idx)}
                      style={{
                        ...arrowStyles.dot,
                        backgroundColor: currentImgIndex === idx ? '#2563eb' : '#cbd5e1',
                        transform: currentImgIndex === idx ? 'scale(1.2)' : 'scale(1)'
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* DETAILS CONTROLS PANEL */}
        <div className="detail-info-side">
          <span className="cat-tag">{product.category}</span>
          <h1 style={{ fontSize: '24px', margin: '8px 0', fontWeight: 'bold', color: '#1e293b' }}>{product.name}</h1>
          <p className="desc" style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5', marginBottom: '20px' }}>{product.description}</p>

          <div className="variant-box" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>Available Sizes</label>
            <div className="chip-group" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {product.variants.map((v, index) => (
                <button 
                  key={index}
                  className={`size-chip ${selectedVariant.size === v.size ? 'selected' : ''}`}
                  onClick={() => handleVariantChange(v)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: selectedVariant.size === v.size ? '2px solid #10b981' : '1px solid #cbd5e1',
                    background: selectedVariant.size === v.size ? '#eff6ff' : '#fff',
                    color: selectedVariant.size === v.size ? '#10b981' : '#475569',
                    fontWeight: selectedVariant.size === v.size ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          <div className="qty-box" style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>Quantity</label>
            <div className="stepper" style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
              <button className="qtylink" onClick={() => setQty(q => Math.max(1, q - 1))} style={stepperButtonStyles}>
                <FiMinus />
              </button>
              <span style={{ padding: '0 16px', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}> {qty} </span>
              <button className="qtylink" onClick={() => setQty(q => q + 1)} style={stepperButtonStyles}>
                <FiPlus />
              </button>
            </div>
          </div>

          <div className="detail-footer" style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', gap: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <div className="price-tag">
              <small style={{ color: '#64748b', display: 'block' }}>Total Price</small>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '0' }}>₹{selectedVariant.price * qty}</h2>
            </div>
            <button className="btn-sakhi flex-1" onClick={handleAddToCart} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>
              <FiShoppingCart /> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const stepperButtonStyles = {
  background: '#f8fafc',
  border: 'none',
  padding: '12px 16px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#475569',
  fontSize: '14px'
};

const arrowStyles = {
  left: { position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10 },
  right: { position: 'absolute', top: '50%', right: '12px', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 10 },
  dotsContainer: { position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 },
  dot: { width: '8px', height: '8px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s ease' }
};

export default ProductDetail;