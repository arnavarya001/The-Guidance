import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Home({ onOpenAiDoubt }) {
  const { t, language } = useLanguage();

  const classesList = [
    { id: 'c_5', name: language === 'hi' ? 'कक्षा 5' : 'Class 5', desc: language === 'hi' ? 'प्राथमिक बोर्ड फाउंडेशन' : 'Primary Board Foundation' },
    { id: 'c_6', name: language === 'hi' ? 'कक्षा 6' : 'Class 6', desc: language === 'hi' ? 'मिडिल स्कूल विषय' : 'Middle School Transition' },
    { id: 'c_7', name: language === 'hi' ? 'कक्षा 7' : 'Class 7', desc: language === 'hi' ? 'मध्यम स्तरीय विषय' : 'Intermediate Subjects' },
    { id: 'c_8', name: language === 'hi' ? 'कक्षा 8' : 'Class 8', desc: language === 'hi' ? 'BSEB बोर्ड कोर तैयारी' : 'BSEB Board Core Prep' },
    { id: 'c_9', name: language === 'hi' ? 'कक्षा 9' : 'Class 9', desc: language === 'hi' ? 'माध्यमिक प्री-बोर्ड' : 'Secondary Pre-Board' },
    { id: 'c_10', name: language === 'hi' ? 'कक्षा 10 (मैट्रिक)' : 'Class 10 (Matric)', desc: language === 'hi' ? 'मैट्रिक बोर्ड परीक्षा एवं PYQs' : 'Matric Board Exam Prep & PYQs', popular: true },
    { id: 'c_11_science', name: language === 'hi' ? 'कक्षा 11' : 'Class 11', desc: language === 'hi' ? 'साइंस, कॉमर्स व आर्ट्स संकाय' : 'Science, Commerce & Arts Streams' },
    { id: 'c_12_science', name: language === 'hi' ? 'कक्षा 12 (इंटर)' : 'Class 12 (Inter)', desc: language === 'hi' ? 'इंटरमीडिएट फाइनल बोर्ड नोट्स' : 'Intermediate Final Board Prep & Notes', popular: true },
  ];

  const navigateTo = (hash) => {
    window.location.hash = hash;
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="section" style={{
        background: 'linear-gradient(135deg, var(--bg) 0%, var(--primary-light) 50%, var(--bg) 100%)',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border)',
        paddingTop: '60px',
        paddingBottom: '80px'
      }}>
        {/* Floating background gradient blobs */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '450px',
          height: '450px',
          background: 'var(--primary-glow)',
          borderRadius: '50%',
          filter: 'blur(90px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '400px',
          height: '400px',
          background: 'var(--secondary-light)',
          borderRadius: '50%',
          filter: 'blur(90px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        <div className="container grid-2" style={{ alignItems: 'center', zIndex: 1, position: 'relative' }}>
          {/* Left Hero Content */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span className="section-tag" style={{ margin: 0 }}>
                {t('heroBadge')}
              </span>
              <span className="streak-flame">
                <span className="icon">🔥</span> {t('heroLiveBatch')}
              </span>
            </div>

            <h1 style={{
              fontSize: '52px',
              lineHeight: 1.15,
              marginBottom: '20px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              color: 'var(--text-dark)'
            }}>
              {t('heroTitle1')}<br />
              <span style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>{t('heroTitle2')}</span> {t('heroTitle3')}
            </h1>
            
            <p style={{
              fontSize: '17px',
              color: 'var(--gray)',
              marginBottom: '32px',
              lineHeight: 1.6,
              maxWidth: '520px'
            }}>
              {t('heroDesc')}
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button onClick={() => navigateTo('#study-material')} className="btn btn-primary btn-lg">
                {t('heroStartLearning')}
              </button>
              <button onClick={() => navigateTo('#daily-challenge')} className="btn btn-outline btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔥</span> {t('heroDailyChallengeBtn')}
              </button>
              {onOpenAiDoubt && (
                <button onClick={onOpenAiDoubt} className="btn btn-secondary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🤖</span> {t('heroAskAiBtn')}
                </button>
              )}
            </div>

            {/* Trust badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '36px', fontSize: '13px', color: 'var(--gray)' }}>
              <div>⭐ <strong>{t('heroRating')}</strong></div>
              <div>•</div>
              <div>👥 <strong>{t('heroStudents')}</strong></div>
              <div>•</div>
              <div>📚 <strong>{t('heroFreeNotes')}</strong></div>
            </div>
          </div>

          {/* Right Hero Graphic Card */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="glass-card glow-box animate-float" style={{
              padding: '32px',
              borderRadius: '24px',
              boxShadow: 'var(--shadow-premium)',
              width: '100%',
              maxWidth: '460px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '20px',
                background: 'var(--success)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: 'var(--shadow)'
              }}>
                {t('heroReadyBadge')}
              </div>

              <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 800 }}>{t('heroHubTitle')}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    <span>{t('heroMathPrep')}</span>
                    <span style={{ color: 'var(--primary)' }}>88%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: '88%' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    <span>{t('heroSciencePrep')}</span>
                    <span style={{ color: 'var(--success)' }}>92%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill progress-bar-fill-success" style={{ width: '92%' }} />
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '10px',
                  marginTop: '6px'
                }}>
                  <div style={{ background: 'var(--bg)', padding: '12px 8px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>500+</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: 600 }}>{t('heroObjectiveCount')}</div>
                  </div>
                  <div style={{ background: 'var(--bg)', padding: '12px 8px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b' }}>🔥 7d</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: 600 }}>{t('heroStreakLabel')}</div>
                  </div>
                  <div style={{ background: 'var(--bg)', padding: '12px 8px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--secondary)' }}>2018-24</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray)', fontWeight: 600 }}>{t('heroPyqLabel')}</div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'var(--primary-light)',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: 'var(--text-dark)',
                  fontWeight: 600,
                  border: '1px solid rgba(37, 99, 235, 0.2)'
                }}>
                  <span>💡</span> {t('heroAiTip')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Doubt Banner */}
      <section style={{ padding: '40px 0', background: 'var(--bg)' }}>
        <div className="container">
          <div className="glass-card glow-box" style={{
            padding: '36px',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
            border: '1px solid var(--primary-glow)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px'
          }}>
            <div style={{ maxWidth: '650px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '24px' }}>🤖</span>
                <span className="section-tag" style={{ margin: 0 }}>{t('aiBannerTag')}</span>
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
                {t('aiBannerTitle')}
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--gray)', lineHeight: 1.5 }}>
                {t('aiBannerDesc')}
              </p>
            </div>
            {onOpenAiDoubt && (
              <button
                onClick={onOpenAiDoubt}
                className="btn btn-primary btn-lg animate-pulse-glow"
                style={{ borderRadius: '100px', padding: '14px 32px' }}
              >
                {t('aiBannerBtn')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t('featSectionTag')}</span>
            <h2 className="section-title">{t('featTitle')}</h2>
            <p className="section-desc">{t('featDesc')}</p>
          </div>

          <div className="grid-4">
            <div className="glass-card" style={{ padding: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>📖</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{t('featNotesTitle')}</h3>
              <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.5 }}>
                {t('featNotesDesc')}
              </p>
            </div>

            <div className="glass-card" style={{ padding: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>🎥</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{t('featVideosTitle')}</h3>
              <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.5 }}>
                {t('featVideosDesc')}
              </p>
            </div>

            <div className="glass-card" style={{ padding: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>✍️</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{t('featTestsTitle')}</h3>
              <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.5 }}>
                {t('featTestsDesc')}
              </p>
            </div>

            <div className="glass-card" style={{ padding: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>📜</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{t('featPyqsTitle')}</h3>
              <p style={{ fontSize: '14px', color: 'var(--gray)', lineHeight: 1.5 }}>
                {t('featPyqsDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Classes Grid Section */}
      <section className="section" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="container">
          <div className="section-title-wrap">
            <span className="section-tag">{t('classesSectionTag')}</span>
            <h2 className="section-title">{t('classesTitle')}</h2>
            <p className="section-desc">{t('classesDesc')}</p>
          </div>

          <div className="grid-4">
            {classesList.map((cls) => (
              <div key={cls.id} className="glass-card" style={{ 
                padding: '24px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '200px',
                border: cls.popular ? '2px solid var(--primary)' : '1px solid var(--border)'
              }}>
                <div>
                  {cls.popular && (
                    <span className="section-tag" style={{ margin: '0 0 10px 0', fontSize: '10px', padding: '2px 8px' }}>
                      🔥 Board Class
                    </span>
                  )}
                  <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-dark)' }}>
                    {cls.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '16px' }}>{cls.desc}</p>
                </div>
                <button 
                  onClick={() => navigateTo(`#study-material?class=${cls.id}`)}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%' }}
                >
                  {t('classExploreBtn')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section" style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 style={{ color: 'white', fontSize: '38px', fontWeight: 800, marginBottom: '16px' }}>
            {t('ctaTitle')}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '17px', marginBottom: '32px', lineHeight: 1.6 }}>
            {t('ctaDesc')}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigateTo('#signup')} className="btn btn-lg" style={{ backgroundColor: 'white', color: 'var(--primary)', fontWeight: 800 }}>
              {t('ctaSignUpBtn')}
            </button>
            <button onClick={() => navigateTo('#syllabus')} className="btn btn-outline btn-lg" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', background: 'transparent' }}>
              {t('ctaCheckSyllabusBtn')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
