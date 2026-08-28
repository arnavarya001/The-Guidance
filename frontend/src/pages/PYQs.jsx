import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function PYQs() {
  const { user, token } = useAuth();

  // Lists
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [pyqPapers, setPyqPapers] = useState([]);

  // Selected
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');

  // Loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const clsRes = await fetch('/api/courses/classes');
        const clsData = await clsRes.json();
        setClasses(clsData);

        const defaultCls = user?.class || clsData[5]?.id || clsData[0]?.id;
        setSelectedClass(defaultCls);
      } catch (e) {
        console.error("Failed to load classes", e);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

  // Fetch subjects when class changes
  useEffect(() => {
    if (!selectedClass) return;
    
    const fetchSubjects = async () => {
      try {
        const res = await fetch(`/api/courses/subjects?classId=${selectedClass}`);
        const data = await res.json();
        setSubjects(data);
        if (data.length > 0) {
          setSelectedSubject(data[0].id);
        }
      } catch (e) {
        console.error("Failed to load subjects", e);
      }
    };
    fetchSubjects();
  }, [selectedClass]);

  // Fetch PYQs papers list when subject changes
  useEffect(() => {
    if (!selectedClass || !selectedSubject) {
      setPyqPapers([]);
      return;
    }

    const fetchPyqList = async () => {
      try {
        const res = await fetch(`/api/pyqs?classId=${selectedClass}&subjectId=${selectedSubject}`);
        const data = await res.json();
        setPyqPapers(data);
      } catch (e) {
        console.error("Failed to load PYQs list", e);
      }
    };
    fetchPyqList();
  }, [selectedClass, selectedSubject]);

  const activeClassBaseId = selectedClass.includes('11') ? 'c_11' : selectedClass.includes('12') ? 'c_12' : selectedClass;

  const handleClassChange = (cid) => {
    if (cid === 'c_11') {
      setSelectedClass('c_11_science');
    } else if (cid === 'c_12') {
      setSelectedClass('c_12_science');
    } else {
      setSelectedClass(cid);
    }
    setSelectedSubject('');
    setPyqPapers([]);
  };

  const handleStreamChange = (stream) => {
    const is12 = selectedClass.includes('12');
    setSelectedClass(is12 ? `c_12_${stream.toLowerCase()}` : `c_11_${stream.toLowerCase()}`);
    setSelectedSubject('');
    setPyqPapers([]);
  };

  const activeClassIs11Or12 = selectedClass.includes('11') || selectedClass.includes('12');
  const selectedStreamName = selectedClass.includes('science') ? 'Science' : selectedClass.includes('commerce') ? 'Commerce' : 'Arts';

  // Filter papers by year
  const filteredPapers = selectedYear === 'All'
    ? pyqPapers
    : pyqPapers.filter(p => p.year === Number(selectedYear));

  const startSolvingPyq = (pyqId) => {
    if (!token) {
      alert("Please login to attempt Previous Year Papers and compile analytics.");
      window.location.hash = '#login';
      return;
    }
    // We redirect to test-engine with a prefix or general handler.
    // In our backend/server.js, we have the post route `/api/pyqs/:id/submit` and `/api/pyqs/:id`.
    // In our client-side routing, we will configure `#test-engine/pyq_${pyqId}` or handle it elegantly!
    // Since our database has specific test papers configured in test series, we can also map PYQs into the test engine directly.
    // Let's redirect to `#test-engine/${pyqId}` and let TestEngine render it. We can add a simple condition in TestEngine
    // to check if it's a test or pyq based on id, but actually we preloaded them and can resolve it automatically!
    window.location.hash = `#test-engine/${pyqId}`;
  };

  return (
    <div className="container section" style={{ padding: '40px 24px', textAlign: 'left' }}>
      <div style={{ marginBottom: '32px' }}>
        <span className="section-tag">📜 Official Question Archives</span>
        <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Previous Year Questions (PYQs)</h2>
        <p style={{ color: 'var(--gray)' }}>Attempt official Bihar Board Matriculation and Intermediate questions online with instant scores.</p>
      </div>

      {/* Class selector */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '16px'
      }}>
        {[
          { id: 'c_5', name: 'Class 5' },
          { id: 'c_6', name: 'Class 6' },
          { id: 'c_7', name: 'Class 7' },
          { id: 'c_8', name: 'Class 8' },
          { id: 'c_9', name: 'Class 9' },
          { id: 'c_10', name: 'Class 10' },
          { id: 'c_11', name: 'Class 11' },
          { id: 'c_12', name: 'Class 12' }
        ].map(c => {
          const isActive = activeClassBaseId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => handleClassChange(c.id)}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Stream filter */}
      {activeClassIs11Or12 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#f1f5f9',
          padding: '12px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          width: 'fit-content'
        }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>Select Stream:</span>
          {['Science', 'Commerce', 'Arts'].map(stream => {
            const isActive = selectedStreamName === stream;
            return (
              <button
                key={stream}
                onClick={() => handleStreamChange(stream)}
                className={`btn btn-sm ${isActive ? 'btn-secondary' : 'btn-outline'}`}
                style={{ padding: '6px 12px', fontSize: '13px' }}
              >
                {stream}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="loader-container"><div className="loader"></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '30px' }}>
          
          {/* Left Panel: Subject & Year Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                📚 Subjects
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {subjects.map(s => {
                  const isSelected = selectedSubject === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSubject(s.id)}
                      className="btn btn-sm"
                      style={{
                        justifyContent: 'flex-start',
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                        borderColor: isSelected ? 'var(--primary)' : 'transparent',
                        color: isSelected ? 'var(--primary)' : 'var(--text-dark)',
                        textAlign: 'left'
                      }}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                📅 Year Filter
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {['All', '2024', '2023', '2022'].map(yr => {
                  const isSelected = selectedYear === yr;
                  return (
                    <button
                      key={yr}
                      onClick={() => setSelectedYear(yr)}
                      className="btn btn-sm"
                      style={{
                        justifyContent: 'flex-start',
                        backgroundColor: isSelected ? '#f5f3ff' : 'transparent',
                        borderColor: isSelected ? 'var(--secondary)' : 'transparent',
                        color: isSelected ? 'var(--secondary)' : 'var(--text-dark)',
                        textAlign: 'left'
                      }}
                    >
                      {yr} Exam
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: PYQ list */}
          <div>
            <div className="alert alert-info" style={{ fontSize: '14px', marginBottom: '24px' }}>
              ℹ️ <strong>BSEB Question Policy:</strong> These practice sets are structured exactly according to official Bihar School Examination Board papers. Solving online provides accuracy reports.
            </div>

            {filteredPapers.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-light)' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📜</div>
                <h3>No PYQs Found</h3>
                <p style={{ fontSize: '14px', color: 'var(--gray)', marginTop: '4px' }}>
                  No previous year papers available for the selected subject and year criteria.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredPapers.map(paper => (
                  <div key={paper.id} className="card" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    textAlign: 'left'
                  }}>
                    <div>
                      <span className="badge badge-secondary" style={{ marginBottom: '6px' }}>{paper.year} Board Exam</span>
                      <h3 style={{ fontSize: '18px', margin: '4px 0' }}>{paper.exam_name}</h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--gray)', marginTop: '6px' }}>
                        <span>📋 Questions: <strong>{paper.question_ids.length}</strong></span>
                        <span>🎯 Marks: <strong>{paper.question_ids.length}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => alert("PDF paper viewer is only available in production downloads. Solve online to practice.")}
                        className="btn btn-outline btn-sm"
                      >
                        📄 Download PDF
                      </button>
                      <button 
                        onClick={() => startSolvingPyq(paper.id)}
                        className="btn btn-primary btn-sm"
                      >
                        ✍️ Solve Online
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
