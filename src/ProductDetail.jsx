import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { FiChevronLeft, FiShoppingCart, FiPlus, FiMinus } from 'react-icons/fi';
import { useCart } from './CartContext';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart(); // Moved to top level

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const { cart } = useCart();

  // This sums up all quantities in the cart
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const getProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct(data);
          setSelectedVariant(data.variants[0]); // Default to first size
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };
    getProduct();
  }, [id]);

  // Function moved outside of useEffect
  const handleAddToCart = () => {
    if (product && selectedVariant) {
      addToCart(product, selectedVariant, qty);
      toast.success(`${product.name} - ${selectedVariant.size} - ${qty} quantity added to cart!`, {
      style: {
        borderRadius: '12px',
        background: '#1e293b',
        color: '#fff',
      },
    });    
  }
  };

  if (!product || !selectedVariant) return <div className="loader">Fetching details...</div>;

  return (
    <div className="detail-container fill-mobile">
      <button className="back-link" onClick={() => navigate(-1)}>
        <FiChevronLeft /> Back
      </button>
      <div className="cart-icon-container" onClick={() => navigate('/cart')}>
        <FiShoppingCart size={24} />
        {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
      </div>
      <div className="detail-card">
        <div className="detail-img-box">
          <img className="fill-mobile" src={product.imageUrl} alt={product.name} />
        </div>

        <div className="detail-content">
          <span className="badge-green">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="desc">{product.description}</p>

          <div className="variant-box">
            <label>Available Sizes</label>
            <div className="chip-group">
              {product.variants.map((v, index) => (
                <button 
                  key={index}
                  className={`size-chip ${selectedVariant.size === v.size ? 'selected' : ''}`}
                  onClick={() => setSelectedVariant(v)}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          <div className="qty-box">
            <label>Quantity</label>
            <div className="stepper">
              <button className="qtylink" onClick={() => setQty(q => Math.max(1, q - 1))}>
                <FiMinus />
              </button>
              <span> {qty} </span>
              <button className="qtylink" onClick={() => setQty(q => q + 1)}>
                <FiPlus />
              </button>
            </div>
          </div>

          <div className="detail-footer">
            <div className="price-tag">
              <small>Total Price</small>
              <h2>₹{selectedVariant.price * qty}</h2>
            </div>
            <button className="btn-sakhi flex-1" onClick={handleAddToCart}>
              <FiShoppingCart /> Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;