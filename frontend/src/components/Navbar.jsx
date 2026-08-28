import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ onOpenAiDoubt, onOpenAiGuru }) {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#home');

  const handleOpenAi = onOpenAiGuru || onOpenAiDoubt;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const navigateTo = (hash) => {
    window.location.hash = hash;
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const isActive = (hash) => currentHash === hash || (hash === '#home' && currentHash === '');

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'var(--navbar-bg)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      transition: 'var(--transition)'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '72px'
      }}>
        {/* Logo */}
        <div onClick={() => navigateTo('#home')} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '20px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
          }}>
            G
          </div>
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              background: 'linear-gradient(to right, var(--primary), var(--secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
              lineHeight: 1.1
            }}>
              {t('brandTitle')}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-light)', letterSpacing: '0.5px' }}>
              {t('brandSubtitle')}
            </div>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="desktop-nav" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          <a
            href="#home"
            style={{
              color: isActive('#home') ? 'var(--primary)' : 'var(--text-dark)',
              borderBottom: isActive('#home') ? '2px solid var(--primary)' : '2px solid transparent',
              paddingBottom: '4px'
            }}
          >
            {t('navHome')}
          </a>
          <a
            href="#syllabus"
            style={{
              color: isActive('#syllabus') ? 'var(--primary)' : 'var(--text-dark)',
              borderBottom: isActive('#syllabus') ? '2px solid var(--primary)' : '2px solid transparent',
              paddingBottom: '4px'
            }}
          >
            {t('navSyllabus')}
          </a>
          <a
            href="#study-material"
            style={{
              color: isActive('#study-material') ? 'var(--primary)' : 'var(--text-dark)',
              borderBottom: isActive('#study-material') ? '2px solid var(--primary)' : '2px solid transparent',
              paddingBottom: '4px'
            }}
          >
            {t('navNotes')}
          </a>
          <a
            href="#video-lectures"
            style={{
              color: isActive('#video-lectures') ? 'var(--primary)' : 'var(--text-dark)',
              borderBottom: isActive('#video-lectures') ? '2px solid var(--primary)' : '2px solid transparent',
              paddingBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>🎥</span> {t('navVideos')}
          </a>
          <a
            href="#test-series"
            style={{
              color: isActive('#test-series') ? 'var(--primary)' : 'var(--text-dark)',
              borderBottom: isActive('#test-series') ? '2px solid var(--primary)' : '2px solid transparent',
              paddingBottom: '4px'
            }}
          >
            {t('navTests')}
          </a>
          <a
            href="#pyqs"
            style={{
              color: isActive('#pyqs') ? 'var(--primary)' : 'var(--text-dark)',
              borderBottom: isActive('#pyqs') ? '2px solid var(--primary)' : '2px solid transparent',
              paddingBottom: '4px'
            }}
          >
            {t('navPyqs')}
          </a>
          <a
            href="#daily-challenge"
            style={{
              color: isActive('#daily-challenge') ? '#f59e0b' : 'var(--text-dark)',
              fontWeight: 700,
              borderBottom: isActive('#daily-challenge') ? '2px solid #f59e0b' : '2px solid transparent',
              paddingBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>🔥</span> {t('navDailyChallenge')}
          </a>
          {user && (
            <a
              href="#dashboard"
              style={{
                color: isActive('#dashboard') ? 'var(--primary)' : 'var(--text-dark)',
                borderBottom: isActive('#dashboard') ? '2px solid var(--primary)' : '2px solid transparent',
                paddingBottom: '4px'
              }}
            >
              {t('navDashboard')}
            </a>
          )}
          {user && user.role === 'admin' && (
            <a href="#admin" style={{
              color: 'var(--secondary)',
              fontWeight: 700,
              background: 'var(--secondary-light)',
              padding: '4px 10px',
              borderRadius: '6px'
            }}>
              {t('navAdmin')}
            </a>
          )}
        </nav>

        {/* Right Section: Language Toggle + Theme Toggle + Auth / Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Language Switcher Button (Hindi / English) */}
          <button
            onClick={toggleLanguage}
            title={language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 800,
              color: 'var(--text-dark)',
              transition: 'var(--transition)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <span style={{ fontSize: '14px' }}>🌐</span>
            <span>{language === 'hi' ? '🇮🇳 हिंदी' : '🇬🇧 English'}</span>
          </button>

          {/* AI Doubt Quick Button */}
          {handleOpenAi && (
            <button
              onClick={handleOpenAi}
              className="desktop-nav"
              style={{
                padding: '6px 12px',
                borderRadius: '100px',
                border: '1px solid var(--border)',
                background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>🤖</span> {t('navAiGuru')}
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
              color: 'var(--text-dark)',
              transition: 'var(--transition)'
            }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="desktop-nav" style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </span>
                <span style={{ fontSize: '10px' }}>▼</span>
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '8px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-lg)',
                  width: '200px',
                  padding: '8px 0',
                  zIndex: 1000
                }}>
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-dark)' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                    <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, marginTop: '4px', textTransform: 'capitalize' }}>
                      {user.class ? user.class.replace('c_', 'Class ') : 'Student'}
                    </div>
                  </div>
                  <div 
                    onClick={() => navigateTo('#dashboard')}
                    style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-dark)' }}
                  >
                    <span>📊</span> {t('navDashboard')}
                  </div>
                  <div 
                    onClick={() => navigateTo('#results')}
                    style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-dark)' }}
                  >
                    <span>📈</span> {t('navResults')}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                  <div 
                    onClick={logout}
                    style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--danger)' }}
                  >
                    <span>🚪</span> {t('navLogout')}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
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
                  localStorage.setItem('the_guidance_user', JSON.stringify(adminUser));
                  localStorage.setItem('the_guidance_token', 'admin_session_' + Date.now());
                  window.location.hash = '#admin';
                  window.location.reload();
                }} 
                className="btn btn-sm desktop-nav"
                style={{ 
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                  color: 'white', 
                  border: 'none', 
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                }}
                title="1-Click Admin Access"
              >
                👑 Admin
              </button>
              <button onClick={() => navigateTo('#login')} className="btn btn-outline btn-sm">
                {t('navLogin')}
              </button>
              <button onClick={() => navigateTo('#signup')} className="btn btn-primary btn-sm desktop-nav">
                {t('navSignUp')}
              </button>
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-nav-toggle"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'none',
              color: 'var(--text-dark)'
            }}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button
              onClick={toggleLanguage}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                fontWeight: 700,
                color: 'var(--primary)'
              }}
            >
              🌐 {language === 'hi' ? 'Switch to English' : 'हिंदी भाषा चुनें'}
            </button>
            {handleOpenAi && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenAi();
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--primary)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontWeight: 700
                }}
              >
                🤖 {t('navAiGuru')}
              </button>
            )}
          </div>

          <a onClick={() => navigateTo('#home')} style={{ padding: '8px 0', fontWeight: 600, color: 'var(--text-dark)', cursor: 'pointer' }}>{t('navHome')}</a>
          <a onClick={() => navigateTo('#syllabus')} style={{ padding: '8px 0', fontWeight: 600, color: 'var(--text-dark)', cursor: 'pointer' }}>{t('navSyllabus')}</a>
          <a onClick={() => navigateTo('#study-material')} style={{ padding: '8px 0', fontWeight: 600, color: 'var(--text-dark)', cursor: 'pointer' }}>{t('navNotes')}</a>
          <a onClick={() => navigateTo('#video-lectures')} style={{ padding: '8px 0', fontWeight: 600, color: 'var(--text-dark)', cursor: 'pointer' }}>🎥 {t('navVideos')}</a>
          <a onClick={() => navigateTo('#test-series')} style={{ padding: '8px 0', fontWeight: 600, color: 'var(--text-dark)', cursor: 'pointer' }}>{t('navTests')}</a>
          <a onClick={() => navigateTo('#pyqs')} style={{ padding: '8px 0', fontWeight: 600, color: 'var(--text-dark)', cursor: 'pointer' }}>{t('navPyqs')}</a>
          <a onClick={() => navigateTo('#daily-challenge')} style={{ padding: '8px 0', fontWeight: 700, color: '#f59e0b', cursor: 'pointer' }}>🔥 {t('navDailyChallenge')}</a>
          {user && (
            <a onClick={() => navigateTo('#dashboard')} style={{ padding: '8px 0', fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}>
              📊 {t('navDashboard')}
            </a>
          )}
        </div>
      )}
    </header>
  );
}
