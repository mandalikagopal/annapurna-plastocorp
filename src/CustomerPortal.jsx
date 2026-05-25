import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
  const [payAmount, setPayAmount] = useState('');
  const [payingBalance, setPayingBalance] = useState(false);
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

  // Razorpay Account Balance Settlement Overlay Bridge
  const processBalancePayment = (amountToPay) => {
    return new Promise((resolve, reject) => {
      const options = {
        key: "rzp_test_SP5Q9mjEkrxM97", // Replace with your live or test rzp_ Key ID
        amount: amountToPay * 100, // Conversion from Rupees to Paisa (₹1 = 100 paisa)
        currency: "INR",
        name: "Annapurna Plastocorp",
        description: "Account Balance Settlement",
        image: "https://annapurna-plastocorp.web.app/logo.png",
        handler: function (response) {
          resolve(response.razorpay_payment_id);
        },
        prefill: {
          name: user?.name || "",
          contact: user?.phone || ""
        },
        theme: {
          color: "#10b981"
        },
        modal: {
          ondismiss: function () {
            setPayingBalance(false);
            alert("Settlement transaction closed.");
            reject(new Error("Dismissed"));
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  };

  const handlePayBalanceSubmit = async () => {
    const amount = parseFloat(payAmount);
    const maxDue = user?.pendingPayment || 0;

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount to pay.");
      return;
    }
    if (amount > maxDue) {
      alert(`You can only pay up to your outstanding balance of ₹${maxDue}`);
      return;
    }

    setPayingBalance(true);
    try {
      // 1. Trigger Razorpay Payment Window
      const paymentId = await processBalancePayment(amount);

      // 2. Decrement outstanding balance due in the user's document safely
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, {
        pendingPayment: increment(-amount)
      });

      // 3. Log a receipt statement document into a collections ledger
      await addDoc(collection(db, 'payments'), {
        uid: auth.currentUser.uid,
        customerName: user?.name || "Customer",
        amountPaid: amount,
        razorpayPaymentId: paymentId,
        type: "Credit Account Balance Settlement",
        createdAt: serverTimestamp()
      });

      alert(`Successfully cleared ₹${amount}! Account parameters updated.`);
      setPayAmount('');
      
      // Refresh local user state snapshot metrics
      const freshSnap = await getDoc(userDocRef);
      if (freshSnap.exists()) {
        setUser(freshSnap.data());
      }
    } catch (err) {
      console.error("Settlement tracking error:", err);
    } finally {
      setPayingBalance(false);
    }
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
      {itemCount > 0 && <span className="cart-badge-dot">{itemCount}</span>}
      <FiShoppingCart size={28} />
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

{/* DYNAMIC ACCOUNT BALANCES PAYMENT CLEARANCE BLOCK */}
        {user?.pendingPayment > 0 && (
          <div className="payment-warning-card">
            <div className="warning-content">
              <FiAlertCircle className="warning-icon" />
              <div className="warning-text">
                <h3>Outstanding Account Balance</h3>
                <p>Total pending credit terms clearance: <span>₹{user.pendingPayment}</span></p>
              </div>
            </div>
            
            <div className="balance-payment-actions">
              <input 
                type="number"
                placeholder="Enter amount to pay"
                value={payAmount}
                max={user.pendingPayment}
                onChange={(e) => setPayAmount(e.target.value)}
                className="balance-pay-input"
                disabled={payingBalance}
              />
              <button 
                onClick={handlePayBalanceSubmit} 
                className="btn-pay-now"
                disabled={payingBalance}
              >
                {payingBalance ? "Processing..." : "Pay Now"}
              </button>
            </div>
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