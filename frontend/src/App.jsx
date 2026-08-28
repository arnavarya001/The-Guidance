import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
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

function AppFooter() {
  const { t } = useLanguage();
  return (
    <footer style={{
      background: 'var(--dark)',
      color: 'white',
      padding: '40px 24px',
      marginTop: 'auto',
      borderTop: '1px solid var(--border)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h3 style={{ color: 'white', marginBottom: '8px', fontWeight: 800 }}>THE GUIDANCE</h3>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '24px' }}>
          {t('footerDesc')}
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '24px',
          fontWeight: 600
        }}>
          <a href="#home" style={{ color: 'white' }}>{t('navHome')}</a>
          <a href="#syllabus" style={{ color: 'white' }}>{t('navSyllabus')}</a>
          <a href="#study-material" style={{ color: 'white' }}>{t('navNotes')}</a>
          <a href="#video-lectures" style={{ color: 'white' }}>{t('navVideos')}</a>
          <a href="#test-series" style={{ color: 'white' }}>{t('navTests')}</a>
          <a href="#pyqs" style={{ color: 'white' }}>{t('navPyqs')}</a>
          <a href="#daily-challenge" style={{ color: '#f59e0b' }}>{t('navDailyChallenge')}</a>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', fontSize: '12px' }}>
          {t('footerCopyright')}
        </div>
      </div>
    </footer>
  );
}

function AppContent() {
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#home');
  const [isAiDoubtOpen, setIsAiDoubtOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || '#home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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
        {route.page === 'home' && <Home />}
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
        {route.page === 'admin' && <AdminPanel />}
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

      {route.page !== 'test-engine' && <AppFooter />}
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
