import React, { useState, useEffect } from "react";
import theme from "../theme";
import apiClient from "../apiClient";

export default function QuizModal({ isOpen, onClose, category, user, onQuizCompleted }) {
  const [questions, setQuestions] = useState([]);
  const [bankKey, setBankKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submittedOption, setSubmittedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const userId = user?._id || user?.id || user?.userId;

  useEffect(() => {
    if (isOpen && category && userId) {
      fetchQuestions();
    }
  }, [isOpen, category, userId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setIsFinished(false);
      setCurrentIndex(0);
      setScore(0);
      setSelectedOption(null);
      setSubmittedOption(null);

      const res = await apiClient.get(`/growth/quiz/questions?userId=${userId}&category=${category}`);
      if (res.data?.ok) {
        setQuestions(res.data.questions || []);
        setBankKey(res.data.bankKey || category);
      }
    } catch (err) {
      console.error("Error fetching quiz questions", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];

  const handleSelectOption = (idx) => {
    if (submittedOption !== null) return; // already revealed explanation
    setSelectedOption(idx);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null) return;
    setSubmittedOption(selectedOption);
    if (selectedOption === currentQ.correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setSubmittedOption(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const finalScore = score + (selectedOption === currentQ?.correct ? 1 : 0);
    setIsFinished(true);
    try {
      setSubmitting(true);
      const res = await apiClient.post("/growth/quiz/submit", {
        userId,
        category,
        score: finalScore,
        totalQuestions: questions.length
      });
      if (onQuizCompleted) {
        onQuizCompleted(res.data);
      }
    } catch (err) {
      console.error("Error submitting quiz results", err);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryTitle = () => {
    if (category === "IQ") return "🧠 Logic & IQ Challenge";
    if (category === "SE") return "💻 Software Engineering Skill Quiz";
    if (category === "JLPT") return "🇯🇵 Japanese Language Mastery Quiz";
    return "🎮 Daily Growth Quiz";
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(5, 10, 25, 0.88)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      zIndex: 50000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 20px 30px"
    }}>
      <div style={{
        background: "var(--card-bg, #0f172a)",
        border: "1px solid rgba(99, 102, 241, 0.4)",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "760px",
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        padding: "24px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, color: "var(--accent, #6366f1)", fontSize: "20px" }}>
              {getCategoryTitle()}
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-secondary, #94a3b8)" }}>
              Level Mode: <strong>{bankKey}</strong>
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "24px", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)" }}>
            ⏳ Loading Questions...
          </div>
        ) : isFinished ? (
          /* Finished State */
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "50px", marginBottom: "16px" }}>🏆</div>
            <h3 style={{ color: "#22c55e", fontSize: "22px", margin: "0 0 8px 0" }}>
              Challenge Completed!
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "0 0 20px 0" }}>
              You scored <strong>{score} / {questions.length}</strong> correct answers.
            </p>
            <div style={{ padding: "16px", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "12px", marginBottom: "24px" }}>
              <span style={{ fontSize: "14px", color: "#34d399", fontWeight: "bold" }}>
                ⚡ Performance Index Boosted by +{Math.round((score / (questions.length || 1)) * 10)}%!
              </span>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                Your Growth Radar & ATS Performance metrics have been updated live.
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ ...theme.button("primary"), width: "100%", padding: "12px" }}
              className="button-hover"
            >
              Continue Learning
            </button>
          </div>
        ) : (
          /* Question View */
          <div>
            {/* Progress Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>Score: {score}</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden", marginBottom: "20px" }}>
              <div style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #34d399)", transition: "width 0.3s" }} />
            </div>

            {/* Question Text */}
            <h4 style={{ fontSize: "16px", color: "var(--text-primary)", marginBottom: "20px", lineHeight: "1.5" }}>
              {currentQ.question}
            </h4>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {currentQ.options.map((opt, idx) => {
                let isSelected = selectedOption === idx;
                let isCorrect = currentQ.correct === idx;
                let bg = "var(--card-item-bg, rgba(255,255,255,0.04))";
                let border = "1px solid var(--card-item-border, rgba(255,255,255,0.1))";

                if (submittedOption !== null) {
                  if (isCorrect) {
                    bg = "rgba(34, 197, 94, 0.18)";
                    border = "1px solid #22c55e";
                  } else if (isSelected) {
                    bg = "rgba(239, 68, 68, 0.18)";
                    border = "1px solid #ef4444";
                  }
                } else if (isSelected) {
                  bg = "rgba(99, 102, 241, 0.2)";
                  border = "1px solid var(--accent, #6366f1)";
                }

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    style={{
                      padding: "14px 18px",
                      borderRadius: "12px",
                      background: bg,
                      border: border,
                      cursor: submittedOption === null ? "pointer" : "default",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      transition: "all 0.2s"
                    }}
                  >
                    <span style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: isSelected ? "var(--accent)" : "rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span style={{ flex: 1 }}>{opt}</span>
                  </div>
                );
              })}
            </div>

            {/* Explanation Section after submission */}
            {submittedOption !== null && (
              <div style={{
                padding: "14px 16px",
                background: submittedOption === currentQ.correct ? "rgba(34, 197, 94, 0.1)" : "rgba(234, 179, 8, 0.1)",
                border: `1px solid ${submittedOption === currentQ.correct ? "rgba(34, 197, 94, 0.3)" : "rgba(234, 179, 8, 0.3)"}`,
                borderRadius: "12px",
                marginBottom: "20px",
                fontSize: "13px",
                lineHeight: "1.5"
              }}>
                <strong style={{ color: submittedOption === currentQ.correct ? "#22c55e" : "#eab308" }}>
                  {submittedOption === currentQ.correct ? "✨ Correct Answer!" : "💡 Solution Explanation:"}
                </strong>
                <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)" }}>
                  {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              {submittedOption === null ? (
                <button
                  onClick={handleConfirmAnswer}
                  disabled={selectedOption === null}
                  style={{
                    ...theme.button("primary"),
                    opacity: selectedOption === null ? 0.5 : 1,
                    cursor: selectedOption === null ? "not-allowed" : "pointer"
                  }}
                  className="button-hover"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  style={{ ...theme.button("primary"), background: "linear-gradient(135deg, #10b981, #059669)" }}
                  className="button-hover"
                >
                  {currentIndex + 1 < questions.length ? "Next Question ➔" : "View Final Results 🏆"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
