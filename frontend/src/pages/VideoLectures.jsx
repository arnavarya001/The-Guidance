import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function VideoLectures() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(user?.class || 'c_10');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    // Fetch classes
    fetch('/api/courses/classes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setClasses(data);
        } else {
          setClasses([
            { id: 'c_9', name: language === 'hi' ? 'कक्षा 9' : 'Class 9' },
            { id: 'c_10', name: language === 'hi' ? 'कक्षा 10 (मैट्रिक)' : 'Class 10 (Matric)' },
            { id: 'c_11_science', name: language === 'hi' ? 'कक्षा 11 साइंस' : 'Class 11 Science' },
            { id: 'c_12_science', name: language === 'hi' ? 'कक्षा 12 इंटर साइंस' : 'Class 12 Inter Science' }
          ]);
        }
      })
      .catch(() => {
        setClasses([
          { id: 'c_9', name: language === 'hi' ? 'कक्षा 9' : 'Class 9' },
          { id: 'c_10', name: language === 'hi' ? 'कक्षा 10 (मैट्रिक)' : 'Class 10 (Matric)' },
          { id: 'c_11_science', name: language === 'hi' ? 'कक्षा 11 साइंस' : 'Class 11 Science' },
          { id: 'c_12_science', name: language === 'hi' ? 'कक्षा 12 इंटर साइंस' : 'Class 12 Inter Science' }
        ]);
      });
  }, [language]);

  useEffect(() => {
    fetchVideos();
  }, [selectedClass, searchQuery]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      let url = `/api/videos?classId=${selectedClass}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading videos:', err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', padding: '40px 0', background: 'var(--bg)' }}>
      <div className="container">
        {/* Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #7c3aed 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '48px 36px',
          color: 'white',
          marginBottom: '40px',
          boxShadow: 'var(--shadow-premium)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '700px' }}>
            <span style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              padding: '6px 14px',
              borderRadius: '100px',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'inline-block',
              marginBottom: '16px'
            }}>
              {t('vidBadge')}
            </span>
            <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px', color: 'white' }}>
              {t('vidTitle')}
            </h1>
            <p style={{ fontSize: '16px', opacity: 0.9, lineHeight: 1.6, marginBottom: '24px' }}>
              {t('vidDesc')}
            </p>

            {/* Quick Stats in Hero */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>150+</div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>Video Lectures</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>100%</div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>BSEB Aligned</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800 }}>Free</div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>Chapter Notes Included</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {/* Class Select Tabs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%' }}>
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClass(c.id)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '100px',
                  border: selectedClass === c.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: selectedClass === c.id ? 'var(--primary)' : 'var(--bg-card)',
                  color: selectedClass === c.id ? 'white' : 'var(--text-dark)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: selectedClass === c.id ? 'var(--shadow)' : 'none',
                  transition: 'var(--transition)'
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              placeholder={t('vidSearchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 38px',
                borderRadius: '100px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-dark)',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}>
              🔍
            </span>
          </div>
        </div>

        {/* Video Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
            <div className="animate-pulse-glow" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', margin: '0 auto 16px auto' }}></div>
            <p>{language === 'hi' ? 'वीडियो कक्षाएं लोड हो रही हैं...' : 'Loading video classes...'}</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center', margin: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
            <h3 style={{ marginBottom: '8px' }}>{t('vidNoVideos')}</h3>
            <p style={{ color: 'var(--gray)' }}>{t('vidTryOther')}</p>
          </div>
        ) : (
          <div className="grid-3">
            {videos.map(video => (
              <div key={video.id} className="video-card glass-card">
                {/* Thumbnail */}
                <div className="video-thumb-wrap" onClick={() => setActiveVideo(video)} style={{ cursor: 'pointer' }}>
                  <img src={video.thumbnail} alt={video.title} />
                  <div className="play-badge">▶</div>
                  <span style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    ⏱ {video.duration}
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="section-tag" style={{ margin: 0, fontSize: '11px', padding: '3px 10px' }}>
                      {video.subject_name}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                      👁 {video.views}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', lineHeight: 1.4, color: 'var(--text-dark)' }}>
                    {video.title}
                  </h3>

                  <p style={{ fontSize: '13px', color: 'var(--gray)', marginBottom: '16px', flex: 1, lineHeight: 1.5 }}>
                    {video.description}
                  </p>

                  <div style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px'
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                      👨‍🏫 {video.teacher}
                    </span>
                    <button
                      onClick={() => setActiveVideo(video)}
                      style={{
                        padding: '6px 14px',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {t('vidWatchBtn')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Player Modal */}
        {activeVideo && (
          <div className="ai-modal-overlay" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setActiveVideo(null)}>
            <div
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '900px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '24px',
                background: 'var(--bg-card)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span className="section-tag" style={{ marginBottom: '8px' }}>{activeVideo.subject_name}</span>
                  <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{activeVideo.title}</h2>
                  <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '4px' }}>
                    {t('vidTeacherLabel')} {activeVideo.teacher} • {t('vidDurationLabel')} {activeVideo.duration}
                  </div>
                </div>
                <button
                  onClick={() => setActiveVideo(null)}
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: 'var(--text-dark)'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Video Embed */}
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 'var(--radius)', background: '#000', marginBottom: '20px' }}>
                <iframe
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Action Buttons & Attached Notes */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text)', maxWidth: '600px' }}>
                  {activeVideo.description}
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {activeVideo.notes_pdf_url || (activeVideo.notes_url && activeVideo.notes_url.startsWith('http')) ? (
                    <a
                      href={activeVideo.notes_pdf_url || activeVideo.notes_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ fontSize: '13px', padding: '8px 16px' }}
                    >
                      📥 {t('vidViewNotesBtn')} (PDF)
                    </a>
                  ) : (
                    <a
                      href="#study-material"
                      className="btn btn-secondary"
                      style={{ fontSize: '13px', padding: '8px 16px' }}
                    >
                      {t('vidViewNotesBtn')}
                    </a>
                  )}
                  <a
                    href="#test-series"
                    className="btn btn-primary"
                    style={{ fontSize: '13px', padding: '8px 16px' }}
                  >
                    {t('vidStartTestBtn')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
