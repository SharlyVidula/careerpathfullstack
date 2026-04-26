import React, { useState } from "react";

/*
 PersonailtyQuiz
 - 6 quick questions
 - each answer adds points to one of 4 buckets:
   analytical, creative, social, technical
 - returns dominant style and sets it via onComplete(workStyle)
*/

const QUESTIONS = [
  {
    q: "When solving a problem, you prefer to:",
    a: [
      { t: "analytical", text: "Break it down logically" },
      { t: "creative", text: "Try a new idea" },
      { t: "technical", text: "Prototype a quick solution" },
      { t: "social", text: "Discuss with a peer" }
    ]
  },
  {
    q: "Your ideal weekend activity is:",
    a: [
      { t: "creative", text: "Draw, write, or design" },
      { t: "social", text: "Hang out with friends" },
      { t: "analytical", text: "Read/watch documentaries" },
      { t: "technical", text: "Tinker with gadgets" }
    ]
  },
  {
    q: "At work you value most:",
    a: [
      { t: "technical", text: "Tools & efficiency" },
      { t: "analytical", text: "Clear process & reasoning" },
      { t: "social", text: "Team cohesion" },
      { t: "creative", text: "Freedom to craft" }
    ]
  },
  {
    q: "When learning something new you:",
    a: [
      { t: "technical", text: "Follow a hands-on tutorial" },
      { t: "analytical", text: "Study theory & examples" },
      { t: "creative", text: "Jump in and improvise" },
      { t: "social", text: "Join a study group" }
    ]
  },
  {
    q: "You handle stress by:",
    a: [
      { t: "social", text: "Talking it out" },
      { t: "analytical", text: "Planning a schedule" },
      { t: "creative", text: "Expressing it creatively" },
      { t: "technical", text: "Fixing something" }
    ]
  },
  {
    q: "Which project excites you most?",
    a: [
      { t: "creative", text: "Redesign a brand" },
      { t: "technical", text: "Build a hardware tool" },
      { t: "analytical", text: "Analyze business data" },
      { t: "social", text: "Organize community events" }
    ]
  }
];

function PersonalityQuiz({ onComplete }) {
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState({
    analytical: 0,
    creative: 0,
    social: 0,
    technical: 0
  });

  const choose = (type) => {
    setScores(s => ({ ...s, [type]: s[type] + 1 }));
    if (idx < QUESTIONS.length - 1) setIdx(idx + 1);
    else finishQuiz({ ...scores, [type]: scores[type] + 1 });
  };

  const finishQuiz = (finalScores) => {
    // pick highest; tie-breaker based on priority order
    const order = ["analytical", "creative", "technical", "social"];
    let best = order[0];
    Object.keys(finalScores).forEach(k => {
      if (finalScores[k] > finalScores[best]) best = k;
    });

    // map to workStyle labels used by career engine
    const workStyleMap = {
      analytical: "analytical",
      creative: "creative",
      technical: "technical",
      social: "social"
    };

    const dominant = workStyleMap[best] || "analytical";

    // callback so parent (Dashboard) can update CareerForm's workStyle
    if (typeof onComplete === "function") onComplete(dominant, finalScores);
  };

  const q = QUESTIONS[idx];

  return (
    <div style={styles.container} className="quiz-fade">
      <h3 style={styles.header}>Quick Personality Quiz</h3>
      <p style={styles.progress}>Question {idx + 1} of {QUESTIONS.length}</p>
      <div style={styles.card}>
        <p style={styles.question}>{q.q}</p>

        <div style={styles.answers}>
          {q.a.map((opt, i) => (
            <button
              key={i}
              onClick={() => choose(opt.t)}
              style={styles.answerBtn}
              className="answer-anim"
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { marginTop: 20, textAlign: "center", color: "white" },
  header: { fontSize: 20, marginBottom: 6 },
  progress: { opacity: 0.8, marginBottom: 12 },
  card: {
    background: "rgba(255,255,255,0.06)",
    padding: 18,
    borderRadius: 12,
    display: "inline-block",
    minWidth: 320,
    border: "1px solid rgba(255,255,255,0.08)"
  },
  question: { fontSize: 16, marginBottom: 12 },
  answers: { display: "grid", gap: 10 },
  answerBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    background: "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
    color: "white"
  }
};

// small animations
const sheet = document.createElement("style");
sheet.innerHTML = `
.quiz-fade { animation: fadeQuiz 0.7s ease both; }
@keyframes fadeQuiz { from {opacity:0; transform: translateY(10px)} to {opacity:1; transform:none} }
.answer-anim { transition: .18s; }
.answer-anim:hover { transform: translateY(-3px); box-shadow: 0 6px 18px rgba(0,0,0,0.4); }
`;
document.head.appendChild(sheet);

export default PersonalityQuiz;
