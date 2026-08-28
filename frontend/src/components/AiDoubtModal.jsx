import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const QUICK_SUGGESTIONS = [
  "Newton ke 3 laws of motion simple Hinglish me samjhao",
  "द्विघात समीकरण हल करने की श्रीधराचार्य विधि",
  "Write a Python function to check palindrome string",
  "प्रकाश का परावर्तन एवं अपवर्तन के नियम",
  "Leave application letter to Principal in Hindi",
  "Bihar Board Matric me 90%+ score karne ki strategy"
];

export default function AiDoubtModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `### 🤖 Namaste${user?.name ? ' ' + user.name : ''}! Main hoon **The Guidance AI Guru**

Main aapka 24/7 AI tutor aur study assistant hoon. Aap mujhse **Hindi, English ya Hinglish** me koi bhi sawal pooch sakte hain:

- 📐 **Maths & Science:** Formulas, derivations, step-by-step problem solving
- 💻 **Coding & Tech:** Python, C++, JavaScript, web development
- 📚 **Bihar Board Prep:** BSEB Class 5–12 syllabus, PYQs, exam strategies
- ✍️ **Writing & Grammar:** Essays, letters, translations, English & Sanskrit vyakaran
- 💡 **General Knowledge & Advice:** Study routines, career guidance

Niche diye gaye suggestions me se click karein ya apna sawal type karein!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (queryText) => {
    const query = (queryText || inputQuery).trim();
    if (!query || loading) return;

    const userMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputQuery('');
    setLoading(true);

    try {
      const historyPayload = updatedMessages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await fetch('http://localhost:5050/api/ai/doubt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          history: historyPayload,
          classId: user?.class ? user.class.replace('c_', '') : '10',
          subject: 'general',
          language: selectedLanguage
        })
      });

      const data = await response.json();
      const aiMsg = {
        sender: 'ai',
        text: data.answer || 'माफ़ कीजिये, अभी उत्तर प्राप्त करने में समस्या आ रही है। कृपया पुनः प्रयास करें।',
        suggested_topics: data.suggested_topics || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'नेटवर्क समस्या के कारण उत्तर नहीं मिल पाया। कृपया जांचें कि बैकएंड सर्वर चालू है।',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'ai',
        text: `### 🧹 Chat reset! Aapka naya session shuru ho gaya hai.
Bataiye aaj kis subject ya topic par kaam karein?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to render markdown formatting (code blocks, math, headers, bold, bullets)
  const formatText = (content, msgIndex) => {
    if (!content) return '';

    // Handle code blocks (```python ... ```)
    const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'code', lang: match[1] || 'code', content: match[2] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    return parts.map((part, pIdx) => {
      if (part.type === 'code') {
        return (
          <div key={pIdx} style={{
            background: 'var(--dark)',
            color: '#38bdf8',
            padding: '12px 16px',
            borderRadius: '8px',
            margin: '10px 0',
            fontFamily: 'monospace',
            fontSize: '13px',
            position: 'relative',
            overflowX: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '11px', marginBottom: '6px', borderBottom: '1px solid #334155', paddingBottom: '4px' }}>
              <span>{part.lang.toUpperCase()}</span>
              <button
                onClick={() => handleCopy(part.content, `${msgIndex}-${pIdx}`)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '11px' }}
              >
                {copiedIndex === `${msgIndex}-${pIdx}` ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <pre style={{ margin: 0 }}>{part.content}</pre>
          </div>
        );
      }

      return part.content.split('\n').map((line, idx) => {
        let processed = line;

        // Headers
        if (processed.startsWith('#### ')) {
          return <h5 key={`${pIdx}-${idx}`} style={{ margin: '8px 0 4px 0', color: 'var(--primary)', fontWeight: 700, fontSize: '14px' }}>{processed.replace('#### ', '')}</h5>;
        }
        if (processed.startsWith('### ')) {
          return <h4 key={`${pIdx}-${idx}`} style={{ margin: '10px 0 6px 0', color: 'var(--primary)', fontWeight: 800, fontSize: '15px' }}>{processed.replace('### ', '')}</h4>;
        }
        if (processed.startsWith('## ')) {
          return <h3 key={`${pIdx}-${idx}`} style={{ margin: '12px 0 8px 0', color: 'var(--text-dark)', fontWeight: 800, fontSize: '16px' }}>{processed.replace('## ', '')}</h3>;
        }

        // Bullet points
        const isBullet = processed.trim().startsWith('- ') || processed.trim().startsWith('* ');
        if (isBullet) {
          processed = processed.replace(/^[-*]\s+/, '');
        }

        // Bold formatting
        const lineParts = processed.split(/(\*\*.*?\*\*)/g);
        const renderedLine = lineParts.map((lp, lIdx) => {
          if (lp.startsWith('**') && lp.endsWith('**')) {
            return <strong key={lIdx} style={{ color: 'var(--text-dark)', fontWeight: 700 }}>{lp.slice(2, -2)}</strong>;
          }
          return lp;
        });

        if (isBullet) {
          return (
            <div key={`${pIdx}-${idx}`} style={{ display: 'flex', gap: '8px', marginLeft: '6px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 800 }}>•</span>
              <span style={{ flex: 1 }}>{renderedLine}</span>
            </div>
          );
        }

        return <p key={`${pIdx}-${idx}`} style={{ marginBottom: '6px' }}>{renderedLine}</p>;
      });
    });
  };

  if (!isOpen) return null;

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}>
              🤖
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                AI Doubt Guru
                <span style={{ fontSize: '10px', background: '#10b981', padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                  24/7 Live
                </span>
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                Hindi • English • Hinglish • All Subjects
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleClearChat}
              title="Clear Chat"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              🧹 Clear
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Language & Tone Mode Bar */}
        <div style={{
          padding: '8px 16px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: 600 }}>Language:</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'auto', label: '🌐 Auto Detect' },
              { id: 'hinglish', label: '🗣️ Hinglish' },
              { id: 'hindi', label: '🇮🇳 हिंदी' },
              { id: 'english', label: '🇬🇧 English' }
            ].map(lang => (
              <button
                key={lang.id}
                onClick={() => setSelectedLanguage(lang.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '100px',
                  border: selectedLanguage === lang.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: selectedLanguage === lang.id ? 'var(--primary)' : 'var(--bg-card)',
                  color: selectedLanguage === lang.id ? 'white' : 'var(--text)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <div className={msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'} style={{ maxWidth: msg.sender === 'user' ? '85%' : '100%' }}>
                {msg.sender === 'ai' ? formatText(msg.text, index) : msg.text}
              </div>
              
              {/* Suggested Topic Chips */}
              {msg.suggested_topics && msg.suggested_topics.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {msg.suggested_topics.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(`${t}`)}
                      style={{
                        padding: '4px 10px',
                        background: 'var(--bg-card)',
                        border: '1px dashed var(--primary)',
                        color: 'var(--primary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      🔍 {t}
                    </button>
                  ))}
                </div>
              )}

              <span style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '4px', padding: '0 4px' }}>
                {msg.time}
              </span>
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: 'flex-start' }} className="chat-bubble-ai">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                <span className="animate-pulse-glow" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></span>
                <span>AI Guru उत्तर तैयार कर रहे हैं...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{
          padding: '8px 16px',
          background: 'var(--bg)',
          borderTop: '1px solid var(--border)',
          overflowX: 'auto',
          display: 'flex',
          gap: '8px'
        }}>
          {QUICK_SUGGESTIONS.map((qs, i) => (
            <button
              key={i}
              onClick={() => handleSend(qs)}
              disabled={loading}
              style={{
                padding: '6px 12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textAlign: 'left'
              }}
            >
              💡 {qs}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            padding: '16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '10px',
            background: 'var(--bg-card)'
          }}
        >
          <input
            type="text"
            placeholder="Kuch bhi poochiye (Hindi, English, Hinglish)..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-dark)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            style={{
              padding: '0 20px',
              background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontWeight: 700,
              cursor: loading || !inputQuery.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !inputQuery.trim() ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
