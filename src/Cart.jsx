import { useCart } from './CartContext';
import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { FiTrash2, FiChevronLeft } from 'react-icons/fi';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';


const Cart = () => {
  const { cart, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const [userData, setUserData] = useState({
        name: '',
        phone: ''
    });      
    
  useEffect(() => {
          const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
              const docRef = doc(db, 'users', user.uid);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                setUserData(docSnap.data());
              }
            } else {
              navigate('/login');
            }
          };
          fetchUserData();
        }, [navigate]);

  const handleCheckout = async () => {
  // Defensive check: Don't even try if the cart somehow became empty
  if (cart.length === 0) return;

  try {
    
    // Check localStorage, but ensure they aren't undefined
    const storedName = userData.name|| 'Walk-in Customer';
    const storedPhone = userData.phone || 'No Phone Provided';
    const uid = userData.uid || 'Walk-in Customer';

    // Clean the cart data to ensure no hidden undefineds in variants
    const cleanItems = cart.map(item => ({
      name: item.name || 'Unknown Item',
      size: item.size || 'Standard',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      image: item.image || ''
    }));

    const orderData = {
      items: cleanItems,
      totalAmount: Number(total),
      status: 'Pending',
      createdAt: serverTimestamp(),
      customerName: storedName,
      customerPhone: storedPhone,
      uid: uid
    };

    // Attempt the save
    const docRef = await addDoc(collection(db, "orders"), orderData);
    
    clearCart();
    toast.success(`Ordered Successfully - Order will be reviewed soon`, {
          style: {
            borderRadius: '12px',
            background: '#1e293b',
            color: '#fff',
          },
        });    

  } catch (error) {
    console.error("Error details:", error);
    toast.error(`Checkout Error: ${error.message}`, {
          style: {
            borderRadius: '12px',
            background: '#1e293b',
            color: '#fff',
          },
        }); 
  }
};

  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <p>Your cart is empty</p>
        <button className="back-link" onClick={() => navigate('/products')}>Browse Products</button>
      </div>
    );
  }

  return (
    <div className="portal-container">
      <button className="back-link" onClick={() => navigate(-1)}>
              <FiChevronLeft /> Back
            </button>
      <div className="cart-page">
        <h2>Your Order Summary</h2>
        <div className="cart-items">
          {cart.map((item, index) => (
            <div key={index} className="cart-item-card">
              <img src={item.image} alt={item.name} />
              <div className="item-details">
                <h4>{item.name}</h4>
                <p>Size: {item.size} | Qty: {item.quantity}</p>
                <p className="item-price">₹{item.price * item.quantity}</p>
              </div>
              <button onClick={() => removeFromCart(index)} className="remove-btn">
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>
        
        <div className="cart-summary-footer">
          <div className="total-row">
            <span>Estimated Total:</span>
            <span>₹{total}</span>
          </div>
          <button className="btn-sakhi w-full" onClick={handleCheckout}>Place Order</button>
        </div>
      </div>
    </div>
  );
};

export default Cart;