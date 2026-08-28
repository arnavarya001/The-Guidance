import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function TestSeries() {
  const { user, token } = useAuth();
  
  // Lists
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  
  // Selected
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All'); // 'All', 'Chapter Test', 'Mock Test', 'Subject Test'
  
  // Loading & Modals
  const [loading, setLoading] = useState(true);
  const [selectedTestToConfirm, setSelectedTestToConfirm] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const clsRes = await fetch('/api/courses/classes');
        const clsData = await clsRes.json();
        const safeClasses = Array.isArray(clsData) && clsData.length > 0 ? clsData : [
          { id: 'c_9', name: 'Class 9' },
          { id: 'c_10', name: 'Class 10' },
          { id: 'c_11_science', name: 'Class 11 Science' },
          { id: 'c_12_science', name: 'Class 12 Science' }
        ];
        setClasses(safeClasses);

        // Default to student class or Class 10
        let defCls = user?.class || safeClasses.find(c => c.id === 'c_10')?.id || safeClasses[0]?.id || 'c_10';

        // Check hash query params
        const hash = window.location.hash;
        if (hash.includes('?')) {
          const params = new URLSearchParams(hash.split('?')[1]);
          const subParam = params.get('subject');
          if (subParam) {
            const parts = subParam.split('_');
            if (parts[1]) defCls = `c_${parts[1]}`;
            setSelectedSubject(subParam);
          }
        }
        setSelectedClass(defCls);
      } catch (e) {
        console.warn("Failed to load initial series data, using defaults", e);
        setClasses([
          { id: 'c_9', name: 'Class 9' },
          { id: 'c_10', name: 'Class 10' },
          { id: 'c_11_science', name: 'Class 11 Science' },
          { id: 'c_12_science', name: 'Class 12 Science' }
        ]);
        setSelectedClass('c_10');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

  // Fetch subjects when selected class changes
  useEffect(() => {
    if (!selectedClass) return;
    
    const fetchSubjects = async () => {
      try {
        const res = await fetch(`/api/courses/subjects?classId=${selectedClass}`);
        const data = await res.json();
        const safeSubjects = Array.isArray(data) && data.length > 0 ? data : [
          { id: 's_10_sci', name: 'Science' },
          { id: 's_10_math', name: 'Mathematics' }
        ];
        setSubjects(safeSubjects);
        if (safeSubjects.length > 0 && !selectedSubject.includes(selectedClass.replace('c_', ''))) {
          setSelectedSubject(safeSubjects[0].id);
        }
      } catch (e) {
        console.warn("Failed to load subjects", e);
        setSubjects([]);
      }
    };
    fetchSubjects();
  }, [selectedClass]);

  // Fetch tests list based on class & subject
  useEffect(() => {
    if (!selectedClass || !selectedSubject) {
      setTests([]);
      return;
    }

    const fetchTests = async () => {
      try {
        const res = await fetch(`/api/tests?classId=${selectedClass}&subjectId=${selectedSubject}`);
        const data = await res.json();
        setTests(Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn("Failed to load tests", e);
        setTests([]);
      }
    };
    fetchTests();
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
    setTests([]);
  };

  const handleStreamChange = (stream) => {
    const is12 = selectedClass.includes('12');
    setSelectedClass(is12 ? `c_12_${stream.toLowerCase()}` : `c_11_${stream.toLowerCase()}`);
    setSelectedSubject('');
    setTests([]);
  };

  const activeClassIs11Or12 = selectedClass.includes('11') || selectedClass.includes('12');
  const selectedStreamName = selectedClass.includes('science') ? 'Science' : selectedClass.includes('commerce') ? 'Commerce' : 'Arts';

  // Filter tests by category
  const filteredTests = selectedCategory === 'All' 
    ? tests 
    : tests.filter(t => t.category === selectedCategory);

  const startTestExecution = (testId) => {
    if (!token) {
      alert("Please log in or register to attempt tests and track scores!");
      window.location.hash = '#login';
      return;
    }
    window.location.hash = `#test-engine/${testId}`;
  };

  return (
    <div className="container section" style={{ padding: '40px 24px', textAlign: 'left' }}>
      <div style={{ marginBottom: '32px' }}>
        <span className="section-tag">✍️ Online Diagnostic Testing</span>
        <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Bihar Board Test Series</h2>
        <p style={{ color: 'var(--gray)' }}>Chapter-wise quizzes, mock examinations, and official board practice papers.</p>
      </div>

      {/* Class Selector Tabs */}
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

      {/* Stream Tabs (11/12) */}
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
          
          {/* Left Panel: Subject & Category Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Subject Filters */}
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

            {/* Test Category Filters */}
            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                🏷️ Categories
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {['All', 'Chapter Test', 'Mock Test', 'Subject Test'].map(cat => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className="btn btn-sm"
                      style={{
                        justifyContent: 'flex-start',
                        backgroundColor: isSelected ? '#f5f3ff' : 'transparent',
                        borderColor: isSelected ? 'var(--secondary)' : 'transparent',
                        color: isSelected ? 'var(--secondary)' : 'var(--text-dark)',
                        textAlign: 'left'
                      }}
                    >
                      {cat}s
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: Available Tests Lists */}
          <div>
            {filteredTests.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-light)' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
                <h3>No Tests Available</h3>
                <p style={{ fontSize: '14px', color: 'var(--gray)', marginTop: '4px' }}>
                  No tests found for this class and subject under the "{selectedCategory}" category.
                </p>
              </div>
            ) : (
              <div className="grid-2">
                {filteredTests.map(test => (
                  <div key={test.id} className="card" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    textAlign: 'left'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span className="badge badge-primary" style={{ fontSize: '11px' }}>{test.category}</span>
                        <span style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: 600 }}>⏱️ {test.time_limit} mins</span>
                      </div>
                      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{test.title}</h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--gray)', marginBottom: '16px' }}>
                        <span>📋 Questions: <strong>{test.question_ids.length}</strong></span>
                        <span>🎯 Marks: <strong>{test.total_marks}</strong></span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedTestToConfirm(test)}
                      className="btn btn-outline"
                      style={{ width: '100%' }}
                    >
                      Attempt Test
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Test Instruction/Start Modal */}
      {selectedTestToConfirm && (
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
            maxWidth: '550px',
            width: '100%',
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
              {selectedTestToConfirm.category}
            </span>
            <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>{selectedTestToConfirm.title}</h3>
            
            {/* Instruction Box */}
            <div style={{
              backgroundColor: 'var(--bg)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              marginBottom: '24px',
              maxHeight: '200px',
              overflowY: 'auto',
              fontSize: '14px',
              lineHeight: 1.6
            }}>
              <h4 style={{ marginBottom: '8px', fontSize: '15px' }}>Instructions:</h4>
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
                {selectedTestToConfirm.instructions}
              </div>
            </div>

            {/* Test Stats summary in modal */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <div style={{ backgroundColor: 'var(--primary-light)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>QUESTIONS</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)' }}>{selectedTestToConfirm.question_ids.length}</div>
              </div>
              <div style={{ backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#047857', fontWeight: 700 }}>DURATION</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)' }}>{selectedTestToConfirm.time_limit} Min</div>
              </div>
              <div style={{ backgroundColor: '#fdf2f8', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#be185d', fontWeight: 700 }}>TOTAL MARKS</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)' }}>{selectedTestToConfirm.total_marks}</div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedTestToConfirm(null)} 
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                onClick={() => startTestExecution(selectedTestToConfirm.id)} 
                className="btn btn-primary"
              >
                Start Test Now 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
