import React, { useState, useEffect, useRef } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; 
import { useNavigate } from 'react-router-dom';
import { FiPhone, FiLock, FiChevronLeft, FiLogIn } from 'react-icons/fi';
import './App.css';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone'); // phone → otp
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

  const sendOTP = async () => {
    if (phone.length !== 10) return setError('Enter valid 10-digit phone');
    
    setLoading(true);
    setError('');

    try {
      const fullPhone = `+91${phone}`;
      const result = await signInWithPhoneNumber(auth, fullPhone, verifierRef.current);
      setConfirmationResult(result);
      setStep('otp');
    } catch (err) {
      setError('Failed to send OTP. Try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const verifyAndLogin = async () => {
    if (otp.length !== 6) return setError('Enter 6-digit OTP');
    setLoading(true);
    setError('');

    try {
      const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Route based on stored role
        navigate(userData.role === 'admin' ? '/admin' : '/customer');
      } else {
        // If user authenticated but no Firestore doc exists, send to register
        setError('Account not found. Please register first.');
        setTimeout(() => navigate('/register'), 2000);
      }
      
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
        <button onClick={() => step === 'otp' ? setStep('phone') : navigate('/')} className="back-link">
          <FiChevronLeft /> {step === 'otp' ? 'Change Number' : 'Back'}
        </button>

        <h1 className="brand-title text-blue-700">Welcome Back</h1>
        <p className="brand-subtitle">Login to your Annapurna Plastocorp & Paperware Account</p>

        {error && <div className="error-box">{error}</div>}

        {step === 'phone' ? (
          <div className="space-y-6">
            <div className="input-group">
              <FiPhone className="input-icon" />
              <input 
                name="phone" 
                placeholder="Registered Phone Number" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} 
                maxLength={10} 
                className="sakhi-input" 
              />
            </div>
            <div className="input-group">
            <button onClick={sendOTP} disabled={loading} className="btn-sakhi w-full py-4 shadow-lg btn-secondary">
              <FiLogIn className="mr-2" /> {loading ? 'Sending...' : 'Request OTP'}
            </button>
            </div>
            <div className="input-group">
            <p className="text-sm text-gray-500 text-center">
              New here? 
            </p>
            </div>
            <div className="input-group">
            <button onClick={() => navigate('/register')} className="btn-sakhi text-blue-600 font-bold">Create Account</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-center animate-fadeIn">
            <div className="otp-icon-wrapper bg-blue-50">
              <FiLock size={30} className="text-blue-600" />
            </div>
            <p className="text-gray-600 text-sm">Verification code sent to <br/><strong>+91 {phone}</strong></p>
            <div className="input-group">
            <input
              type="text"
              placeholder="· · · · · ·"
              value={otp}
              maxLength={6}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="sakhi-input-otp otp-blue"
            />
            </div>

            <button onClick={verifyAndLogin} disabled={loading} className="btn-sakhi w-full py-4 shadow-xl btn-secondary">
              {loading ? 'Logging in...' : 'Verify & Login'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;