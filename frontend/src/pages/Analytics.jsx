import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Analytics() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      window.location.hash = '#login';
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (e) {
        console.error("Failed to load analytics", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (!data || data.empty) {
    return (
      <div className="container section" style={{ padding: '40px 24px', textAlign: 'left' }}>
        <div style={{ marginBottom: '32px' }}>
          <span className="section-tag">📊 Diagnostic Report</span>
          <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Performance Analytics</h2>
          <p style={{ color: 'var(--gray)' }}>Get detailed insights into your strengths and weaknesses.</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-light)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
          <h3>No Analytics Data Found</h3>
          <p style={{ fontSize: '14px', color: 'var(--gray)', marginTop: '4px', marginBottom: '16px' }}>
            Attempt some tests in the Test Series section first to compile performance analytics!
          </p>
          <button onClick={() => window.location.hash = '#test-series'} className="btn btn-primary">
            ✍️ Attempt Test Series
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section" style={{ padding: '40px 24px', textAlign: 'left' }}>
      <div style={{ marginBottom: '32px' }}>
        <span className="section-tag">📊 Diagnostic Report</span>
        <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Performance Analytics</h2>
        <p style={{ color: 'var(--gray)' }}>Detailed chapter-wise metrics, accuracy tracking, and historical board test trends.</p>
      </div>

      {/* Grid: Global Stats Cards */}
      <div className="grid-3" style={{ marginBottom: '32px' }}>
        {/* Score */}
        <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--primary)' }}>
          <h4 style={{ fontSize: '14px', color: 'var(--gray)', textTransform: 'uppercase' }}>Overall Score Rate</h4>
          <div style={{ fontSize: '44px', fontWeight: 800, margin: '8px 0', color: 'var(--primary)' }}>
            {data.overall_percentage}%
          </div>
          <p style={{ fontSize: '13px', color: 'var(--gray)' }}>Average score across all exams</p>
        </div>

        {/* Accuracy */}
        <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--success)' }}>
          <h4 style={{ fontSize: '14px', color: 'var(--gray)', textTransform: 'uppercase' }}>Precision Accuracy</h4>
          <div style={{ fontSize: '44px', fontWeight: 800, margin: '8px 0', color: 'var(--success)' }}>
            {data.accuracy}%
          </div>
          <p style={{ fontSize: '13px', color: 'var(--gray)' }}>Correct ratio of answered questions</p>
        </div>

        {/* Count */}
        <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--secondary)' }}>
          <h4 style={{ fontSize: '14px', color: 'var(--gray)', textTransform: 'uppercase' }}>Total Exams Attempted</h4>
          <div style={{ fontSize: '44px', fontWeight: 800, margin: '8px 0', color: 'var(--secondary)' }}>
            {data.total_tests}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--gray)' }}>Completed test sheets</p>
        </div>
      </div>

      {/* Grid: Subject Performance & Chronological Progress */}
      <div className="grid-2" style={{ marginBottom: '32px', alignItems: 'stretch' }}>
        {/* Subject wise coverage */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '20px' }}>📚 Subject Performance Index</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.keys(data.subject_performance).map(subject => {
              const score = data.subject_performance[subject].percentage;
              const attempts = data.subject_performance[subject].attempts;
              return (
                <div key={subject}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
                    <span>{subject} <span style={{ fontWeight: 500, fontSize: '12px', color: 'var(--gray)' }}>({attempts} {attempts === 1 ? 'test' : 'tests'})</span></span>
                    <span style={{ color: 'var(--primary)' }}>{score}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${score}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="card">
          <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>📈 Progress Over Time</h3>
          
          {/* Simulated tower bar chart using CSS flexbox */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            height: '180px',
            padding: '10px 20px',
            backgroundColor: 'var(--bg)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            marginBottom: '20px'
          }}>
            {data.progress_over_time.map((pt, idx) => (
              <div 
                key={idx} 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: `${100 / data.progress_over_time.length - 5}%`
                }}
              >
                {/* Score hover tag */}
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>
                  {pt.score}%
                </span>
                {/* Chart Bar */}
                <div style={{
                  height: `${pt.score * 1.2}px`, // Scaled for 120px max height
                  width: '100%',
                  background: 'linear-gradient(to top, var(--primary), var(--secondary))',
                  borderRadius: '6px 6px 0 0',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)',
                  transition: 'height 0.3s ease'
                }} />
                {/* Date Label */}
                <span style={{ fontSize: '10px', color: 'var(--gray)', marginTop: '8px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', textAlign: 'center' }}>
                  {pt.date}
                </span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '13px', color: 'var(--gray)', textAlign: 'center' }}>
            Timeline displays chronological exam percentages from left to right.
          </p>
        </div>
      </div>

      {/* Grid: Strengths and Weaknesses */}
      <div className="grid-2">
        {/* Strong topics */}
        <div className="card" style={{ borderTop: '4px solid var(--success)' }}>
          <h3 style={{ fontSize: '20px', color: '#047857', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💪 Strong Topics (≥70% Score)
          </h3>
          {data.strong_topics.length === 0 ? (
            <p style={{ color: 'var(--gray)', fontSize: '14px' }}>Attempt more chapter tests to analyze subject strengths.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.strong_topics.map((t, idx) => (
                <div key={idx} style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--success-light)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#065f46' }}>{t.name}</span>
                  <span className="badge badge-success" style={{ padding: '4px 10px' }}>{t.score}% Accuracy</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weak topics */}
        <div className="card" style={{ borderTop: '4px solid var(--danger)' }}>
          <h3 style={{ fontSize: '20px', color: '#b91c1c', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Weak Topics (&lt;50% Score)
          </h3>
          {data.weak_topics.length === 0 ? (
            <p style={{ color: 'var(--gray)', fontSize: '14px' }}>Keep up the great work! No weak topics detected yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.weak_topics.map((t, idx) => (
                <div key={idx} style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--danger-light)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#991b1b' }}>{t.name}</span>
                  <span className="badge badge-danger" style={{ padding: '4px 10px' }}>{t.score}% Score</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
