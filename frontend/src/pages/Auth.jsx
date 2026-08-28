import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { signInWithGooglePopup } from '../firebase';

export default function Auth({ mode = 'login' }) {
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState(mode); // 'login' | 'signup' | 'forgot' | 'otp' | 'admin'
  const [classes, setClasses] = useState([]);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [classId, setClassId] = useState('c_10');
  const [newPassword, setNewPassword] = useState('');

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  // Status
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAuthMode(mode);
    setError('');
    setSuccess('');
  }, [mode]);

  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  useEffect(() => {
    fetch('/api/courses/classes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setClasses(data);
          setClassId(data.find(c => c.id === 'c_10')?.id || data[0].id);
        } else {
          setClasses([
            { id: 'c_9', name: 'Class 9' },
            { id: 'c_10', name: 'Class 10' },
            { id: 'c_11_science', name: 'Class 11 Science' },
            { id: 'c_12_science', name: 'Class 12 Science' }
          ]);
        }
      })
      .catch(() => {
        setClasses([
          { id: 'c_9', name: 'Class 9' },
          { id: 'c_10', name: 'Class 10' },
          { id: 'c_11_science', name: 'Class 11 Science' },
          { id: 'c_12_science', name: 'Class 12 Science' }
        ]);
      });
  }, []);

  // Handle Standard Email/Password Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        login(data.user, data.token);
        window.location.hash = data.user.role === 'admin' ? '#admin' : '#dashboard';
      }, 500);
    } catch (err) {
      setError(err.message || 'Invalid credentials or server error.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Student Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          password,
          classId,
          board: 'Bihar Board'
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      setSuccess('Account created successfully!');
      setTimeout(() => {
        login(data.user, data.token);
        window.location.hash = '#dashboard';
      }, 500);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!mobile || !/^\d{10}$/.test(mobile.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobile.trim() })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to send OTP.');

      setOtpSent(true);
      setOtpTimer(60);
      setSuccess(`OTP sent to +91 ${mobile.trim()} (Use 123456 for instant testing)`);
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setError('Please enter the verification code.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: mobile.trim(),
          otp: otpCode.trim(),
          name: name.trim() || undefined,
          classId: classId || 'c_10'
        })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'OTP verification failed.');

      setSuccess('Verification successful! Logging in...');
      setTimeout(() => {
        login(data.user, data.token);
        window.location.hash = '#dashboard';
      }, 500);
    } catch (err) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { user: googleUser, token: googleToken } = await signInWithGooglePopup();
      setSuccess(`Welcome, ${googleUser.name}!`);
      setTimeout(() => {
        login(googleUser, googleToken);
        window.location.hash = googleUser.role === 'admin' ? '#admin' : '#dashboard';
      }, 500);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed.');
      } else {
        setError(err.message || 'Google Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), mobile: mobile.trim(), newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password.');

      setSuccess('Password updated successfully! You can now log in.');
      setTimeout(() => setAuthMode('login'), 1200);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 72px)',
      background: 'radial-gradient(circle at top, var(--primary-light) 0%, var(--bg) 100%)',
      padding: '40px 20px'
    }}>
      <div className="card glass" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '36px',
        borderRadius: '24px',
        boxShadow: 'var(--shadow-premium)'
      }}>
        {/* Auth Mode Switch Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-card-hover)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: authMode === 'login' ? 'var(--bg-card)' : 'transparent',
              color: authMode === 'login' ? 'var(--primary)' : 'var(--gray)',
              fontWeight: authMode === 'login' ? 700 : 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: authMode === 'login' ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition)'
            }}
          >
            Email Login
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('otp'); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: authMode === 'otp' ? 'var(--bg-card)' : 'transparent',
              color: authMode === 'otp' ? '#f59e0b' : 'var(--gray)',
              fontWeight: authMode === 'otp' ? 700 : 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: authMode === 'otp' ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition)'
            }}
          >
            📱 Mobile OTP
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('signup'); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: authMode === 'signup' ? 'var(--bg-card)' : 'transparent',
              color: authMode === 'signup' ? 'var(--primary)' : 'var(--gray)',
              fontWeight: authMode === 'signup' ? 700 : 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: authMode === 'signup' ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition)'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-dark)' }}>
            {authMode === 'login' && 'Account Login'}
            {authMode === 'otp' && 'Instant Mobile Sign In'}
            {authMode === 'signup' && 'Create Student Account'}
            {authMode === 'forgot' && 'Reset Password'}
          </h2>
          <p style={{ color: 'var(--gray)', fontSize: '13px' }}>
            {authMode === 'login' && 'Sign in with your email and password'}
            {authMode === 'otp' && 'Fast and secure OTP verification for Bihar Board students'}
            {authMode === 'signup' && 'Join thousands of students preparing with The Guidance'}
            {authMode === 'forgot' && 'Enter your registered details to set a new password'}
          </p>
        </div>

        {error && <div className="alert alert-error" style={{ fontSize: '13px', marginBottom: '16px' }}>⚠️ {error}</div>}
        {success && <div className="alert alert-success" style={{ fontSize: '13px', marginBottom: '16px' }}>✅ {success}</div>}

        {/* Google Sign In Option for student flows */}
        {(authMode === 'login' || authMode === 'signup') && (
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="btn"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                backgroundColor: '#ffffff',
                color: '#1f2937',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '11px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>

            <div style={{ margin: '18px 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              <span style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: 600 }}>OR WITH EMAIL</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            </div>
          </div>
        )}

        {/* 1. EMAIL LOGIN FORM */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@gmail.com"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <span
                  onClick={() => setAuthMode('forgot')}
                  style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                >
                  Forgot Password?
                </span>
              </div>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
              {loading ? 'Signing in...' : 'Sign In as Student'}
            </button>
          </form>
        )}

        {/* 2. MOBILE OTP FORM */}
        {authMode === 'otp' && (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
            <div className="form-group">
              <label className="form-label">10-Digit Mobile Number</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-card-hover)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center'
                }}>+91</span>
                <input
                  type="tel"
                  className="form-control"
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  disabled={otpSent}
                  required
                />
              </div>
            </div>

            {otpSent && (
              <>
                <div className="form-group">
                  <label className="form-label">Student Name (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your Name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">6-Digit Verification Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 123456"
                    required
                    style={{ fontSize: '18px', letterSpacing: '4px', textAlign: 'center', fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--gray)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Change Number
                  </button>
                  {otpTimer > 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--gray)' }}>Resend in {otpTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn"
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                fontWeight: 700,
                border: 'none',
                borderRadius: '12px'
              }}
            >
              {loading ? 'Processing...' : (otpSent ? 'Verify Code & Sign In' : '📲 Send Verification Code')}
            </button>
          </form>
        )}

        {/* 3. SIGNUP FORM */}
        {authMode === 'signup' && (
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Aarav Kumar"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="aarav@gmail.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                className="form-control"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210 (10 digits)"
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Class</label>
                <select
                  className="form-control form-select"
                  value={classId}
                  onChange={e => setClassId(e.target.value)}
                  required
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Board</label>
                <input type="text" className="form-control" value="Bihar Board (BSEB)" disabled />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* 4. DEDICATED ADMIN LOGIN FORM */}
        {/* 4. FORGOT PASSWORD FORM */}
        {authMode === 'forgot' && (
          <form onSubmit={handleForgotSubmit}>
            <div className="form-group">
              <label className="form-label">Registered Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Registered Mobile Number</label>
              <input
                type="tel"
                className="form-control"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="10 digit number"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '12px' }}>
              {loading ? 'Updating...' : 'Set New Password'}
            </button>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <span
                onClick={() => setAuthMode('login')}
                style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                ← Back to Login
              </span>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
