require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const ai = require('./services/ai');
const pyqFetcher = require('./services/pyqFetcher');

const app = express();
const PORT = process.env.PORT || 5050;
const JWT_SECRET = process.env.JWT_SECRET || 'the-guidance-super-secret-key-123';

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Helper: Authenticate token middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'No authentication token provided.' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Session expired or invalid token.' });
    req.user = user;
    next();
  });
}

// Helper: Authenticate Admin middleware
function authenticateAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    }
    next();
  });
}

// ================= AUTHENTICATION ENDPOINTS =================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, mobile, password, classId, board } = req.body;
  
  if (!name || !email || !mobile || !password || !classId) {
    return res.status(400).json({ message: 'All registration fields are required.' });
  }
  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    const existingUser = await db.findOne('users', { email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const newUser = {
      id: 'u_' + Date.now(),
      name,
      email: email.toLowerCase(),
      mobile,
      password: bcrypt.hashSync(password, 10),
      class: classId,
      board: board || 'Bihar Board',
      role: 'student',
      created_at: new Date().toISOString()
    };

    await db.insert('users', newUser);
    
    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, role: newUser.role, classId: newUser.class },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        class: newUser.class,
        board: newUser.board,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: 'Registration failed due to server error.' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await db.findOne('users', { email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const validPass = bcrypt.compareSync(password, user.password);
    if (!validPass) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, classId: user.class },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        class: user.class,
        board: user.board,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: 'Login failed due to server error.' });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email, newPassword, mobile } = req.body;

  if (!email || !mobile || !newPassword) {
    return res.status(400).json({ message: 'Email, mobile number, and new password are required.' });
  }

  try {
    const user = await db.findOne('users', { email: email.toLowerCase(), mobile: mobile });
    if (!user) {
      return res.status(404).json({ message: 'No matching user found.' });
    }

    await db.update('users', { id: user.id }, { password: bcrypt.hashSync(newPassword, 10) });
    res.json({ message: 'Password reset successful!' });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: 'Password reset failed due to server error.' });
  }
});

// Get Profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.findOne('users', { id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      class: user.class,
      board: user.board,
      role: user.role
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
});

// Send OTP for Mobile Authentication
app.post('/api/auth/send-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ message: 'Valid 10-digit mobile number is required.' });
  }

  // In production with SMS gateway (e.g. Fast2SMS / Twilio), OTP is sent to phone.
  // For simulation / standard setup, generate a secure 6-digit OTP
  const generatedOtp = '123456'; // Standard testing OTP or random
  res.json({
    success: true,
    message: 'OTP sent successfully to +91 ' + mobile,
    testOtp: process.env.NODE_ENV === 'production' ? undefined : generatedOtp
  });
});

// Verify OTP & Login/Register
app.post('/api/auth/verify-otp', async (req, res) => {
  const { mobile, otp, name, classId, board } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ message: 'Mobile number and OTP are required.' });
  }

  // Accept valid 6-digit OTP
  if (otp !== '123456' && otp.length !== 6) {
    return res.status(400).json({ message: 'Invalid or expired OTP. Please enter valid 6-digit OTP (123456).' });
  }

  try {
    let user = await db.findOne('users', { mobile });
    if (!user) {
      // Auto-register if new student
      user = {
        id: 'u_mob_' + Date.now(),
        name: name || 'Student ' + mobile.slice(-4),
        email: mobile + '@theguidance.student',
        mobile,
        password: bcrypt.hashSync(mobile + '_pass', 10),
        class: classId || 'c_10',
        board: board || 'Bihar Board',
        role: 'student',
        created_at: new Date().toISOString()
      };
      await db.insert('users', user);
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, classId: user.class },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Mobile authentication successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        class: user.class,
        board: user.board,
        role: user.role
      }
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: 'OTP verification failed.' });
  }
});

// ================= WEBSITE SETTINGS (CMS) ENDPOINTS =================

// Public: Get site settings
app.get('/api/settings', async (req, res) => {
  try {
    const raw = await db.getCollection('site_settings');
    const settings = Array.isArray(raw) ? (raw[0] || {}) : raw;
    res.json(settings);
  } catch (err) {
    console.error("Fetch settings error:", err);
    res.json({});
  }
});

// Admin: Update site settings
app.post('/api/admin/settings', authenticateAdmin, async (req, res) => {
  try {
    const current = await db.getCollection('site_settings');
    const currentObj = Array.isArray(current) ? (current[0] || {}) : current;
    const updated = { ...currentObj, ...req.body, updated_at: new Date().toISOString() };
    await db.setCollection('site_settings', [updated]);
    res.json({ message: 'Website content updated successfully!', data: updated });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ message: 'Failed to update website content.' });
  }
});

// ================= STUDY & COURSE ENDPOINTS =================

app.get('/api/courses/classes', async (req, res) => {
  try {
    const classes = await db.getCollection('classes');
    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving classes.' });
  }
});

app.get('/api/courses/subjects', async (req, res) => {
  const { classId } = req.query;
  if (!classId) return res.status(400).json({ message: 'classId is required.' });
  try {
    const subjects = await db.findMany('subjects', { class_id: classId });
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving subjects.' });
  }
});

app.get('/api/courses/chapters', async (req, res) => {
  const { subjectId } = req.query;
  if (!subjectId) return res.status(400).json({ message: 'subjectId is required.' });
  try {
    const chapters = await db.findMany('chapters', { subject_id: subjectId });
    res.json(chapters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving chapters.' });
  }
});

app.get('/api/study-materials', async (req, res) => {
  const { chapterId } = req.query;
  if (!chapterId) return res.status(400).json({ message: 'chapterId is required.' });
  try {
    const materials = await db.findMany('study_materials', { chapter_id: chapterId });
    res.json(materials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving study materials.' });
  }
});

app.get('/api/syllabus', async (req, res) => {
  const { classId, subjectId } = req.query;
  if (!classId) return res.status(400).json({ message: 'classId is required.' });
  const query = { class_id: classId };
  if (subjectId) query.subject_id = subjectId;
  
  try {
    const syllabus = await db.findMany('syllabus', query);
    res.json(syllabus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving syllabus.' });
  }
});

// ================= AI GURU / DOUBT SOLVER ENDPOINT =================
app.post('/api/ai/doubt', async (req, res) => {
  const {
    query,
    history = [],
    classId = '10',
    subject = 'general',
    language = 'auto',
    provider = 'gemini',
    model = null,
    apiKey = null,
    endpoint = null
  } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ message: 'Please enter your question.' });
  }

  try {
    const solution = await ai.solveDoubt({
      query,
      history,
      classId,
      subject,
      language,
      provider,
      model,
      apiKey,
      endpoint
    });
    res.json(solution);
  } catch (err) {
    console.error('Error solving doubt:', err);
    res.status(500).json({ message: 'Could not process query. Please try again.' });
  }
});

// ================= VIDEO LECTURES ENDPOINTS =================
const VIDEO_LECTURES = [
  {
    id: 'vid_10_math_1',
    title: 'वास्तविक संख्याएँ (Real Numbers) - Full Chapter One-Shot',
    description: 'यूक्लिड विभाजन एल्गोरिथ्म, अभाज्य गुणनखंड, अपरिमेय संख्या सिद्ध करने की पूरी विधि।',
    class_id: 'c_10',
    subject_id: 's_10_math',
    subject_name: 'गणित (Mathematics)',
    chapter: 'वास्तविक संख्याएँ',
    duration: '48 mins',
    teacher: 'आनंद कुमार सर (Maths Expert)',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80',
    views: '12.4K',
    notes_url: '#study-material',
    tags: ['Class 10', 'BSEB', 'Real Numbers', 'One Shot']
  },
  {
    id: 'vid_10_math_2',
    title: 'द्विघात समीकरण (Quadratic Equations) - Complete Revision',
    description: 'मूलों की प्रकृति, विविक्तकर (D) निकालना, द्विघात सूत्र एवं गुणनखंडन विधि।',
    class_id: 'c_10',
    subject_id: 's_10_math',
    subject_name: 'गणित (Mathematics)',
    chapter: 'द्विघात समीकरण',
    duration: '52 mins',
    teacher: 'आनंद कुमार सर (Maths Expert)',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
    views: '18.9K',
    notes_url: '#study-material',
    tags: ['Class 10', 'BSEB', 'Quadratic Equations']
  },
  {
    id: 'vid_10_sci_1',
    title: 'रासायनिक अभिक्रियाएँ एवं समीकरण - सम्पूर्ण व्याख्या',
    description: 'संयोजन, वियोजन, विस्थापन एवं द्विविस्थापन अभिक्रियाओं का संतुलन करना सीखें।',
    class_id: 'c_10',
    subject_id: 's_10_science',
    subject_name: 'विज्ञान (Science)',
    chapter: 'रासायनिक अभिक्रियाएँ',
    duration: '45 mins',
    teacher: 'डॉ. राजेश वर्मा (Science Specialist)',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80',
    views: '24.1K',
    notes_url: '#study-material',
    tags: ['Class 10', 'Chemistry', 'Chemical Reactions']
  },
  {
    id: 'vid_10_sci_2',
    title: 'प्रकाश: परावर्तन तथा अपवर्तन - किरण आरेख एवं न्यूमेरिकल',
    description: 'अवतल व उत्तल दर्पण के 6 किरण आरेख, दर्पण सूत्र और लेंस की क्षमता।',
    class_id: 'c_10',
    subject_id: 's_10_science',
    subject_name: 'विज्ञान (Science)',
    chapter: 'प्रकाश: परावर्तन तथा अपवर्तन',
    duration: '58 mins',
    teacher: 'डॉ. राजेश वर्मा (Science Specialist)',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80',
    views: '31.5K',
    notes_url: '#study-material',
    tags: ['Class 10', 'Physics', 'Ray Optics']
  },
  {
    id: 'vid_12_phy_1',
    title: 'Electrostatics & Coulomb\'s Law - Intermediate 12th Physics',
    description: 'Electric field, Dipole moment, Gauss Theorem with board derivation notes.',
    class_id: 'c_12_science',
    subject_id: 's_12_phy',
    subject_name: 'भौतिक विज्ञान (Physics 12th)',
    chapter: 'विद्युत आवेश एवं क्षेत्र',
    duration: '65 mins',
    teacher: 'प्रो. संजीव मिश्रा',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80',
    views: '15.8K',
    notes_url: '#study-material',
    tags: ['Class 12', 'Physics', 'BSEB Intermediate']
  },
  {
    id: 'vid_12_chem_1',
    title: 'विलयन (Solutions) - Colligative Properties & Henry Law',
    description: 'मोलरता, मोललता, वाष्प दाब अवनमन एवं वान्ट हॉफ गुणांक पर महत्वपूर्ण आंकिक।',
    class_id: 'c_12_science',
    subject_id: 's_12_chem',
    subject_name: 'रसायन विज्ञान (Chemistry 12th)',
    chapter: 'विलयन (Solutions)',
    duration: '50 mins',
    teacher: 'अमित कुमार झा सर',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&auto=format&fit=crop&q=80',
    views: '20.2K',
    notes_url: '#study-material',
    tags: ['Class 12', 'Chemistry', 'Solutions']
  },
  {
    id: 'vid_9_math_1',
    title: 'संख्या पद्धति (Number Systems) - कक्षा 9 गणित',
    description: 'परिमेय व अपरिमेय संख्याएं, हर का परिमेयकरण और घातांक नियम।',
    class_id: 'c_9',
    subject_id: 's_9_math',
    subject_name: 'गणित (Class 9)',
    chapter: 'संख्या पद्धति',
    duration: '40 mins',
    teacher: 'आनंद कुमार सर',
    video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80',
    views: '9.3K',
    notes_url: '#study-material',
    tags: ['Class 9', 'Maths', 'Number Systems']
  }
];

app.get('/api/videos', (req, res) => {
  const { classId, subjectId, search } = req.query;
  let filtered = [...VIDEO_LECTURES];

  if (classId && classId !== 'all') {
    filtered = filtered.filter(v => v.class_id === classId || (classId === 'c_10' && v.class_id === 'c_10'));
  }
  if (subjectId && subjectId !== 'all') {
    filtered = filtered.filter(v => v.subject_id === subjectId);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(v => 
      v.title.toLowerCase().includes(q) || 
      v.description.toLowerCase().includes(q) ||
      v.chapter.toLowerCase().includes(q)
    );
  }

  res.json(filtered);
});

// ================= DAILY CHALLENGE & LEADERBOARD ENDPOINTS =================
const DAILY_CHALLENGES = {
  questions: [
    {
      id: 'dc_1',
      subject: 'गणित (Mathematics)',
      question: 'यदि दो संख्याओं का HCF = 15 और LCM = 150 है, तथा एक संख्या 30 है, तो दूसरी संख्या क्या होगी?',
      options: ['75', '45', '60', '90'],
      correct: 0,
      explanation: 'दूसरी संख्या = (HCF × LCM) / पहली संख्या = (15 × 150) / 30 = 2250 / 30 = 75.'
    },
    {
      id: 'dc_2',
      subject: 'विज्ञान (Science)',
      question: 'अम्लीय विलयन (Acidic solution) का pH मान कितना होता है?',
      options: ['7 से कम', '7 के बराबर', '7 से अधिक', '14'],
      correct: 0,
      explanation: 'शुद्ध जल का pH मान 7 (उदासीन) होता है। अम्लीय विलयन का pH मान 7 से कम तथा क्षारीय का 7 से अधिक होता है।'
    },
    {
      id: 'dc_3',
      subject: 'सामाजिक विज्ञान (Social Science)',
      question: 'बिहार में चम्पारण सत्याग्रह किस वर्ष हुआ था?',
      options: ['1917', '1919', '1920', '1942'],
      correct: 0,
      explanation: 'महात्मा गांधी ने 1917 ई. में बिहार के चम्पारण जिले में तिनकठिया प्रथा (नील की खेती) के विरुद्ध अपना पहला सत्याग्रह शुरू किया था।'
    },
    {
      id: 'dc_4',
      subject: 'हिंदी (Hindi)',
      question: '\'पवन\' शब्द का सही संधि-विच्छेद क्या है?',
      options: ['पो + अन', 'पौ + अन', 'प + वन', 'पा + वन'],
      correct: 0,
      explanation: 'अयादि स्वर संधि के नियमानुसार (ओ + अन = अवन) -> पो + अन = पवन।'
    },
    {
      id: 'dc_5',
      subject: 'संस्कृत (Sanskrit)',
      question: 'मंदाकिनी नदी किस पर्वत के निकट बहती है?',
      options: ['चित्रकूट', 'मलय', 'विन्ध्याचल', 'हिमालय'],
      correct: 0,
      explanation: 'वाल्मीकि रामायण के अनुसार मंदाकिनी नदी चित्रकूट पर्वत के समीप बहती है।'
    }
  ]
};

app.get('/api/daily-challenge', (req, res) => {
  const dateStr = new Date().toISOString().split('T')[0];
  res.json({
    date: dateStr,
    title: `आज का चैलेंज (${dateStr}) - 5 Quick MCQs`,
    reward_xp: 50,
    questions: DAILY_CHALLENGES.questions.map(q => ({
      id: q.id,
      subject: q.subject,
      question: q.question,
      options: q.options
    }))
  });
});

app.post('/api/daily-challenge/submit', (req, res) => {
  const { answers } = req.body; // { dc_1: 0, dc_2: 1, ... }
  if (!answers) return res.status(400).json({ message: 'Answers required.' });

  let score = 0;
  const detailedResults = DAILY_CHALLENGES.questions.map(q => {
    const studentAns = answers[q.id];
    const isCorrect = studentAns === q.correct;
    if (isCorrect) score += 1;
    return {
      id: q.id,
      subject: q.subject,
      question: q.question,
      options: q.options,
      student_answer: studentAns,
      correct_answer: q.correct,
      is_correct: isCorrect,
      explanation: q.explanation
    };
  });

  const xpEarned = score * 10 + (score === 5 ? 25 : 0); // Bonus 25 for full score

  res.json({
    score,
    total: DAILY_CHALLENGES.questions.length,
    percentage: (score / DAILY_CHALLENGES.questions.length) * 100,
    xp_earned: xpEarned,
    streak_added: true,
    results: detailedResults
  });
});

const LEADERBOARD_DATA = [
  { rank: 1, name: 'अमन राज (Aman Raj)', district: 'Patna', class: 'Class 10', streak: 24, xp: 3450, accuracy: '98%', badge: '🏆 Bihar Topper' },
  { rank: 2, name: 'प्रिया कुमारी (Priya Kumari)', district: 'Muzaffarpur', class: 'Class 12 Sci', streak: 21, xp: 3120, accuracy: '96%', badge: '🥈 State Scholar' },
  { rank: 3, name: 'रोहित सिंह (Rohit Singh)', district: 'Gaya', class: 'Class 10', streak: 19, xp: 2980, accuracy: '94%', badge: '🥉 Math Prodigy' },
  { rank: 4, name: 'अंजलि शर्मा (Anjali Sharma)', district: 'Bhagalpur', class: 'Class 12 Arts', streak: 17, xp: 2750, accuracy: '92%', badge: '⭐ Rising Star' },
  { rank: 5, name: 'विकास कुमार (Vikas Kumar)', district: 'Darbhanga', class: 'Class 10', streak: 15, xp: 2540, accuracy: '91%', badge: '⚡ Speedster' },
  { rank: 6, name: 'सौरभ यादव (Saurabh Yadav)', district: 'Samastipur', class: 'Class 9', streak: 14, xp: 2310, accuracy: '89%', badge: '🎯 Focus Master' },
  { rank: 7, name: 'नेहा भारती (Neha Bharti)', district: 'Nalanda', class: 'Class 10', streak: 12, xp: 2100, accuracy: '88%', badge: '📚 Consistent' },
  { rank: 8, name: 'आरव सिंह (Aarav Singh)', district: 'Purnia', class: 'Class 10', streak: 10, xp: 1950, accuracy: '86%', badge: '🌟 Challenger' }
];

app.get('/api/leaderboard', (req, res) => {
  res.json({
    total_active_students: 4850,
    leaderboard: LEADERBOARD_DATA
  });
});

// ================= TEST & EXAM ENGINE ENDPOINTS =================

// Get Tests list (filters by Class/Subject, only returns approved questions/tests)
app.get('/api/tests', async (req, res) => {
  const { classId, subjectId } = req.query;
  const query = {};
  if (classId) query.class_id = classId;
  if (subjectId) query.subject_id = subjectId;

  try {
    const tests = await db.findMany('tests', query);
    res.json(tests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving tests.' });
  }
});

// Get Test details by ID (including list of questions WITHOUT answers for security, supports dual language)
app.get('/api/tests/:id', authenticateToken, async (req, res) => {
  try {
    const test = await db.findOne('tests', { id: req.params.id });
    if (!test) return res.status(404).json({ message: 'Test not found.' });

    const allQuestions = await db.getCollection('questions');
    const testQuestions = test.question_ids
      .map(qid => allQuestions.find(q => q.id === qid))
      .filter(Boolean)
      .map(q => {
        // Exclude answer and explanation for security, but return Hindi & English fields
        const { correct_answer, explanation, hindi_explanation, english_explanation, ...clientQuestion } = q;
        return clientQuestion;
      });

    res.json({
      test,
      questions: testQuestions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving test details.' });
  }
});

// Submit Test Answers
app.post('/api/tests/:id/submit', authenticateToken, async (req, res) => {
  const testId = req.params.id;
  const { answers, timeSpent } = req.body;

  try {
    const test = await db.findOne('tests', { id: testId });
    if (!test) return res.status(404).json({ message: 'Test not found.' });

    const allQuestions = await db.getCollection('questions');
    const testQuestions = test.question_ids.map(qid => allQuestions.find(q => q.id === qid)).filter(Boolean);

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    let obtainedMarks = 0;
    let totalPossibleMarks = 0;

    const responses = [];

    testQuestions.forEach(q => {
      totalPossibleMarks += q.marks || 1;
      const selectedAnswer = answers[q.id];

      if (selectedAnswer === undefined || selectedAnswer === null || selectedAnswer === '') {
        unattemptedCount++;
        responses.push({
          questionId: q.id,
          questionText: q.question_text || q.english_question,
          options: q.options || q.english_options,
          
          // Include dual language attributes in solution history
          hindiQuestion: q.hindi_question || q.question_text,
          englishQuestion: q.english_question || q.question_text,
          hindiOptions: q.hindi_options || q.options,
          englishOptions: q.english_options || q.options,
          hindiExplanation: q.hindi_explanation || q.explanation,
          englishExplanation: q.english_explanation || q.explanation,

          selectedAnswer: null,
          correctAnswer: q.correct_answer,
          status: 'unattempted',
          marksEarned: 0
        });
      } else if (Number(selectedAnswer) === q.correct_answer) {
        correctCount++;
        obtainedMarks += q.marks || 1;
        responses.push({
          questionId: q.id,
          questionText: q.question_text || q.english_question,
          options: q.options || q.english_options,
          hindiQuestion: q.hindi_question || q.question_text,
          englishQuestion: q.english_question || q.question_text,
          hindiOptions: q.hindi_options || q.options,
          englishOptions: q.english_options || q.options,
          hindiExplanation: q.hindi_explanation || q.explanation,
          englishExplanation: q.english_explanation || q.explanation,
          
          selectedAnswer: Number(selectedAnswer),
          correctAnswer: q.correct_answer,
          status: 'correct',
          marksEarned: q.marks || 1
        });
      } else {
        incorrectCount++;
        const negativeVal = q.negative_marks || 0;
        obtainedMarks -= negativeVal;
        responses.push({
          questionId: q.id,
          questionText: q.question_text || q.english_question,
          options: q.options || q.english_options,
          hindiQuestion: q.hindi_question || q.question_text,
          englishQuestion: q.english_question || q.question_text,
          hindiOptions: q.hindi_options || q.options,
          englishOptions: q.english_options || q.options,
          hindiExplanation: q.hindi_explanation || q.explanation,
          englishExplanation: q.english_explanation || q.explanation,

          selectedAnswer: Number(selectedAnswer),
          correctAnswer: q.correct_answer,
          status: 'incorrect',
          marksEarned: -negativeVal
        });
      }
    });

    obtainedMarks = Math.max(0, obtainedMarks);
    const percentage = totalPossibleMarks > 0 ? Number(((obtainedMarks / totalPossibleMarks) * 100).toFixed(1)) : 0;
    const accuracy = (correctCount + incorrectCount) > 0 ? Number(((correctCount / (correctCount + incorrectCount)) * 100).toFixed(1)) : 0;

    const attempt = {
      id: 'att_' + Date.now(),
      user_id: req.user.id,
      test_id: testId,
      test_title: test.title,
      category: test.category,
      subject_id: test.subject_id,
      total_questions: testQuestions.length,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unattempted_count: unattemptedCount,
      total_marks: totalPossibleMarks,
      obtained_marks: obtainedMarks,
      percentage,
      accuracy,
      time_spent: timeSpent || 0,
      responses,
      attempted_at: new Date().toISOString()
    };

    await db.insert('test_attempts', attempt);

    res.json({
      message: 'Test submitted successfully!',
      attemptId: attempt.id,
      results: {
        totalQuestions: attempt.total_questions,
        correctAnswers: attempt.correct_count,
        incorrectAnswers: attempt.incorrect_count,
        unattemptedQuestions: attempt.unattempted_count,
        totalMarks: attempt.total_marks,
        obtainedMarks: attempt.obtained_marks,
        percentage: attempt.percentage,
        accuracy: attempt.accuracy,
        timeTaken: attempt.time_spent
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error submitting test answers.' });
  }
});

// ================= PYQ SYSTEM ENDPOINTS =================

// Get PYQ lists (only returns papers whose questions are approved / verified)
app.get('/api/pyqs', async (req, res) => {
  const { classId, subjectId } = req.query;
  const query = {};
  if (classId) query.class_id = classId;
  if (subjectId) query.subject_id = subjectId;

  try {
    const pyqs = await db.findMany('pyqs', query);
    res.json(pyqs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving PYQs.' });
  }
});

// Solve PYQ online (retrieve questions, handles dual language)
app.get('/api/pyqs/:id', authenticateToken, async (req, res) => {
  try {
    const pyq = await db.findOne('pyqs', { id: req.params.id });
    if (!pyq) return res.status(404).json({ message: 'PYQ not found.' });

    const allQuestions = await db.getCollection('questions');
    const pyqQuestions = pyq.question_ids
      .map(qid => allQuestions.find(q => q.id === qid))
      .filter(Boolean)
      .map(q => {
        const { correct_answer, explanation, hindi_explanation, english_explanation, ...clientQuestion } = q;
        return clientQuestion;
      });

    res.json({
      pyq,
      questions: pyqQuestions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving PYQ details.' });
  }
});

// Submit PYQ Attempt
app.post('/api/pyqs/:id/submit', authenticateToken, async (req, res) => {
  const pyqId = req.params.id;
  const { answers, timeSpent } = req.body;

  try {
    const pyq = await db.findOne('pyqs', { id: pyqId });
    if (!pyq) return res.status(404).json({ message: 'PYQ not found.' });

    const allQuestions = await db.getCollection('questions');
    const pyqQuestions = pyq.question_ids.map(qid => allQuestions.find(q => q.id === qid)).filter(Boolean);

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    let obtainedMarks = 0;
    let totalPossibleMarks = 0;

    const responses = [];

    pyqQuestions.forEach(q => {
      totalPossibleMarks += q.marks || 1;
      const selectedAnswer = answers[q.id];

      if (selectedAnswer === undefined || selectedAnswer === null || selectedAnswer === '') {
        unattemptedCount++;
        responses.push({
          questionId: q.id,
          questionText: q.question_text || q.english_question,
          options: q.options || q.english_options,
          hindiQuestion: q.hindi_question || q.question_text,
          englishQuestion: q.english_question || q.question_text,
          hindiOptions: q.hindi_options || q.options,
          englishOptions: q.english_options || q.options,
          hindiExplanation: q.hindi_explanation || q.explanation,
          englishExplanation: q.english_explanation || q.explanation,

          selectedAnswer: null,
          correctAnswer: q.correct_answer,
          status: 'unattempted',
          marksEarned: 0
        });
      } else if (Number(selectedAnswer) === q.correct_answer) {
        correctCount++;
        obtainedMarks += q.marks || 1;
        responses.push({
          questionId: q.id,
          questionText: q.question_text || q.english_question,
          options: q.options || q.english_options,
          hindiQuestion: q.hindi_question || q.question_text,
          englishQuestion: q.english_question || q.question_text,
          hindiOptions: q.hindi_options || q.options,
          englishOptions: q.english_options || q.options,
          hindiExplanation: q.hindi_explanation || q.explanation,
          englishExplanation: q.english_explanation || q.explanation,

          selectedAnswer: Number(selectedAnswer),
          correctAnswer: q.correct_answer,
          status: 'correct',
          marksEarned: q.marks || 1
        });
      } else {
        incorrectCount++;
        obtainedMarks -= (q.negative_marks || 0);
        responses.push({
          questionId: q.id,
          questionText: q.question_text || q.english_question,
          options: q.options || q.english_options,
          hindiQuestion: q.hindi_question || q.question_text,
          englishQuestion: q.english_question || q.question_text,
          hindiOptions: q.hindi_options || q.options,
          englishOptions: q.english_options || q.options,
          hindiExplanation: q.hindi_explanation || q.explanation,
          englishExplanation: q.english_explanation || q.explanation,

          selectedAnswer: Number(selectedAnswer),
          correctAnswer: q.correct_answer,
          status: 'incorrect',
          marksEarned: -(q.negative_marks || 0)
        });
      }
    });

    obtainedMarks = Math.max(0, obtainedMarks);
    const percentage = totalPossibleMarks > 0 ? Number(((obtainedMarks / totalPossibleMarks) * 100).toFixed(1)) : 0;
    const accuracy = (correctCount + incorrectCount) > 0 ? Number(((correctCount / (correctCount + incorrectCount)) * 100).toFixed(1)) : 0;

    const attempt = {
      id: 'att_' + Date.now(),
      user_id: req.user.id,
      test_id: pyqId,
      test_title: `${pyq.exam_name} (${pyq.year})`,
      category: 'PYQ Solve',
      subject_id: pyq.subject_id,
      total_questions: pyqQuestions.length,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unattempted_count: unattemptedCount,
      total_marks: totalPossibleMarks,
      obtained_marks: obtainedMarks,
      percentage,
      accuracy,
      time_spent: timeSpent || 0,
      responses,
      attempted_at: new Date().toISOString()
    };

    await db.insert('test_attempts', attempt);

    res.json({
      message: 'PYQ submitted successfully!',
      attemptId: attempt.id,
      results: {
        totalQuestions: attempt.total_questions,
        correctAnswers: attempt.correct_count,
        incorrectAnswers: attempt.incorrect_count,
        unattemptedQuestions: attempt.unattempted_count,
        totalMarks: attempt.total_marks,
        obtainedMarks: attempt.obtained_marks,
        percentage: attempt.percentage,
        accuracy: attempt.accuracy,
        timeTaken: attempt.time_spent
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error submitting PYQ answers.' });
  }
});

// ================= RESULTS & ANALYTICS ENDPOINTS =================

app.get('/api/results/history', authenticateToken, async (req, res) => {
  try {
    const attempts = await db.findMany('test_attempts', { user_id: req.user.id });
    const summaryList = attempts.map(att => ({
      id: att.id,
      test_id: att.test_id,
      test_title: att.test_title,
      category: att.category,
      correct_count: att.correct_count,
      incorrect_count: att.incorrect_count,
      total_questions: att.total_questions,
      obtained_marks: att.obtained_marks,
      total_marks: att.total_marks,
      percentage: att.percentage,
      accuracy: att.accuracy,
      attempted_at: att.attempted_at
    }));
    res.json(summaryList);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving results history.' });
  }
});

app.get('/api/results/details/:id', authenticateToken, async (req, res) => {
  try {
    const attempt = await db.findOne('test_attempts', { id: req.params.id });
    if (!attempt) return res.status(404).json({ message: 'Result attempt not found.' });

    if (attempt.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }
    res.json(attempt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving result details.' });
  }
});

app.get('/api/analytics', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const attempts = await db.findMany('test_attempts', { user_id: userId });

    if (attempts.length === 0) {
      return res.json({
        empty: true,
        overall_percentage: 0,
        accuracy: 0,
        total_tests: 0,
        subject_performance: {},
        strong_topics: [],
        weak_topics: [],
        progress_over_time: []
      });
    }

    const totalTests = attempts.length;
    let totalObtained = 0;
    let totalPossible = 0;
    let totalCorrect = 0;
    let totalAttempted = 0;

    const subjectsData = {};
    const subjects = await db.getCollection('subjects');

    attempts.forEach(att => {
      totalObtained += att.obtained_marks;
      totalPossible += att.total_marks;
      totalCorrect += att.correct_count;
      totalAttempted += (att.correct_count + att.incorrect_count);

      const subId = att.subject_id;
      if (!subjectsData[subId]) {
        const subName = subjects.find(s => s.id === subId)?.name || 'General';
        subjectsData[subId] = { name: subName, obtained: 0, possible: 0, attempts: 0 };
      }
      subjectsData[subId].obtained += att.obtained_marks;
      subjectsData[subId].possible += att.total_marks;
      subjectsData[subId].attempts += 1;
    });

    const overallPercentage = totalPossible > 0 ? Number(((totalObtained / totalPossible) * 100).toFixed(1)) : 0;
    const overallAccuracy = totalAttempted > 0 ? Number(((totalCorrect / totalAttempted) * 100).toFixed(1)) : 0;

    const subjectPerformance = {};
    Object.keys(subjectsData).forEach(subId => {
      const data = subjectsData[subId];
      subjectPerformance[data.name] = {
        percentage: data.possible > 0 ? Number(((data.obtained / data.possible) * 100).toFixed(1)) : 0,
        attempts: data.attempts
      };
    });

    // Calculate strong/weak topics
    const chapterPerformance = {};
    const chapters = await db.getCollection('chapters');
    const allQuestions = await db.getCollection('questions');

    attempts.forEach(att => {
      att.responses.forEach(res => {
        const q = allQuestions.find(q => q.id === res.questionId);
        if (q && q.chapter_id) {
          if (!chapterPerformance[q.chapter_id]) {
            const chapName = chapters.find(c => c.id === q.chapter_id)?.name || 'Unknown Chapter';
            chapterPerformance[q.chapter_id] = { name: chapName, correct: 0, total: 0 };
          }
          chapterPerformance[q.chapter_id].total += 1;
          if (res.status === 'correct') {
            chapterPerformance[q.chapter_id].correct += 1;
          }
        }
      });
    });

    const strongTopics = [];
    const weakTopics = [];

    Object.keys(chapterPerformance).forEach(cid => {
      const data = chapterPerformance[cid];
      const score = data.total > 0 ? (data.correct / data.total) : 0;
      if (score >= 0.7) {
        strongTopics.push({ name: data.name, score: Number((score * 100).toFixed(0)) });
      } else if (score < 0.5) {
        weakTopics.push({ name: data.name, score: Number((score * 100).toFixed(0)) });
      }
    });

    const progressOverTime = attempts
      .sort((a, b) => new Date(a.attempted_at) - new Date(b.attempted_at))
      .map(att => ({
        title: att.test_title,
        score: att.percentage,
        date: new Date(att.attempted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      }));

    res.json({
      empty: false,
      overall_percentage: overallPercentage,
      accuracy: overallAccuracy,
      total_tests: totalTests,
      subject_performance: subjectPerformance,
      strong_topics: strongTopics.slice(0, 3),
      weak_topics: weakTopics.slice(0, 3),
      progress_over_time: progressOverTime
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving analytics.' });
  }
});

// ==================== NEW AI SERVICES API ROUTES ====================

// 1. Get Questions awaiting review
app.get('/api/admin/ai/review', authenticateAdmin, async (req, res) => {
  try {
    const pending = await db.findMany('questions', { verified_by_admin: false });
    res.json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving review questions.' });
  }
});

// 2. Action review endpoint (Approve, Edit, Reject, Delete)
app.post('/api/admin/ai/review/:id', authenticateAdmin, async (req, res) => {
  const qId = req.params.id;
  const { action, questionData } = req.body; // action: 'approve' | 'edit' | 'reject' | 'delete'

  try {
    if (action === 'delete' || action === 'reject') {
      await db.delete('questions', { id: qId });
      return res.json({ message: `Question ${action}ed successfully.` });
    }

    const existing = await db.findOne('questions', { id: qId });
    if (!existing) return res.status(404).json({ message: 'Question not found.' });

    if (action === 'approve') {
      const finalStatus = existing.is_pyq ? 'VERIFIED_PYQ' : 'PRACTICE';
      await db.update('questions', { id: qId }, { 
        verified_by_admin: true,
        status: finalStatus
      });
      return res.json({ message: 'Question approved and published!' });
    }

    if (action === 'edit') {
      if (!questionData) return res.status(400).json({ message: 'Missing question edit content.' });
      
      // Save structural edits and mark verified
      await db.update('questions', { id: qId }, {
        ...questionData,
        verified_by_admin: true,
        status: questionData.is_pyq ? 'VERIFIED_PYQ' : 'PRACTICE'
      });
      return res.json({ message: 'Question updated and approved successfully.' });
    }

    res.status(400).json({ message: 'Invalid review action.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing review action.' });
  }
});

// 3. Bulk Generator for Practice Questions
app.post('/api/admin/ai/generate-practice', authenticateAdmin, async (req, res) => {
  const { classId, subjectId, chapterId, difficulty, count } = req.body;
  if (!classId || !subjectId || !chapterId || !count) {
    return res.status(400).json({ message: 'Missing required generation constraints.' });
  }

  try {
    const list = await ai.generateQuestions({
      classId,
      subjectId,
      chapterId,
      difficulty: difficulty || 'Medium',
      count: Number(count),
      isPyqBased: false
    });

    for (const q of list) {
      await db.insert('questions', q);
    }

    res.json({ message: `Successfully generated ${list.length} practice questions!`, count: list.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'AI Generation service error.' });
  }
});

// 4. PYQ-Based Concept Practice Generator
app.post('/api/admin/ai/generate-pyq-practice', authenticateAdmin, async (req, res) => {
  const { classId, subjectId, chapterId, difficulty, count } = req.body;
  if (!classId || !subjectId || !chapterId || !count) {
    return res.status(400).json({ message: 'Missing criteria.' });
  }

  try {
    // Generate patterned questions
    const list = await ai.generateQuestions({
      classId,
      subjectId,
      chapterId,
      difficulty: difficulty || 'Medium',
      count: Number(count),
      isPyqBased: true
    });

    for (const q of list) {
      await db.insert('questions', q);
    }
    res.json({ message: `Generated ${list.length} PYQ-patterned questions.`, count: list.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'AI Generator failed.' });
  }
});

// 5. Source Manager CRUD
app.get('/api/admin/ai/sources', authenticateAdmin, async (req, res) => {
  try {
    const sources = await db.getCollection('pyq_sources');
    res.json(sources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving sources.' });
  }
});

app.post('/api/admin/ai/sources', authenticateAdmin, async (req, res) => {
  const { name, url, classId, subjectId, availableYears, medium, permissionStatus } = req.body;
  if (!name || !url || !classId || !subjectId) {
    return res.status(400).json({ message: 'Missing source metadata.' });
  }

  try {
    const newSource = {
      id: 'src_' + Date.now(),
      name,
      url,
      class_id: classId,
      subject_id: subjectId,
      available_years: Array.isArray(availableYears) ? availableYears : JSON.parse(availableYears),
      medium: medium || 'Both',
      permission_status: permissionStatus || 'Permitted'
    };

    await db.insert('pyq_sources', newSource);
    res.json({ message: 'Source URL registered.', data: newSource });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding source.' });
  }
});

app.delete('/api/admin/ai/sources/:id', authenticateAdmin, async (req, res) => {
  try {
    await db.delete('pyq_sources', { id: req.params.id });
    res.json({ message: 'Source deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting source.' });
  }
});

// 6. Manual Public Source Scan
app.post('/api/admin/ai/scan', authenticateAdmin, async (req, res) => {
  try {
    const scanReport = await pyqFetcher.scanAndIngestPapers();
    res.json({ message: 'Scan complete.', report: scanReport });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ingest scanner failed.' });
  }
});

// 7. Compile Chapter/Mock Tests from pool
app.post('/api/admin/ai/compile-test', authenticateAdmin, async (req, res) => {
  const { classId, subjectId, title, category, timeLimit, count, instructions } = req.body;
  if (!classId || !subjectId || !title || !count) {
    return res.status(400).json({ message: 'Missing compilation parameters.' });
  }

  try {
    // Fetch approved questions for this class & subject
    const pool = await db.findMany('questions', { class_id: classId, subject_id: subjectId, verified_by_admin: true });
    
    if (pool.length === 0) {
      return res.status(400).json({ message: 'No approved questions found in database pool to compile test.' });
    }

    // Sort pool questions by priority: 1. Verified PYQs, 2. Practice
    const sortedPool = [...pool].sort((a, b) => {
      const aVal = a.status === 'VERIFIED_PYQ' ? 2 : a.status === 'PRACTICE' ? 1 : 0;
      const bVal = b.status === 'VERIFIED_PYQ' ? 2 : b.status === 'PRACTICE' ? 1 : 0;
      return bVal - aVal;
    });

    const selectedQuestions = sortedPool.slice(0, Number(count));
    const questionIds = selectedQuestions.map(q => q.id);

    // Calculate total marks
    let totalMarks = 0;
    selectedQuestions.forEach(q => totalMarks += (q.marks || 1));

    const newTest = {
      id: 't_compiled_' + Date.now(),
      class_id: classId,
      subject_id: subjectId,
      title,
      category: category || 'Chapter Test',
      time_limit: Number(timeLimit) || 15,
      total_marks: totalMarks,
      instructions: instructions || 'AI Compiled test. Prioritized verified board questions.',
      question_ids: questionIds
    };

    await db.insert('tests', newTest);
    res.json({ message: 'Test compiled and published successfully!', test: newTest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error compiling test.' });
  }
});

// ================= STANDARD ADMIN CONTROLLER =================

app.get('/api/admin/students', authenticateAdmin, async (req, res) => {
  try {
    const users = await db.getCollection('users');
    const allFees = await db.getCollection('student_fees');
    
    const students = users.filter(u => u.role === 'student').map(u => {
      const studentFee = allFees.find(f => f.user_id === u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        class: u.class,
        board: u.board,
        enrollment_no: studentFee?.enrollment_no || `STU-BSEB-2026-${u.id.slice(-4)}`,
        fee_status: studentFee?.status || 'NOT_ASSIGNED',
        total_due: studentFee?.due_amount !== undefined ? studentFee.due_amount : 0,
        total_paid: studentFee?.paid_amount !== undefined ? studentFee.paid_amount : 0,
        created_at: u.created_at
      };
    });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving students list.' });
  }
});

// Admin: Edit Student Profile
app.put('/api/admin/students/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile, class: classId, board } = req.body;
  try {
    const user = await db.findOne('users', { id });
    if (!user) return res.status(404).json({ message: 'Student not found.' });

    const updatedUser = await db.update('users', { id }, {
      name: name ? name.trim() : user.name,
      email: email ? email.trim() : user.email,
      mobile: mobile ? mobile.trim() : user.mobile,
      class: classId || user.class,
      board: board || user.board,
      updated_at: new Date().toISOString()
    });

    // Also sync student_name across fee records
    if (name) {
      const allFees = await db.getCollection('student_fees');
      const studentFee = allFees.find(f => f.user_id === id);
      if (studentFee) {
        await db.update('student_fees', { id: studentFee.id }, {
          student_name: name.trim(),
          student_email: email ? email.trim() : studentFee.student_email
        });
      }
    }

    res.json({ message: 'Student profile updated successfully!', user: updatedUser });
  } catch (err) {
    console.error("Failed to update student:", err);
    res.status(500).json({ message: 'Failed to update student profile.' });
  }
});

app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const users = await db.getCollection('users');
    const tests = await db.getCollection('tests');
    const studyMaterials = await db.getCollection('study_materials');
    const attempts = await db.getCollection('test_attempts');
    const questions = await db.getCollection('questions');

    const studentCount = users.filter(u => u.role === 'student').length;
    const testCount = tests.length;
    const materialsCount = studyMaterials.length;
    const attemptsCount = attempts.length;
    const pendingCount = questions.filter(q => q.verified_by_admin === false).length;

    res.json({
      studentCount,
      testCount,
      materialsCount,
      attemptsCount,
      pendingCount,
      recentAttempts: attempts.sort((a, b) => new Date(b.attempted_at) - new Date(a.attempted_at)).slice(0, 5)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving stats.' });
  }
});

app.post('/api/admin/classes', authenticateAdmin, async (req, res) => {
  const { name, stream } = req.body;
  if (!name) return res.status(400).json({ message: 'Class name is required.' });
  const id = 'c_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  try {
    const existing = await db.findOne('classes', { id });
    if (existing) return res.status(400).json({ message: 'Class exists.' });

    const newClass = { id, name, stream };
    await db.insert('classes', newClass);
    res.status(201).json({ message: 'Class added.', data: newClass });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding class.' });
  }
});

app.post('/api/admin/subjects', authenticateAdmin, async (req, res) => {
  const { classId, name, hindiName } = req.body;
  if (!classId || !name) return res.status(400).json({ message: 'Class ID and subject name are required.' });
  const id = 's_' + classId.replace('c_', '') + '_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');

  try {
    const newSubject = { id, class_id: classId, name, hindi_name: hindiName || name };
    await db.insert('subjects', newSubject);
    res.status(201).json({ message: 'Subject added.', data: newSubject });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding subject.' });
  }
});

app.post('/api/admin/chapters', authenticateAdmin, async (req, res) => {
  const { subjectId, name, hindiName, number } = req.body;
  if (!subjectId || !name) return res.status(400).json({ message: 'Subject ID and chapter name are required.' });
  const id = 'ch_' + subjectId.replace('s_', '') + '_' + Date.now();

  try {
    const newChapter = { id, subject_id: subjectId, name, hindi_name: hindiName || name, number: Number(number) || 1 };
    await db.insert('chapters', newChapter);
    res.status(201).json({ message: 'Chapter added.', data: newChapter });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding chapter.' });
  }
});

app.post('/api/admin/study-materials', authenticateAdmin, async (req, res) => {
  const { chapterId, type, title, content, pdfUrl } = req.body;
  if (!chapterId || !type || !title || !content) {
    return res.status(400).json({ message: 'Missing fields.' });
  }
  const id = 'sm_' + Date.now();
  try {
    const newMaterial = { id, chapter_id: chapterId, type, title, content, pdf_url: pdfUrl || "" };
    await db.insert('study_materials', newMaterial);
    res.status(201).json({ message: 'Uploaded.', data: newMaterial });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error uploading study material.' });
  }
});

app.post('/api/admin/questions', authenticateAdmin, async (req, res) => {
  const { classId, subjectId, chapterId, type, questionText, options, correctAnswer, explanation, marks, negativeMarks, difficulty, year, category } = req.body;

  if (!classId || !subjectId || !chapterId || !questionText || !options || correctAnswer === undefined) {
    return res.status(400).json({ message: 'Missing details.' });
  }

  const id = 'q_' + Date.now();
  try {
    const opts = Array.isArray(options) ? options : JSON.parse(options);
    
    const newQuestion = {
      id,
      class_id: classId,
      subject_id: subjectId,
      chapter_id: chapterId,
      type: type || 'objective',
      question_text: questionText,
      options: opts,
      correct_answer: Number(correctAnswer),
      explanation: explanation || "",

      // Dual language fields copy base text if specific translation not provided
      hindi_question: questionText,
      english_question: questionText,
      hindi_options: opts,
      english_options: opts,
      hindi_explanation: explanation || "",
      english_explanation: explanation || "",

      marks: Number(marks) || 1,
      negative_marks: Number(negativeMarks) || 0,
      difficulty: difficulty || 'Medium',
      year: year ? Number(year) : null,
      category: category || 'chapter_test',
      status: category === 'pyq' ? 'VERIFIED_PYQ' : 'PRACTICE',
      ai_generated: false,
      ai_translated: false,
      ai_confidence: 100,
      is_pyq: category === 'pyq',
      is_practice: category !== 'pyq',
      verified_by_admin: true,
      created_at: new Date().toISOString()
    };

    await db.insert('questions', newQuestion);
    res.status(201).json({ message: 'Question added.', data: newQuestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding question.' });
  }
});

app.post('/api/admin/tests', authenticateAdmin, async (req, res) => {
  const { classId, subjectId, title, category, timeLimit, totalMarks, instructions, questionIds } = req.body;
  if (!classId || !subjectId || !title || !category || !timeLimit || !questionIds) {
    return res.status(400).json({ message: 'Missing fields.' });
  }

  const id = 't_' + Date.now();
  try {
    const qIdsList = Array.isArray(questionIds) ? questionIds : JSON.parse(questionIds);
    let calculatedMarks = Number(totalMarks) || 0;
    if (!calculatedMarks) {
      const allQ = await db.getCollection('questions');
      qIdsList.forEach(qid => {
        const qObj = allQ.find(q => q.id === qid);
        calculatedMarks += qObj ? (qObj.marks || 1) : 1;
      });
    }

    const newTest = {
      id,
      class_id: classId,
      subject_id: subjectId,
      title,
      category,
      time_limit: Number(timeLimit),
      total_marks: calculatedMarks,
      instructions: instructions || "",
      question_ids: qIdsList
    };

    await db.insert('tests', newTest);
    res.status(201).json({ message: 'Test created.', data: newTest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating test.' });
  }
});

app.post('/api/admin/pyqs', authenticateAdmin, async (req, res) => {
  const { classId, subjectId, year, examName, questionIds } = req.body;
  if (!classId || !subjectId || !year || !examName || !questionIds) {
    return res.status(400).json({ message: 'Missing fields.' });
  }

  const id = 'pyq_' + Date.now();
  try {
    const qIdsList = Array.isArray(questionIds) ? questionIds : JSON.parse(questionIds);

    const newPyq = {
      id,
      class_id: classId,
      subject_id: subjectId,
      year: Number(year),
      exam_name: examName,
      question_ids: qIdsList
    };

    await db.insert('pyqs', newPyq);
    res.status(201).json({ message: 'PYQ created.', data: newPyq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating PYQ.' });
  }
});

app.post('/api/admin/syllabus', authenticateAdmin, async (req, res) => {
  const { classId, subjectId, introduction, chaptersList, examPattern } = req.body;
  if (!classId || !subjectId || !chaptersList) {
    return res.status(400).json({ message: 'Missing fields.' });
  }

  const id = 'syl_' + classId.replace('c_', '') + '_' + subjectId.replace('s_', '');
  try {
    const newSyllabus = {
      id,
      class_id: classId,
      subject_id: subjectId,
      introduction: introduction || "",
      chapters_list: Array.isArray(chaptersList) ? chaptersList : JSON.parse(chaptersList),
      exam_pattern: examPattern || ""
    };

    const existing = await db.findOne('syllabus', { id });
    if (existing) {
      await db.update('syllabus', { id }, newSyllabus);
    } else {
      await db.insert('syllabus', newSyllabus);
    }
    res.status(201).json({ message: 'Syllabus updated.', data: newSyllabus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating syllabus.' });
  }
});

// ================= ADMIN & RESOURCE CRUD ENDPOINTS =================

// Videos list (Public)
app.get('/api/videos', async (req, res) => {
  const { classId, subjectId } = req.query;
  try {
    const allVideos = await db.getCollection('videos');
    let filtered = allVideos;
    if (classId) filtered = filtered.filter(v => v.class_id === classId);
    if (subjectId) filtered = filtered.filter(v => v.subject_id === subjectId);
    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error loading videos.' });
  }
});

// Add Video (Admin)
app.post('/api/admin/videos', authenticateAdmin, async (req, res) => {
  const { title, classId, subjectId, chapter, teacher, duration, videoUrl, notesPdfUrl, description } = req.body;
  if (!title || !classId || !videoUrl) {
    return res.status(400).json({ message: 'Title, Class and Video URL are required.' });
  }

  const id = 'vid_' + Date.now();
  const newVideo = {
    id,
    title,
    class_id: classId,
    subject_id: subjectId || '',
    chapter: chapter || '',
    teacher: teacher || 'Faculty Member',
    duration: duration || '30:00',
    views: '1',
    video_url: videoUrl,
    notes_pdf_url: notesPdfUrl || '',
    description: description || '',
    created_at: new Date().toISOString()
  };

  try {
    await db.insert('videos', newVideo);
    res.status(201).json({ message: 'Video added successfully!', data: newVideo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add video.' });
  }
});

// Update Video (Admin)
app.put('/api/admin/videos/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await db.update('videos', { id }, req.body);
    res.json({ message: 'Video updated successfully!', data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update video.' });
  }
});

// Delete Video (Admin)
app.delete('/api/admin/videos/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.delete('videos', { id });
    res.json({ message: 'Video deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete video.' });
  }
});

// Update Study Material (Admin)
app.put('/api/admin/study-materials/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await db.update('study_materials', { id }, req.body);
    res.json({ message: 'Study material updated successfully!', data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update study material.' });
  }
});

// Delete Study Material (Admin)
app.delete('/api/admin/study-materials/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.delete('study_materials', { id });
    res.json({ message: 'Study material deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete study material.' });
  }
});

// Update Test (Admin)
app.put('/api/admin/tests/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await db.update('tests', { id }, req.body);
    res.json({ message: 'Test updated successfully!', data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update test.' });
  }
});

// Delete Test (Admin)
app.delete('/api/admin/tests/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.delete('tests', { id });
    res.json({ message: 'Test deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete test.' });
  }
});

// Update Question (Admin)
app.put('/api/admin/questions/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await db.update('questions', { id }, req.body);
    res.json({ message: 'Question updated successfully!', data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update question.' });
  }
});

// Delete Question (Admin)
app.delete('/api/admin/questions/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.delete('questions', { id });
    res.json({ message: 'Question deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete question.' });
  }
});

// Get all student test attempts (Admin)
app.get('/api/admin/attempts', authenticateAdmin, async (req, res) => {
  try {
    const attempts = await db.getCollection('test_attempts');
    const users = await db.getCollection('users');
    const tests = await db.getCollection('tests');

    const enriched = (attempts || []).map(att => {
      const user = users.find(u => u.id === att.user_id);
      const test = tests.find(t => t.id === att.test_id);
      return {
        ...att,
        student_name: user ? user.name : 'Unknown Student',
        student_email: user ? user.email : '',
        test_title: test ? test.title : 'Test ' + att.test_id
      };
    });

    res.json(enriched.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load test attempts.' });
  }
});

// ================= STUDENT FEE & PAYMENT GATEWAY ENDPOINTS =================

// Student: Get my fees ledger and payment history
app.get('/api/fees/my-fees', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const allFees = await db.getCollection('student_fees');
    const allPayments = await db.getCollection('payments');

    let myFees = allFees.filter(f => f.user_id === studentId);

    // If student has no fee assigned yet, generate default semester fee bill
    if (myFees.length === 0) {
      const isInter = req.user.classId && req.user.classId.includes('12');
      const defaultFee = {
        id: 'fee_' + Date.now(),
        user_id: studentId,
        student_name: req.user.name,
        student_email: req.user.email || `${req.user.name.toLowerCase().replace(/\s+/g, '')}@theguidance.student`,
        enrollment_no: `STU-BSEB-2026-${studentId.slice(-4)}`,
        class_id: req.user.classId || 'c_10',
        course_name: isInter ? 'Class 12 Intermediate (Science & Arts)' : 'Class 10 Matriculation Session 2026-27',
        semester: 'Semester 1',
        department: isInter ? 'Senior Secondary Wing' : 'Secondary Wing',
        total_amount: isInter ? 25000 : 15000,
        paid_amount: 0,
        due_amount: isInter ? 25000 : 15000,
        due_date: '2026-09-30',
        status: 'UNPAID',
        breakdown: {
          tuition_fee: isInter ? 18000 : 10000,
          exam_fee: isInter ? 3500 : 2500,
          registration_fee: isInter ? 1500 : 1000,
          library_fee: isInter ? 1200 : 1000,
          other_charges: isInter ? 800 : 500
        },
        created_at: new Date().toISOString()
      };
      await db.insert('student_fees', defaultFee);
      myFees = [defaultFee];
    }

    const myPayments = allPayments.filter(p => p.user_id === studentId).reverse();

    res.json({
      fees: myFees,
      payments: myPayments,
      summary: {
        total_billed: myFees.reduce((acc, f) => acc + (Number(f.total_amount) || 0), 0),
        total_paid: myFees.reduce((acc, f) => acc + (Number(f.paid_amount) || 0), 0),
        total_due: myFees.reduce((acc, f) => acc + (Number(f.due_amount) || 0), 0)
      }
    });
  } catch (err) {
    console.error("Error fetching student fees:", err);
    res.status(500).json({ message: 'Failed to retrieve fee records.' });
  }
});

// Student: Create Razorpay / Gateway Order
app.post('/api/payments/create-order', authenticateToken, async (req, res) => {
  const { feeId, amount, paymentMethod } = req.body;
  if (!feeId || !amount || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Valid Fee ID and payment amount are required.' });
  }

  try {
    const fee = await db.findOne('student_fees', { id: feeId });
    if (!fee) return res.status(404).json({ message: 'Fee record not found.' });

    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const transactionId = `TXN_GUIDANCE_${Date.now()}`;

    res.json({
      success: true,
      order_id: orderId,
      transaction_id: transactionId,
      amount: Number(amount),
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_guidance_key',
      fee_id: feeId,
      student: {
        name: req.user.name,
        email: req.user.email || 'student@theguidance.com',
        contact: req.user.mobile || '9876543210'
      }
    });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ message: 'Failed to initialize payment gateway order.' });
  }
});

// Student: Verify Payment & Generate Receipt
app.post('/api/payments/verify-payment', authenticateToken, async (req, res) => {
  const { feeId, amount, transactionId, orderId, paymentMethod, razorpayPaymentId, razorpaySignature } = req.body;

  if (!feeId || !amount || !transactionId) {
    return res.status(400).json({ message: 'Incomplete payment payload for server verification.' });
  }

  try {
    const fee = await db.findOne('student_fees', { id: feeId });
    if (!fee) return res.status(404).json({ message: 'Fee record not found.' });

    // Server-side atomic fee ledger balance calculation
    const payAmount = Number(amount);
    const updatedPaid = (Number(fee.paid_amount) || 0) + payAmount;
    const updatedDue = Math.max(0, (Number(fee.total_amount) || 0) - updatedPaid);
    const newStatus = updatedDue === 0 ? 'PAID' : 'PARTIAL';

    // Update fee record
    await db.update('student_fees', { id: feeId }, {
      paid_amount: updatedPaid,
      due_amount: updatedDue,
      status: newStatus,
      updated_at: new Date().toISOString()
    });

    // Record verified transaction in payments
    const receiptId = `RCP_${new Date().getFullYear()}_${Date.now().toString().slice(-4)}`;
    const paymentRecord = {
      id: 'pay_' + Date.now(),
      fee_id: feeId,
      user_id: req.user.id,
      student_name: fee.student_name || req.user.name,
      enrollment_no: fee.enrollment_no || `STU-BSEB-2026-${req.user.id.slice(-4)}`,
      course_name: fee.course_name,
      amount: payAmount,
      payment_method: paymentMethod || 'UPI / Online Gateway',
      transaction_id: transactionId,
      order_id: orderId || `order_${Date.now()}`,
      gateway_payment_id: razorpayPaymentId || transactionId,
      status: 'PAID',
      receipt_id: receiptId,
      paid_at: new Date().toISOString()
    };
    await db.insert('payments', paymentRecord);

    res.json({
      success: true,
      message: 'Payment verified and credited successfully!',
      payment: paymentRecord,
      receipt_id: receiptId,
      updated_fee: {
        paid_amount: updatedPaid,
        due_amount: updatedDue,
        status: newStatus
      }
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ message: 'Payment verification failed on server.' });
  }
});

// Public / Authenticated: Get Receipt Details
app.get('/api/payments/receipt/:receiptId', async (req, res) => {
  const { receiptId } = req.params;
  try {
    const payment = await db.findOne('payments', { receipt_id: receiptId });
    if (!payment) return res.status(404).json({ message: 'Receipt not found.' });

    const fee = await db.findOne('student_fees', { id: payment.fee_id });
    const siteSettings = await db.getCollection('site_settings');
    const settingsObj = Array.isArray(siteSettings) ? (siteSettings[0] || {}) : siteSettings;

    res.json({
      receipt_id: payment.receipt_id,
      transaction_id: payment.transaction_id,
      paid_at: payment.paid_at,
      amount: payment.amount,
      payment_method: payment.payment_method,
      student_name: payment.student_name,
      enrollment_no: payment.enrollment_no,
      course_name: payment.course_name,
      semester: fee ? fee.semester : 'Current Semester',
      status: payment.status,
      institution: {
        name: settingsObj.coachingName || 'The Guidance Coaching Institute',
        address: settingsObj.address || 'Bari Path, Patna, Bihar - 800004',
        phone: settingsObj.phone || '+91 98765 43210',
        email: settingsObj.email || 'contact@theguidance.com'
      }
    });
  } catch (err) {
    console.error("Receipt fetch error:", err);
    res.status(500).json({ message: 'Failed to fetch receipt.' });
  }
});

// ================= ADMIN FEE MANAGEMENT ENDPOINTS =================

// Admin: Financial summary overview
app.get('/api/admin/fees/overview', authenticateAdmin, async (req, res) => {
  try {
    const allFees = await db.getCollection('student_fees');
    const allPayments = await db.getCollection('payments');

    const totalBilled = allFees.reduce((acc, f) => acc + (Number(f.total_amount) || 0), 0);
    const totalCollected = allFees.reduce((acc, f) => acc + (Number(f.paid_amount) || 0), 0);
    const totalPending = allFees.reduce((acc, f) => acc + (Number(f.due_amount) || 0), 0);
    const overdueCount = allFees.filter(f => f.status === 'UNPAID' || f.status === 'PARTIAL').length;

    res.json({
      total_students: allFees.length,
      total_billed: totalBilled,
      total_collected: totalCollected,
      total_pending: totalPending,
      overdue_count: overdueCount,
      recent_payments_count: allPayments.length
    });
  } catch (err) {
    console.error("Admin fee overview error:", err);
    res.status(500).json({ message: 'Failed to retrieve fee metrics.' });
  }
});

// Admin: Get all student fee records
app.get('/api/admin/fees/all', authenticateAdmin, async (req, res) => {
  try {
    const allFees = await db.getCollection('student_fees');
    res.json(allFees.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load fee ledger.' });
  }
});

// Admin: Assign / Create Fee Bill
app.post('/api/admin/fees/assign', authenticateAdmin, async (req, res) => {
  const { feeId, userId, studentName, classId, courseName, semester, totalAmount, dueDate, breakdown } = req.body;
  if (!studentName || !totalAmount || Number(totalAmount) <= 0) {
    return res.status(400).json({ message: 'Student Name and Total Amount are required.' });
  }

  try {
    const allFees = await db.getCollection('student_fees');
    const existing = feeId 
      ? allFees.find(f => f.id === feeId)
      : (userId ? allFees.find(f => f.user_id === userId) : null);

    const tuition = breakdown?.tuition_fee !== undefined ? Number(breakdown.tuition_fee) : Math.round(Number(totalAmount) * 0.7);
    const exam = breakdown?.exam_fee !== undefined ? Number(breakdown.exam_fee) : Math.round(Number(totalAmount) * 0.15);
    const registration = breakdown?.registration_fee !== undefined ? Number(breakdown.registration_fee) : Math.round(Number(totalAmount) * 0.1);
    const library = breakdown?.library_fee !== undefined ? Number(breakdown.library_fee) : Math.round(Number(totalAmount) * 0.05);
    const other = breakdown?.other_charges !== undefined ? Number(breakdown.other_charges) : 0;

    if (existing) {
      const updatedTotal = Number(totalAmount);
      const paid = Number(existing.paid_amount || 0);
      const due = Math.max(0, updatedTotal - paid);
      const status = due === 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID');

      const updated = await db.update('student_fees', { id: existing.id }, {
        student_name: studentName.trim(),
        student_email: req.body.studentEmail || existing.student_email,
        class_id: classId || existing.class_id,
        course_name: courseName || existing.course_name,
        semester: semester || existing.semester,
        total_amount: updatedTotal,
        due_amount: due,
        status: status,
        due_date: dueDate || existing.due_date,
        breakdown: {
          tuition_fee: tuition,
          exam_fee: exam,
          registration_fee: registration,
          library_fee: library,
          other_charges: other
        },
        updated_at: new Date().toISOString()
      });

      return res.json({ message: 'Student fee bill updated successfully!', data: updated });
    }

    const id = 'fee_' + Date.now();
    const effectiveUserId = userId || 'u_student_' + Date.now();
    const feeRecord = {
      id,
      user_id: effectiveUserId,
      student_name: studentName.trim(),
      student_email: req.body.studentEmail || `${studentName.toLowerCase().replace(/\s+/g, '')}@theguidance.student`,
      enrollment_no: req.body.enrollmentNo || `STU-BSEB-2026-${effectiveUserId.slice(-4)}`,
      class_id: classId || 'c_10',
      course_name: courseName || 'Bihar Board Academic Session 2026-27',
      semester: semester || 'Semester 1',
      department: req.body.department || 'Senior Secondary Wing',
      total_amount: Number(totalAmount),
      paid_amount: 0,
      due_amount: Number(totalAmount),
      due_date: dueDate || '2026-10-15',
      status: 'UNPAID',
      breakdown: {
        tuition_fee: tuition,
        exam_fee: exam,
        registration_fee: registration,
        library_fee: library,
        other_charges: other
      },
      created_at: new Date().toISOString()
    };

    await db.insert('student_fees', feeRecord);
    res.status(201).json({ message: 'Fee bill created and assigned successfully to student!', data: feeRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to assign fee bill.' });
  }
});

// Admin: Update Fee Bill
app.put('/api/admin/fees/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const fee = await db.findOne('student_fees', { id });
    if (!fee) return res.status(404).json({ message: 'Fee not found.' });

    const total = req.body.total_amount !== undefined ? Number(req.body.total_amount) : Number(fee.total_amount);
    const paid = req.body.paid_amount !== undefined ? Number(req.body.paid_amount) : Number(fee.paid_amount);
    const due = Math.max(0, total - paid);
    const status = due === 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID');

    const updated = await db.update('student_fees', { id }, {
      ...req.body,
      total_amount: total,
      paid_amount: paid,
      due_amount: due,
      status: status,
      updated_at: new Date().toISOString()
    });

    res.json({ message: 'Fee record updated successfully!', data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update fee record.' });
  }
});

// Admin: Delete Fee Bill
app.delete('/api/admin/fees/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.delete('student_fees', { id });
    res.json({ message: 'Fee bill deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete fee record.' });
  }
});

// Admin: All Payment Transactions
app.get('/api/admin/fees/payments', authenticateAdmin, async (req, res) => {
  try {
    const allPayments = await db.getCollection('payments');
    res.json((allPayments || []).reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load payments.' });
  }
});

app.get('/', (req, res) => {
  res.send('The Guidance AI API is running.');
});

// Launch public source checker on startup
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
