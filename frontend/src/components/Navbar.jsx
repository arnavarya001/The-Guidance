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

  const isActive = (hash) => {
    const cleanHash = currentHash.split('?')[0];
    return cleanHash === hash || (hash === '#home' && (cleanHash === '' || cleanHash === '#'));
  };

  const navLinks = [
    { hash: '#home', label: t('navHome'), icon: '🏠' },
    { hash: '#syllabus', label: t('navSyllabus'), icon: '📖' },
    { hash: '#study-material', label: t('navNotes'), icon: '📝' },
    { hash: '#video-lectures', label: t('navVideos'), icon: '🎥' },
    { hash: '#test-series', label: t('navTests'), icon: '⏱️' },
    { hash: '#pyqs', label: t('navPyqs'), icon: '📜' },
    { hash: '#daily-challenge', label: t('navDailyChallenge'), icon: '🔥', highlight: true }
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'var(--navbar-bg)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      transition: 'var(--transition)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '72px',
        padding: '0 20px',
        gap: '12px'
      }}>
        {/* Professional Coaching Logo */}
        <div 
          onClick={() => navigateTo('#home')} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            userSelect: 'none',
            flexShrink: 0
          }}
        >
          {/* Custom SVG Education Crest */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            flexShrink: 0
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3Z" fill="#ffffff" />
              <path d="M5 13.18V17.18C5 19.94 8.13 22 12 22C15.87 22 19 19.94 19 17.18V13.18L12 17L5 13.18Z" fill="#facc15" />
            </svg>
          </div>
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.3px',
              lineHeight: 1.1,
              color: 'var(--text-dark)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}>
              <span>THE GUIDANCE</span>
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                color: '#fff',
                padding: '2px 5px',
                borderRadius: '4px',
                letterSpacing: '0.5px'
              }}>BSEB</span>
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gray)', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
              Coaching & Board Hub
            </div>
          </div>
        </div>

        {/* Desktop Nav Links with perfect horizontal alignment & no wrapping */}
        <nav className="desktop-nav" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 600,
          fontSize: '13px',
          whiteSpace: 'nowrap',
          flexWrap: 'nowrap'
        }}>
          {navLinks.map(link => {
            const active = isActive(link.hash);
            return (
              <a
                key={link.hash}
                href={link.hash}
                style={{
                  color: link.highlight ? (active ? '#d97706' : '#f59e0b') : (active ? 'var(--primary)' : 'var(--text-dark)'),
                  backgroundColor: active ? (link.highlight ? 'rgba(245, 158, 11, 0.1)' : 'var(--primary-light)') : 'transparent',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  transition: 'var(--transition)',
                  fontWeight: active ? 700 : 600,
                  textDecoration: 'none',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '14px' }}>{link.icon}</span>
                <span>{link.label}</span>
              </a>
            );
          })}

          {/* Student Dashboard link (only when logged in) */}
          {user && (
            <a
              href="#dashboard"
              style={{
                color: isActive('#dashboard') ? 'var(--primary)' : 'var(--text-dark)',
                backgroundColor: isActive('#dashboard') ? 'var(--primary-light)' : 'transparent',
                padding: '6px 10px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                transition: 'var(--transition)',
                fontWeight: isActive('#dashboard') ? 700 : 600,
                textDecoration: 'none',
                flexShrink: 0
              }}
            >
              <span style={{ fontSize: '14px' }}>📊</span>
              <span>{t('navDashboard')}</span>
            </a>
          )}

          {/* Admin Panel link (PRIVATE: Only visible to verified Admin role) */}
          {user && user.role === 'admin' && (
            <a
              href="#admin"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)',
                textDecoration: 'none',
                transition: 'var(--transition)'
              }}
            >
              <span>👑</span>
              <span>Admin Console</span>
            </a>
          )}
        </nav>

        {/* Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="btn btn-outline"
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '20px',
              borderColor: 'var(--border)'
            }}
            title="Toggle Hindi / English"
          >
            <span>🌐</span>
            <span>{language === 'en' ? 'EN' : 'HI'}</span>
          </button>

          {/* AI Guru Trigger Button (Visible on desktop/tablet) */}
          {handleOpenAi && (
            <button
              onClick={handleOpenAi}
              className="btn desktop-only"
              style={{
                background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))',
                border: '1px solid var(--primary-glow)',
                color: 'var(--primary)',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '20px',
                cursor: 'pointer'
              }}
            >
              <span>🤖</span>
              <span>{t('navAiGuru')}</span>
            </button>
          )}

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-dark)'
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* Desktop User Auth Info / Buttons */}
          <div className="desktop-only">
            {user ? (
              <div style={{ position: 'relative' }}>
                <div
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-card-hover)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: user.role === 'admin' ? '#f59e0b' : 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px'
                  }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>
                      {user.name ? user.name.split(' ')[0] : 'Student'}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--gray)', textTransform: 'capitalize' }}>
                      {user.role === 'admin' ? '👑 Admin' : (user.class || 'Student')}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--gray)' }}>▼</span>
                </div>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    width: '220px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    boxShadow: 'var(--shadow-premium)',
                    padding: '8px',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>{user.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray)' }}>{user.email || user.mobile}</div>
                    </div>

                    <button
                      onClick={() => navigateTo('#dashboard')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: 'var(--text-dark)'
                      }}
                    >
                      <span>📊</span> Student Profile & Results
                    </button>

                    {user.role === 'admin' && (
                      <button
                        onClick={() => navigateTo('#admin')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'rgba(245, 158, 11, 0.1)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#d97706',
                          fontWeight: 700
                        }}
                      >
                        <span>👑</span> Admin Control Panel
                      </button>
                    )}

                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '4px' }}>
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                          window.location.hash = '#home';
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: 'var(--danger)',
                          width: '100%'
                        }}
                      >
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => navigateTo('#login')}
                  className="btn btn-outline"
                  style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '10px' }}
                >
                  {t('navLogin')}
                </button>
                <button
                  onClick={() => navigateTo('#signup')}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '10px' }}
                >
                  {t('navSignup')}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-toggle"
            style={{
              background: 'var(--bg-card-hover)',
              border: '1.5px solid var(--border)',
              borderRadius: '10px',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '6px 10px',
              color: 'var(--text-dark)',
              fontWeight: 800,
              boxShadow: 'var(--shadow-sm)'
            }}
            title="Open Mobile Navigation Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 20px 35px rgba(0, 0, 0, 0.15)',
          maxHeight: 'calc(100vh - 72px)',
          overflowY: 'auto'
        }}>
          {navLinks.map(link => (
            <div
              key={link.hash}
              onClick={() => navigateTo(link.hash)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: isActive(link.hash) ? 'var(--primary-light)' : 'transparent',
                color: isActive(link.hash) ? 'var(--primary)' : 'var(--text-dark)',
                fontWeight: isActive(link.hash) ? 700 : 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </div>
          ))}

          {user && (
            <div
              onClick={() => navigateTo('#dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: isActive('#dashboard') ? 'var(--primary-light)' : 'transparent',
                color: isActive('#dashboard') ? 'var(--primary)' : 'var(--text-dark)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <span>📊</span>
              <span>{t('navDashboard')}</span>
            </div>
          )}

          {user && user.role === 'admin' && (
            <div
              onClick={() => navigateTo('#admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#d97706',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <span>👑</span>
              <span>Admin Panel</span>
            </div>
          )}

          {/* Director & Leadership Info Card in Mobile Drawer */}
          <div style={{
            backgroundColor: 'var(--bg-card-hover)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '14px',
            marginTop: '8px',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>👑</span>
              <span>Director: Abhay Kumar Singh</span>
            </div>
            <div style={{ color: 'var(--gray)', marginBottom: '8px' }}>
              The Guidance Coaching Institute, Patna
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href="tel:9934881169"
                className="btn btn-outline btn-sm"
                style={{ flex: 1, padding: '6px', fontSize: '11px', textAlign: 'center', textDecoration: 'none' }}
              >
                📞 Call: 9934881169
              </a>
              <a
                href="https://wa.me/919934881169"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm"
                style={{ flex: 1, padding: '6px', fontSize: '11px', textAlign: 'center', backgroundColor: '#10b981', color: 'white', textDecoration: 'none', fontWeight: 700 }}
              >
                💬 WhatsApp
              </a>
            </div>
          </div>

          {/* Mobile Drawer Bottom Quick Action Bar */}
          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '12px',
            marginTop: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={toggleLanguage}
                className="btn btn-outline btn-sm"
                style={{ flex: 1, padding: '8px', fontSize: '13px', borderRadius: '10px' }}
              >
                🌐 {language === 'en' ? 'English' : 'हिंदी'}
              </button>
              {handleOpenAi && (
                <button
                  onClick={() => { setMobileMenuOpen(false); handleOpenAi(); }}
                  className="btn btn-sm"
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '13px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--primary-light), var(--secondary-light))',
                    color: 'var(--primary)',
                    fontWeight: 700
                  }}
                >
                  🤖 {t('navAiGuru')}
                </button>
              )}
              <button
                onClick={toggleTheme}
                className="btn btn-outline btn-sm"
                style={{ padding: '8px 12px', fontSize: '16px', borderRadius: '10px' }}
                title="Toggle Dark / Light Theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>

            {!user ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => navigateTo('#login')}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '10px', fontSize: '13px', borderRadius: '10px' }}
                >
                  {t('navLogin')}
                </button>
                <button
                  onClick={() => navigateTo('#signup')}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', fontSize: '13px', borderRadius: '10px' }}
                >
                  {t('navSignup')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  window.location.hash = '#home';
                }}
                className="btn btn-outline"
                style={{ width: '100%', padding: '10px', color: 'var(--danger)', fontSize: '13px', borderRadius: '10px' }}
              >
                🚪 Logout ({user.name ? user.name.split(' ')[0] : 'Student'})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
