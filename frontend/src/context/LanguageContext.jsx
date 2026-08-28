import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const TRANSLATIONS = {
  hi: {
    // Brand & Header
    brandTitle: "THE GUIDANCE",
    brandSubtitle: "बिहार बोर्ड BSEB",
    
    // Nav links
    navHome: "होम",
    navSyllabus: "सिलेबस",
    navNotes: "नोट्स",
    navVideos: "वीडियो",
    navTests: "टेस्ट सीरीज",
    navPyqs: "PYQ पेपर्स",
    navDailyChallenge: "डेली क्विज़",
    navDashboard: "डैशबोर्ड",
    navResults: "रिजल्ट्स",
    navAdmin: "एडमिन",
    navLogin: "लॉगिन",
    navSignUp: "रजिस्ट्रेशन",
    navSignup: "रजिस्ट्रेशन",
    navLogout: "लॉगआउट",
    navAiGuru: "AI गुरु",

    // Home Page
    heroBadge: "🎯 बिहार बोर्ड BSEB विशेष कोचिंग",
    heroLiveBatch: "Live 2026 बैच",
    heroTitle1: "बिहार बोर्ड में",
    heroTitle2: "शीर्ष रैंक (Top Rank)",
    heroTitle3: "हासिल करें",
    heroDesc: "कक्षा 5 से 12वीं (Matric & Inter) के लिए सम्पूर्ण अध्याय-वार नोट्स, वीडियो लेक्चर्स, 24/7 AI डाउट सॉल्वर और 2018–2024 के पिछले वर्षों के पेपर्स।",
    heroStartLearning: "🚀 पढ़ाई शुरू करें",
    heroDailyChallengeBtn: "🔥 आज का चैलेंज",
    heroAskAiBtn: "🤖 AI गुरु से पूछें",
    heroRating: "4.9/5 रेटिंग",
    heroStudents: "25,000+ बिहार के छात्र",
    heroFreeNotes: "100% फ्री नोट्स",
    heroHubTitle: "🎯 छात्र प्रगति केंद्र (Progress Hub)",
    heroReadyBadge: "✓ BSEB 2026 अपडेटेड",
    heroMathPrep: "10वीं गणित तैयारी",
    heroSciencePrep: "10वीं विज्ञान तैयारी",
    heroObjectiveCount: "500+ वस्तुनिष्ठ प्रश्न",
    heroStreakLabel: "स्ट्रीक",
    heroPyqLabel: "आधिकारिक PYQs",
    heroAiTip: "💡 AI गुरु से किसी भी प्रश्न का तुरंत समाधान पाएं!",

    // AI Banner on Home
    aiBannerTag: "24/7 AI डाउट गुरु",
    aiBannerTitle: "गणित, विज्ञान या किसी भी विषय में कोई सवाल अटका है?",
    aiBannerDesc: "The Guidance AI Guru आपके सभी प्रश्नों का सटीक, चरणबद्ध हल (Step-by-Step Solution) तुरंत प्रदान करता है।",
    aiBannerBtn: "💬 अभी डाउट पूछें (निशुल्क)",

    // Home Features
    featSectionTag: "प्रमुख विशेषताएं",
    featTitle: "बिहार बोर्ड परीक्षा में सर्वश्रेष्ठ तैयारी",
    featDesc: "आधिकारिक BSEB पाठ्यक्रम के अनुसार निर्मित सम्पूर्ण शिक्षण प्रणाली।",
    featNotesTitle: "अध्याय-वार नोट्स",
    featNotesDesc: "हर चैप्टर के सरल, स्पष्ट नोट्स, महत्वपूर्ण सूत्र और परीक्षा उपयोगी सारांश।",
    featVideosTitle: "वीडियो व्याख्यान",
    featVideosDesc: "विशेषज्ञ शिक्षकों द्वारा वन-शॉट वीडियो लेक्चर्स और न्यूमेरिकल का लाइव हल।",
    featTestsTitle: "ऑनलाइन टेस्ट सीरीज",
    featTestsDesc: "BSEB के असली परीक्षा पैटर्न पर आधारित टाइमर वाले वस्तुनिष्ठ टेस्ट।",
    featPyqsTitle: "पिछले वर्ष के पेपर (PYQ)",
    featPyqsDesc: "2018 से 2024 तक के सभी आधिकारिक प्रश्न पत्रों का व्याख्या सहित हल।",

    // Home Classes
    classesSectionTag: "कक्षाएं",
    classesTitle: "अपनी कक्षा चुनें और तैयारी शुरू करें",
    classesDesc: "मैट्रिक (10वीं) और इंटरमीडिएट (12वीं) के लिए विशेष रूप से डिज़ाइन की गई सामग्री।",
    classExploreBtn: "विषय देखें →",

    // Home CTA
    ctaTitle: "क्या आप बिहार बोर्ड परीक्षा में टॉप करने के लिए तैयार हैं?",
    ctaDesc: "अभी निशुल्क खाता बनाएं, टेस्ट इतिहास सुरक्षित रखें, और अपनी तैयारी को मजबूत करें।",
    ctaSignUpBtn: "फ्री अकाउंट बनाएं",
    ctaCheckSyllabusBtn: "BSEB सिलेबस देखें",

    // Dashboard
    dashTag: "छात्र डैशबोर्ड",
    dashGreeting: "नमस्ते",
    dashPrepProgressTitle: "📈 सम्पूर्ण पाठ्यक्रम तैयारी प्रगति",
    dashPrepProgressDesc: "पाठ्यक्रम कवरेज और दिए गए टेस्ट्स के आधार पर।",
    dashClassLabel: "कक्षा:",
    dashSyllabusLabel: "पाठ्यक्रम: BSEB 2026 अपडेटेड",
    dashPerfSummary: "प्रदर्शन सारांश (Performance)",
    dashAvgScore: "औसत प्राप्तांक (Average Score)",
    dashAccuracy: "सटीकता (Accuracy):",
    dashTotalTests: "कुल टेस्ट्स:",
    dashRecentTests: "📝 हालिया टेस्ट प्रयास",
    dashNoTests: "अभी तक कोई टेस्ट नहीं दिया गया। अपनी तैयारी जांचने के लिए पहला टेस्ट दें!",
    dashViewAllResults: "सभी रिजल्ट्स देखें →",
    dashRecChapters: "📚 अनुशंसित अध्याय (Recommended Chapters)",
    dashRecTests: "📝 आगामी मॉडल टेस्ट",
    dashStudyBtn: "अध्ययन करें",
    dashAttemptBtn: "टेस्ट दें",
    dashDailyActiveTitle: "आज का दैनिक चैलेंज सक्रिय है! (+50 XP Bonus)",
    dashDailyActiveDesc: "5 त्वरित प्रश्नों को हल करें और अपनी स्ट्रीक को सुरक्षित रखें।",
    dashSolveDailyBtn: "क्विज हल करें →",
    dashViewAnalyticsBtn: "विश्लेषण देखें →",

    // Video Lectures Page
    vidBadge: "🎥 बिहार बोर्ड वीडियो व्याख्यान",
    vidTitle: "सर्वश्रेष्ठ शिक्षकों द्वारा अध्याय-वार वीडियो कक्षाएं",
    vidDesc: "कक्षा 5 से 12वीं तक के सभी विषयों के विस्तृत वीडियो लेक्चर्स, वन-शॉट रिवीज़न और महत्वपूर्ण प्रश्नों का सम्पूर्ण विश्लेषण।",
    vidSearchPlaceholder: "अध्याय या टॉपिक खोजें...",
    vidWatchBtn: "वीडियो देखें",
    vidViewNotesBtn: "📖 चैप्टर नोट्स देखें",
    vidStartTestBtn: "✍️ अभ्यास टेस्ट दें",
    vidTeacherLabel: "शिक्षक:",
    vidDurationLabel: "अवधि:",
    vidNoVideos: "कोई वीडियो उपलब्ध नहीं है",
    vidTryOther: "कृपया किसी अन्य कक्षा या विषय का चयन करें।",

    // Daily Challenge & Leaderboard Page
    dcBadge: "Daily Streak",
    dcTitle: "आज का चैलेंज एवं बिहार बोर्ड लीडरबोर्ड",
    dcDesc: "हर दिन 5 बहुविकल्पीय प्रश्न हल करें, अपनी तैयारी को मजबूत करें और बिहार के हज़ारों छात्रों में अपनी रैंक सुधारें।",
    dcStreakCardTitle: "आपकी वर्तमान स्ट्रीक",
    dcStreakSavedNotice: "आज हल करने पर: +1 Day Streak!",
    dcTabQuiz: "⚡ आज का क्विज (5 MCQs)",
    dcTabLeaderboard: "🏆 बिहार स्टेट लीडरबोर्ड",
    dcSubmitBtn: "✓ आज का चैलेंज सबमिट करें",
    dcSubmitting: "सबमिट हो रहा है...",
    dcExplainLabel: "💡 समाधान / व्याख्या:",
    dcCorrectBadge: "✓ सही उत्तर",
    dcLeaderboardTitle: "बिहार राज्य रैंकिंग (Top 10)",
    dcTotalActive: "कुल सक्रिय छात्र:",
    dcColRank: "रैंक",
    dcColName: "छात्र का नाम",
    dcColDistrict: "जिला",
    dcColClass: "कक्षा",
    dcColStreak: "स्ट्रीक",
    dcColXp: "कुल XP",
    dcColAccuracy: "सटीकता",

    // AI Guru Modal
    aiModalTitle: "AI डाउट गुरु",
    aiModalLiveBadge: "24/7 लाइव",
    aiModalSubtitle: "हिंदी • English • Hinglish • सभी विषय",
    aiClearBtn: "🧹 रीसेट",
    aiLanguageLabel: "भाषा मोड:",
    aiInputPlaceholder: "कुछ भी पूछिए (Hindi, English, Hinglish)...",
    aiThinkingMsg: "AI Guru उत्तर तैयार कर रहे हैं...",
    aiCopyBtn: "📋 कॉपी",
    aiCopiedBtn: "✓ कॉपीड!",

    // Footer
    footerDesc: "बिहार बोर्ड कक्षा 5 से 12वीं ऑनलाइन कोचिंग एवं प्रैक्टिस प्लेटफॉर्म। पूर्णतः BSEB पाठ्यक्रम के अनुकूल।",
    footerCopyright: `© ${new Date().getFullYear()} The Guidance. सर्वाधिकार सुरक्षित। मैट्रिक एवं इंटरमीडिएट बोर्ड परीक्षा सफलता हेतु समर्पित।`
  },
  en: {
    // Brand & Header
    brandTitle: "THE GUIDANCE",
    brandSubtitle: "BIHAR BOARD BSEB",
    
    // Nav links
    navHome: "Home",
    navSyllabus: "Syllabus",
    navNotes: "Notes",
    navVideos: "Videos",
    navTests: "Test Series",
    navPyqs: "PYQs",
    navDailyChallenge: "Daily Quiz",
    navDashboard: "Dashboard",
    navResults: "Results",
    navAdmin: "Admin",
    navLogin: "Login",
    navSignUp: "Sign Up",
    navSignup: "Sign Up",
    navLogout: "Logout",
    navAiGuru: "AI Guru",

    // Home Page
    heroBadge: "🎯 Bihar Board BSEB Specialist Platform",
    heroLiveBatch: "Live 2026 Batch",
    heroTitle1: "Achieve Top Rank",
    heroTitle2: "in Bihar Board",
    heroTitle3: "Exams",
    heroDesc: "Complete chapter-wise notes, video lectures, 24/7 AI doubt solver, and 2018–2024 official previous year question papers for Classes 5 to 12.",
    heroStartLearning: "🚀 Start Learning",
    heroDailyChallengeBtn: "🔥 Daily Challenge",
    heroAskAiBtn: "🤖 Ask AI Guru",
    heroRating: "4.9/5 Rating",
    heroStudents: "25,000+ Bihar Students",
    heroFreeNotes: "100% Free Notes",
    heroHubTitle: "🎯 Student Progress Hub",
    heroReadyBadge: "✓ BSEB 2026 Ready",
    heroMathPrep: "Class 10 Math Prep",
    heroSciencePrep: "Class 10 Science Prep",
    heroObjectiveCount: "500+ Objective MCQs",
    heroStreakLabel: "Streak",
    heroPyqLabel: "Official PYQs",
    heroAiTip: "💡 Get instant step-by-step solutions to any question from AI Guru!",

    // AI Banner on Home
    aiBannerTag: "24/7 AI Doubt Guru",
    aiBannerTitle: "Stuck on a Math, Science, or any subject question?",
    aiBannerDesc: "The Guidance AI Guru provides accurate, step-by-step solutions and board exam tips instantly.",
    aiBannerBtn: "💬 Ask Doubt Now (Free)",

    // Home Features
    featSectionTag: "Key Features",
    featTitle: "Designed for BSEB Board Excellence",
    featDesc: "Comprehensive study system built strictly according to the official Bihar School Examination Board syllabus.",
    featNotesTitle: "Chapter-wise Notes",
    featNotesDesc: "Clear and concise notes, key formula sheets, and chapter summaries for thorough revision.",
    featVideosTitle: "Video Lectures",
    featVideosDesc: "One-shot chapter lectures, numerical derivations, and interactive classes by expert educators.",
    featTestsTitle: "Online Test Series",
    featTestsDesc: "Real exam simulation test series based on the latest BSEB objective pattern with active timers.",
    featPyqsTitle: "Previous Year Papers (PYQs)",
    featPyqsDesc: "Official solved question papers from 2018 to 2024 with detailed answer keys and explanations.",

    // Home Classes
    classesSectionTag: "Classes",
    classesTitle: "Select Your Class to Start Studying",
    classesDesc: "Custom-curated materials designed specifically for matriculation and intermediate streams.",
    classExploreBtn: "Explore Subjects →",

    // Home CTA
    ctaTitle: "Ready to Ace Your Bihar Board Examinations?",
    ctaDesc: "Create a free account now to track your test history, view performance analytics, and ace your exams.",
    ctaSignUpBtn: "Create Free Account",
    ctaCheckSyllabusBtn: "Check BSEB Syllabus",

    // Dashboard
    dashTag: "Student Dashboard",
    dashGreeting: "Welcome back",
    dashPrepProgressTitle: "📈 Overall Syllabus Preparation Progress",
    dashPrepProgressDesc: "Calculated from completed syllabus topics and attempted diagnostic tests.",
    dashClassLabel: "Class:",
    dashSyllabusLabel: "Syllabus: BSEB 2026 Updated",
    dashPerfSummary: "Performance Summary",
    dashAvgScore: "Average Score",
    dashAccuracy: "Accuracy:",
    dashTotalTests: "Total Tests:",
    dashRecentTests: "📝 Recent Test Attempts",
    dashNoTests: "No tests attempted yet. Take your first test to track performance!",
    dashViewAllResults: "View All Results →",
    dashRecChapters: "📚 Recommended Chapters",
    dashRecTests: "📝 Upcoming Model Tests",
    dashStudyBtn: "Study",
    dashAttemptBtn: "Attempt",
    dashDailyActiveTitle: "Today's Daily Challenge is Live! (+50 XP Bonus)",
    dashDailyActiveDesc: "Solve 5 quick questions to maintain and increase your streak.",
    dashSolveDailyBtn: "Solve Quiz →",
    dashViewAnalyticsBtn: "View Full Analytics →",

    // Video Lectures Page
    vidBadge: "🎥 Bihar Board Video Lectures",
    vidTitle: "Chapter-wise Video Classes by Top Educators",
    vidDesc: "Comprehensive video lectures, one-shot revision sessions, and solved numerical problems for Classes 5 to 12.",
    vidSearchPlaceholder: "Search chapter or topic...",
    vidWatchBtn: "Watch Video",
    vidViewNotesBtn: "📖 View Chapter Notes",
    vidStartTestBtn: "✍️ Practice Chapter Test",
    vidTeacherLabel: "Educator:",
    vidDurationLabel: "Duration:",
    vidNoVideos: "No videos found",
    vidTryOther: "Please select another class or subject filter.",

    // Daily Challenge & Leaderboard Page
    dcBadge: "Daily Streak",
    dcTitle: "Daily Challenge & Bihar State Leaderboard",
    dcDesc: "Solve 5 multiple-choice questions daily, build continuous study streaks, and rank among thousands of students across Bihar.",
    dcStreakCardTitle: "Your Current Streak",
    dcStreakSavedNotice: "Solve today for: +1 Day Streak!",
    dcTabQuiz: "⚡ Today's Quiz (5 MCQs)",
    dcTabLeaderboard: "🏆 Bihar State Leaderboard",
    dcSubmitBtn: "✓ Submit Today's Challenge",
    dcSubmitting: "Submitting...",
    dcExplainLabel: "💡 Solution / Explanation:",
    dcCorrectBadge: "✓ Correct Answer",
    dcLeaderboardTitle: "Bihar State Rankings (Top 10)",
    dcTotalActive: "Total Active Students:",
    dcColRank: "Rank",
    dcColName: "Student Name",
    dcColDistrict: "District",
    dcColClass: "Class",
    dcColStreak: "Streak",
    dcColXp: "Total XP",
    dcColAccuracy: "Accuracy",

    // AI Guru Modal
    aiModalTitle: "AI Doubt Guru",
    aiModalLiveBadge: "24/7 Live",
    aiModalSubtitle: "Hindi • English • Hinglish • All Subjects",
    aiClearBtn: "🧹 Clear",
    aiLanguageLabel: "Language Mode:",
    aiInputPlaceholder: "Ask anything (Hindi, English, Hinglish)...",
    aiThinkingMsg: "AI Guru is writing your solution...",
    aiCopyBtn: "📋 Copy",
    aiCopiedBtn: "✓ Copied!",

    // Footer
    footerDesc: "Bihar Board Classes 5–12 Online Coaching and Practice Platform. Conforming strictly to the BSEB Syllabus.",
    footerCopyright: `© ${new Date().getFullYear()} The Guidance. All rights reserved. Designed for Matric & Intermediate board success.`
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem('app_language') || 'hi');

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const toggleLanguage = () => {
    const newLang = language === 'hi' ? 'en' : 'hi';
    setLanguage(newLang);
  };

  const t = (key) => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.hi;
    return dict[key] !== undefined ? dict[key] : (TRANSLATIONS.en[key] || key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
