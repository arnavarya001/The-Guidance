import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function DailyChallenge() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' | 'leaderboard'
  const [challengeData, setChallengeData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetchChallenge();
    fetchLeaderboard();
  }, []);

  const fetchChallenge = async () => {
    try {
      const res = await fetch('/api/daily-challenge');
      const data = await res.json();
      setChallengeData(data);
    } catch (err) {
      console.warn('Error fetching daily challenge:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setLeaderboardData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error fetching leaderboard:', err);
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length === 0) {
      alert(language === 'hi' ? 'कृपया कम से कम एक प्रश्न का उत्तर दें।' : 'Please answer at least one question.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/daily-challenge/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: selectedAnswers })
      });
      const data = await res.json();
      setResults(data);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting challenge:', err);
      alert(language === 'hi' ? 'सबमिट करने में त्रुटि हुई।' : 'Error submitting challenge.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', padding: '40px 0', background: 'var(--bg)' }}>
      <div className="container">
        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #dc2626 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 32px',
          color: 'white',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-premium)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span className="streak-flame" style={{ background: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}>
                <span className="icon">🔥</span> {t('dcBadge')}
              </span>
              <span style={{ fontSize: '13px', background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '100px' }}>
                +50 XP Bonus
              </span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
              {t('dcTitle')}
            </h1>
            <p style={{ fontSize: '15px', opacity: 0.9, maxWidth: '600px', lineHeight: 1.5 }}>
              {t('dcDesc')}
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 24px',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.25)'
          }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
              {t('dcStreakCardTitle')}
            </div>
            <div style={{ fontSize: '36px', fontWeight: 800, margin: '4px 0' }}>
              🔥 7 Days
            </div>
            <div style={{ fontSize: '12px', color: '#fef08a' }}>
              {t('dcStreakSavedNotice')}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`btn ${activeTab === 'quiz' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '100px', fontSize: '15px' }}
          >
            {t('dcTabQuiz')}
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`btn ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '100px', fontSize: '15px' }}
          >
            {t('dcTabLeaderboard')}
          </button>
        </div>

        {/* TAB 1: DAILY QUIZ */}
        {activeTab === 'quiz' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
                <p>{language === 'hi' ? 'क्विज लोड हो रहा है...' : 'Loading quiz...'}</p>
              </div>
            ) : !challengeData ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <p>{language === 'hi' ? 'आज का चैलेंज उपलब्ध नहीं है।' : 'Today’s challenge is unavailable.'}</p>
              </div>
            ) : (
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Result Card if Submitted */}
                {isSubmitted && results && (
                  <div className="glass-card glow-box" style={{
                    padding: '32px',
                    marginBottom: '32px',
                    textAlign: 'center',
                    background: results.score >= 3 ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), var(--bg-card))' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), var(--bg-card))',
                    borderColor: results.score >= 3 ? 'var(--success)' : 'var(--danger)'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                      {results.score === 5 ? '🎉 🏆' : results.score >= 3 ? '👏 ⭐' : '💪 📚'}
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
                      {results.score === 5 ? (language === 'hi' ? 'उत्कृष्ट प्रदर्शन! पूर्ण अंक!' : 'Outstanding! Perfect Score!') : results.score >= 3 ? (language === 'hi' ? 'बहुत अच्छा प्रयास!' : 'Great Attempt!') : (language === 'hi' ? 'अच्छा प्रयास, पुनः अभ्यास करें!' : 'Good Effort! Keep practicing!')}
                    </h2>
                    <p style={{ fontSize: '16px', color: 'var(--gray)', marginBottom: '20px' }}>
                      {language === 'hi' ? `आपने ${results.total} में से ${results.score} सही उत्तर दिए (${results.percentage}%)` : `You answered ${results.score} of ${results.total} correctly (${results.percentage}%)`}
                    </p>

                    <div style={{ display: 'inline-flex', gap: '20px', background: 'var(--bg)', padding: '12px 24px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{language === 'hi' ? 'अर्जित अंक (XP)' : 'XP Earned'}</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>+{results.xp_earned} XP</div>
                      </div>
                      <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '20px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{language === 'hi' ? 'स्ट्रीक स्थिति' : 'Streak Status'}</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>🔥 Saved (+1 Day)</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Question List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {(isSubmitted && results ? results.results : challengeData.questions).map((q, qIndex) => {
                    const studentAns = selectedAnswers[q.id];
                    return (
                      <div key={q.id} className="glass-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span className="section-tag" style={{ margin: 0, fontSize: '11px' }}>
                            {q.subject}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-light)' }}>
                            {language === 'hi' ? `प्रश्न ${qIndex + 1} of ${challengeData.questions.length}` : `Question ${qIndex + 1} of ${challengeData.questions.length}`}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1.5, marginBottom: '20px', color: 'var(--text-dark)' }}>
                          {q.question}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {q.options.map((opt, optIndex) => {
                            let optionStyle = {
                              padding: '14px 18px',
                              borderRadius: 'var(--radius)',
                              border: '1px solid var(--border)',
                              background: 'var(--bg)',
                              cursor: isSubmitted ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '14px',
                              transition: 'var(--transition)'
                            };

                            if (!isSubmitted) {
                              if (studentAns === optIndex) {
                                optionStyle.border = '2px solid var(--primary)';
                                optionStyle.background = 'var(--primary-light)';
                                optionStyle.fontWeight = 600;
                              }
                            } else {
                              if (optIndex === q.correct_answer) {
                                optionStyle.border = '2px solid var(--success)';
                                optionStyle.background = 'var(--success-light)';
                                optionStyle.fontWeight = 700;
                              } else if (studentAns === optIndex && !q.is_correct) {
                                optionStyle.border = '2px solid var(--danger)';
                                optionStyle.background = 'var(--danger-light)';
                              }
                            }

                            return (
                              <div
                                key={optIndex}
                                style={optionStyle}
                                onClick={() => handleSelectOption(q.id, optIndex)}
                              >
                                <span style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: studentAns === optIndex ? 'var(--primary)' : 'var(--border)',
                                  color: studentAns === optIndex ? 'white' : 'var(--text-dark)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 700
                                }}>
                                  {String.fromCharCode(65 + optIndex)}
                                </span>
                                <span style={{ flex: 1, color: 'var(--text-dark)' }}>{opt}</span>
                                {isSubmitted && optIndex === q.correct_answer && (
                                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>{t('dcCorrectBadge')}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation Box on Result */}
                        {isSubmitted && q.explanation && (
                          <div style={{
                            marginTop: '16px',
                            padding: '14px 18px',
                            background: 'var(--primary-light)',
                            borderLeft: '4px solid var(--primary)',
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: 'var(--text-dark)'
                          }}>
                            <strong>{t('dcExplainLabel')}</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit Action */}
                {!isSubmitted && (
                  <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="btn btn-primary animate-pulse-glow"
                      style={{ padding: '14px 36px', fontSize: '16px', borderRadius: '100px' }}
                    >
                      {submitting ? t('dcSubmitting') : t('dcSubmitBtn')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BIHAR STATE LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div>
            {leaderboardData && (
              <>
                {/* Podium for Top 3 */}
                <div className="podium-wrap">
                  {/* Rank 2 */}
                  {leaderboardData.leaderboard[1] && (
                    <div className="podium-card podium-2 glass-card">
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>🥈</div>
                      <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-dark)' }}>
                        {leaderboardData.leaderboard[1].name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '8px' }}>
                        📍 {leaderboardData.leaderboard[1].district} • {leaderboardData.leaderboard[1].class}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>
                        {leaderboardData.leaderboard[1].xp} XP
                      </div>
                      <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                        🔥 {leaderboardData.leaderboard[1].streak} Days Streak
                      </div>
                    </div>
                  )}

                  {/* Rank 1 */}
                  {leaderboardData.leaderboard[0] && (
                    <div className="podium-card podium-1 glass-card glow-box">
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>👑 🏆</div>
                      <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-dark)' }}>
                        {leaderboardData.leaderboard[0].name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '8px' }}>
                        📍 {leaderboardData.leaderboard[0].district} • {leaderboardData.leaderboard[0].class}
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b' }}>
                        {leaderboardData.leaderboard[0].xp} XP
                      </div>
                      <div style={{ fontSize: '12px', color: '#ea580c', fontWeight: 700, marginTop: '4px' }}>
                        🔥 {leaderboardData.leaderboard[0].streak} Days Streak
                      </div>
                    </div>
                  )}

                  {/* Rank 3 */}
                  {leaderboardData.leaderboard[2] && (
                    <div className="podium-card podium-3 glass-card">
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>🥉</div>
                      <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-dark)' }}>
                        {leaderboardData.leaderboard[2].name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gray)', marginBottom: '8px' }}>
                        📍 {leaderboardData.leaderboard[2].district} • {leaderboardData.leaderboard[2].class}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>
                        {leaderboardData.leaderboard[2].xp} XP
                      </div>
                      <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                        🔥 {leaderboardData.leaderboard[2].streak} Days Streak
                      </div>
                    </div>
                  )}
                </div>

                {/* Table for All Ranks */}
                <div className="glass-card" style={{ padding: '24px', overflowX: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{t('dcLeaderboardTitle')}</h3>
                    <span style={{ fontSize: '13px', color: 'var(--gray)' }}>
                      {t('dcTotalActive')} {leaderboardData.total_active_students}
                    </span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--gray)' }}>
                        <th style={{ padding: '12px 8px' }}>{t('dcColRank')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('dcColName')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('dcColDistrict')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('dcColClass')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('dcColStreak')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('dcColXp')}</th>
                        <th style={{ padding: '12px 16px' }}>{t('dcColAccuracy')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.leaderboard.map((s, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'var(--transition)' }}>
                          <td style={{ padding: '14px 8px', fontWeight: 800 }}>
                            {s.rank === 1 ? '🥇 1' : s.rank === 2 ? '🥈 2' : s.rank === 3 ? '🥉 3' : `#${s.rank}`}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-dark)' }}>
                            {s.name} <span style={{ fontSize: '11px', color: 'var(--primary)', marginLeft: '6px' }}>{s.badge}</span>
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--text)' }}>{s.district}</td>
                          <td style={{ padding: '14px 16px', color: 'var(--text)' }}>{s.class}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span className="streak-flame" style={{ padding: '2px 8px', fontSize: '12px' }}>
                              🔥 {s.streak}d
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--primary)' }}>{s.xp}</td>
                          <td style={{ padding: '14px 16px', color: 'var(--success)', fontWeight: 600 }}>{s.accuracy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
