import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Syllabus() {
  const { user } = useAuth();
  
  // Lists
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  
  // Syllabus details
  const [syllabusData, setSyllabusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syllabusLoading, setSyllabusLoading] = useState(false);

  useEffect(() => {
    const fetchClassesAndSubjects = async () => {
      try {
        const clsRes = await fetch('/api/courses/classes');
        const clsData = await clsRes.json();
        setClasses(clsData);

        // Default to student class or Class 10
        const defaultCls = user?.class || clsData[5]?.id || clsData[0]?.id;
        setSelectedClass(defaultCls);
      } catch (e) {
        console.error("Failed to load classes", e);
      } finally {
        setLoading(false);
      }
    };
    fetchClassesAndSubjects();
  }, [user]);

  // Fetch subjects when selected class changes
  useEffect(() => {
    if (!selectedClass) return;
    
    const fetchSubjects = async () => {
      try {
        const res = await fetch(`/api/courses/subjects?classId=${selectedClass}`);
        const data = await res.json();
        setSubjects(data);
        if (data.length > 0) {
          setSelectedSubject(data[0]);
        } else {
          setSelectedSubject(null);
          setSyllabusData(null);
        }
      } catch (e) {
        console.error("Failed to load subjects", e);
      }
    };
    fetchSubjects();
  }, [selectedClass]);

  // Fetch syllabus details when subject changes
  useEffect(() => {
    if (!selectedClass || !selectedSubject) {
      setSyllabusData(null);
      return;
    }

    const fetchSyllabus = async () => {
      setSyllabusLoading(true);
      try {
        const res = await fetch(`/api/syllabus?classId=${selectedClass}&subjectId=${selectedSubject.id}`);
        const data = await res.json();
        if (data.length > 0) {
          setSyllabusData(data[0]);
        } else {
          setSyllabusData(null);
        }
      } catch (e) {
        console.error("Failed to load syllabus", e);
      } finally {
        setSyllabusLoading(false);
      }
    };
    fetchSyllabus();
  }, [selectedClass, selectedSubject]);

  const activeClassBaseId = selectedClass.includes('11') ? 'c_11' : selectedClass.includes('12') ? 'c_12' : selectedClass;

  const handleClassChange = (cid) => {
    // Check if class 11 or 12 to append stream (default Science)
    if (cid === 'c_11') {
      setSelectedClass('c_11_science');
    } else if (cid === 'c_12') {
      setSelectedClass('c_12_science');
    } else {
      setSelectedClass(cid);
    }
    setSelectedSubject(null);
    setSyllabusData(null);
  };

  const handleStreamChange = (stream) => {
    const is12 = selectedClass.includes('12');
    setSelectedClass(is12 ? `c_12_${stream.toLowerCase()}` : `c_11_${stream.toLowerCase()}`);
    setSelectedSubject(null);
    setSyllabusData(null);
  };

  const activeClassIs11Or12 = selectedClass.includes('11') || selectedClass.includes('12');
  const selectedStreamName = selectedClass.includes('science') ? 'Science' : selectedClass.includes('commerce') ? 'Commerce' : 'Arts';

  return (
    <div className="container section" style={{ padding: '40px 24px', textAlign: 'left' }}>
      <div style={{ marginBottom: '32px' }}>
        <span className="section-tag">📋 Academic Blueprint</span>
        <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Official Bihar Board (BSEB) Syllabus</h2>
        <p style={{ color: 'var(--gray)' }}>Access official class-wise chapter weightage, exam blueprints, and marks distribution.</p>
      </div>

      {/* Class tabs */}
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

      {/* Stream tabs */}
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
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-dark)' }}>Stream:</span>
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
          
          {/* Left Panel: Subject Tabs */}
          <div>
            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                📚 Subjects
              </h3>
              {subjects.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>No subjects preloaded.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {subjects.map(s => {
                    const isSelected = selectedSubject?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSubject(s)}
                        className="btn btn-sm"
                        style={{
                          justifyContent: 'flex-start',
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                          borderColor: isSelected ? 'var(--primary)' : 'transparent',
                          color: isSelected ? 'var(--primary)' : 'var(--text-dark)',
                          textAlign: 'left'
                        }}
                      >
                        {s.name} ({s.hindi_name})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Syllabus Details */}
          <div>
            {syllabusLoading ? (
              <div className="loader-container"><div className="loader"></div></div>
            ) : syllabusData ? (
              <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Intro */}
                <div>
                  <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
                    Class {selectedClass.replace('c_', '').toUpperCase().replace('_', ' ')} | Official BSEB Syllabus
                  </span>
                  <h2 style={{ fontSize: '28px', color: 'var(--text-dark)' }}>{selectedSubject?.name} Syllabus</h2>
                  <p style={{ color: 'var(--text)', fontSize: '15px', marginTop: '12px', lineHeight: 1.6 }}>
                    {syllabusData.introduction}
                  </p>
                </div>

                {/* Exam Pattern Blueprint */}
                <div style={{ backgroundColor: 'var(--primary-light)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(37,99,235,0.1)' }}>
                  <h3 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '10px' }}>📝 Official Exam Pattern Blueprint</h3>
                  <div style={{ whiteSpace: 'pre-line', fontSize: '14px', lineHeight: 1.6, color: '#1e3a8a', fontWeight: 500 }}>
                    {syllabusData.exam_pattern}
                  </div>
                </div>

                {/* Chapters Weightage */}
                <div>
                  <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>📖 Chapter Weightage & Coverage</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {syllabusData.chapters_list.map((ch, idx) => (
                      <div key={idx} style={{
                        padding: '16px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div style={{ maxWidth: '80%' }}>
                          <div style={{ fontWeight: 700, fontSize: '15px' }}>{ch.name}</div>
                          <div style={{ fontSize: '13px', color: 'var(--gray)', marginTop: '2px' }}>{ch.description}</div>
                        </div>
                        <span className="badge badge-secondary" style={{ padding: '6px 12px' }}>
                          {ch.weightage}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => window.location.hash = `#study-material?class=${selectedClass}`} className="btn btn-primary btn-sm">
                    🚀 View Chapter Notes
                  </button>
                  <button onClick={() => window.location.hash = '#test-series'} className="btn btn-outline btn-sm">
                    ✍️ Practice Model Tests
                  </button>
                </div>

              </div>
            ) : (
              <div className="card" style={{
                textAlign: 'center',
                padding: '80px 40px',
                color: 'var(--text-light)'
              }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>📋</div>
                <h3>Syllabus Details Not Found</h3>
                <p style={{ fontSize: '14px', color: 'var(--gray)', marginTop: '4px', maxWidth: '380px', margin: '4px auto 0 auto' }}>
                  No syllabus entry has been created for this subject yet. Admins can update official BSEB weights via the Admin Panel.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
