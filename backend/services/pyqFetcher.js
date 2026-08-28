const db = require('../db');
const ai = require('./ai');

// Simulated newly discovered question papers payload
const MOCK_QUESTION_PAPERS = [
  {
    source_name: "BSEB Official Public Repository",
    exam: "Matric Annual Exam 2025",
    subject_id: "s_10_math",
    class_id: "c_10",
    questions: [
      {
        text: "The product of a non-zero rational and an irrational number is always:",
        options: ["Always rational", "Always irrational", "Rational or irrational", "Equal to 1"],
        correct: 1,
        explanation: "The product of any non-zero rational number (e.g. 2) and an irrational number (e.g. √3) is always irrational (2√3).",
        hindi: "एक गैर-शून्य परिमेय और एक अपरिमेय संख्या का गुणनफल हमेशा होता है:",
        hindi_options: ["हमेशा परिमेय", "हमेशा अपरिमेय", "परिमेय या अपरिमेय", "1 के बराबर"]
      },
      {
        text: "If the product of the zeroes of quadratic polynomial x^2 - 4x + k is 3, what is the value of k?",
        options: ["3", "-3", "4", "-4"],
        correct: 0,
        explanation: "Product of zeroes alpha * beta = c/a = k/1 = k. Since product is 3, k = 3.",
        hindi: "यदि द्विघात बहुपद x^2 - 4x + k के शून्यकों का गुणनफल 3 है, तो k का मान क्या है?",
        hindi_options: ["3", "-3", "4", "-4"]
      }
    ]
  },
  {
    source_name: "Bihar School Board Open Source Portal",
    exam: "Matric Science Board Paper 2025",
    subject_id: "s_10_science",
    class_id: "c_10",
    questions: [
      {
        text: "What gas is released when sodium carbonate reacts with hydrochloric acid?",
        options: ["Hydrogen", "Carbon dioxide", "Oxygen", "Chlorine"],
        correct: 1,
        explanation: "Na2CO3 + 2HCl -> 2NaCl + H2O + CO2. Carbon dioxide gas is released.",
        hindi: "जब सोडियम कार्बोनेट हाइड्रोक्लोरिक अम्ल के साथ अभिक्रिया करता है, तो कौन सी गैस निकलती है?",
        hindi_options: ["हाइड्रोजन", "कार्बन डाइऑक्साइड", "ऑक्सीजन", "क्लोरीन"]
      }
    ]
  }
];

const pyqFetcher = {
  // Discover and ingest new papers from sources
  scanAndIngestPapers: async () => {
    console.log("=== Launching BSEB Question Ingestion Scraper ===");
    const sources = await db.getCollection('pyq_sources');
    const existingQuestions = await db.getCollection('questions');
    
    let papersProcessed = 0;
    let questionsExtracted = 0;
    let duplicatesSkipped = 0;
    const ingestLogs = [];

    // Filter permitted sources
    const activeSources = sources.filter(s => 
      s.permission_status.toLowerCase().includes('permitted') ||
      s.permission_status.toLowerCase().includes('open')
    );

    for (const source of activeSources) {
      // Find matching mock paper content for this source URL/Subject
      const mockPaper = MOCK_QUESTION_PAPERS.find(p => 
        p.subject_id === source.subject_id && 
        p.class_id === source.class_id
      );

      if (!mockPaper) continue;

      // Ensure we don't repeatedly download the same paper
      const processedPapers = (await db.getCollection('processed_papers')) || [];
      if (processedPapers.includes(paperHash)) {
        console.log(`Source paper already ingested: ${mockPaper.exam}. Skipping.`);
        continue;
      }

      console.log(`Scanning Source: ${source.name} (${source.url})`);
      console.log(`Downloading and extracting text from: ${mockPaper.exam}...`);
      
      papersProcessed++;
      
      for (const qData of mockPaper.questions) {
        // 1. Duplicate detection
        const dupCheck = await ai.checkDuplicate(qData.text, source.subject_id);
        if (dupCheck.isDuplicate) {
          duplicatesSkipped++;
          console.log(`Duplicate flagged (${dupCheck.similarity}% similarity). Skipping: "${qData.text.substring(0, 30)}..."`);
          continue;
        }

        // 2. Chapter detection
        const chapDetect = await ai.detectChapter(qData.text, source.class_id, source.subject_id);
        const chapterId = chapDetect ? chapDetect.chapter_id : 'ch_10_math_1';

        // 3. AI Translation validation/construction
        let hindiQ = qData.hindi;
        let engQ = qData.text;
        if (!hindiQ) {
          hindiQ = await ai.translate(engQ, 'hindi');
        }

        // 4. Explanation generation
        const explanationEng = qData.explanation;
        const explanationHindi = await ai.translate(qData.explanation, 'hindi');

        // Compile question details
        const aiConfidence = chapDetect ? chapDetect.confidence : 86;
        
        // Push to review pool
        const extractedQ = {
          id: 'q_extracted_' + Date.now() + Math.random().toString(36).substr(2, 5),
          class_id: source.class_id,
          subject_id: source.subject_id,
          chapter_id: chapterId,
          topic: chapDetect ? chapDetect.topic : "General Properties",
          type: "objective",
          
          question_text: engQ,
          options: qData.options,
          correct_answer: qData.correct,
          explanation: explanationEng,

          // Enhanced dual language
          hindi_question: hindiQ,
          english_question: engQ,
          hindi_options: qData.hindi_options || qData.options,
          english_options: qData.options,
          hindi_explanation: explanationHindi,
          english_explanation: explanationEng,

          marks: 1,
          negative_marks: 0,
          difficulty: "Medium",
          year: 2025,
          category: "pyq",
          
          // Status tracking
          status: aiConfidence >= 90 ? "VERIFIED_PYQ" : "NEEDS_REVIEW",
          ai_generated: false,
          ai_translated: true,
          ai_confidence: aiConfidence,
          is_pyq: true,
          is_practice: false,
          verified_by_admin: false, // Must be approved by admin to be fully public
          source_url: source.url,
          created_at: new Date().toISOString()
        };

        await db.insert('questions', extractedQ);
        questionsExtracted++;
      }

      // Mark paper as processed
      processedPapers.push(paperHash);
      await db.setCollection('processed_papers', processedPapers);
      
      ingestLogs.push({
        exam: mockPaper.exam,
        source: source.name,
        extractedCount: mockPaper.questions.length
      });
    }

    console.log(`Ingestion Summary: ${papersProcessed} papers processed, ${questionsExtracted} questions extracted, ${duplicatesSkipped} duplicates skipped.`);
    return {
      success: true,
      papersProcessed,
      questionsExtracted,
      duplicatesSkipped,
      logs: ingestLogs
    };
  },

  // Daily checker job simulation
  startScheduler: () => {
    // Check every hour (or simulate standard timers)
    setInterval(async () => {
      try {
        await pyqFetcher.scanAndIngestPapers();
      } catch (err) {
        console.error("Scheduled checker error:", err);
      }
    }, 1000 * 60 * 60 * 24); // 24 hours
  }
};

module.exports = pyqFetcher;
