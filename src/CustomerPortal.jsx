import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { 
  FiLogOut, FiPackage, FiUser, FiShoppingBag, 
  FiMapPin, FiPhone, FiChevronRight, FiShoppingCart , FiAlertCircle, FiExternalLink
} from 'react-icons/fi';
import './App.css';
import { bulkUploadProducts } from './ProductUploader';
import { useCart } from './CartContext';
const CustomerPortal = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { cart } = useCart();

  // This sums up all quantities in the cart
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch extra details from Firestore
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setUser(docSnap.data());
        } else {
          setUser(firebaseUser); // Fallback to auth data
        }
      } else {
        navigate('/login'); // Redirect if not logged in
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

 
  const fetchUserData = async () => {
    if (auth.currentUser) {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUser(docSnap.data()); // This refreshes the UI with the new balance
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) return <div className="loader">Loading Portal...</div>;

  return (
    <div className="portal-container">
      {/* Top Navigation */}
      <nav className="portal-nav">
        <div className="nav-content">
          <img src="/logo.png" alt="Logo" className="nav-logo" />
          <button onClick={handleLogout} className="logout-btn">
            <FiLogOut /> <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="portal-main">
        <div className="portal-header-flex">
  <header className="portal-header">
    <h1>Welcome, {user?.name || 'Customer'}</h1>
    <p>Manage your orders and account</p>
  </header>
  
  <div className="cart-trigger" onClick={() => navigate('/cart')}>
    <div className="cart-icon-wrapper">
      <FiShoppingCart size={28} />
      {itemCount > 0 && <span className="cart-badge-dot">{itemCount}</span>}
    </div>
    <span>My Cart</span>
  </div>
</div>
        {/* Quick Info Bar */}
        <div className="info-grid">
          <div className="info-pill">
            <FiPhone className="text-emerald-600" />
            <span>{user?.phone}</span>
          </div>
          <div className="info-pill">
            <FiMapPin className="text-emerald-600" />
            <span>Pincode: {user?.pincode}</span>
          </div>
        </div>

      {/* Pending Payment Notification - Placed prominently above the grid */}
{!loading && user?.pendingPayment > 0 && (
  <div className="payment-section-wrapper animate-fadeIn">
    
  </div>
)}

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          <section className="dashboard-card" onClick={() => navigate('/orders')}>
            <div className="card-icon bg-emerald-100 text-emerald-700">
              <FiPackage size={24} />
            </div>
            <div className="card-text">
              <h3>My Orders</h3>
              <p>Track current and past orders</p>
            </div>
            <FiChevronRight className="arrow" />
          </section>

          <section className="dashboard-card" onClick={() => navigate('/products')}>
            <div className="card-icon bg-blue-100 text-blue-700">
              <FiShoppingBag size={24} />
            </div>
            <div className="card-text">
              <h3>Product Catalog</h3>
              <p>Browse our latest paperware & plastics</p>
            </div>
            <FiChevronRight className="arrow" />
          </section>

          <section className="dashboard-card" onClick={() => navigate('/profile')}>
            <div className="card-icon bg-purple-100 text-purple-700">
              <FiUser size={24} />
            </div>
            <div className="card-text">
              <h3>My Profile</h3>
              <p>Update address and contact info</p>
            </div>
            <FiChevronRight className="arrow" />
          </section>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="recent-activity">
          <h3>Recent Updates</h3>
          <div className="empty-state">
            <p>No recent notifications. Start shopping today!</p>
          </div>
        </div>

        {/* <button 
  onClick={bulkUploadProducts} 
  style={{ padding: '15px', background: 'red', color: 'white', margin: '20px' }}
>
  SYNC DATABASE (CLICK ONCE)
</button> */}
      </main>
    </div>
  );
};

export default CustomerPortal;