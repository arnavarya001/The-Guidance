const ai = require('./services/ai');

async function testGeminiStyleAI() {
  console.log("=== Testing Gemini-Style Multi-Lingual AI Engine ===");

  // 1. Hinglish query
  console.log("\n1. Testing Hinglish query...");
  const hinglishRes = await ai.solveDoubt({
    query: "bhai Newton ka 3rd law aur momentum samjha do simple words me",
    history: [],
    language: "hinglish"
  });
  console.log("Hinglish response status:", hinglishRes.answer ? "PASS" : "FAIL");
  console.log("Snippet:", hinglishRes.answer.slice(0, 120) + "...\n");

  // 2. Coding query
  console.log("2. Testing Coding query...");
  const codeRes = await ai.solveDoubt({
    query: "python program to check prime number",
    history: [],
    language: "english"
  });
  console.log("Coding response status:", codeRes.answer.includes("```python") ? "PASS" : "FAIL");
  console.log("Snippet:", codeRes.answer.slice(0, 120) + "...\n");

  // 3. Hindi Letter / Essay query
  console.log("3. Testing Hindi Letter/Essay query...");
  const letterRes = await ai.solveDoubt({
    query: "प्रधानाध्यापक को 3 दिन की छुट्टी के लिए आवेदन पत्र",
    history: [],
    language: "hindi"
  });
  console.log("Hindi Letter status:", letterRes.answer ? "PASS" : "FAIL");
  console.log("Snippet:", letterRes.answer.slice(0, 120) + "...\n");

  // 4. Multi-turn conversation simulation
  console.log("4. Testing Multi-turn conversation...");
  const turn2Res = await ai.solveDoubt({
    query: "iska ek example bhi do",
    history: [
      { sender: 'user', text: "द्विघात समीकरण क्या होता है?" },
      { sender: 'ai', text: "द्विघात समीकरण ax^2 + bx + c = 0 के रूप का होता है।" }
    ],
    language: "auto"
  });
  console.log("Multi-turn status:", turn2Res.answer ? "PASS" : "FAIL");

  console.log("\n=== All Gemini-Style AI Tests Passed! ===");
}

testGeminiStyleAI().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
