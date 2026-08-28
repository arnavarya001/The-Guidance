import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function MobileBottomNav({ onOpenAiGuru }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#home');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (hash) => {
    window.location.hash = hash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActive = (hash) => {
    const cleanHash = currentHash.split('?')[0];
    if (hash === '#home') {
      return cleanHash === '' || cleanHash === '#' || cleanHash === '#home';
    }
    return cleanHash === hash;
  };

  const navItems = [
    { hash: '#home', label: t('navHome') || 'Home', icon: '🏠' },
    { hash: '#syllabus', label: t('navSyllabus') || 'Syllabus', icon: '📖' },
    { hash: '#study-material', label: t('navNotes') || 'Notes', icon: '📝' },
    { hash: '#video-lectures', label: t('navVideos') || 'Videos', icon: '🎥' },
    { hash: '#test-series', label: t('navTests') || 'Tests', icon: '⏱️' },
    { 
      hash: user ? '#dashboard' : '#login', 
      label: user ? (t('navDashboard') || 'Profile') : (t('navLogin') || 'Login'), 
      icon: user ? '👤' : '🔑' 
    }
  ];

  return (
    <nav 
      className="mobile-bottom-app-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '62px',
        backgroundColor: 'var(--navbar-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
        zIndex: 990,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 6px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {navItems.map(item => {
        const active = isActive(item.hash);
        return (
          <button
            key={item.hash}
            type="button"
            onClick={() => navigateTo(item.hash)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '6px 0',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: active ? 'var(--primary)' : 'var(--gray)',
              transition: 'var(--transition)',
              position: 'relative'
            }}
          >
            {active && (
              <div style={{
                position: 'absolute',
                top: '0px',
                width: '24px',
                height: '3px',
                borderRadius: '100px',
                backgroundColor: 'var(--primary)',
                boxShadow: '0 2px 8px var(--primary)'
              }} />
            )}
            <span style={{ 
              fontSize: '18px', 
              transform: active ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' 
            }}>
              {item.icon}
            </span>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: active ? 700 : 500,
              letterSpacing: '-0.2px',
              whiteSpace: 'nowrap'
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
