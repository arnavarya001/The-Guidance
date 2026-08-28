import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function TestEngine({ testId }) {
  const { token } = useAuth();
  
  // Data
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  // State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { q_1: 2 }
  const [markedForReview, setMarkedForReview] = useState({}); // { q_1: true }
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [timeSpent, setTimeSpent] = useState(0); // in seconds
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    if (!token) {
      window.location.hash = '#login';
      return;
    }

    const fetchTestDetails = async () => {
      try {
        const res = await fetch(`/api/tests/${testId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTest(data.test);
          setQuestions(data.questions);
          setTimeLeft(data.test.time_limit * 60);
        } else {
          alert("Error loading test paper.");
          window.location.hash = '#test-series';
        }
      } catch (e) {
        console.error("Test engine load error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchTestDetails();
  }, [testId, token]);

  // Timer Countdown Effect
  useEffect(() => {
    if (loading || !test || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time runs out
          autoSubmitTest();
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, test, timeLeft]);

  const autoSubmitTest = () => {
    alert("Time has run out! Submitting your answers automatically...");
    submitTestAnswers();
  };

  const handleOptionChange = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const clearAnswer = (questionId) => {
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const toggleMarkForReview = (questionId) => {
    setMarkedForReview(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const submitTestAnswers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          answers,
          timeSpent
        })
      });
      const data = await res.json();
      if (res.ok) {
        window.location.hash = `#results/${data.attemptId}`;
      } else {
        alert(data.message || "Failed to submit test.");
        setLoading(false);
      }
    } catch (e) {
      console.error("Submission failed", e);
      alert("Network error: Could not submit test.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
        <p style={{ marginTop: '16px', fontWeight: 600 }}>Loading examination sheet...</p>
      </div>
    );
  }

  if (!test) return null;

  const currentQ = questions[currentIdx];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Count progress stats
  const answeredCount = Object.keys(answers).length;
  const reviewCount = Object.keys(markedForReview).filter(k => markedForReview[k]).length;
  const unattemptedCount = questions.length - answeredCount;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '3fr 1fr',
      height: 'calc(100vh - 72px)',
      backgroundColor: '#f1f5f9'
    }}>
      {/* Left Column: Exam Question Area */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '30px',
        overflowY: 'auto'
      }}>
        {/* Header toolbar */}
        <div className="card glass" style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderRadius: '12px'
        }}>
          <div>
            <span className="badge badge-secondary" style={{ marginBottom: '4px' }}>BSEB Live Exam</span>
            <h3 style={{ fontSize: '18px' }}>{test.title}</h3>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: timeLeft < 60 ? '#fef2f2' : '#f0fdf4',
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${timeLeft < 60 ? 'var(--danger)' : 'var(--success)'}`,
            fontWeight: 800,
            fontSize: '18px',
            color: timeLeft < 60 ? 'var(--danger)' : 'var(--success)'
          }}>
            ⏱️ {timeString}
          </div>
        </div>

        {/* Question Panel */}
        {currentQ && (
          <div className="card" style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left', borderRadius: '16px' }}>
            <div>
              {/* Question Number and marks */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                <h4 style={{ fontSize: '18px', color: 'var(--primary)' }}>Question {currentIdx + 1} of {questions.length}</h4>
                <div style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: 700 }}>
                  Marks: +{currentQ.marks || 1} | Neg: -{currentQ.negative_marks || 0}
                </div>
              </div>

              {/* Question Text */}
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '30px', lineHeight: 1.5 }}>
                {currentQ.question_text}
              </h3>

              {/* Multiple Choice Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {currentQ.options.map((opt, idx) => {
                  const isChecked = answers[currentQ.id] === idx;
                  return (
                    <label 
                      key={idx} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px 20px',
                        borderRadius: '10px',
                        border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border)'}`,
                        backgroundColor: isChecked ? 'var(--primary-light)' : 'white',
                        cursor: 'pointer',
                        fontWeight: isChecked ? 700 : 500,
                        transition: 'var(--transition)'
                      }}
                    >
                      <input 
                        type="radio" 
                        name={`q_${currentQ.id}`}
                        checked={isChecked}
                        onChange={() => handleOptionChange(currentQ.id, idx)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions toolbar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border)',
              paddingTop: '24px',
              marginTop: '30px'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => clearAnswer(currentQ.id)} 
                  className="btn btn-outline btn-sm"
                  disabled={answers[currentQ.id] === undefined}
                >
                  🧹 Clear Answer
                </button>
                <button 
                  onClick={() => toggleMarkForReview(currentQ.id)} 
                  className="btn btn-secondary btn-sm"
                  style={{
                    backgroundColor: markedForReview[currentQ.id] ? 'var(--secondary)' : 'transparent',
                    color: markedForReview[currentQ.id] ? 'white' : 'var(--secondary)',
                    borderColor: 'var(--secondary)'
                  }}
                >
                  ⭐ {markedForReview[currentQ.id] ? 'Unmark Review' : 'Mark for Review'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))} 
                  disabled={currentIdx === 0}
                  className="btn btn-outline"
                >
                  ◀ Previous
                </button>
                {currentIdx < questions.length - 1 ? (
                  <button 
                    onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))} 
                    className="btn btn-primary"
                  >
                    Next ▶
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowSubmitModal(true)} 
                    className="btn btn-success"
                  >
                    🏁 Submit Test
                  </button>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Right Column: Question Panel Navigator */}
      <div style={{
        backgroundColor: 'white',
        borderLeft: '1px solid var(--border)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        textAlign: 'left'
      }}>
        <div>
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Navigator Drawer</h3>
          
          {/* Question Grid panel */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '24px'
          }}>
            {questions.map((q, idx) => {
              const isSelected = currentIdx === idx;
              const isAnswered = answers[q.id] !== undefined;
              const isMarked = markedForReview[q.id] === true;

              let bgColor = '#e2e8f0'; // default unattempted
              let color = 'var(--text-dark)';
              let border = '1px solid transparent';

              if (isAnswered) {
                bgColor = 'var(--success-light)';
                color = 'var(--success)';
                border = '1px solid var(--success)';
              }
              if (isMarked) {
                bgColor = '#f3e8ff';
                color = 'var(--secondary)';
                border = '1px solid var(--secondary)';
              }
              if (isSelected) {
                border = '2px solid var(--primary)';
                color = 'var(--primary)';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    fontSize: '14px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    backgroundColor: bgColor,
                    color: color,
                    border: border,
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Color Indicators Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: 'var(--success-light)', border: '1px solid var(--success)' }}></div>
              <span>Answered ({answeredCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#f3e8ff', border: '1px solid var(--secondary)' }}></div>
              <span>Marked for Review ({reviewCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#e2e8f0' }}></div>
              <span>Unattempted ({unattemptedCount})</span>
            </div>
          </div>
        </div>

        {/* Big Submit Button */}
        <button 
          onClick={() => setShowSubmitModal(true)} 
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          Submit Exam Paper
        </button>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{
            maxWidth: '450px',
            width: '100%',
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: '22px', marginBottom: '12px' }}>Submit Examination?</h3>
            <p style={{ color: 'var(--gray)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to finish the test? You have answered <strong>{answeredCount}</strong> out of <strong>{questions.length}</strong> questions.
            </p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowSubmitModal(false)} 
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Back to Test
              </button>
              <button 
                onClick={submitTestAnswers} 
                className="btn btn-success"
                style={{ flex: 1 }}
              >
                Yes, Submit 🏁
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
