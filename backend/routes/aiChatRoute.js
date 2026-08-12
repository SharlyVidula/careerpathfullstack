const express = require('express');
const router = express.Router();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/chat', async (req,res)=>{
  try {
    const { message, cvContext } = req.body;
    if(!message) return res.status(400).json({ ok:false, error:"No message" });
    
    let contextStr = "No CV or context provided by the user. Speak generally.";
    if (cvContext) {
      contextStr = `User CV Context:\n${cvContext}\n\nPlease use this context to provide highly accurate job guessings, advice, and answers tailored specifically to this user's experience.`;
    }

    const prompt = `You are the official AI Assistant inside the 'LNBTI Progress Portal' (Lanka Nippon BizTech Institute, Sri Lanka).
You provide personalized academic guidance, portfolio telemetry insights, and career path advice tailored specifically for LNBTI students, Senior Lecturer Academic Coordinators, and Intern Company Supervisors.

Core LNBTI Progress Portal Context & Governance Rules:
1. Platform Name: 'LNBTI Progress Portal' (Lanka Nippon BizTech Institute, Sri Lanka).
2. Student Academic Stages:
   - Stage 1 (1st & 2nd Year): Focuses on foundational skill building, daily learning activity logs in Growth Tracker, GitHub OAuth connection, and public repository portfolio building. Advanced matching tools are locked during Stage 1.
   - Stage 2 (3rd Year Intern Ready): Unlocks internship vacancy applications, Job Role Matching, and AI Resume Analyzer when Senior Lecturers promote the account.
   - Stage 3 (Final Year Job Expecting): Unlocks full-time graduate job postings and direct industry partner recruitment.
3. Governance & Roles:
   - Academic Coordinators (Senior Lecturers): Approve student sign-ups, promote students across academic stages, search telemetry by Index Number (e.g. UGC0323021 / UOG0323045), and manage social link reset requests.
   - Degree Batches: UGC (SE) (Software Engineering) and UOG (University of Greenwich). Batch numbers: SE1, SE2... and UOG1, UOG2...
   - Company Supervisors: Recruiters from tech companies (IFS, Virtusa, 99x) posting vacancies.

Tone: Highly encouraging, professional, academic, precise, and supportive.

You must return ONLY a JSON response in the following format (do not wrap in markdown backticks):
{
  "reply": "Your conversational reply here",
  "isMatch": false,
  "role": "Job Role Title",
  "score": 95
}

${contextStr}

User says: "${message}"
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.7,
      max_tokens: 800,
    });

    let raw = response.choices[0].message.content.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/```json/i, "").replace(/```/g, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // Fallback if AI fails to return JSON
      parsed = { reply: raw, isMatch: false };
    }

    return res.json({ ok:true, ...parsed });
  } catch(e){ 
    console.error("AI Chat Error:", e); 
    res.status(500).json({ ok:false, error: e.message }); 
  }
});

module.exports = router;
