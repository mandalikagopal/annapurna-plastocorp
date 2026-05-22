import React, { useState, useEffect, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; 
import { useNavigate } from 'react-router-dom';
import { FiUser, FiPhone, FiMapPin, FiLock, FiChevronLeft } from 'react-icons/fi';
import './App.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pincode: '',
  });

  const [step, setStep] = useState('form'); 
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const recaptchaRef = useRef(null);
  const verifierRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!verifierRef.current && recaptchaRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
        size: 'invisible',
      });
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (formData.phone.length !== 10) return 'Enter 10-digit phone number';
    if (formData.pincode.length !== 6) return 'Enter 6-digit pincode';
    return null;
  };

  const sendOTP = async () => {
    const validationError = validateForm();
    if (validationError) return setError(validationError);

    setLoading(true);
    setError('');

    try {
      const fullPhone = `+91${formData.phone}`;
      const result = await signInWithPhoneNumber(auth, fullPhone, verifierRef.current);
      setConfirmationResult(result);
      setStep('otp');
    } catch (err) {
      setError('Failed to send OTP. Please check your number.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const verifyAndRegister = async () => {
    if (otp.length !== 6) return setError('Enter 6-digit OTP');
    setLoading(true);
    setError('');

    try {
      const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      const userData = {
        uid: user.uid,
        name: formData.name.trim(),
        phone: user.phoneNumber,
        role: 'customer', // Defaulted to customer
        pincode: formData.pincode,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      
      // Navigate to the customer portal
      navigate('/customer');
      
    } catch (err) {
      setError('Invalid OTP. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div ref={recaptchaRef}></div>

      <div className="card shadow-2xl">
        <button onClick={() => step === 'otp' ? setStep('form') : navigate('/')} className="back-link">
          <FiChevronLeft /> {step === 'otp' ? 'Edit Details' : 'Back'}
        </button>

        <h1 className="brand-title text-emerald-700">Get Started</h1>
        <p className="brand-subtitle">Quick register for Annapurna Plastocorp & Paperware</p>

        {error && <div className="error-box">{error}</div>}

        {step === 'form' ? (
          <div className="space-y-5">
            <div className="input-group">
              <FiUser className="input-icon" />
              <input 
                name="name" 
                placeholder="Full Name" 
                value={formData.name} 
                onChange={handleChange} 
                className="sakhi-input" 
              />
            </div>

            <div className="input-group">
              <FiPhone className="input-icon" />
              <input 
                name="phone" 
                placeholder="Phone Number" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} 
                maxLength={10} 
                className="sakhi-input" 
              />
            </div>

            <div className="input-group">
              <FiMapPin className="input-icon" />
              <input 
                name="pincode" 
                placeholder="Pincode" 
                value={formData.pincode} 
                onChange={(e) => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '')})} 
                maxLength={6} 
                className="sakhi-input" 
              />
            </div>

            <button onClick={sendOTP} disabled={loading} className="btn-sakhi w-full py-4 shadow-lg">
              {loading ? 'Sending OTP...' : 'Continue'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 text-center animate-fadeIn">
            <div className="otp-icon-wrapper shadow-inner">
              <FiLock size={30} className="text-emerald-600" />
            </div>
            <p className="text-gray-600 text-sm">We've sent a 6-digit code to <br/><strong>+91 {formData.phone}</strong></p>
            <div className="input-group">
            <input
              id='otp'
              type="text"
              placeholder="· · · · · ·"
              value={otp}
              maxLength={6}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="sakhi-input-otp"
            />
            </div>
            <div className="input-group">
            <button onClick={verifyAndRegister} disabled={loading} className="btn-sakhi w-full py-4 shadow-xl">
              {loading ? 'Verifying...' : 'Verify & Register'}
            </button>
            </div>
            <div className="input-group">
            <button onClick={sendOTP} className="btn-sakhi text-emerald-600 text-sm font-medium hover:underline">
              Didn't get code? Resend
            </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;