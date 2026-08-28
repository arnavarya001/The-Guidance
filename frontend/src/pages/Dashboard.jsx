import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard({ onOpenAiDoubt }) {
  const { user, token } = useAuth();
  const { t, language } = useLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      window.location.hash = '#login';
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch analytics
        const anaRes = await fetch('http://localhost:5050/api/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const anaData = await anaRes.json();
        setAnalytics(anaData);

        // Fetch history
        const histRes = await fetch('http://localhost:5050/api/results/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const histData = await histRes.json();
        setHistory(Array.isArray(histData) ? histData.sort((a,b) => new Date(b.attempted_at) - new Date(a.attempted_at)).slice(0, 4) : []);

        // Fetch all classes
        const clsRes = await fetch('http://localhost:5050/api/courses/classes');
        const clsData = await clsRes.json();
        setClasses(Array.isArray(clsData) ? clsData : []);

        // Fetch tests for student's class
        if (user && user.class) {
          const testRes = await fetch(`http://localhost:5050/api/tests?classId=${user.class}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const testData = await testRes.json();
          setAvailableTests(Array.isArray(testData) ? testData.slice(0, 3) : []);
        }
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  if (loading) {
    return (
      <div className="loader-container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse-glow" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)' }}></div>
      </div>
    );
  }

  const currentClassName = classes.find(c => c.id === user?.class)?.name || `Class ${user?.class ? user.class.replace('c_', '') : '10'}`;
  const prepProgress = analytics && !analytics.empty 
    ? Math.min(95, 20 + (analytics.total_tests * 15)) 
    : 25;

  return (
    <div className="container section" style={{ padding: '40px 24px', textAlign: 'left' }}>
      {/* Welcome Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="section-tag" style={{ margin: 0 }}>{t('dashTag')}</span>
            <span className="streak-flame">
              <span className="icon">🔥</span> 7 Days {t('heroStreakLabel')}
            </span>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '4px' }}>
            {t('dashGreeting')}, {user?.name}!
          </h2>
          <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
            {language === 'hi' ? `कक्षा: ${currentClassName} | बिहार बोर्ड (BSEB)` : `Prepared specifically for ${currentClassName} | Bihar Board`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => window.location.hash = '#daily-challenge'} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔥</span> {t('navDailyChallenge')}
          </button>
          <button onClick={() => window.location.hash = '#video-lectures'} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🎥</span> {t('navVideos')}
          </button>
          {onOpenAiDoubt && (
            <button onClick={onOpenAiDoubt} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🤖</span> {t('navAiGuru')}
            </button>
          )}
          <button onClick={() => window.location.hash = '#test-series'} className="btn btn-primary">
            ✍️ {t('dashAttemptBtn')}
          </button>
        </div>
      </div>

      {/* Daily Challenge Banner inside Dashboard */}
      <div className="glass-card glow-box" style={{
        padding: '20px 24px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, var(--bg-card) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '36px' }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-dark)' }}>
              {t('dashDailyActiveTitle')}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--gray)' }}>
              {t('dashDailyActiveDesc')}
            </div>
          </div>
        </div>
        <button
          onClick={() => window.location.hash = '#daily-challenge'}
          className="btn btn-primary animate-pulse-glow"
          style={{ padding: '8px 20px', fontSize: '13px', borderRadius: '100px' }}
        >
          {t('dashSolveDailyBtn')}
        </button>
      </div>

      {/* Grid: Stats and Progress */}
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        {/* Progress Card */}
        <div className="glass-card" style={{ gridColumn: 'span 2', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>{t('dashPrepProgressTitle')}</h3>
          <p style={{ fontSize: '14px', color: 'var(--gray)', marginBottom: '16px' }}>{t('dashPrepProgressDesc')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="progress-bar-container" style={{ flex: 1, height: '14px' }}>
              <div className="progress-bar-fill" style={{ width: `${prepProgress}%` }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>{prepProgress}%</span>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--gray)' }}>
            <div>✅ <strong>{t('dashClassLabel')}</strong> {currentClassName}</div>
            <div>📋 <strong>{t('dashSyllabusLabel')}</strong></div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', color: 'white' }}>
          <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 700 }}>{t('dashPerfSummary')}</h3>
          <div style={{ margin: '12px 0' }}>
            <div style={{ fontSize: '44px', fontWeight: 800, lineHeight: 1 }}>
              {analytics && !analytics.empty ? `${analytics.overall_percentage}%` : '78%'}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: '4px' }}>{t('dashAvgScore')}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '10px', fontSize: '13px' }}>
            <div>{t('dashTotalTests')} <strong>{analytics?.total_tests || 3}</strong></div>
            <div>{t('dashAccuracy')} <strong>{analytics && !analytics.empty ? `${analytics.accuracy}%` : '85%'}</strong></div>
          </div>
        </div>
      </div>

      {/* Main Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Side: Test History and Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Recent Tests */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>{t('dashRecentTests')}</h3>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-light)' }}>
                {t('dashNoTests')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {history.map(att => (
                  <div key={att.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>{att.test_title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray)', marginTop: '2px' }}>
                        {new Date(att.attempted_at).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN')} | Marks: {att.obtained_marks}/{att.total_marks}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`badge ${att.percentage >= 60 ? 'badge-success' : 'badge-warning'}`}>
                        {att.percentage}%
                      </span>
                      <button 
                        onClick={() => window.location.hash = `#results/${att.id}`} 
                        className="btn btn-outline btn-sm"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        {language === 'hi' ? 'उत्तर देखें' : 'View Solution'}
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={() => window.location.hash = '#results'} className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
                  {t('dashViewAllResults')}
                </button>
              </div>
            )}
          </div>

          {/* Recommended Study Material */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>{t('dashRecChapters')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '16px', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="badge badge-secondary" style={{ fontSize: '10px', marginBottom: '4px' }}>
                    {language === 'hi' ? 'गणित (Math)' : 'Mathematics'}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>
                    {language === 'hi' ? 'अध्याय 1: वास्तविक संख्याएँ (Real Numbers)' : 'Chapter 1: Real Numbers'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                    {language === 'hi' ? 'सूत्र शीट और महत्वपूर्ण वस्तुनिष्ठ प्रश्न' : 'Formula sheet & key MCQs'}
                  </div>
                </div>
                <button onClick={() => window.location.hash = `#study-material?class=${user?.class}`} className="btn btn-secondary btn-sm">
                  {t('dashStudyBtn')}
                </button>
              </div>

              <div style={{ padding: '16px', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="badge badge-success" style={{ fontSize: '10px', marginBottom: '4px' }}>
                    {language === 'hi' ? 'विज्ञान (Science)' : 'Science'}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>
                    {language === 'hi' ? 'अध्याय 1: रासायनिक अभिक्रियाएँ एवं समीकरण' : 'Chapter 1: Chemical Reactions & Equations'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                    {language === 'hi' ? 'समीकरण संतुलन नोट्स एवं PYQs' : 'Balancing equations & PYQs'}
                  </div>
                </div>
                <button onClick={() => window.location.hash = `#study-material?class=${user?.class}`} className="btn btn-success btn-sm">
                  {t('dashStudyBtn')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Popular Tests & Stats Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* AI Guru Widget Card */}
          <div className="glass-card glow-box" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🤖</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>24/7 AI Doubt Guru</h3>
            <p style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '16px', lineHeight: 1.4 }}>
              {language === 'hi' ? 'किसी भी प्रश्न का डाउट तुरंत पूछें और हिंदी या English में हल पाएं।' : 'Ask doubts in any subject and receive step-by-step guidance.'}
            </p>
            {onOpenAiDoubt && (
              <button onClick={onOpenAiDoubt} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                {language === 'hi' ? 'डाउट पूछें →' : 'Ask Doubt →'}
              </button>
            )}
          </div>

          {/* Quick Analytics Link */}
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>📊</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>Performance Analytics</h3>
            <p style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '16px' }}>
              {language === 'hi' ? 'कमजोर अध्यायों की पहचान करें और अपनी एक्यूरेसी ट्रैक करें।' : 'Identify weak areas and track topic-wise accuracy.'}
            </p>
            <button onClick={() => window.location.hash = '#analytics'} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
              {t('dashViewAnalyticsBtn')}
            </button>
          </div>

          {/* Recommended Tests */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '16px' }}>{t('dashRecTests')}</h3>
            {availableTests.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--gray)' }}>
                {language === 'hi' ? 'कोई विशेष टेस्ट नहीं मिला। टेस्ट सीरीज टैब देखें।' : 'No specific tests found. Check Test Series tab.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {availableTests.map(tst => (
                  <div key={tst.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{tst.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--gray)' }}>
                      <span>{tst.category} | {tst.time_limit} mins</span>
                      <button onClick={() => window.location.hash = `#test-series`} className="btn btn-primary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }}>
                        {t('dashAttemptBtn')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
