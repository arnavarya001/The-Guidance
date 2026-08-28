import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function StudyMaterial() {
  const { user } = useAuth();
  
  // Data lists
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Selected entities
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStream, setSelectedStream] = useState('Science'); // For Class 11-12
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedMaterialType, setSelectedMaterialType] = useState('notes'); // 'notes' | 'formulas' | 'summary'

  // Loading
  const [loading, setLoading] = useState(true);

  // Parse URL query parameter on load (e.g. ?class=c_10)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const clsRes = await fetch('/api/courses/classes');
        const clsData = await clsRes.json();
        setClasses(clsData);

        // Determine default class
        let defClass = clsData[5]?.id || clsData[0]?.id; // Default to Class 10
        
        // Check hash query params
        const hash = window.location.hash;
        if (hash.includes('?')) {
          const params = new URLSearchParams(hash.split('?')[1]);
          const clsParam = params.get('class');
          if (clsParam) defClass = clsParam;
        } else if (user && user.class) {
          defClass = user.class;
        }

        setSelectedClass(defClass);
      } catch (e) {
        console.error("Failed to load classes", e);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

  // Fetch subjects whenever class or stream changes
  useEffect(() => {
    if (!selectedClass) return;

    const fetchSubjects = async () => {
      try {
        const res = await fetch(`/api/courses/subjects?classId=${selectedClass}`);
        const data = await res.json();
        
        // If it's Class 11/12, filter based on selectedStream
        const isClass11Or12 = selectedClass.includes('11') || selectedClass.includes('12');
        let filtered = data;
        
        if (isClass11Or12) {
          // If the subject belongs to Class 11 Science/Commerce/Arts specifically
          // Class 11-12 subjects are structured differently. Let's see: the database subjects
          // might have prefixes or class_id maps. Let's make sure we find them.
          // In db, we have c_12_science, c_11_science, etc.
          // So subjects are already linked to the specific classId like "c_12_science".
        }
        
        setSubjects(filtered);
        if (filtered.length > 0) {
          setSelectedSubject(filtered[0]);
        } else {
          setSelectedSubject(null);
          setChapters([]);
          setSelectedChapter(null);
          setMaterials([]);
        }
      } catch (e) {
        console.error("Failed to fetch subjects", e);
      }
    };

    fetchSubjects();
  }, [selectedClass, selectedStream]);

  // Fetch chapters when subject changes
  useEffect(() => {
    if (!selectedSubject) return;

    const fetchChapters = async () => {
      try {
        const res = await fetch(`/api/courses/chapters?subjectId=${selectedSubject.id}`);
        const data = await res.json();
        setChapters(data);
        if (data.length > 0) {
          setSelectedChapter(data[0]);
        } else {
          setSelectedChapter(null);
          setMaterials([]);
        }
      } catch (e) {
        console.error("Failed to fetch chapters", e);
      }
    };

    fetchChapters();
  }, [selectedSubject]);

  // Fetch study materials when chapter changes
  useEffect(() => {
    if (!selectedChapter) {
      setMaterials([]);
      return;
    }

    const fetchMaterials = async () => {
      try {
        const res = await fetch(`/api/study-materials?chapterId=${selectedChapter.id}`);
        const data = await res.json();
        setMaterials(data);
      } catch (e) {
        console.error("Failed to fetch study materials", e);
      }
    };

    fetchMaterials();
  }, [selectedChapter]);

  // Handle stream click for Class 11/12
  const handleClassChange = (cid) => {
    // If selecting Class 11 or 12, need to match with stream
    if (cid === 'c_11') {
      setSelectedClass(`c_11_${selectedStream.toLowerCase()}`);
    } else if (cid === 'c_12') {
      setSelectedClass(`c_12_${selectedStream.toLowerCase()}`);
    } else {
      setSelectedClass(cid);
    }
    setSelectedSubject(null);
    setSelectedChapter(null);
    setMaterials([]);
  };

  const handleStreamChange = (stream) => {
    setSelectedStream(stream);
    // Find current main class type (11 or 12)
    const is12 = selectedClass.includes('12');
    const newCid = is12 ? `c_12_${stream.toLowerCase()}` : `c_11_${stream.toLowerCase()}`;
    setSelectedClass(newCid);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setMaterials([]);
  };

  const activeClassIs11Or12 = selectedClass.includes('11') || selectedClass.includes('12');
  const activeClassBaseId = selectedClass.includes('11') ? 'c_11' : selectedClass.includes('12') ? 'c_12' : selectedClass;

  const currentMaterial = materials.find(m => m.type === selectedMaterialType) || materials[0];

  return (
    <div className="container section" style={{ padding: '40px 24px', textAlign: 'left' }}>
      <div style={{ marginBottom: '32px' }}>
        <span className="section-tag">📖 Learning Resources</span>
        <h2 style={{ fontSize: '32px', marginBottom: '8px' }}>Bihar Board Study Materials</h2>
        <p style={{ color: 'var(--gray)' }}>Chapter-wise study notes, formulas, summaries, and practice test series.</p>
      </div>

      {/* Class Selection Tabs */}
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

      {/* Stream Selection (only if Class 11 or 12) */}
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
            const isActive = selectedStream === stream;
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

      {/* Main Grid: Left Sidebar (Subjects/Chapters), Right Content (Viewer) */}
      {loading ? (
        <div className="loader-container"><div className="loader"></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '30px' }}>
          
          {/* Left Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Subjects List */}
            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                📚 Subjects
              </h3>
              {subjects.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>No subjects preloaded for this class.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {subjects.map(s => {
                    const isSelected = selectedSubject?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedSubject(s);
                          setSelectedChapter(null);
                          setMaterials([]);
                        }}
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

            {/* Chapters List */}
            {selectedSubject && (
              <div className="card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  📖 Chapters
                </h3>
                {chapters.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>No chapters preloaded for this subject.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {chapters.map(c => {
                      const isSelected = selectedChapter?.id === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedChapter(c);
                            setMaterials([]);
                          }}
                          className="btn btn-sm"
                          style={{
                            justifyContent: 'flex-start',
                            backgroundColor: isSelected ? '#f5f3ff' : 'transparent',
                            borderColor: isSelected ? 'var(--secondary)' : 'transparent',
                            color: isSelected ? 'var(--secondary)' : 'var(--text-dark)',
                            textAlign: 'left',
                            fontSize: '13px',
                            fontWeight: isSelected ? 700 : 500
                          }}
                        >
                          Ch {c.number}: {c.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Viewer Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {selectedChapter ? (
              <div className="card" style={{ padding: '32px' }}>
                
                {/* Header of Chapter */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '16px',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: '20px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
                      {selectedSubject?.name}
                    </span>
                    <h2 style={{ fontSize: '26px' }}>
                      Chapter {selectedChapter.number}: {selectedChapter.name}
                    </h2>
                    <p style={{ color: 'var(--gray)', fontSize: '14px', marginTop: '4px' }}>
                      {selectedChapter.hindi_name}
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => window.location.hash = `#test-series?subject=${selectedSubject.id}`} 
                      className="btn btn-primary btn-sm"
                    >
                      📝 Chapter Test
                    </button>
                    <button 
                      onClick={() => {
                        if (currentMaterial && currentMaterial.pdf_url) {
                          window.open(currentMaterial.pdf_url, '_blank');
                        } else {
                          alert("No PDF file is attached to this chapter's notes yet. You can view the complete interactive notes directly below.");
                        }
                      }} 
                      className={`btn btn-sm ${currentMaterial?.pdf_url ? 'btn-secondary' : 'btn-outline'}`}
                      title={currentMaterial?.pdf_url ? "Download/View attached PDF notes" : "No PDF attached"}
                    >
                      📥 {currentMaterial?.pdf_url ? 'Download PDF Notes' : 'Download PDF'}
                    </button>
                  </div>
                </div>

                {/* Resource Category Tabs */}
                <div className="tabs">
                  {[
                    { id: 'notes', label: 'Detailed Notes' },
                    { id: 'formulas', label: 'Important Formulas & Concepts' },
                    { id: 'summary', label: 'Chapter Summary' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedMaterialType(tab.id)}
                      className={`tab-btn ${selectedMaterialType === tab.id ? 'active' : ''}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Resource Material Body */}
                <div style={{ marginTop: '20px', minHeight: '300px' }}>
                  {currentMaterial ? (
                    <div style={{ fontSize: '16px', color: 'var(--text-dark)', lineHeight: 1.7 }}>
                      <h3 style={{ marginBottom: '16px', fontSize: '20px', color: 'var(--primary)' }}>
                        {currentMaterial.title}
                      </h3>
                      {/* We mock markdown rendering with custom lines parser since we can format it nicely using CSS pre tags or simple mapping */}
                      <div className="markdown-body" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {currentMaterial.content.replace(/\\n/g, '\n')}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-light)' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
                      <h4>No {selectedMaterialType} uploaded yet for this chapter.</h4>
                      <p style={{ fontSize: '14px', color: 'var(--gray)', marginTop: '4px' }}>
                        Admins can upload notes using the Admin Panel.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="card" style={{
                textAlign: 'center',
                padding: '80px 40px',
                color: 'var(--text-light)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>📚</div>
                <h3 style={{ color: 'var(--text-dark)' }}>Please Select a Subject and Chapter</h3>
                <p style={{ maxWidth: '400px', margin: '8px 0 24px 0', fontSize: '14px', color: 'var(--gray)' }}>
                  Use the left navigation sidebar to browse notes and study resources curated specifically for the BSEB syllabus.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
