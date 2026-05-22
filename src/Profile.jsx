import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiPhone, FiMapPin, FiMail, FiEdit2, FiChevronLeft, FiCheck } from 'react-icons/fi';
import './App.css';
import toast from 'react-hot-toast';


const Profile = () => {
  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    pincode: '',
    email: '',
    address: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

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
      setLoading(false);
    };
    fetchUserData();
  }, [navigate]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const user = auth.currentUser;
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        name: userData.name,
        email: userData.email || '',
        pincode: userData.pincode,
        address: userData.address || ''
      });
      setIsEditing(false);
      toast.success(`Profile updated successfully!`, {
          style: {
            borderRadius: '12px',
            background: '#1e293b',
            color: '#fff',
          },
        });    

    } catch (error) {
      console.error("Update error:", error);
       toast.error(`PFailed to update profile.`, {
          style: {
            borderRadius: '12px',
            background: '#1e293b',
            color: '#fff',
          },
        });  
    }
    setUpdating(false);
  };

  if (loading) return <div className="loader">Loading Profile...</div>;

  return (
    <div className="portal-container">
      <div className="profile-header-bg" />
      
      <div className="profile-content">
        <button onClick={() => navigate('/customer')} className="back-link-white">
          <FiChevronLeft /> Back to Dashboard
        </button>

        <div className="profile-card">
          <div className="profile-avatar">
            {userData.name.charAt(0).toUpperCase()}
          </div>

          <div className="profile-info-header">
            <h2>{userData.name}</h2>
            <p className="role-badge">{userData.role || 'Customer'}</p>
          </div>

          <div className="profile-form-grid">
            {/* Name Field */}
            <div className="profile-input-box">
              <label><FiUser /> Full Name</label>
              <input 
                disabled={!isEditing}
                value={userData.name}
                onChange={(e) => setUserData({...userData, name: e.target.value})}
                className={isEditing ? "edit-active" : ""}
              />
            </div>

            {/* Phone Field (Always Disabled for Security) */}
            <div className="profile-input-box">
              <label><FiPhone /> Registered Phone</label>
              <input disabled value={userData.phone} />
              <small>Phone cannot be changed</small>
            </div>

            {/* Email Field */}
            <div className="profile-input-box">
              <label><FiMail /> Email Address</label>
              <input 
                disabled={!isEditing}
                placeholder="Add your email"
                value={userData.email}
                onChange={(e) => setUserData({...userData, email: e.target.value})}
                className={isEditing ? "edit-active" : ""}
              />
            </div>

            {/* Pincode Field */}
            <div className="profile-input-box">
              <label><FiMapPin /> Pincode</label>
              <input 
                disabled={!isEditing}
                value={userData.pincode}
                onChange={(e) => setUserData({...userData, pincode: e.target.value})}
                className={isEditing ? "edit-active" : ""}
              />
            </div>

            {/* Address Field (Full Width) */}
            <div className="profile-input-box full-width">
              <label><FiMapPin /> Full Delivery Address</label>
              <textarea 
                disabled={!isEditing}
                placeholder="Enter complete building, street, and landmark details"
                value={userData.address}
                onChange={(e) => setUserData({...userData, address: e.target.value})}
                className={isEditing ? "edit-active" : ""}
              />
            </div>
          </div>

          <div className="profile-actions">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="btn-sakhi w-full py-3">
                <FiEdit2 /> Edit Profile
              </button>
            ) : (
              <div className="action-buttons">
                <button onClick={() => setIsEditing(false)} className="btn-cancel">Cancel</button>
                <button onClick={handleUpdate} disabled={updating} className="btn-sakhi py-3">
                  {updating ? 'Saving...' : <><FiCheck /> Save Changes</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;