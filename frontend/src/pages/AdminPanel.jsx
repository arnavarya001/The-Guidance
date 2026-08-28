import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadPdfToFirebase } from '../firebase';

export default function AdminPanel({ settings, onSettingsUpdated }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Global lists
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [tests, setTests] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [videos, setVideos] = useState([]);
  const [students, setStudents] = useState([]);
  const [attempts, setAttempts] = useState([]);

  // CMS Settings Form State
  const [cmsForm, setCmsForm] = useState({
    heroTitle: settings?.heroTitle || 'Bihar Board & CBSE Excellence Coaching',
    heroSubtitle: settings?.heroSubtitle || 'Complete structured preparation for Class 5 to 12.',
    coachingName: settings?.coachingName || 'The Guidance Coaching Institute',
    coachingDesc: settings?.coachingDesc || 'Empowering students across Bihar with state-of-the-art academic resources.',
    address: settings?.address || 'Bari Path, Near Patna College, Patna, Bihar - 800004',
    phone: settings?.phone || '+91 98765 43210',
    email: settings?.email || 'contact@theguidance.com',
    whatsapp: settings?.whatsapp || '+91 98765 43210',
    announcement: settings?.announcement || '📢 Admissions open for 2026-27 Matric & Inter batches!',
    facebookUrl: settings?.facebookUrl || '',
    youtubeUrl: settings?.youtubeUrl || '',
    telegramUrl: settings?.telegramUrl || ''
  });

  // Material Form
  const [matClassId, setMatClassId] = useState('');
  const [matSubjectId, setMatSubjectId] = useState('');
  const [matChapterId, setMatChapterId] = useState('');
  const [matType, setMatType] = useState('notes');
  const [matTitle, setMatTitle] = useState('');
  const [matContent, setMatContent] = useState('');
  const [matPdfUrl, setMatPdfUrl] = useState('');
  const [matFile, setMatFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Video Form
  const [vidClassId, setVidClassId] = useState('');
  const [vidSubjectId, setVidSubjectId] = useState('');
  const [vidChapter, setVidChapter] = useState('');
  const [vidTitle, setVidTitle] = useState('');
  const [vidTeacher, setVidTeacher] = useState('');
  const [vidDuration, setVidDuration] = useState('45:00');
  const [vidUrl, setVidUrl] = useState('');
  const [vidNotesUrl, setVidNotesUrl] = useState('');
  const [vidDesc, setVidDesc] = useState('');

  // Question Form
  const [qClassId, setQClassId] = useState('');
  const [qSubjectId, setQSubjectId] = useState('');
  const [qChapterId, setQChapterId] = useState('');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [qMarks, setQMarks] = useState(1);
  const [qNegative, setQNegative] = useState(0);
  const [qDifficulty, setQDifficulty] = useState('Medium');
  const [qCategory, setQCategory] = useState('chapter_test');

  // Test Form
  const [tClassId, setTClassId] = useState('');
  const [tSubjectId, setTSubjectId] = useState('');
  const [tTitle, setTTitle] = useState('');
  const [tCategory, setTCategory] = useState('chapter_test');
  const [tTimeLimit, setTTimeLimit] = useState(30);
  const [tInstructions, setTInstructions] = useState('');
  const [tSelectedQuestions, setTSelectedQuestions] = useState([]);

  // Status
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const token = localStorage.getItem('guidance_token') || 'admin_token';

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    if (settings) {
      setCmsForm(prev => ({ ...prev, ...settings }));
    }
  }, [settings]);

  // Load all admin data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [clsRes, qRes, tRes, matRes, vidRes, stuRes, attRes] = await Promise.allSettled([
        fetch('/api/courses/classes'),
        fetch('/api/questions'),
        fetch('/api/tests'),
        fetch('/api/study-materials'),
        fetch('/api/videos'),
        fetch('/api/admin/students', { headers: authHeaders }),
        fetch('/api/admin/attempts', { headers: authHeaders })
      ]);

      if (clsRes.status === 'fulfilled') {
        const clsData = await clsRes.value.json();
        if (Array.isArray(clsData)) {
          setClasses(clsData);
          if (clsData.length > 0) {
            setMatClassId(clsData[0].id);
            setVidClassId(clsData[0].id);
            setQClassId(clsData[0].id);
            setTClassId(clsData[0].id);
          }
        }
      }

      if (qRes.status === 'fulfilled') {
        const qData = await qRes.value.json();
        if (Array.isArray(qData)) setQuestions(qData);
      }

      if (tRes.status === 'fulfilled') {
        const tData = await tRes.value.json();
        if (Array.isArray(tData)) setTests(tData);
      }

      if (matRes.status === 'fulfilled') {
        const matData = await matRes.value.json();
        if (Array.isArray(matData)) setMaterials(matData);
      }

      if (vidRes.status === 'fulfilled') {
        const vidData = await vidRes.value.json();
        if (Array.isArray(vidData)) setVideos(vidData);
      }

      if (stuRes.status === 'fulfilled') {
        const stuData = await stuRes.value.json();
        if (Array.isArray(stuData)) setStudents(stuData);
      }

      if (attRes.status === 'fulfilled') {
        const attData = await attRes.value.json();
        if (Array.isArray(attData)) setAttempts(attData);
      }
    } catch (err) {
      console.warn('Error loading initial data in Admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Fetch subjects when selected class changes in forms
  useEffect(() => {
    const fetchSubs = async (cid) => {
      if (!cid) return;
      try {
        const res = await fetch(`/api/courses/subjects?classId=${cid}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSubjects(data);
          if (data.length > 0) {
            setMatSubjectId(data[0].id);
            setVidSubjectId(data[0].id);
            setQSubjectId(data[0].id);
            setTSubjectId(data[0].id);
          }
        }
      } catch (e) {
        console.warn('Failed to load subjects for class:', cid);
      }
    };
    fetchSubs(matClassId || qClassId || tClassId || 'c_10');
  }, [matClassId, qClassId, tClassId]);

  // Fetch chapters when selected subject changes
  useEffect(() => {
    const fetchChaps = async (sid) => {
      if (!sid) return;
      try {
        const res = await fetch(`/api/courses/chapters?subjectId=${sid}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setChapters(data);
          if (data.length > 0) {
            setMatChapterId(data[0].id);
            setQChapterId(data[0].id);
          }
        }
      } catch (e) {
        console.warn('Failed to load chapters for subject:', sid);
      }
    };
    fetchChaps(matSubjectId || qSubjectId);
  }, [matSubjectId, qSubjectId]);

  // Helper for notifications
  const notify = (msg, isErr = false) => {
    if (isErr) {
      setErrorMessage(msg);
      setSuccessMessage('');
    } else {
      setSuccessMessage(msg);
      setErrorMessage('');
    }
    setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 4000);
  };

  // 1. SAVE CMS SETTINGS
  const handleSaveCms = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(cmsForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save settings.');
      notify('Website content updated and published live!');
      if (onSettingsUpdated) onSettingsUpdated(cmsForm);
    } catch (err) {
      notify(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  // 2. FIREBASE PDF UPLOAD
  const handlePdfUpload = async () => {
    if (!matFile) {
      notify('Please select a PDF file first.', true);
      return;
    }
    setUploadingPdf(true);
    setUploadProgress(10);
    try {
      const downloadUrl = await uploadPdfToFirebase(matFile, (progress) => {
        setUploadProgress(progress);
      });
      setMatPdfUrl(downloadUrl);
      notify('PDF uploaded to Firebase Cloud Storage successfully!');
    } catch (err) {
      console.error(err);
      notify('Firebase PDF upload failed: ' + err.message, true);
    } finally {
      setUploadingPdf(false);
    }
  };

  // 3. CREATE STUDY MATERIAL
  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    if (!matChapterId || !matTitle || !matContent) {
      notify('Please fill chapter, title, and study content.', true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/study-materials', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          chapterId: matChapterId,
          type: matType,
          title: matTitle.trim(),
          content: matContent,
          pdfUrl: matPdfUrl
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save study material.');
      notify('Study material added successfully!');
      setMatTitle('');
      setMatContent('');
      setMatPdfUrl('');
      setMatFile(null);
      setUploadProgress(0);
      loadAllData();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  // DELETE STUDY MATERIAL
  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study resource?')) return;
    try {
      await fetch(`/api/admin/study-materials/${id}`, { method: 'DELETE', headers: authHeaders });
      notify('Study resource deleted.');
      setMaterials(materials.filter(m => m.id !== id));
    } catch (err) {
      notify('Delete failed.', true);
    }
  };

  // 4. CREATE VIDEO LECTURE
  const handleCreateVideo = async (e) => {
    e.preventDefault();
    if (!vidClassId || !vidTitle || !vidUrl) {
      notify('Class, Title, and Video URL are required.', true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          classId: vidClassId,
          subjectId: vidSubjectId,
          chapter: vidChapter.trim(),
          title: vidTitle.trim(),
          teacher: vidTeacher.trim() || 'Senior Faculty',
          duration: vidDuration.trim(),
          videoUrl: vidUrl.trim(),
          notesPdfUrl: vidNotesUrl.trim(),
          description: vidDesc.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save video.');
      notify('Video lecture published successfully!');
      setVidTitle('');
      setVidUrl('');
      setVidNotesUrl('');
      setVidDesc('');
      loadAllData();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  // DELETE VIDEO
  const handleDeleteVideo = async (id) => {
    if (!window.confirm('Delete this video lecture?')) return;
    try {
      await fetch(`/api/admin/videos/${id}`, { method: 'DELETE', headers: authHeaders });
      notify('Video lecture deleted.');
      setVideos(videos.filter(v => v.id !== id));
    } catch (err) {
      notify('Delete failed.', true);
    }
  };

  // 5. CREATE QUESTION
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!qClassId || !qSubjectId || !qChapterId || !qText || qOptions.some(o => !o.trim())) {
      notify('Please fill question text and all 4 options.', true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          classId: qClassId,
          subjectId: qSubjectId,
          chapterId: qChapterId,
          questionText: qText.trim(),
          options: qOptions,
          correctAnswer: Number(qCorrect),
          explanation: qExplanation.trim(),
          marks: Number(qMarks),
          negativeMarks: Number(qNegative),
          difficulty: qDifficulty,
          category: qCategory
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add question.');
      notify('Question added to database!');
      setQText('');
      setQOptions(['', '', '', '']);
      setQExplanation('');
      loadAllData();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  // DELETE QUESTION
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question from question pool?')) return;
    try {
      await fetch(`/api/admin/questions/${id}`, { method: 'DELETE', headers: authHeaders });
      notify('Question deleted.');
      setQuestions(questions.filter(q => q.id !== id));
    } catch (err) {
      notify('Delete failed.', true);
    }
  };

  // 6. CREATE TEST PAPER
  const handleCreateTest = async (e) => {
    e.preventDefault();
    if (!tClassId || !tSubjectId || !tTitle || tSelectedQuestions.length === 0) {
      notify('Please enter test title and select at least 1 question.', true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          classId: tClassId,
          subjectId: tSubjectId,
          title: tTitle.trim(),
          category: tCategory,
          timeLimit: Number(tTimeLimit),
          instructions: tInstructions.trim(),
          questionIds: tSelectedQuestions
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create test paper.');
      notify('Test paper created and published for students!');
      setTTitle('');
      setTInstructions('');
      setTSelectedQuestions([]);
      loadAllData();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  // DELETE TEST
  const handleDeleteTest = async (id) => {
    if (!window.confirm('Delete this test paper?')) return;
    try {
      await fetch(`/api/admin/tests/${id}`, { method: 'DELETE', headers: authHeaders });
      notify('Test deleted.');
      setTests(tests.filter(t => t.id !== id));
    } catch (err) {
      notify('Delete failed.', true);
    }
  };

  return (
    <div className="container section" style={{ padding: '36px 20px', minHeight: 'calc(100vh - 140px)' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px',
        padding: '24px 28px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: 'white',
        boxShadow: 'var(--shadow-premium)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ background: '#f59e0b', color: '#000', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
              COACHING CMS
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Admin Console • {user?.name}</span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: 'white' }}>
            The Guidance Management Dashboard
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
            Manage curriculum assets, website CMS content, Firebase Cloud PDFs, video lectures, and live tests.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => window.location.hash = '#home'}
            className="btn btn-outline"
            style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', padding: '8px 16px', fontSize: '13px' }}
          >
            👁️ View Public Site
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && <div className="alert alert-success" style={{ marginBottom: '20px' }}>✅ {successMessage}</div>}
      {errorMessage && <div className="alert alert-error" style={{ marginBottom: '20px' }}>⚠️ {errorMessage}</div>}

      {/* Navigation Tabs */}
      <div className="tabs" style={{ marginBottom: '28px', flexWrap: 'wrap', gap: '8px' }}>
        {[
          { id: 'dashboard', label: '📊 Statistics & Overview' },
          { id: 'cms', label: '🎨 Website Content (CMS)' },
          { id: 'materials', label: '📝 Study Notes & PDFs' },
          { id: 'videos', label: '🎥 Video Lectures' },
          { id: 'questions', label: '❓ Question Pool' },
          { id: 'tests', label: '⏱️ Test Series Engine' },
          { id: 'students', label: '👥 Student Roster' },
          { id: 'attempts', label: '🏆 Test Scores Audit' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 700 : 600
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. DASHBOARD & STATISTICS */}
      {activeTab === 'dashboard' && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {[
              { label: 'Registered Students', count: students.length || 3, icon: '👥', color: '#3b82f6' },
              { label: 'Curriculum Classes', count: classes.length || 8, icon: '🏫', color: '#8b5cf6' },
              { label: 'Study Resources & PDFs', count: materials.length || 12, icon: '📂', color: '#10b981' },
              { label: 'Video Lectures', count: videos.length || 3, icon: '🎥', color: '#ef4444' },
              { label: 'Question Bank', count: questions.length || 15, icon: '❓', color: '#f59e0b' },
              { label: 'Active Test Papers', count: tests.length || 6, icon: '⏱️', color: '#06b6d4' }
            ].map((stat, i) => (
              <div key={i} className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  backgroundColor: `${stat.color}15`,
                  color: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-dark)' }}>{stat.count}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: 600 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>⚡ Quick Management Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => setActiveTab('materials')} className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '12px' }}>
                  📂 Upload New Chapter Notes & PDF
                </button>
                <button onClick={() => setActiveTab('videos')} className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '12px' }}>
                  🎥 Add Video Lecture & Notes Link
                </button>
                <button onClick={() => setActiveTab('tests')} className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '12px' }}>
                  ⏱️ Compile New Model Examination
                </button>
                <button onClick={() => setActiveTab('cms')} className="btn btn-outline" style={{ justifyContent: 'flex-start', padding: '12px' }}>
                  🎨 Update Homepage Announcement Banner
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>📢 Current Live Announcement</h3>
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                fontSize: '14px',
                lineHeight: 1.6,
                color: '#92400e',
                marginBottom: '16px'
              }}>
                {cmsForm.announcement}
              </div>
              <button onClick={() => setActiveTab('cms')} className="btn btn-primary btn-sm">
                ✏️ Edit Live Announcement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CMS WEBSITE CONTENT MANAGER */}
      {activeTab === 'cms' && (
        <div className="card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>🎨 Website Content CMS</h3>
          <p style={{ color: 'var(--gray)', fontSize: '13px', marginBottom: '24px' }}>
            Edit coaching announcements, hero banners, contact info, and institute details. Changes reflect immediately across the platform.
          </p>

          <form onSubmit={handleSaveCms}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Coaching Institute Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={cmsForm.coachingName}
                  onChange={e => setCmsForm({ ...cmsForm, coachingName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Hero Headline</label>
                <input
                  type="text"
                  className="form-control"
                  value={cmsForm.heroTitle}
                  onChange={e => setCmsForm({ ...cmsForm, heroTitle: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Hero Subtitle & Highlights</label>
              <textarea
                className="form-control"
                rows="2"
                value={cmsForm.heroSubtitle}
                onChange={e => setCmsForm({ ...cmsForm, heroSubtitle: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Top Banner Announcement Notice (Visible on Homepage)</label>
              <input
                type="text"
                className="form-control"
                value={cmsForm.announcement}
                onChange={e => setCmsForm({ ...cmsForm, announcement: e.target.value })}
                placeholder="📢 Admissions open for 2026-27..."
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Contact Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={cmsForm.phone}
                  onChange={e => setCmsForm({ ...cmsForm, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={cmsForm.email}
                  onChange={e => setCmsForm({ ...cmsForm, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Campus Physical Address</label>
              <input
                type="text"
                className="form-control"
                value={cmsForm.address}
                onChange={e => setCmsForm({ ...cmsForm, address: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Institute Overview Description</label>
              <textarea
                className="form-control"
                rows="3"
                value={cmsForm.coachingDesc}
                onChange={e => setCmsForm({ ...cmsForm, coachingDesc: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontWeight: 700, borderRadius: '12px' }}
            >
              {actionLoading ? 'Saving...' : '💾 Save & Publish Content'}
            </button>
          </form>
        </div>
      )}

      {/* 3. STUDY MATERIALS & PDF CLOUD UPLOADER */}
      {activeTab === 'materials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>📝 Upload Study Notes & PDF Files</h3>
            <p style={{ color: 'var(--gray)', fontSize: '13px', marginBottom: '20px' }}>
              Publish interactive chapter summaries, formula sheets, and upload PDF files directly to <strong>Firebase Cloud Storage</strong>.
            </p>

            <form onSubmit={handleCreateMaterial}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-control form-select" value={matClassId} onChange={e => setMatClassId(e.target.value)}>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-control form-select" value={matSubjectId} onChange={e => setMatSubjectId(e.target.value)}>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.hindi_name})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Chapter</label>
                  <select className="form-control form-select" value={matChapterId} onChange={e => setMatChapterId(e.target.value)}>
                    {chapters.map(ch => <option key={ch.id} value={ch.id}>Ch {ch.number}: {ch.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Material Type</label>
                  <select className="form-control form-select" value={matType} onChange={e => setMatType(e.target.value)}>
                    <option value="notes">Detailed Chapter Notes</option>
                    <option value="formulas">Formulas & Concept Cheat Sheet</option>
                    <option value="summary">Quick Chapter Summary</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Document / Resource Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={matTitle}
                  onChange={e => setMatTitle(e.target.value)}
                  placeholder="e.g. Chapter 1 - Complete Formula Derivations & Board Notes"
                  required
                />
              </div>

              {/* Firebase PDF File Uploader Box */}
              <div style={{
                padding: '20px',
                backgroundColor: 'var(--bg-card-hover)',
                border: '2px dashed var(--border)',
                borderRadius: '16px',
                marginBottom: '20px'
              }}>
                <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  ☁️ Firebase Cloud Storage PDF Uploader
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={e => setMatFile(e.target.files[0])}
                    style={{ fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={handlePdfUpload}
                    disabled={!matFile || uploadingPdf}
                    className="btn btn-secondary btn-sm"
                  >
                    {uploadingPdf ? `Uploading (${uploadProgress}%)...` : '⬆️ Upload to Firebase'}
                  </button>
                </div>

                {matPdfUrl && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--success)' }}>
                    ✅ PDF Attached: <a href={matPdfUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>Open File</a>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Interactive Notes Body (Markdown supported)</label>
                <textarea
                  className="form-control"
                  rows="6"
                  value={matContent}
                  onChange={e => setMatContent(e.target.value)}
                  placeholder="# Chapter 1 Concepts&#10;&#10;## 1. Key Definitions&#10;- Point 1&#10;- Point 2"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontWeight: 700, borderRadius: '12px' }}
              >
                {actionLoading ? 'Publishing...' : 'Publish Study Notes'}
              </button>
            </form>
          </div>

          {/* Existing Materials List */}
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              📚 Published Study Materials ({materials.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {materials.map(m => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    backgroundColor: 'var(--bg-card-hover)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{m.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)', textTransform: 'capitalize' }}>
                      Type: {m.type} {m.pdf_url && '• 📄 PDF Attached'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {m.pdf_url && (
                      <a href={m.pdf_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                        View PDF
                      </a>
                    )}
                    <button onClick={() => handleDeleteMaterial(m.id)} className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. VIDEO LECTURES MANAGER */}
      {activeTab === 'videos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>🎥 Publish Video Lecture</h3>
            <p style={{ color: 'var(--gray)', fontSize: '13px', marginBottom: '20px' }}>
              Add YouTube / Cloud video classes with teacher names, duration, and attached PDF notes.
            </p>

            <form onSubmit={handleCreateVideo}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-control form-select" value={vidClassId} onChange={e => setVidClassId(e.target.value)}>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-control form-select" value={vidSubjectId} onChange={e => setVidSubjectId(e.target.value)}>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Lecture Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={vidTitle}
                    onChange={e => setVidTitle(e.target.value)}
                    placeholder="e.g. Chemical Reactions and Equations - Complete One Shot"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Faculty / Teacher Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={vidTeacher}
                    onChange={e => setVidTeacher(e.target.value)}
                    placeholder="Er. R. K. Singh"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Video Embed URL (YouTube or Cloud)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={vidUrl}
                    onChange={e => setVidUrl(e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Attached PDF Notes URL (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={vidNotesUrl}
                    onChange={e => setVidNotesUrl(e.target.value)}
                    placeholder="https://...pdf"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Lecture Description & Timestamps</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={vidDesc}
                  onChange={e => setVidDesc(e.target.value)}
                  placeholder="Overview of lecture topics, key board questions discussed..."
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontWeight: 700, borderRadius: '12px' }}
              >
                {actionLoading ? 'Saving...' : 'Publish Video Lecture'}
              </button>
            </form>
          </div>

          {/* Existing Videos */}
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              🎥 Published Video Classes ({videos.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {videos.map(v => (
                <div
                  key={v.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    backgroundColor: 'var(--bg-card-hover)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{v.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                      Teacher: {v.teacher} • Duration: {v.duration} {v.notes_pdf_url && '• 📄 PDF Notes'}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteVideo(v.id)} className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }}>
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. QUESTION POOL MANAGER */}
      {activeTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>❓ Create Question for Bank</h3>
            <p style={{ color: 'var(--gray)', fontSize: '13px', marginBottom: '20px' }}>
              Build MCQs with 4 options, explanations, difficulty ratings, and marks for online examinations.
            </p>

            <form onSubmit={handleCreateQuestion}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-control form-select" value={qClassId} onChange={e => setQClassId(e.target.value)}>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-control form-select" value={qSubjectId} onChange={e => setQSubjectId(e.target.value)}>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Question Text (Hindi / English)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  placeholder="e.g. Which gas is released when dilute HCl reacts with zinc metal?"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                {qOptions.map((opt, i) => (
                  <div key={i} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Option {i + 1}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={opt}
                      onChange={e => {
                        const copy = [...qOptions];
                        copy[i] = e.target.value;
                        setQOptions(copy);
                      }}
                      placeholder={`Option ${i + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Correct Option</label>
                  <select className="form-control form-select" value={qCorrect} onChange={e => setQCorrect(Number(e.target.value))}>
                    <option value={0}>Option 1 is Correct</option>
                    <option value={1}>Option 2 is Correct</option>
                    <option value={2}>Option 3 is Correct</option>
                    <option value={3}>Option 4 is Correct</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Marks / Difficulty</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      className="form-control"
                      value={qMarks}
                      onChange={e => setQMarks(e.target.value)}
                      placeholder="Marks"
                      style={{ width: '80px' }}
                    />
                    <select className="form-control form-select" value={qDifficulty} onChange={e => setQDifficulty(e.target.value)}>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Solution & Explanation</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={qExplanation}
                  onChange={e => setQExplanation(e.target.value)}
                  placeholder="Explanation of correct answer with chemical equation..."
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontWeight: 700, borderRadius: '12px' }}
              >
                {actionLoading ? 'Saving...' : 'Add Question to Bank'}
              </button>
            </form>
          </div>

          {/* Existing Questions Pool */}
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              ❓ Questions in Pool ({questions.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {questions.slice(0, 20).map(q => (
                <div
                  key={q.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    backgroundColor: 'var(--bg-card-hover)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ maxWidth: '80%' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{q.question_text}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                      Marks: {q.marks || 1} • Difficulty: {q.difficulty || 'Medium'} • Category: {q.category || 'Practice'}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteQuestion(q.id)} className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }}>
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. TEST SERIES ENGINE */}
      {activeTab === 'tests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>⏱️ Compile Online Test Paper</h3>
            <p style={{ color: 'var(--gray)', fontSize: '13px', marginBottom: '20px' }}>
              Assemble questions into full mock tests, set time limits, and publish for students.
            </p>

            <form onSubmit={handleCreateTest}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-control form-select" value={tClassId} onChange={e => setTClassId(e.target.value)}>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-control form-select" value={tSubjectId} onChange={e => setTSubjectId(e.target.value)}>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Test Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={tTitle}
                    onChange={e => setTTitle(e.target.value)}
                    placeholder="e.g. Matric Model Practice Test 1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Time Limit (Minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={tTimeLimit}
                    onChange={e => setTTimeLimit(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Exam Instructions</label>
                <input
                  type="text"
                  className="form-control"
                  value={tInstructions}
                  onChange={e => setTInstructions(e.target.value)}
                  placeholder="All questions are compulsory. Negative marking of 0.25 applies."
                />
              </div>

              {/* Select Questions */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Select Questions from Pool ({tSelectedQuestions.length} selected)
                </label>
                <div style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {questions.map(q => {
                    const isSelected = tSelectedQuestions.includes(q.id);
                    return (
                      <label
                        key={q.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setTSelectedQuestions(tSelectedQuestions.filter(id => id !== q.id));
                            } else {
                              setTSelectedQuestions([...tSelectedQuestions, q.id]);
                            }
                          }}
                        />
                        <span>{q.question_text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontWeight: 700, borderRadius: '12px' }}
              >
                {actionLoading ? 'Publishing Test...' : 'Publish Test Paper'}
              </button>
            </form>
          </div>

          {/* Active Tests List */}
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              ⏱️ Active Test Papers ({tests.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tests.map(t => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 18px',
                    backgroundColor: 'var(--bg-card-hover)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{t.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray)' }}>
                      Duration: {t.time_limit} mins • Total Marks: {t.total_marks} • Questions: {t.question_ids?.length || 0}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteTest(t.id)} className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }}>
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. STUDENT ROSTER */}
      {activeTab === 'students' && (
        <div className="card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>
            👥 Registered Student Roster ({students.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--gray)' }}>
                  <th style={{ padding: '12px 14px' }}>Name</th>
                  <th style={{ padding: '12px 14px' }}>Email</th>
                  <th style={{ padding: '12px 14px' }}>Mobile</th>
                  <th style={{ padding: '12px 14px' }}>Class</th>
                  <th style={{ padding: '12px 14px' }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700 }}>{s.name}</td>
                    <td style={{ padding: '12px 14px' }}>{s.email}</td>
                    <td style={{ padding: '12px 14px' }}>+91 {s.mobile}</td>
                    <td style={{ padding: '12px 14px' }}>{s.class}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`badge ${s.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                        {s.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. TEST SCORES AUDIT */}
      {activeTab === 'attempts' && (
        <div className="card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>
            🏆 Student Test Scorecards Audit ({attempts.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--gray)' }}>
                  <th style={{ padding: '12px 14px' }}>Student</th>
                  <th style={{ padding: '12px 14px' }}>Test Title</th>
                  <th style={{ padding: '12px 14px' }}>Score</th>
                  <th style={{ padding: '12px 14px' }}>Percentage</th>
                  <th style={{ padding: '12px 14px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map(att => (
                  <tr key={att.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700 }}>{att.student_name}</td>
                    <td style={{ padding: '12px 14px' }}>{att.test_title}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--primary)' }}>
                      {att.score} / {att.total_marks}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {att.percentage ? `${att.percentage}%` : `${Math.round((att.score / (att.total_marks || 1)) * 100)}%`}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--gray)' }}>
                      {att.completed_at ? new Date(att.completed_at).toLocaleDateString() : 'Recent'}
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
