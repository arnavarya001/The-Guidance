import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import AiDoubtModal from './components/AiDoubtModal';

// Pages
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Syllabus from './pages/Syllabus';
import StudyMaterial from './pages/StudyMaterial';
import TestSeries from './pages/TestSeries';
import TestEngine from './pages/TestEngine';
import Results from './pages/Results';
import Analytics from './pages/Analytics';
import AdminPanel from './pages/AdminPanel';
import PYQs from './pages/PYQs';
import VideoLectures from './pages/VideoLectures';
import DailyChallenge from './pages/DailyChallenge';

function AppFooter({ settings }) {
  const { t } = useLanguage();
  const ownerName = 'Abhay Kumar Singh';
  const phone = settings?.phone || '+91 99349 91169';
  const email = settings?.email || 'siabhay17@gmail.com';
  const address = settings?.address || 'Bari Path, Near Patna College, Patna, Bihar - 800004';
  const coachingName = settings?.coachingName || 'THE GUIDANCE';

  return (
    <footer style={{
      background: 'var(--dark)',
      color: 'white',
      padding: '48px 24px 80px',
      marginTop: 'auto',
      borderTop: '1px solid var(--border)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '36px',
          marginBottom: '36px'
        }}>
          {/* Brand & Leadership Info */}
          <div>
            <h3 style={{ color: 'white', marginBottom: '8px', fontWeight: 800, fontSize: '20px' }}>
              {coachingName}
            </h3>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#f59e0b',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '12px'
            }}>
              👑 Director & Founder: {ownerName}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
              {settings?.coachingDesc || t('footerDesc')}
            </p>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>📍 {address}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📞</span>
                <a href={`tel:${phone.replace(/\s+/g, '')}`} style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
                  {phone}
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✉️</span>
                <a href={`mailto:${email}`} style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
                  {email}
                </a>
              </div>
              <div style={{ marginTop: '6px' }}>
                <a
                  href={`https://wa.me/919934991169?text=Hello%20Abhay%20Sir%2C%20I%20have%20an%20admission%20inquiry%20regarding%20The%20Guidance.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm"
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    fontWeight: 700
                  }}
                >
                  💬 WhatsApp Director
                </a>
              </div>
            </div>
          </div>

          {/* Quick Academic Links */}
          <div>
            <h4 style={{ color: '#facc15', fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
              Academic Portal
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <a href="#syllabus" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>📖 Bihar Board Syllabus</a>
              <a href="#study-material" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>📝 Chapter Notes & PDF Books</a>
              <a href="#video-lectures" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>🎥 Video Classes & Lectures</a>
              <a href="#test-series" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>⏱️ Chapter Mock Tests</a>
              <a href="#pyqs" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>📜 5-Year Past Papers (PYQ)</a>
            </div>
          </div>

          {/* Student Support */}
          <div>
            <h4 style={{ color: '#60a5fa', fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
              Student Services
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <a href="#daily-challenge" style={{ color: '#f59e0b', fontWeight: 600, textDecoration: 'none' }}>🔥 Daily Challenge & Quiz</a>
              <a href="#login" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>🔑 Student Sign In / OTP</a>
              <a href="#dashboard" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>📊 Performance Analytics</a>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>🤖 24/7 AI Doubt Solver Active</span>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)'
        }}>
          <div>
            © {new Date().getFullYear()} {coachingName}. All Rights Reserved. Built for Bihar Board & CBSE Excellence.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="#home" style={{ color: 'rgba(255,255,255,0.6)' }}>Home</a>
            <a href="#study-material" style={{ color: 'rgba(255,255,255,0.6)' }}>Materials</a>
            <a href="#test-series" style={{ color: 'rgba(255,255,255,0.6)' }}>Tests</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function AdminAccessDenied() {
  return (
    <div className="container section" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 140px)',
      padding: '40px 20px'
    }}>
      <div className="card glass" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '40px',
        textAlign: 'center',
        borderRadius: '20px',
        boxShadow: 'var(--shadow-premium)'
      }}>
        <div style={{ fontSize: '54px', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: 'var(--danger)' }}>
          Admin Access Required
        </h2>
        <p style={{ color: 'var(--gray)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          This administrative control console is restricted. Only authorized coaching administrators with verified credentials may access this area.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => window.location.hash = '#login'}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontWeight: 700 }}
          >
            🔑 Admin Login
          </button>
          <button
            onClick={() => window.location.hash = '#home'}
            className="btn btn-outline"
            style={{ padding: '10px 20px' }}
          >
            🏠 Return Home
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#home');
  const [isAiDoubtOpen, setIsAiDoubtOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch CMS site settings
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') setSettings(data);
      })
      .catch(err => console.warn('Could not load site settings:', err));
  }, []);

  // Parse routing
  const getRoute = () => {
    const hash = currentPath.split('?')[0]; // Strip search params
    if (hash === '#home' || hash === '' || hash === '#') return { page: 'home' };
    if (hash === '#login') return { page: 'auth', mode: 'login' };
    if (hash === '#signup') return { page: 'auth', mode: 'signup' };
    if (hash === '#forgot') return { page: 'auth', mode: 'forgot' };
    if (hash === '#dashboard') return { page: 'dashboard' };
    if (hash === '#syllabus') return { page: 'syllabus' };
    if (hash === '#study-material') return { page: 'study-material' };
    if (hash === '#video-lectures') return { page: 'video-lectures' };
    if (hash === '#daily-challenge') return { page: 'daily-challenge' };
    if (hash === '#test-series') return { page: 'test-series' };
    if (hash === '#pyqs') return { page: 'pyqs' };
    if (hash.startsWith('#test-engine/')) {
      return { page: 'test-engine', id: hash.replace('#test-engine/', '') };
    }
    if (hash.startsWith('#results/')) {
      return { page: 'results', id: hash.replace('#results/', '') };
    }
    if (hash === '#results') return { page: 'results' };
    if (hash === '#analytics') return { page: 'analytics' };
    if (hash === '#admin') return { page: 'admin' };

    return { page: 'home' };
  };

  const route = getRoute();

  return (
    <>
      <Navbar onOpenAiGuru={() => setIsAiDoubtOpen(true)} />
      <main style={{ minHeight: 'calc(100vh - 70px)' }}>
        {route.page === 'home' && <Home settings={settings} />}
        {route.page === 'auth' && <Auth mode={route.mode} />}
        {route.page === 'dashboard' && <Dashboard />}
        {route.page === 'syllabus' && <Syllabus />}
        {route.page === 'study-material' && <StudyMaterial />}
        {route.page === 'video-lectures' && <VideoLectures />}
        {route.page === 'daily-challenge' && <DailyChallenge />}
        {route.page === 'test-series' && <TestSeries />}
        {route.page === 'pyqs' && <PYQs />}
        {route.page === 'test-engine' && <TestEngine testId={route.id} />}
        {route.page === 'results' && <Results resultId={route.id} />}
        {route.page === 'analytics' && <Analytics />}
        {route.page === 'admin' && (
          user && user.role === 'admin' ? (
            <AdminPanel settings={settings} onSettingsUpdated={(s) => setSettings(s)} />
          ) : (
            <AdminAccessDenied />
          )
        )}
      </main>

      {/* Floating AI Guru Trigger Button */}
      <div
        className="floating-ai-btn"
        onClick={() => setIsAiDoubtOpen(true)}
        title={t('navAiGuru')}
      >
        <span style={{ fontSize: '20px' }}>🤖</span>
        <span>{t('navAiGuru')}</span>
      </div>

      {/* AI Doubt Modal Component */}
      <AiDoubtModal
        isOpen={isAiDoubtOpen}
        onClose={() => setIsAiDoubtOpen(false)}
      />

      {/* Native Mobile Bottom Navigation App Bar */}
      {route.page !== 'test-engine' && (
        <MobileBottomNav onOpenAiGuru={() => setIsAiDoubtOpen(true)} />
      )}

      {route.page !== 'test-engine' && <AppFooter settings={settings} />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
