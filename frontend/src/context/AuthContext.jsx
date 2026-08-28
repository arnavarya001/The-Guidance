import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('guidance_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('guidance_token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we have a token and need to refresh from backend API
    const loadProfile = async () => {
      if (token && !user) {
        try {
          const res = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
            localStorage.setItem('guidance_user', JSON.stringify(data));
          }
        } catch (e) {
          console.warn("Could not fetch remote profile, using local session", e);
        }
      }
    };

    loadProfile();
  }, [token, user]);

  const login = (userData, userToken) => {
    setToken(userToken);
    setUser(userData);
    localStorage.setItem('guidance_token', userToken);
    localStorage.setItem('guidance_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('guidance_token');
    localStorage.removeItem('guidance_user');
    window.location.hash = '#home';
  };

  const updateProfileState = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('guidance_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
