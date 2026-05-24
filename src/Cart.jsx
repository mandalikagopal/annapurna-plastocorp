import { useCart } from './CartContext';
import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { FiTrash2, FiChevronLeft, FiCreditCard } from 'react-icons/fi';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Cart = () => {
  const { cart, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    hasCreditAccess: false
  });      
  
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'credit'
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            setUserData({
              name: data.name || '',
              phone: data.phone || '',
              // Matches if string field payableField is 'credit' OR boolean flag creditAllowed is true
              hasCreditAccess: data.payableField === 'credit' || data.creditAllowed === true
            });
            
            // Auto pre-select credit option if configured as primary payment rule
            if (data.payableField === 'credit') {
              setPaymentMethod('credit');
            }
          }
        } catch (err) {
          console.error("Error retrieving client status:", err);
        }
      } else {
        navigate('/login');
      }
    };
    fetchUserData();
  }, [navigate]);

  // Method A: Initializing Native Razorpay Payment Overlay Handler Hook
  const processRazorpayPayment = () => {
    return new Promise((resolve, reject) => {
      const options = {
        key: "rzp_test_SP5Q9mjEkrxM97", // Replace with your live or test rzp_ Key ID
        amount: total * 100, // Razorpay calculates value fields in Paisa denominations (₹1 = 100 Paisa)
        currency: "INR",
        name: "Annapurna Plastocorp",
        description: "Order Checkout Summary",
        image: "https://annapurna-plastocorp.web.app/logo.png", // Optional company logo path asset
        handler: function (response) {
          // Triggers on clean banking authorization confirmation matches
          resolve(response.razorpay_payment_id);
        },
        prefill: {
          name: userData.name || "",
          contact: userData.phone || ""
        },
        theme: {
          color: "#10b981" // Custom Emerald Application interface mapping
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            toast.error("Payment execution window dismissed.");
            reject(new Error("Payment window dismissed by client."));
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  };

  // Central Unified Submit Orchestration Handler
  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) return;
    setProcessing(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("User session expired. Please log in again.");
        navigate('/login');
        return;
      }

      let paymentId = "Account_Credit_Terms";
      let finalOrderStatus = "Pending Processing";
      const calculatedTotal = Number(total) || 0;

      if (paymentMethod === 'online') {
        // Trigger payment popup and await success confirmation token callback
        try {
          paymentId = await processRazorpayPayment();
          finalOrderStatus = "Paid Successfully";
        } catch (paymentErr) {
          // Promise rejection handled safely inside modal trigger block
          return;
        }
      } else {
        // Bought on verified credit options loop
        finalOrderStatus = "On Account Balance";
      }

      // Sanitize Cart Items array to fully protect against Firestore undefined field insertion crashes
      const sanitizedItems = cart.map(item => ({
        id: item.id || "",
        name: item.name || "Unknown Product",
        size: item.size || "Standard",
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        image: item.image || "" // Graceful empty fallback string allocation
      }));

      // Construct verified structured schema data payload
      const orderPayload = {
        uid: user.uid,
        customerName: userData.name || user.displayName || "Valued Customer",
        customerPhone: userData.phone || user.phoneNumber || "",
        items: sanitizedItems,
        totalAmount: calculatedTotal,
        paymentType: paymentMethod || "online", 
        paymentDetailsId: paymentId || "N/A",
        status: finalOrderStatus,
        createdAt: serverTimestamp()
      };

      // 1. Create new transaction document inside your orders collection
      await addDoc(collection(db, 'orders'), orderPayload);
      
      // 2. 🌟 NEW: If using business credit, increment the user's pendingPayment ledger field safely
      if (paymentMethod === 'credit') {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          pendingPayment: increment(calculatedTotal)
        });
      }

      // Wipe tracking states from active browser local context instances
      clearCart();
      toast.success("Order Placed Successfully!");
      navigate('/customer');
    } catch (err) {
      console.error("Order fulfillment pipeline execution error:", err);
      toast.error("Failed to compile order operations.");
    } finally {
      setProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="portal-container">
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <button className="back-link" onClick={() => navigate('/products')}>Browse Products</button>
        </div>
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

        {/* Conditional Settlement Mode Presentation block for credit tier flags */}
        {userData.hasCreditAccess && (
          <div className="profile-input-box" style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
              Choose Settlement Method
            </label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                background: 'white',
                color: '#1e293b',
                outline: 'none',
                marginTop: '6px'
              }}
            >
              <option value="credit">Buy on Business Credit Account Terms</option>
              <option value="online">Pay Immediately (UPI / Cards / NetBanking)</option>
            </select>
          </div>
        )}
        
        <div className="cart-summary-footer">
          <div className="total-row">
            <span>Estimated Total:</span>
            <span>₹{total}</span>
          </div>
          
          <button 
            disabled={processing} 
            className={`btn-sakhi w-full ${paymentMethod === 'credit' ? 'btn-secondary' : ''}`}
            onClick={handleCheckoutSubmit}
          >
            {processing ? (
              "Securing Authorization..."
            ) : paymentMethod === 'credit' ? (
              <>Order on Credit Account Balance</>
            ) : (
              <><FiCreditCard style={{ marginRight: '8px' }} /> Proceed to Pay Online</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;