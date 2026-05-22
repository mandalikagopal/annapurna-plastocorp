import React, { useState, useEffect, useDebugValue } from 'react';
import { db, auth } from './firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { FiPackage, FiChevronLeft, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      const user = auth.currentUser;
      console.log(user.uid);
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // We fetch by the user's phone number or name stored in the order
        // Note: For 'orderBy' to work with 'where', you might need to click a link in the console to create an index
        const q = query(
          collection(db, 'orders'),
          where('uid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  if (loading) return <div className="loader">Loading your orders...</div>;

  return (
    <div className="portal-container">
      <div className="orders-header">
        <button className="back-link" onClick={() => navigate('/customer')}>
          <FiChevronLeft /> Back to Portal
        </button>
        <h1>My Orders</h1>
      </div>

      <div className="orders-list">
        {orders.length === 0 ? (
          <div className="empty-state">
            <FiPackage size={48} />
            <p>You haven't placed any orders yet.</p>
            <button className="btn-sakhi" onClick={() => navigate('/products')}>Start Shopping</button>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-main-info">
                <div className="order-id-box">
                  <span className="order-label">Order ID</span>
                  <span className="order-id">#{order.id.slice(-6).toUpperCase()}</span>
                </div>
                <div className={`status-badge ${order.status.toLowerCase()}`}>
                  {order.status}
                </div>
              </div>

              <div className="order-items-preview">
                {order.items.map((item, i) => (
                  <div key={i} className="item-row">
                    <span>{item.quantity}x {item.name} ({item.size})</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <div className="order-date">
                  <FiClock size={14} />
                  {order.createdAt?.toDate().toLocaleDateString('en-IN')}
                </div>
                <div className="order-total">
                  Total: <span>₹{order.totalAmount}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;