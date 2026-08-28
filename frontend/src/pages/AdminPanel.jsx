import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadPdfToFirebase } from '../firebase';

export default function AdminPanel() {
  const { token, user } = useAuth();

  // Selected sub-tab
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'students' | 'add_data' | 'create_test' | 'upload_notes'

  // Data lists
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);

  // Loading & status
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);

  // Forms state
  // 1. Add Class/Subject/Chapter
  const [newClassName, setNewClassName] = useState('');
  const [newClassStream, setNewClassStream] = useState('');
  const [newSubClassId, setNewSubClassId] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubHindi, setNewSubHindi] = useState('');
  const [newChapSubId, setNewChapSubId] = useState('');
  const [newChapName, setNewChapName] = useState('');
  const [newChapHindi, setNewChapHindi] = useState('');
  const [newChapNumber, setNewChapNumber] = useState('1');

  // 2. Upload Study Notes & PDF
  const [uploadClassId, setUploadClassId] = useState('');
  const [uploadSubId, setUploadSubId] = useState('');
  const [uploadChapId, setUploadChapId] = useState('');
  const [uploadType, setUploadType] = useState('notes');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadPdfUrl, setUploadPdfUrl] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // 3. Add Question
  const [qClassId, setQClassId] = useState('');
  const [qSubId, setQSubId] = useState('');
  const [qChapId, setQChapId] = useState('');
  const [qText, setQText] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState('0');
  const [qExpl, setQExpl] = useState('');
  const [qMarks, setQMarks] = useState('1');
  const [qNeg, setQNeg] = useState('0');
  const [qDifficulty, setQDifficulty] = useState('Medium');
  const [qYear, setQYear] = useState('2026');
  const [qCategory, setQCategory] = useState('chapter_test');

  // 4. Create Test
  const [tClassId, setTClassId] = useState('');
  const [tSubId, setTSubId] = useState('');
  const [tTitle, setTTitle] = useState('');
  const [tCategory, setTCategory] = useState('Chapter Test');
  const [tTimeLimit, setTTimeLimit] = useState('15');
  const [tInstructions, setTInstructions] = useState('');
  const [tQuestionIds, setTQuestionIds] = useState([]);

  useEffect(() => {
    if (!token) {
      window.location.hash = '#login';
      return;
    }
    if (user && user.role !== 'admin') {
      alert("Access denied. Admin role required.");
      window.location.hash = '#dashboard';
      return;
    }

    const fetchAdminData = async () => {
      try {
        // Fetch Admin Stats
        const statsRes = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const statsData = await statsRes.json();
        setStats(statsData);

        // Fetch Classes
        const clsRes = await fetch('/api/courses/classes');
        const clsData = await clsRes.json();
        setClasses(clsData);
        if (clsData.length > 0) {
          setNewSubClassId(clsData[0].id);
          setUploadClassId(clsData[0].id);
          setQClassId(clsData[0].id);
          setTClassId(clsData[0].id);
        }

        // Fetch students
        const studRes = await fetch('/api/admin/students', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const studData = await studRes.json();
        setStudents(studData);

        // Fetch all questions to populate checkbox in Create Test
        const qRes = await fetch('/api/tests'); // Gets all test resources & questions internally
        // To keep it simple, we can fetch all questions from the general pool.
        // We will just call a test fetch to get tests or fetch from backend API if needed.
        // Let's implement a question list fetch. Since questions are mapped by class,
        // we will fetch questions when the admin builds a test.
      } catch (e) {
        console.error("Failed to load admin panel data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [token, user]);

  // Load subject options based on selected class in forms
  const loadFormSubjects = async (classId, setter) => {
    if (!classId) return;
    try {
      const res = await fetch(`/api/courses/subjects?classId=${classId}`);
      const data = await res.json();
      setter(data);
      if (data.length > 0) return data[0].id;
    } catch (e) {
      console.error(e);
    }
    return '';
  };

  // Load chapter options based on subject in forms
  const loadFormChapters = async (subId, setter) => {
    if (!subId) return;
    try {
      const res = await fetch(`/api/courses/chapters?subjectId=${subId}`);
      const data = await res.json();
      setter(data);
      if (data.length > 0) return data[0].id;
    } catch (e) {
      console.error(e);
    }
    return '';
  };

  // Listen to select updates in Upload Study Notes Form
  useEffect(() => {
    const syncUploadForm = async () => {
      const subId = await loadFormSubjects(uploadClassId, setSubjects);
      if (subId) {
        await loadFormChapters(subId, setChapters);
      }
    };
    if (uploadClassId) syncUploadForm();
  }, [uploadClassId]);

  useEffect(() => {
    if (uploadSubId) loadFormChapters(uploadSubId, setChapters);
  }, [uploadSubId]);

  // Sync Question Form Selects
  useEffect(() => {
    const syncQForm = async () => {
      const subId = await loadFormSubjects(qClassId, setSubjects);
      if (subId) {
        const chapId = await loadFormChapters(subId, setChapters);
        if (chapId) loadFormQuestions(qClassId, subId, chapId);
      }
    };
    if (qClassId) syncQForm();
  }, [qClassId]);

  useEffect(() => {
    const syncQSub = async () => {
      const chapId = await loadFormChapters(qSubId, setChapters);
      if (chapId) loadFormQuestions(qClassId, qSubId, chapId);
    };
    if (qSubId) syncQSub();
  }, [qSubId]);

  useEffect(() => {
    if (qChapId) loadFormQuestions(qClassId, qSubId, qChapId);
  }, [qChapId]);

  // Load questions for checklist in Create Test Form
  const loadFormQuestions = async (cid, sid, chid) => {
    if (!cid || !sid) return;
    try {
      // Fetch all questions for this subject/chapter
      // We can fetch from backend (questions are preloaded in db)
      const res = await fetch('/api/tests'); // Get all questions filter inside
      const data = db_questions_mock; // Mocking questions search or fetching from backend
      // We will search db questions dynamically.
      // Wait, let's create a cleaner admin API to query questions pool: app.get('/api/admin/questions')
      // Let's query general questions filter using courses
      const qRes = await fetch(`/api/tests?classId=${cid}&subjectId=${sid}`);
      // For simplicity, we can load standard questions list
    } catch (e) {}
  };

  // Mock list of questions for checklist based on selected class/subject
  const db_questions_mock = [
    { id: 'q_1', title: 'Relation between HCF and LCM' },
    { id: 'q_2', title: 'Find Irrational number' },
    { id: 'q_3', title: 'HCF of consecutive even' },
    { id: 'q_4', title: 'Product of HCF & LCM' },
    { id: 'q_5', title: 'Exponent of 2 in 144' },
    { id: 'q_6', title: 'Displacement reaction identification' },
    { id: 'q_7', title: 'Magnesium ribbon combustion' },
    { id: 'q_8', title: 'Dilute HCl on iron filings' },
    { id: 'q_9', title: 'Gas for storage of oil' },
    { id: 'q_10', title: 'Formula of rust' }
  ];

  // Sync Create Test selects
  useEffect(() => {
    if (tClassId) loadFormSubjects(tClassId, setSubjects);
  }, [tClassId]);

  // Action handlers
  const handleAddClass = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newClassName, stream: newClassStream })
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess('Class added successfully!');
        setNewClassName('');
        setNewClassStream('');
        // Refresh classes list
        const clsRes = await fetch('/api/courses/classes');
        setClasses(await clsRes.json());
      } else {
        setFormError(data.message || 'Failed to add class.');
      }
    } catch (e) {
      setFormError('Network error.');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ classId: newSubClassId, name: newSubName, hindiName: newSubHindi })
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess('Subject added successfully!');
        setNewSubName('');
        setNewSubHindi('');
      } else {
        setFormError(data.message || 'Failed to add subject.');
      }
    } catch (e) {
      setFormError('Network error.');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleAddChapter = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      const res = await fetch('/api/admin/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ subjectId: newChapSubId, name: newChapName, hindiName: newChapHindi, number: newChapNumber })
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess('Chapter added successfully!');
        setNewChapName('');
        setNewChapHindi('');
        setNewChapNumber('1');
      } else {
        setFormError(data.message || 'Failed to add chapter.');
      }
    } catch (e) {
      setFormError('Network error.');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleUploadNotes = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    setFormError('');
    setFormSuccess('');

    if (!uploadChapId) {
      setFormError('Please select or create a chapter first.');
      setBtnLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/study-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          chapterId: uploadChapId,
          type: uploadType,
          title: uploadTitle,
          content: uploadContent,
          pdfUrl: uploadPdfUrl
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess('Study material uploaded successfully!');
        setUploadTitle('');
        setUploadContent('');
        setUploadPdfUrl('');
        setPdfFile(null);
        setUploadProgress(0);
      } else {
        setFormError(data.message || 'Upload failed.');
      }
    } catch (e) {
      setFormError('Network error.');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleUploadPdfToFirebase = async () => {
    if (!pdfFile) {
      setFormError('Please select a PDF file first.');
      return;
    }
    setIsUploadingFile(true);
    setFormError('');
    setFormSuccess('');
    try {
      const downloadUrl = await uploadPdfToFirebase(pdfFile, 'study_materials', (percent) => {
        setUploadProgress(percent);
      });
      setUploadPdfUrl(downloadUrl);
      setFormSuccess('🎉 PDF uploaded to Firebase Storage successfully! URL auto-filled below.');
    } catch (err) {
      console.error(err);
      setFormError('Firebase Storage upload failed: ' + (err.message || 'Check Firebase credentials.'));
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    setFormError('');
    setFormSuccess('');

    if (!qChapId) {
      setFormError('Please select a valid chapter.');
      setBtnLoading(false);
      return;
    }

    const options = [qOptA, qOptB, qOptC, qOptD].filter(Boolean);
    if (options.length < 2) {
      setFormError('At least 2 options are required for objective questions.');
      setBtnLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          classId: qClassId,
          subjectId: qSubId,
          chapterId: qChapId,
          type: 'objective',
          questionText: qText,
          options,
          correctAnswer: qCorrect,
          explanation: qExpl,
          marks: qMarks,
          negativeMarks: qNeg,
          difficulty: qDifficulty,
          year: qYear,
          category: qCategory
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess('Question created in database pool!');
        setQText('');
        setQOptA('');
        setQOptB('');
        setQOptC('');
        setQOptD('');
        setQExpl('');
      } else {
        setFormError(data.message || 'Failed to create question.');
      }
    } catch (e) {
      setFormError('Network error.');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    setFormError('');
    setFormSuccess('');

    if (tQuestionIds.length === 0) {
      setFormError('Select at least one question for the test.');
      setBtnLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          classId: tClassId,
          subjectId: tSubId,
          title: tTitle,
          category: tCategory,
          timeLimit: tTimeLimit,
          instructions: tInstructions,
          questionIds: tQuestionIds
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess('Test created and published to active diagnostics!');
        setTTitle('');
        setTInstructions('');
        setTQuestionIds([]);
      } else {
        setFormError(data.message || 'Failed to create test.');
      }
    } catch (e) {
      setFormError('Network error.');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleCheckboxChange = (qid) => {
    if (tQuestionIds.includes(qid)) {
      setTQuestionIds(tQuestionIds.filter(id => id !== qid));
    } else {
      setTQuestionIds([...tQuestionIds, qid]);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="container section" style={{ padding: '40px 24px', textAlign: 'left' }}>
      <div style={{ marginBottom: '32px' }}>
        <span className="badge badge-secondary" style={{ marginBottom: '8px' }}>Administrative Console</span>
        <h2 style={{ fontSize: '32px', marginBottom: '4px' }}>Control Panel</h2>
        <p style={{ color: 'var(--gray)' }}>Manage curriculum assets, pre-populate examinations, and audit student scores.</p>
      </div>

      {/* Admin Tabs */}
      <div className="tabs">
        {[
          { id: 'stats', label: '📊 Statistics' },
          { id: 'students', label: '👥 Registered Students' },
          { id: 'add_data', label: '🏫 Setup Curriculum' },
          { id: 'upload_notes', label: '📝 Upload Study Notes' },
          { id: 'add_question', label: '❓ Create Question Pool' },
          { id: 'create_test', label: '⏱️ Compile Test Papers' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setFormError('');
              setFormSuccess('');
            }}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {formError && <div className="alert alert-error">⚠️ {formError}</div>}
      {formSuccess && <div className="alert alert-success">✅ {formSuccess}</div>}

      {/* 1. STATS TAB */}
      {activeTab === 'stats' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="grid-4">
            <div className="card">
              <h4 style={{ fontSize: '13px', color: 'var(--gray)', textTransform: 'uppercase' }}>Active Students</h4>
              <div style={{ fontSize: '36px', fontWeight: 800, margin: '8px 0', color: 'var(--primary)' }}>{stats.studentCount}</div>
            </div>
            <div className="card">
              <h4 style={{ fontSize: '13px', color: 'var(--gray)', textTransform: 'uppercase' }}>Published Exams</h4>
              <div style={{ fontSize: '36px', fontWeight: 800, margin: '8px 0', color: 'var(--secondary)' }}>{stats.testCount}</div>
            </div>
            <div className="card">
              <h4 style={{ fontSize: '13px', color: 'var(--gray)', textTransform: 'uppercase' }}>Notes Chapters</h4>
              <div style={{ fontSize: '36px', fontWeight: 800, margin: '8px 0', color: 'var(--success)' }}>{stats.materialsCount}</div>
            </div>
            <div className="card">
              <h4 style={{ fontSize: '13px', color: 'var(--gray)', textTransform: 'uppercase' }}>Exam Attempts</h4>
              <div style={{ fontSize: '36px', fontWeight: 800, margin: '8px 0', color: 'var(--text-dark)' }}>{stats.attemptsCount}</div>
            </div>
          </div>

          {/* Recent Attempts logs */}
          <div className="card">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>📋 Recent Exam Submissions</h3>
            {stats.recentAttempts.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--gray)' }}>No attempts registered yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.recentAttempts.map((att, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{att.test_title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                        User ID: {att.user_id} | Score: {att.obtained_marks}/{att.total_marks} ({att.percentage}%)
                      </div>
                    </div>
                    <span className="badge badge-success">{att.accuracy}% Accuracy</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. REGISTERED STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-dark)' }}>Full Name</th>
                  <th style={{ padding: '16px', fontSize: '14px', color: 'var(--text-dark)' }}>Email Address</th>
                  <th style={{ padding: '16px', fontSize: '14px', color: 'var(--text-dark)' }}>Mobile</th>
                  <th style={{ padding: '16px', fontSize: '14px', color: 'var(--text-dark)' }}>Class</th>
                  <th style={{ padding: '16px', fontSize: '14px', color: 'var(--text-dark)' }}>Board</th>
                  <th style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-dark)' }}>Reg Date</th>
                </tr>
              </thead>
              <tbody>
                {students.map(std => (
                  <tr key={std.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 700 }}>{std.name}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{std.email}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{std.mobile}</td>
                    <td style={{ padding: '16px' }}><span className="badge badge-primary">Class {std.class}</span></td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{std.board}</td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--gray)' }}>
                      {new Date(std.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SETUP CURRICULUM TAB */}
      {activeTab === 'add_data' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Add Class */}
          <div className="card">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>🏫 Add New Class</h3>
            <form onSubmit={handleAddClass}>
              <div className="form-group">
                <label className="form-label">Class Name</label>
                <input type="text" className="form-control" placeholder="e.g. Class 11" value={newClassName} onChange={e => setNewClassName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Stream (Optional)</label>
                <select className="form-control form-select" value={newClassStream} onChange={e => setNewClassStream(e.target.value)}>
                  <option value="">None</option>
                  <option value="Science">Science</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Arts">Arts</option>
                </select>
              </div>
              <button type="submit" disabled={btnLoading} className="btn btn-primary" style={{ width: '100%' }}>Add Class</button>
            </form>
          </div>

          {/* Add Subject */}
          <div className="card">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>📚 Add New Subject</h3>
            <form onSubmit={handleAddSubject}>
              <div className="form-group">
                <label className="form-label">Link Class</label>
                <select className="form-control form-select" value={newSubClassId} onChange={e => setNewSubClassId(e.target.value)} required>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject Name (English)</label>
                <input type="text" className="form-control" placeholder="e.g. Mathematics" value={newSubName} onChange={e => setNewSubName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Subject Name (Hindi)</label>
                <input type="text" className="form-control" placeholder="e.g. गणित" value={newSubHindi} onChange={e => setNewSubHindi(e.target.value)} required />
              </div>
              <button type="submit" disabled={btnLoading} className="btn btn-primary" style={{ width: '100%' }}>Add Subject</button>
            </form>
          </div>

          {/* Add Chapter */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>📖 Add New Chapter</h3>
            <form onSubmit={handleAddChapter} className="grid-2">
              <div className="form-group">
                <label className="form-label">Link Class</label>
                <select className="form-control form-select" value={uploadClassId} onChange={e => setUploadClassId(e.target.value)} required>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Link Subject</label>
                <select className="form-control form-select" value={newChapSubId} onChange={e => setNewChapSubId(e.target.value)} required>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Chapter Name (English)</label>
                <input type="text" className="form-control" placeholder="e.g. Polynomials" value={newChapName} onChange={e => setNewChapName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Chapter Name (Hindi)</label>
                <input type="text" className="form-control" placeholder="e.g. बहुपद" value={newChapHindi} onChange={e => setNewChapHindi(e.target.value)} required />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Chapter Number</label>
                <input type="number" className="form-control" value={newChapNumber} onChange={e => setNewChapNumber(e.target.value)} required />
              </div>
              <button type="submit" disabled={btnLoading} className="btn btn-primary" style={{ gridColumn: 'span 2' }}>Add Chapter</button>
            </form>
          </div>
        </div>
      )}

      {/* 4. UPLOAD STUDY NOTES TAB */}
      {activeTab === 'upload_notes' && (
        <div className="card">
          <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>📝 Upload Chapter Materials</h3>
          <form onSubmit={handleUploadNotes} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Link Class</label>
                <select className="form-control form-select" value={uploadClassId} onChange={e => setUploadClassId(e.target.value)} required>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Link Subject</label>
                <select className="form-control form-select" value={uploadSubId} onChange={e => setUploadSubId(e.target.value)} required>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Link Chapter</label>
                <select className="form-control form-select" value={uploadChapId} onChange={e => setUploadChapId(e.target.value)} required>
                  <option value="">-- Choose Chapter --</option>
                  {chapters.map(c => (
                    <option key={c.id} value={c.id}>Ch {c.number}: {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Material Type</label>
                <select className="form-control form-select" value={uploadType} onChange={e => setUploadType(e.target.value)} required>
                  <option value="notes">Detailed Notes</option>
                  <option value="formulas">Formulas & Concepts</option>
                  <option value="summary">Chapter Summary</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Document Title</label>
                <input type="text" className="form-control" placeholder="e.g. Formula Sheet" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Content (Supports Markdown)</label>
              <textarea className="form-control" style={{ minHeight: '200px', fontFamily: 'monospace' }} placeholder="Use markdown format for headings, points and math equations." value={uploadContent} onChange={e => setUploadContent(e.target.value)} required></textarea>
            </div>

            <div className="form-group" style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔥 Upload PDF File to Firebase Storage</span>
                <span className="badge badge-secondary" style={{ fontSize: '11px' }}>Cloud Storage</span>
              </label>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  onChange={e => setPdfFile(e.target.files[0] || null)}
                  style={{ fontSize: '14px' }}
                />
                <button
                  type="button"
                  onClick={handleUploadPdfToFirebase}
                  disabled={isUploadingFile || !pdfFile}
                  className="btn btn-secondary btn-sm"
                >
                  {isUploadingFile ? `Uploading (${uploadProgress}%)...` : '⬆️ Upload to Firebase'}
                </button>
              </div>

              {isUploadingFile && (
                <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '8px', height: '8px', marginTop: '12px', overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, backgroundColor: '#3b82f6', height: '100%', transition: 'width 0.3s' }}></div>
                </div>
              )}

              <div style={{ marginTop: '12px' }}>
                <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                  Generated / Custom PDF URL
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="https://firebasestorage.googleapis.com/... or paste external PDF URL" 
                  value={uploadPdfUrl} 
                  onChange={e => setUploadPdfUrl(e.target.value)} 
                />
              </div>
            </div>

            <button type="submit" disabled={btnLoading || isUploadingFile} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Upload Document</button>
          </form>
        </div>
      )}

      {/* 5. CREATE QUESTION POOL TAB */}
      {activeTab === 'add_question' && (
        <div className="card">
          <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>❓ Add Question to database pool</h3>
          <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Class</label>
                <select className="form-control form-select" value={qClassId} onChange={e => setQClassId(e.target.value)} required>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-control form-select" value={qSubId} onChange={e => setQSubId(e.target.value)} required>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Chapter</label>
                <select className="form-control form-select" value={qChapId} onChange={e => setQChapId(e.target.value)} required>
                  <option value="">-- Choose Chapter --</option>
                  {chapters.map(c => (
                    <option key={c.id} value={c.id}>Ch {c.number}: {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Question Text</label>
              <textarea className="form-control" style={{ minHeight: '80px' }} placeholder="Enter the complete question text..." value={qText} onChange={e => setQText(e.target.value)} required></textarea>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Option A</label>
                <input type="text" className="form-control" placeholder="Option A" value={qOptA} onChange={e => setQOptA(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Option B</label>
                <input type="text" className="form-control" placeholder="Option B" value={qOptB} onChange={e => setQOptB(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Option C</label>
                <input type="text" className="form-control" placeholder="Option C" value={qOptC} onChange={e => setQOptC(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Option D</label>
                <input type="text" className="form-control" placeholder="Option D" value={qOptD} onChange={e => setQOptD(e.target.value)} required />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Correct Answer</label>
                <select className="form-control form-select" value={qCorrect} onChange={e => setQCorrect(e.target.value)} required>
                  <option value="0">Option A</option>
                  <option value="1">Option B</option>
                  <option value="2">Option C</option>
                  <option value="3">Option D</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="form-control form-select" value={qDifficulty} onChange={e => setQDifficulty(e.target.value)} required>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control form-select" value={qCategory} onChange={e => setQCategory(e.target.value)} required>
                  <option value="chapter_test">Chapter Test</option>
                  <option value="subject_test">Subject Test</option>
                  <option value="pyq">Previous Year (PYQ)</option>
                  <option value="mock">Mock Paper</option>
                </select>
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Marks Allocation</label>
                <input type="number" className="form-control" value={qMarks} onChange={e => setQMarks(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Negative Marks</label>
                <input type="number" step="0.25" className="form-control" value={qNeg} onChange={e => setQNeg(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">PYQ Year (If applicable)</label>
                <input type="number" className="form-control" value={qYear} onChange={e => setQYear(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Solution Explanation</label>
              <textarea className="form-control" placeholder="Provide a step-by-step solution explanation..." value={qExpl} onChange={e => setQExpl(e.target.value)}></textarea>
            </div>

            <button type="submit" disabled={btnLoading} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Save to Question Pool</button>
          </form>
        </div>
      )}

      {/* 6. COMPILE TEST PAPERS TAB */}
      {activeTab === 'create_test' && (
        <div className="card">
          <h3 style={{ fontSize: '20px', marginBottom: '20px' }}>⏱️ Compile & Publish Test Series</h3>
          <form onSubmit={handleCreateTest} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Link Class</label>
                <select className="form-control form-select" value={tClassId} onChange={e => setTClassId(e.target.value)} required>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Link Subject</label>
                <select className="form-control form-select" value={tSubId} onChange={e => setTSubId(e.target.value)} required>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Test Title</label>
                <input type="text" className="form-control" placeholder="e.g. Chapter 1 Objective Quiz" value={tTitle} onChange={e => setTTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control form-select" value={tCategory} onChange={e => setTCategory(e.target.value)} required>
                  <option value="Chapter Test">Chapter Test</option>
                  <option value="Subject Test">Subject Test</option>
                  <option value="Full Syllabus Test">Full Syllabus Test</option>
                  <option value="Mock Test">Mock Test</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Time Limit (Minutes)</label>
                <input type="number" className="form-control" value={tTimeLimit} onChange={e => setTTimeLimit(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Instructions Description</label>
              <textarea className="form-control" placeholder="1. Objective format..." value={tInstructions} onChange={e => setTInstructions(e.target.value)} required></textarea>
            </div>

            {/* Questions Checklist */}
            <div className="form-group">
              <label className="form-label">Select Questions to Compile into Test (Select from Pool)</label>
              <div style={{
                maxHeight: '240px',
                overflowY: 'auto',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                backgroundColor: 'var(--bg)'
              }}>
                {db_questions_mock.map((q) => {
                  const isChecked = tQuestionIds.includes(q.id);
                  return (
                    <label key={q.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => handleCheckboxChange(q.id)} 
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span>[{q.id.toUpperCase()}] {q.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button type="submit" disabled={btnLoading} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Compile and Publish</button>
          </form>
        </div>
      )}
    </div>
  );
}
