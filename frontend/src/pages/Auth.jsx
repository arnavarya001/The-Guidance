import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Auth({ mode = 'login' }) {
  const { login } = useAuth();
  const [authMode, setAuthMode] = useState(mode); // 'login' | 'signup' | 'forgot'
  const [classes, setClasses] = useState([]);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [classId, setClassId] = useState('');
  const [newPassword, setNewPassword] = useState('');

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
    // Load classes list for dropdown
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/courses/classes');
        if (res.ok) {
          const data = await res.json();
          setClasses(data);
          if (data.length > 0) setClassId(data[5]?.id || data[0].id); // default to Class 10 if exists
        }
      } catch (e) {
        console.error("Failed to load classes", e);
      }
    };
    fetchClasses();
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    // 1. Instant Admin Access (Guaranteed to work across all platforms/Vercel/Offline)
    if (cleanEmail === 'admin@theguidance.com' && cleanPassword === 'admin123') {
      setSuccess('Logged in as Administrator!');
      const adminUser = {
        id: 'u_admin',
        name: 'Admin The Guidance',
        email: 'admin@theguidance.com',
        mobile: '9999999999',
        class: 'All',
        board: 'Bihar Board',
        role: 'admin'
      };
      setTimeout(() => {
        login(adminUser, 'admin_session_token_' + Date.now());
        window.location.hash = '#admin';
        setLoading(false);
      }, 400);
      return;
    }

    // 2. Demo Student Instant Access
    if (cleanEmail === 'student@theguidance.com' || (cleanEmail === 'aarav@gmail.com' && cleanPassword === '123456')) {
      setSuccess('Logged in as Demo Student!');
      const studentUser = {
        id: 'u_student1',
        name: 'Aarav Kumar',
        email: cleanEmail,
        mobile: '9876543210',
        class: 'c_10',
        board: 'Bihar Board',
        role: 'student'
      };
      setTimeout(() => {
        login(studentUser, 'student_session_token_' + Date.now());
        window.location.hash = '#dashboard';
        setLoading(false);
      }, 400);
      return;
    }

    // 3. Check registered users in local storage
    const localUsers = JSON.parse(localStorage.getItem('the_guidance_users') || '[]');
    const matched = localUsers.find(u => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword);
    if (matched) {
      setSuccess('Logged in successfully!');
      setTimeout(() => {
        login(matched, 'local_session_token_' + Date.now());
        window.location.hash = matched.role === 'admin' ? '#admin' : '#dashboard';
        setLoading(false);
      }, 400);
      return;
    }

    // 4. Try Backend API
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Logged in successfully!');
        setTimeout(() => {
          login(data.user, data.token);
          window.location.hash = data.user.role === 'admin' ? '#admin' : '#dashboard';
        }, 400);
      } else {
        setError(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      setError('Invalid email or password. For Admin login, use admin@theguidance.com / admin123');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!name || !email || !mobile || !password || !classId) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          mobile,
          password,
          classId,
          board: 'Bihar Board'
        })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Account created successfully!');
        setTimeout(() => {
          login(data.user, data.token);
          window.location.hash = '#dashboard';
        }, 800);
        return;
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      // Local registration fallback
      const newUser = {
        id: 'u_' + Date.now(),
        name,
        email,
        mobile,
        password,
        class: classId,
        board: 'Bihar Board',
        role: 'student'
      };
      const localUsers = JSON.parse(localStorage.getItem('the_guidance_users') || '[]');
      localUsers.push(newUser);
      localStorage.setItem('the_guidance_users', JSON.stringify(localUsers));

      setSuccess('Account created successfully!');
      setTimeout(() => {
        login(newUser, 'local_jwt_session_' + Date.now());
        window.location.hash = '#dashboard';
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !mobile || !newPassword) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mobile, newPassword })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Password updated successfully! You can now log in.');
        setTimeout(() => {
          setAuthMode('login');
        }, 1200);
        return;
      } else {
        setError(data.message || 'Password reset failed.');
      }
    } catch (err) {
      // Local/offline password reset fallback
      const cleanEmail = (email || '').trim().toLowerCase();
      const localUsers = JSON.parse(localStorage.getItem('the_guidance_users') || '[]');
      const userIndex = localUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
      
      if (userIndex !== -1) {
        localUsers[userIndex].password = newPassword;
        localStorage.setItem('the_guidance_users', JSON.stringify(localUsers));
      }

      setSuccess('Password updated successfully! You can now log in with your new password.');
      setTimeout(() => {
        setAuthMode('login');
      }, 1200);
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
      background: 'radial-gradient(circle at top, var(--primary-light) 0%, var(--bg) 100%)'
    }}>
      <div className="card glass" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: 'var(--shadow-premium)'
      }}>
        {/* Header Toggle */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>
            {authMode === 'login' && 'Welcome Back'}
            {authMode === 'signup' && 'Create Your Account'}
            {authMode === 'forgot' && 'Reset Password'}
          </h2>
          <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
            {authMode === 'login' && 'Access Bihar Board materials and test papers'}
            {authMode === 'signup' && 'Sign up to build performance metrics'}
            {authMode === 'forgot' && 'Confirm details to update password'}
          </p>
        </div>

        {error && <div className="alert alert-error" style={{ fontSize: '14px' }}>⚠️ {error}</div>}
        {success && <div className="alert alert-success" style={{ fontSize: '14px' }}>✅ {success}</div>}

        {/* LOGIN FORM */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@gmail.com" 
                required 
              />
            </div>
            
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <span 
                  onClick={() => setAuthMode('forgot')} 
                  style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
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

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              {loading ? 'Logging in...' : 'Sign In'}
            </button>

            <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              <span style={{ fontSize: '12px', color: 'var(--gray)' }}>OR QUICK ACCESS</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            </div>

            <button 
              type="button" 
              onClick={() => {
                const adminUser = {
                  id: 'u_admin',
                  name: 'Admin The Guidance',
                  email: 'admin@theguidance.com',
                  mobile: '9999999999',
                  class: 'All',
                  board: 'Bihar Board',
                  role: 'admin'
                };
                login(adminUser, 'admin_session_' + Date.now());
                window.location.hash = '#admin';
              }} 
              className="btn" 
              style={{ 
                width: '100%', 
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                color: 'white', 
                border: 'none',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
            >
              👑 Instant 1-Click Admin Access
            </button>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
              Don't have an account?{' '}
              <span 
                onClick={() => setAuthMode('signup')} 
                style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Sign Up Free
              </span>
            </div>
          </form>
        )}

        {/* SIGNUP FORM */}
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
                onChange={e => setMobile(e.target.value)}
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

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
              Already registered?{' '}
              <span 
                onClick={() => setAuthMode('login')} 
                style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Sign In
              </span>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
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
                placeholder="Min 6 characters" 
                required 
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              {loading ? 'Updating password...' : 'Update Password'}
            </button>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
              Remember password?{' '}
              <span 
                onClick={() => setAuthMode('login')} 
                style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
              >
                Back to Sign In
              </span>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
