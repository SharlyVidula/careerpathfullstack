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

    const prompt = `You are a helpful and intelligent Career AI Assistant inside a platform called 'Career Path System'.
Your goal is to converse freely with the user. Answer their questions accurately based on the context provided.
You must return ONLY a JSON response in the following format. Do not use Markdown backticks.
{
  "reply": "Your conversational reply here",
  "isMatch": boolean, // true ONLY IF the user is explicitly asking for a job match or scanning their CV for jobs right now
  "role": "Job Role Title", // Only if isMatch is true. Based on CV.
  "score": 95 // integer out of 100, Only if isMatch is true.
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
