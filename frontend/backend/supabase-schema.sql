-- Enable UUID extension if needed, though we use custom string IDs
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    stream TEXT
);

-- 2. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hindi_name TEXT
);

-- 3. Chapters Table
CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hindi_name TEXT,
    number INTEGER
);

-- 4. Study Materials Table
CREATE TABLE IF NOT EXISTS study_materials (
    id TEXT PRIMARY KEY,
    chapter_id TEXT REFERENCES chapters(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    pdf_url TEXT
);

-- 5. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT,
    password TEXT NOT NULL,
    class TEXT, -- Represents class ID or class name
    board TEXT DEFAULT 'Bihar Board',
    role TEXT DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
    chapter_id TEXT REFERENCES chapters(id) ON DELETE SET NULL,
    topic TEXT,
    type TEXT,
    question_text TEXT,
    options JSONB,
    correct_answer INTEGER,
    explanation TEXT,
    hindi_question TEXT,
    english_question TEXT,
    hindi_options JSONB,
    english_options JSONB,
    hindi_explanation TEXT,
    english_explanation TEXT,
    marks INTEGER DEFAULT 1,
    negative_marks INTEGER DEFAULT 0,
    difficulty TEXT,
    year INTEGER,
    category TEXT,
    status TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_translated BOOLEAN DEFAULT FALSE,
    ai_confidence INTEGER DEFAULT 100,
    is_pyq BOOLEAN DEFAULT FALSE,
    is_practice BOOLEAN DEFAULT FALSE,
    verified_by_admin BOOLEAN DEFAULT TRUE,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tests Table
CREATE TABLE IF NOT EXISTS tests (
    id TEXT PRIMARY KEY,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT,
    time_limit INTEGER,
    total_marks INTEGER,
    instructions TEXT,
    question_ids JSONB
);

-- 8. Test Attempts Table
CREATE TABLE IF NOT EXISTS test_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    test_id TEXT REFERENCES tests(id) ON DELETE SET NULL,
    test_title TEXT,
    category TEXT,
    subject_id TEXT,
    total_questions INTEGER,
    correct_count INTEGER,
    incorrect_count INTEGER,
    unattempted_count INTEGER,
    total_marks INTEGER,
    obtained_marks INTEGER,
    percentage NUMERIC,
    accuracy NUMERIC,
    time_spent INTEGER,
    responses JSONB,
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PYQs Table
CREATE TABLE IF NOT EXISTS pyqs (
    id TEXT PRIMARY KEY,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
    year INTEGER,
    exam_name TEXT,
    question_ids JSONB
);

-- 10. PYQ Sources Table
CREATE TABLE IF NOT EXISTS pyq_sources (
    id TEXT PRIMARY KEY,
    name TEXT,
    url TEXT,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
    available_years JSONB,
    medium TEXT,
    permission_status TEXT
);

-- 11. Syllabus Table
CREATE TABLE IF NOT EXISTS syllabus (
    id TEXT PRIMARY KEY,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
    introduction TEXT,
    chapters_list JSONB,
    exam_pattern TEXT
);

-- 12. Processed Papers Table
CREATE TABLE IF NOT EXISTS processed_papers (
    paper_hash TEXT PRIMARY KEY
);

-- Disable Row Level Security (RLS) on all tables for server-side Express access
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE pyqs DISABLE ROW LEVEL SECURITY;
ALTER TABLE pyq_sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus DISABLE ROW LEVEL SECURITY;
ALTER TABLE processed_papers DISABLE ROW LEVEL SECURITY;
