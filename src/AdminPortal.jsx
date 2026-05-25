import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { 
  collection, getDocs, doc, updateDoc, addDoc, 
  query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { 
  FiLogOut, FiUsers, FiPackage, FiShoppingBag, 
  FiEdit2, FiPlus, FiTrash2, FiClock, FiImage, FiDownload, FiDollarSign, FiCheckCircle 
} from 'react-icons/fi';
import './App.css';

const AdminPortal = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'orders' | 'products' | 'settlements'
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Data Collections States
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  // Product Editing / Adding Form States
  const [editingProduct, setEditingProduct] = useState(null); 
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('Plates');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  
  // Upgraded variants initialization to support a multi-image string array and quantity metrics
  const [prodVariants, setProdVariants] = useState([
    { size: '', price: '', quantity: '', images: [''] }
  ]);

  // Settlement submission localized tracking
  const [settleAmounts, setSettleAmounts] = useState({});
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
      } else {
        fetchAllData();
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);

      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const ordersSnap = await getDocs(ordersQuery);
      const ordersList = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersList);

      const productsSnap = await getDocs(collection(db, 'products'));
      const productsList = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsList);

      // --- ADD THIS BLOCK TO FETCH PAYMENTS ---
      const paymentsQuery = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
      const paymentsSnap = await getDocs(paymentsQuery);
      const paymentsList = paymentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayments(paymentsList);
      // ----------------------------------------

    } catch (err) {
      console.error("Error executing admin updates lookups:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPayableFieldChange = async (userId, val) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        payableField: val,
        creditAllowed: val === 'credit'
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, payableField: val, creditAllowed: val === 'credit' } : u));
    } catch (err) {
      console.error("Failed to reconfigure customer allowance context:", err);
      alert("Error setting user preference parameter.");
    }
  };

  const handlePendingPaymentChange = async (userId, amountString) => {
    const numericAmount = amountString === '' ? 0 : Number(amountString);
    if (isNaN(numericAmount)) return;

    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        pendingPayment: numericAmount
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, pendingPayment: numericAmount } : u));
    } catch (err) {
      console.error("Failed to update user outstanding payload ledger:", err);
    }
  };

  // Process manual credit recoveries/settlements directly inside the new view tab
  const handleSubmitSettlement = async (userId, currentOwed) => {
    const collectVal = Number(settleAmounts[userId] || 0);
    if (!collectVal || collectVal <= 0) return alert("Please specify a valid credit recovery amount.");
    if (collectVal > currentOwed) return alert("Collection exceeds outstanding user debt limit balance.");

    const updatedDebt = Math.max(0, currentOwed - collectVal);

    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        pendingPayment: updatedDebt
      });
      
      // Clear out entry tracking field input row state reference 
      setSettleAmounts(prev => ({ ...prev, [userId]: '' }));
      alert(`Successfully processed payment receipt of ₹${collectVal}!`);
      fetchAllData();
    } catch (err) {
      console.error("Failed logging credit recovery book modifications:", err);
      alert("Database mutation timeout error logging settlement receipt balance.");
    }
  };

  // --- Variant Management Functions ---
  const handleAddVariantRow = () => {
    setProdVariants([...prodVariants, { size: '', price: '', quantity: '', images: [''] }]);
  };

  const handleRemoveVariantRow = (index) => {
    setProdVariants(prodVariants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (variantIndex, field, value) => {
    const updated = prodVariants.map((v, i) => {
      if (i === variantIndex) {
        return { 
          ...v, 
          [field]: (field === 'price' || field === 'quantity') ? (value === '' ? '' : Number(value)) : value 
        };
      }
      return v;
    });
    setProdVariants(updated);
  };

  // --- Variant Image Array Controls ---
  const handleAddImageToVariant = (variantIndex) => {
    const updated = prodVariants.map((v, i) => {
      if (i === variantIndex) {
        return { ...v, images: [...v.images, ''] };
      }
      return v;
    });
    setProdVariants(updated);
  };

  const handleRemoveImageFromVariant = (variantIndex, imgIndex) => {
    const updated = prodVariants.map((v, i) => {
      if (i === variantIndex) {
        return { ...v, images: v.images.filter((_, idx) => idx !== imgIndex) };
      }
      return v;
    });
    setProdVariants(updated);
  };

  const handleVariantImageURLChange = (variantIndex, imgIndex, value) => {
    const updated = prodVariants.map((v, i) => {
      if (i === variantIndex) {
        const updatedImages = v.images.map((img, idx) => idx === imgIndex ? value : img);
        return { ...v, images: updatedImages };
      }
      return v;
    });
    setProdVariants(updated);
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('Plates');
    setProdDescription('');
    setProdImageUrl('');
    setProdVariants([{ size: '', price: '', quantity: '', images: [''] }]);
  };

  const handleEditSetup = (product) => {
    setEditingProduct(product);
    setProdName(product.name || '');
    setProdCategory(product.category || 'Plates');
    setProdDescription(product.description || '');
    setProdImageUrl(product.imageUrl || '');
    
    setProdVariants(
      product.variants && product.variants.length > 0 
        ? product.variants.map(v => ({
            size: v.size || '',
            price: v.price || '',
            quantity: v.quantity !== undefined ? v.quantity : '',
            images: Array.isArray(v.images) ? v.images : (v.image ? [v.image] : [''])
          })) 
        : [{ size: '', price: '', quantity: '', images: [''] }]
    );
    
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!prodName || !prodImageUrl) return alert("Please populate required fields.");

    const cleanVariants = prodVariants
      .filter(v => v.size && Number(v.price) > 0)
      .map(v => ({
        size: v.size,
        price: v.price,
        quantity: v.quantity !== '' ? Number(v.quantity) : 0,
        images: v.images.filter(imgUrl => imgUrl.trim() !== '')
      }));

    if (cleanVariants.length === 0) return alert("Please configure at least one size variant.");

    const payload = {
      name: prodName,
      category: prodCategory,
      description: prodDescription,
      imageUrl: prodImageUrl,
      variants: cleanVariants
    };

    try {
      if (editingProduct) {
        const docRef = doc(db, 'products', editingProduct.id);
        await updateDoc(docRef, payload);
        alert("Product updated successfully!");
      } else {
        await addDoc(collection(db, 'products'), payload);
        alert("New Product added successfully!");
      }
      resetProductForm();
      fetchAllData();
    } catch (err) {
      console.error("Failed item write operations pipeline:", err);
    }
  };

  // --- Native PDF Invoice Generation System ---
  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    const invoiceDate = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
    
    let itemsRows = '';
    order.items?.forEach((item, index) => {
      itemsRows += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-size: 14px; color: #334155;">${index + 1}</td>
          <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 600;">${item.name}</td>
          <td style="padding: 12px; font-size: 14px; color: #475569; text-align: center;">${item.size || 'N/A'}</td>
          <td style="padding: 12px; font-size: 14px; color: #475569; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; font-size: 14px; color: #475569; text-align: right;">₹${item.price}</td>
          <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 700; text-align: right;">₹${item.price * item.quantity}</td>
        </tr>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice Bill - ${order.id.toUpperCase()}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            * { box-sizing: border-box; font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
            body { padding: 40px; background: #fff; color: #1e293b; }
            .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 30px; border-bottom: 2px solid #f1f5f9; margin-bottom: 35px; }
            .logo-side { max-width: 1200px; display: flex; justify-content: space-between; align-items: center; }
            .logo-side img { height: 150px; width: auto; object-fit: contain; }            
            .txn-side { text-align: right; }
            .txn-side h1 { font-size: 24px; font-weight: 800; color: #10b981; margin-bottom: 6px; text-transform: uppercase; }
            .txn-side p { font-size: 13px; color: #64748b; line-height: 1.5; }
            .client-details-block { margin-bottom: 35px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; }
            .client-details-block div p { font-size: 13px; color: #64748b; margin-bottom: 4px; }
            .client-details-block div h3 { font-size: 15px; color: #0f172a; font-weight: 700; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .items-table th { background: #f1f5f9; padding: 12px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
            .totals-section { display: flex; justify-content: flex-end; margin-bottom: 80px; padding-top: 10px; }
            .totals-box { width: 320px; border-top: 2px solid #e2e8f0; padding-top: 12px; }
            .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #475569; }
            .total-row.grand { font-size: 18px; font-weight: 800; color: #0f172a; border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 12px; }
            .signature-area { display: flex; justify-content: flex-end; margin-top: 60px; page-break-inside: avoid; }
            .signature-box { text-align: center; width: 220px; border-top: 1px solid #94a3b8; padding-top: 8px; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
            @media print { body { padding: 20px; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="background: #f1f5f9; padding: 12px; display: flex; justify-content: center; gap: 12px; margin-bottom: 20px; border-radius: 8px;">
             <button onclick="window.print()" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Print / Save PDF</button>
             <button onclick="window.close()" style="padding: 8px 16px; background: #64748b; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Dismiss</button>
          </div>

          <div class="invoice-header">
           <div class="logo-side">
              <img src="/logo.png" alt="Company Logo" onerror="this.style.display='none'"/>
              <h2>Annapurna Plastocorp & Paperware</h2>
            </div>
            
            <div class="txn-side">
              <h1>TAX INVOICE</h1>
              <p><strong>Transaction ID:</strong> #${order.id.toUpperCase()}</p>
              <p><strong>Date/Time:</strong> ${invoiceDate}</p>
              <p><strong>Terms:</strong> Code ${order.paymentType?.toUpperCase() || 'ONLINE'}</p>
            </div>
          </div>

          <div class="client-details-block">
            <div>
              <p>Billed To Customer Details:</p>
              <h3>${order.customerName || 'Valued Corporate Buyer'}</h3>
              <p style="margin-top: 4px; color: #334155;">Phone contact reference: +91 ${order.customerPhone || 'N/A'}</p>
            </div>
            <div style="text-align: right;">
              <p>Fulfillment Server Node Location:</p>
              <h3>Bharatiya Dharma Vikas Enterprise Hub</h3>
              <p style="margin-top: 4px; color: #334155;">Status: System verified (${order.status || 'Settled'})</p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 60px; text-align: left;">Sl.</th>
                <th style="text-align: left;">Product</th>
                <th style="width: 100px; text-align: center;">Size</th>
                <th style="width: 80px; text-align: center;">Qty</th>
                <th style="width: 120px; text-align: right;">Rate</th>
                <th style="width: 140px; text-align: right;">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="totals-box">
              <div class="total-row">
                <span>Subtotal amount</span>
                <span>₹${order.totalAmount}</span>
              </div>
              <div class="total-row">
                <span>Estimated Handling Fees</span>
                <span>₹0.00</span>
              </div>
              <div class="total-row grand">
                <span>Aggregate Total Balance</span>
                <span>₹${order.totalAmount}</span>
              </div>
            </div>
          </div>

          <div class="signature-area">
            <div class="signature-box">
              <div style="height: 45px;"></div>
              Authorized Signatory
            </div>
          </div>

          <script>
            window.onload = function() {
              // Auto trigger rendering popup configurations
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return <div className="portal-container"><p style={{ textAlign: 'center', color: '#64748b' }}>Compiling Administration Systems...</p></div>;
  }

  return (
    <div className="portal-container">
      <nav className="portal-nav">
              <div className="nav-content">
                <img src="/logo.png" alt="Logo" className="nav-logo" />
                <button onClick={handleLogout} className="logout-btn">
                  <FiLogOut /> <span>Logout</span>
                </button>
              </div>
            </nav>
      {/* Header Section
      <header className="portal-header">
        <div className="logo-wrapper" style={{ width: '60px', height: '60px', margin: '0', padding: '5px', borderRadius: '12px' }}>
          <img src="/logo.png" alt="Annapurna Logo" className="logo-img" />
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <FiLogOut /> Logout
        </button>
      </header> */}

      {/* Admin Title Dashboard Context */}
      <div style={{ margin: '0 0 20px 0', padding: '0 4px' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#1e293b', fontWeight: '800' }}>Annapurna Plastocorp & Paperware Admin Centre</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Bharatiya Dharma Vikas Enterprise Hub</p>
      </div>

      {/* Admin Navigation Tabs Panel */}
      <div className="admin-tabs-row" style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: '#f1f5f9', padding: '6px', borderRadius: '16px', overflowX: 'auto' }}>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
          style={{ flex: 1, padding: '12px 6px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: activeTab === 'users' ? 'white' : 'transparent', color: activeTab === 'users' ? '#10b981' : '#64748b', boxShadow: activeTab === 'users' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', minWidth: '100px' }}
        >
          <FiUsers /> Customers
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
          style={{ flex: 1, padding: '12px 6px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: activeTab === 'orders' ? 'white' : 'transparent', color: activeTab === 'orders' ? '#10b981' : '#64748b', boxShadow: activeTab === 'orders' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', minWidth: '100px' }}
        >
          <FiPackage /> Orders
        </button>
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
          style={{ flex: 1, padding: '12px 6px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: activeTab === 'products' ? 'white' : 'transparent', color: activeTab === 'products' ? '#10b981' : '#64748b', boxShadow: activeTab === 'products' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', minWidth: '100px' }}
        >
          <FiShoppingBag /> Catalog Master
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settlements' ? 'active' : ''}`}
          onClick={() => setActiveTab('settlements')}
          style={{ flex: 1, padding: '12px 6px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: activeTab === 'settlements' ? 'white' : 'transparent', color: activeTab === 'settlements' ? '#10b981' : '#64748b', boxShadow: activeTab === 'settlements' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', minWidth: '140px' }}
        >
          <FiDollarSign /> Settlement Ledgers
        </button>
      </div>

      {/* VIEW A: USERS CONTROL MATRIX */}
      {activeTab === 'users' && (
        <div className="admin-view-panel animate-fadeIn">
          <h3 style={{ marginBottom: '16px', color: '#1e293b' }}>Customer Credit Allowance Configuration</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {users.map((client) => (
              <div key={client.id} className="cart-item-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <h4 style={{ color: '#1e293b', fontWeight: '700' }}>{client.name || "Anonymous Client"}</h4>
                  <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>☎ {client.phone || "No baseline number"}</p>
                  {client.pendingPayment > 0 && (
                    <span style={{ fontSize: '12px', color: '#e11d48', fontWeight: 'bold', display: 'block', marginTop: '4px', background: '#fff1f2', padding: '2px 8px', borderRadius: '6px', width: 'fit-content' }}>
                      Owes Balance: ₹{client.pendingPayment}
                    </span>
                  )}
                </div>

                <div style={{ width: '130px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Pending Balance (₹)</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={client.pendingPayment !== undefined ? client.pendingPayment : ''} 
                    onChange={(e) => handlePendingPaymentChange(client.id, e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc', fontWeight: '600', color: '#e11d48', outline: 'none' }}
                  />
                </div>

                <div style={{ width: '210px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Checkout Terms Mode</label>
                  <select 
                    value={client.payableField || 'none'}
                    onChange={(e) => handleUserPayableFieldChange(client.id, e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc', fontWeight: '600', color: '#334155', outline: 'none' }}
                  >
                    <option value="none">Standard Cash Only (None)</option>
                    <option value="credit">Verified Corporate Credit Limit</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW B: INVOICES & ORDERS LEDGER WITH PDF BILL GENERATION */}
      {activeTab === 'orders' && (
        <div className="admin-view-panel animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ color: '#1e293b' }}>Global Transaction Pipelines</h3>
          {orders.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No orders tracked inside system clusters yet.</p>
          ) : (
            orders.map(order => (
              <div key={order.id} className="order-card" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px' }}>
                <div className="order-main-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>TXN REF ID: #{order.id.slice(-8).toUpperCase()}</span>
                    <h4 style={{ margin: '4px 0 0 0', color: '#1e293b', fontWeight: '800' }}>{order.customerName}</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>📱 {order.customerPhone}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span className={`status-badge ${order.status?.toLowerCase().replace(/\s+/g, '-')}`} style={{ height: 'fit-content', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', background: order.paymentType === 'credit' ? '#fee2e2' : '#d1fae5', color: order.paymentType === 'credit' ? '#991b1b' : '#065f46' }}>
                      {order.status || "Processing"}
                    </span>
                    {/* Invoice Download Action Interface Link */}
                    <button 
                      onClick={() => handlePrintInvoice(order)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #10b981', color: '#10b981', background: 'transparent', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      <FiDownload size={12} /> Download Invoice Bill
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0', padding: '12px 0', margin: '12px 0' }}>
                  {order.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569', marginBottom: '4px' }}>
                      <span>{item.quantity}x {item.name} ({item.size})</span>
                      <span style={{ fontWeight: '600' }}>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiClock /> {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('en-IN') : 'Recent'}
                  </span>
                  <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: 'bold' }}>
                    Total Amount: <span style={{ color: '#10b981', fontSize: '18px' }}>₹{order.totalAmount}</span> via <span style={{ textTransform: 'uppercase', fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{order.paymentType}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW C: MASTER CATALOG MANAGEMENT PORTAL WITH STOCK QUANTITY CONTROLS */}
      {activeTab === 'products' && (
        <div className="admin-view-panel animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div>
            <h3 style={{ marginBottom: '14px', color: '#1e293b' }}>Active Storage Catalog Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {products.map(prod => (
                <div key={prod.id} className="cart-item-card" style={{ display: 'flex', alignItems: 'center', padding: '12px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', gap: '14px' }}>
                  <img src={prod.imageUrl} alt={prod.name} style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{prod.category}</span>
                    <h4 style={{ color: '#1e293b', margin: '4px 0 2px 0' }}>{prod.name}</h4>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>{prod.variants?.length || 0} Sizes configs loaded</p>
                  </div>
                  <button 
                    onClick={() => handleEditSetup(prod)} 
                    style={{ background: '#f1f5f9', border: 'none', color: '#475569', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <FiEdit2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Area */}
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginBottom: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editingProduct ? <><FiEdit2 style={{ color: '#3b82f6' }} /> Re-edit Product Matrix</> : <><FiPlus style={{ color: '#10b981' }} /> Add Brand New Catalog Listing</>}
            </h3>
            
            <form onSubmit={handleProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Product Title Name *</label>
                  <input type="text" placeholder="e.g. Milky White Bags" value={prodName} onChange={(e) => setProdName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '6px', outline: 'none' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Inventory Category Dropdown *</label>
                  <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '6px', background: 'white', outline: 'none', fontWeight: '600', color: '#334155' }}>
                    <option value="Plates">Plates</option>
                    <option value="Cups">Cups</option>
                    <option value="Containers">Containers</option>
                    <option value="Spoons">Spoons</option>
                    <option value="Carry Bags">Carry Bags</option>
                    <option value="Tissues">Tissues</option>
                    <option value="Pouches">Pouches</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Description Notes Context</label>
                <textarea placeholder="Specify manufacture density, packaging metrics etc." value={prodDescription} onChange={(e) => setProdDescription(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '6px', height: '80px', resize: 'none', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Main Product Image Path URL *</label>
                <input type="url" placeholder="https://images.unsplash.com/..." value={prodImageUrl} onChange={(e) => setProdImageUrl(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginTop: '6px', outline: 'none' }} required />
              </div>

              {/* Dynamic Variants Array Builder View Panel */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Variants Configuration Ledger *</label>
                  <button type="button" onClick={handleAddVariantRow} style={{ background: '#d1fae5', border: 'none', color: '#065f46', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiPlus /> Add Variant Row
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {prodVariants.map((variant, vIdx) => (
                    <div key={vIdx} style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      
                      {/* Grid containing Size, Price, and newly integrated Quantity tracker */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: '2 1 120px' }}>
                          <label style={{ fontSize: '11px', color: '#64748b' }}>Size *</label>
                          <input type="text" placeholder='e.g. 17x23' value={variant.size} onChange={(e) => handleVariantChange(vIdx, 'size', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', marginTop: '4px' }} required />
                        </div>
                        <div style={{ flex: '1 1 80px' }}>
                          <label style={{ fontSize: '11px', color: '#64748b' }}>Price (₹) *</label>
                          <input type="number" placeholder="320" value={variant.price} onChange={(e) => handleVariantChange(vIdx, 'price', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', marginTop: '4px' }} required />
                        </div>
                        <div style={{ flex: '1 1 80px' }}>
                          <label style={{ fontSize: '11px', color: '#64748b' }}>Quantity *</label>
                          <input type="number" placeholder="100" value={variant.quantity} onChange={(e) => handleVariantChange(vIdx, 'quantity', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', marginTop: '4px' }} required />
                        </div>
                        {prodVariants.length > 1 && (
                          <button type="button" onClick={() => handleRemoveVariantRow(vIdx)} style={{ background: '#fee2e2', border: 'none', color: '#991b1b', padding: '10px', borderRadius: '8px', cursor: 'pointer', marginTop: '18px' }}>
                            <FiTrash2 />
                          </button>
                        )}
                      </div>

                      {/* Variant Carousels Multilink Engine block */}
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #edf2f7' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>Variant Carousel Images (Array)</span>
                          <button type="button" onClick={() => handleAddImageToVariant(vIdx)} style={{ background: '#e0f2fe', border: 'none', color: '#0369a1', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            + Add Image URL
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {variant.images.map((imgUrl, imgIdx) => (
                            <div key={imgIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <FiImage style={{ color: '#94a3b8' }} size={14} />
                              <input 
                                type="url" 
                                placeholder="https://images.unsplash.com/..." 
                                value={imgUrl} 
                                onChange={(e) => handleVariantImageURLChange(vIdx, imgIdx, e.target.value)} 
                                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '12px', background: '#ffffff' }} 
                              />
                              {variant.images.length > 1 && (
                                <button type="button" onClick={() => handleRemoveImageFromVariant(vIdx, imgIdx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}>
                                  <FiTrash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Action Toolbar footer links */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="btn-sakhi btn-secondary" style={{ flex: 2 }}>
                  {editingProduct ? "Apply Modifications" : "Commit Items Into Database"}
                </button>
                {editingProduct && (
                  <button type="button" onClick={resetProductForm} style={{ flex: 1, background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Cancel Changes
                  </button>
                )}
              </div>
            </form>
          </div>

        </div>
      )}

      {/* NEW VIEW D: SEPARATED TAB DISPLAYING OUTSTANDING PAYMENTS & CREDIT SETTLEMENT MANAGEMENT TOOLS */}
      {/* VIEW D: SEPARATED TAB DISPLAYING OUTSTANDING PAYMENTS & CREDIT SETTLEMENT MANAGEMENT TOOLS */}
      {activeTab === 'settlements' && (
        <div className="admin-view-panel animate-fadeIn" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start', flexWrap: 'wrap' }}>
          
          {/* Column 1: Actionable Outstanding Ledger Accounts */}
          <div>
            <h3 style={{ marginBottom: '16px', color: '#1e293b' }}>Credit Account Settlement Book Keeping</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {users.filter(u => Number(u.pendingPayment || 0) > 0).length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>All clear! No pending payments detected across the system database networks.</p>
              ) : (
                users.filter(u => Number(u.pendingPayment || 0) > 0).map((client) => (
                  <div key={client.id} style={{ display: 'flex', flexDirection: 'column', padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Outstanding Liability</span>
                        <h4 style={{ color: '#1e293b', fontWeight: '700', marginTop: '6px' }}>{client.name || "Anonymous Buyer"}</h4>
                        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>☎ +91 {client.phone || 'N/A'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Total Debt</span>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: '#e11d48' }}>₹{client.pendingPayment}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '4px' }}>Record Payment Recovery (₹)</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 5000"
                          value={settleAmounts[client.id] || ''}
                          onChange={(e) => setSettleAmounts({ ...settleAmounts, [client.id]: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                        />
                      </div>
                      <button 
                        onClick={() => handleSubmitSettlement(client.id, client.pendingPayment)}
                        style={{ background: '#10b981', color: 'white', border: 'none', padding: '9px 14px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                      >
                        <FiCheckCircle size={14} /> Clear
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Live Historical Database Payment Logs */}
          <div>
            <h3 style={{ marginBottom: '16px', color: '#1e293b' }}>Settlement History Records</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
              {payments.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '30px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>No historical collection logs fetched from payments collection.</p>
              ) : (
                payments.map((pay) => (
                  <div key={pay.id} style={{ background: 'white', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ color: '#1e293b', fontWeight: '700', fontSize: '14px' }}>{pay.customerName || 'Verified Corporate Account'}</h4>
                      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                        ID: {pay.razorpayPaymentId || 'Manual Entry/Cash'}
                      </p>
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                        <FiClock size={12} /> {pay.createdAt?.toDate ? pay.createdAt.toDate().toLocaleString('en-IN') : 'Recent'}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#10b981', display: 'block' }}>+ ₹{pay.amountPaid}</span>
                      <span style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569', display: 'inline-block', marginTop: '4px', fontWeight: '600' }}>
                        {pay.type || 'Settlement'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default AdminPortal;