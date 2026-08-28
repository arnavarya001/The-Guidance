import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Results({ attemptId = null }) {
  const { token } = useAuth();
  
  // Data States
  const [history, setHistory] = useState([]);
  const [attemptDetails, setAttemptDetails] = useState(null);
  
  // Loading
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Correct' | 'Incorrect' | 'Unattempted'

  // Fetch data depending on route
  useEffect(() => {
    if (!token) {
      window.location.hash = '#login';
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        if (attemptId) {
          const res = await fetch(`/api/results/details/${attemptId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setAttemptDetails(data);
          } else {
            alert("Could not load test attempt details.");
            window.location.hash = '#results';
          }
        } else {
          const res = await fetch('/api/results/history', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setHistory(data.sort((a,b) => new Date(b.attempted_at) - new Date(a.attempted_at)));
          }
        }
      } catch (e) {
        console.error("Results fetch error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [attemptId, token]);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  // LIST VIEW: List all attempts
  if (!attemptId) {
    return (
      <div className="container section" style={{ padding: '40px 24px', textAlign: 'left' }}>
        <div style={{ marginBottom: '32px' }}>
          <span className="section-tag">📊 Score History</span>
          <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Your Test Results</h2>
          <p style={{ color: 'var(--gray)' }}>Review scores, accuracy metrics, and detailed question-by-question solution breakdowns.</p>
        </div>

        {history.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-light)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
            <h3>No Exam History Yet</h3>
            <p style={{ fontSize: '14px', color: 'var(--gray)', marginTop: '4px', marginBottom: '16px' }}>
              You have not attempted any tests. Start your test series to view detailed report cards.
            </p>
            <button onClick={() => window.location.hash = '#test-series'} className="btn btn-primary">
              ✍️ View Test Series
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>Test Title</th>
                    <th style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>Category</th>
                    <th style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>Attempt Date</th>
                    <th style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>Score</th>
                    <th style={{ padding: '16px', fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>Accuracy</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(att => (
                    <tr key={att.id} style={{ borderBottom: '1px solid var(--border)', transition: 'var(--transition)' }} className="table-row-hover">
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-dark)' }}>{att.test_title}</td>
                      <td style={{ padding: '16px' }}><span className="badge badge-primary">{att.category}</span></td>
                      <td style={{ padding: '16px', fontSize: '14px', color: 'var(--gray)' }}>
                        {new Date(att.attempted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 700, color: att.percentage >= 60 ? 'var(--success)' : 'var(--warning)' }}>
                          {att.obtained_marks}/{att.total_marks} ({att.percentage}%)
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge ${att.accuracy >= 70 ? 'badge-success' : 'badge-warning'}`}>
                          {att.accuracy}%
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button 
                          onClick={() => window.location.hash = `#results/${att.id}`} 
                          className="btn btn-outline btn-sm"
                        >
                          Review Solutions →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DETAILS VIEW: Single attempt scorecard & answers reviewer
  const rStats = attemptDetails;
  
  // Filter solutions list
  const filteredResponses = rStats.responses.filter(res => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Correct') return res.status === 'correct';
    if (activeTab === 'Incorrect') return res.status === 'incorrect';
    if (activeTab === 'Unattempted') return res.status === 'unattempted';
    return true;
  });

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  return (
    <div className="container section" style={{ padding: '40px 24px', textAlign: 'left' }}>
      {/* Detail Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div>
          <button onClick={() => window.location.hash = '#results'} className="btn btn-outline btn-sm" style={{ marginBottom: '12px' }}>
            ◀ Back to History
          </button>
          <span className="badge badge-primary" style={{ marginLeft: '12px', marginBottom: '12px' }}>{rStats.category}</span>
          <h2 style={{ fontSize: '28px' }}>Result: {rStats.test_title}</h2>
          <p style={{ color: 'var(--gray)', fontSize: '14px', marginTop: '2px' }}>
            Attempted on {new Date(rStats.attempted_at).toLocaleString('en-IN')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.location.hash = '#dashboard'} className="btn btn-outline">
            Dashboard
          </button>
          <button onClick={() => window.location.hash = `#test-series`} className="btn btn-primary">
            Retake Test
          </button>
        </div>
      </div>

      {/* Scorecard Metric Grid */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        {/* Percentage Card */}
        <div className="card" style={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          color: 'white',
          border: 'none'
        }}>
          <h4 style={{ color: 'white', fontSize: '14px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Obtained Percentage</h4>
          <div style={{ fontSize: '40px', fontWeight: 800, margin: '8px 0' }}>{rStats.percentage}%</div>
          <p style={{ fontSize: '13px', opacity: 0.9 }}>
            Marks: <strong>{rStats.obtained_marks}</strong> / {rStats.total_marks}
          </p>
        </div>

        {/* Accuracy Card */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h4 style={{ fontSize: '13px', color: 'var(--gray)', textTransform: 'uppercase' }}>Test Accuracy</h4>
          <div style={{ fontSize: '40px', fontWeight: 800, margin: '8px 0', color: rStats.accuracy >= 75 ? 'var(--success)' : 'var(--warning)' }}>
            {rStats.accuracy}%
          </div>
          <p style={{ fontSize: '13px', color: 'var(--gray)' }}>
            Based on active submissions
          </p>
        </div>

        {/* Time Spent Card */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h4 style={{ fontSize: '13px', color: 'var(--gray)', textTransform: 'uppercase' }}>Time Taken</h4>
          <div style={{ fontSize: '40px', fontWeight: 800, margin: '8px 0', color: 'var(--text-dark)' }}>
            {formatTime(rStats.time_spent)}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--gray)' }}>
            Total exam allocation used
          </p>
        </div>

        {/* Answers Counts Card */}
        <div className="card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>✅ Correct Answers:</span>
            <strong style={{ color: 'var(--success)' }}>{rStats.correct_count}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>❌ Incorrect Answers:</span>
            <strong style={{ color: 'var(--danger)' }}>{rStats.incorrect_count}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>⚪ Unattempted:</span>
            <strong>{rStats.unattempted_count}</strong>
          </div>
        </div>
      </div>

      {/* Answer solutions details reviewer */}
      <div className="card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <h3 style={{ fontSize: '20px' }}>Question Solutions Review</h3>
          
          {/* Answer Type Filters */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'All', label: `All (${rStats.responses.length})` },
              { id: 'Correct', label: `Correct (${rStats.correct_count})` },
              { id: 'Incorrect', label: `Incorrect (${rStats.incorrect_count})` },
              { id: 'Unattempted', label: `Unattempted (${rStats.unattempted_count})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Solutions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredResponses.map((res, idx) => {
            const isCorrect = res.status === 'correct';
            const isIncorrect = res.status === 'incorrect';
            const isUnattempted = res.status === 'unattempted';

            return (
              <div key={idx} style={{
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.02)' : isIncorrect ? 'rgba(239, 68, 68, 0.02)' : 'var(--bg)'
              }}>
                {/* Question Info Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Question {idx + 1}</span>
                  <span className={`badge ${isCorrect ? 'badge-success' : isIncorrect ? 'badge-danger' : 'badge-warning'}`} style={{ padding: '4px 8px', fontSize: '11px' }}>
                    {res.status}
                  </span>
                </div>

                {/* Question Text */}
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '16px', lineHeight: 1.5 }}>
                  {res.questionText}
                </h4>

                {/* Options List */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '16px' }}>
                  {res.options.map((opt, oIdx) => {
                    const isCorrectOption = oIdx === res.correctAnswer;
                    const isSelectedOption = oIdx === res.selectedAnswer;

                    let optionStyle = {
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      fontSize: '14px',
                      fontWeight: 500,
                      backgroundColor: 'white'
                    };

                    if (isCorrectOption) {
                      optionStyle.backgroundColor = 'var(--success-light)';
                      optionStyle.borderColor = 'var(--success)';
                      optionStyle.color = '#047857';
                      optionStyle.fontWeight = 700;
                    } else if (isSelectedOption && isIncorrect) {
                      optionStyle.backgroundColor = 'var(--danger-light)';
                      optionStyle.borderColor = 'var(--danger)';
                      optionStyle.color = '#b91c1c';
                      optionStyle.fontWeight = 700;
                    }

                    return (
                      <div key={oIdx} style={optionStyle}>
                        <span style={{ marginRight: '10px' }}>
                          {isCorrectOption ? '✓' : isSelectedOption && isIncorrect ? '✗' : '•'}
                        </span>
                        {opt}
                      </div>
                    );
                  })}
                </div>

                {/* Solution Explanation */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  borderLeft: '4px solid var(--primary)',
                  padding: '16px',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '14px',
                  lineHeight: 1.6
                }}>
                  <strong style={{ color: 'var(--primary)' }}>Explanation:</strong>
                  <p style={{ marginTop: '4px', color: 'var(--text)' }}>{res.explanation || 'No explanation provided for this question.'}</p>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
