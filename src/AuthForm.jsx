import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import PhoneInput from 'react-phone-number-input/input';
import 'react-phone-number-input/style.css';
import { FiArrowLeft } from 'react-icons/fi';

const AuthForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isRegister = searchParams.get('mode') === 'register';

  const [step, setStep] = useState(isRegister ? 'info' : 'phone'); // info → phone → otp (register); phone → otp (login)
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [pincode, setPincode] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dev: Disable reCAPTCHA for localhost
  useEffect(() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      if (auth.settings) {
        auth.settings.appVerificationDisabledForTesting = true;
        console.log('✅ Test mode: reCAPTCHA OFF (OTP: 123456 for +919876543210)');
      }
    }
  }, []);

  const createRecaptchaVerifier = useCallback(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier('recaptcha', {
        size: 'invisible',
        callback: () => console.log('reCAPTCHA solved')
      }, auth);
    }
    return window.recaptchaVerifier;
  }, []);

  const sendOtp = async () => {
    if (!phone) return setError('Enter phone number');
    if (isRegister && (!name || !pincode || pincode.length !== 6)) {
      return setError('Name and 6-digit pincode required for register');
    }

    setLoading(true);
    setError('');
    try {
      const verifier = createRecaptchaVerifier();
      const result = await signInWithPhoneNumber(verifier, phone);
      setConfirmationResult(result);
      setStep('otp');
      console.log('✅ OTP sent to', phone);
    } catch (err) {
      setError(err.message);
      console.error('OTP error:', err);
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (!confirmationResult || otp.length !== 6) return setError('Enter valid 6-digit OTP');

    setLoading(true);
    setError('');
    try {
      const userCredential = await confirmationResult.confirm(otp);
      const user = userCredential.user;
      console.log('✅ Verified user:', user.uid);

      // Check/create user doc
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists() && isRegister) {
        // New register: save name, pincode, role
        await setDoc(userRef, {
          name,
          phone,
          pincode,
          role: 'customer',
          createdAt: new Date().toISOString()
        });
        console.log('✅ New customer registered');
      }

      // Redirect by role
      const role = (await getDoc(userRef)).data()?.role || 'customer';
      setTimeout(() => {
        window.location.href = role === 'admin' ? '/admin' : '/customer';
      }, 1500);
    } catch (err) {
      setError('Invalid OTP. Try 123456 for test phone.');
      console.error('Verify error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center px-4 py-12">
      <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl max-w-md w-full mx-auto border border-white/50">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 -ml-2"
        >
          <FiArrowLeft /> Back to Home
        </button>

        <h2 className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          {isRegister ? 'Register' : 'Login'}
        </h2>
        <p className="text-gray-600 text-center mb-8">
          Enter details for {isRegister ? 'new account' : 'existing account'} (OTP verification)
        </p>

        {step === 'info' && isRegister && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="tel"
              placeholder="Pincode (6 digits)"
              value={pincode}
              maxLength={6}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => setStep('phone')}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition-all duration-300"
            >
              Next
            </button>
          </div>
        )}

        {step === 'phone' && (
          <div className="space-y-4">
            <PhoneInput
              country="IN"
              value={phone}
              onChange={setPhone}
              className="w-full p-4 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-blue-500"
              inputClass="w-full p-3 text-lg"
            />
            {isRegister && (
              <p className="text-sm text-gray-500">Name & pincode saved for new account</p>
            )}
            <button
              onClick={sendOtp}
              disabled={loading || !phone}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              {loading ? 'Sending...' : `Send OTP`}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              maxLength={6}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full p-4 text-center text-xl tracking-widest border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 text-center">
              Didn't receive? <button onClick={sendOtp} className="text-blue-600 hover:underline font-medium">Resend</button>
            </p>
            <button
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 text-white font-semibold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center mt-4 p-3 bg-red-50 rounded-xl">{error}</p>
        )}

        <div id="recaptcha" className="hidden" />
      </div>
    </div>
  );
};

export default AuthForm;
