import React, { useState, useRef, useEffect } from "react";
import theme from "../theme";
import Skeleton from "./Skeleton";
import apiClient from "../apiClient";

// The mock Generative UI Match Component rendered *inside* the chat stream!
function GenerativeMatchCard({ matchData }) {
    return (
        <div style={{ ...theme.glassPanel("16px"), marginTop: "8px", border: "1px solid rgba(52, 211, 153, 0.4)", background: "rgba(52, 211, 153, 0.05)", animation: "popIn 0.5s ease" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#34d399", fontSize: "14px" }}>Generative Match Action</h4>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(52, 211, 153, 0.2)", display: "grid", placeItems: "center", fontWeight: 700, color: "#34d399" }}>
                    {matchData?.score ? `${matchData.score}%` : "85%"}
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-primary)" }}>You are highly matched for <strong>{matchData?.role || "Top Roles"}</strong>.</p>
                    <button style={{ ...theme.button('primary'), padding: "4px 8px", fontSize: "11px", marginTop: "6px" }} className="button-hover">Review Roadmap</button>
                </div>
            </div>
            <style>{`@keyframes popIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }`}</style>
        </div>
    );
}

export default function FloatingAI() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        { role: "system", content: "Hi! I'm your 2026 Generative AI Assistant. Ask me anything about your career or CV!" }
    ]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (open) scrollToBottom();
    }, [messages, open]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        
        setMessages(prev => [...prev, { role: "system", content: "Thinking...", isThinking: true }]);

        let cvContext = "";
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            if (user && user.resumeText) {
                cvContext = user.resumeText;
            }
        } catch(e) {}

        try {
            const res = await apiClient.post("/ai/chat", {
                message: userMsg,
                cvContext: cvContext
            });

            const data = res.data;

            setMessages(prev => {
                const filtered = prev.filter(m => !m.isThinking);
                const newMsgs = [...filtered, { role: "system", content: data.reply || "No reply generated." }];
                if (data.isMatch) {
                    newMsgs.push({ role: "system", isGenerative: true, matchData: { role: data.role, score: data.score } });
                }
                return newMsgs;
            });
        } catch (error) {
            setMessages(prev => {
                const filtered = prev.filter(m => !m.isThinking);
                return [...filtered, { role: "system", content: "Error connecting to AI. Please try again later." }];
            });
        }
    };

    return (
        <>
            {/* Floating Orb Button */}
            <button
                onClick={() => setOpen(!open)}
                className="button-hover"
                style={{
                    position: "fixed", bottom: "30px", right: "30px", width: "60px", height: "60px",
                    borderRadius: "50%", background: "var(--accent)", color: "#000", border: "none",
                    fontWeight: "bold", fontSize: "24px", cursor: "pointer", zIndex: 9999,
                    boxShadow: "0 0 20px var(--accent), 0 0 40px var(--accent)"
                }}
            >
                ✦
            </button>

            {/* Chat Window */}
            {open && (
                <div style={{
                    position: "fixed", bottom: "100px", right: "30px", width: "340px", height: "450px",
                    ...theme.glassPanel("15px"), display: "flex", flexDirection: "column", zIndex: 9999,
                    animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards", transformOrigin: "bottom right"
                }}>
                    <div style={{ padding: "15px", borderBottom: "1px solid var(--border)", fontWeight: 700, color: "var(--accent)" }}>
                        ✦ AI Interface
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                                {m.isGenerative ? (
                                    <GenerativeMatchCard matchData={m.matchData} />
                                ) : m.isThinking ? (
                                    <div style={{ background: "var(--surface-alt)", padding: "10px 14px", borderRadius: "12px", borderBottomLeftRadius: 0 }}>
                                        <Skeleton width="40px" height="10px" />
                                    </div>
                                ) : (
                                    <div style={{
                                        background: m.role === "user" ? "var(--accent)" : "rgba(255,255,255,0.05)",
                                        border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.1)",
                                        color: m.role === "user" ? "#000" : "var(--text-primary)",
                                        padding: "10px 14px",
                                        borderRadius: "14px",
                                        borderBottomRightRadius: m.role === "user" ? 0 : "14px",
                                        borderBottomLeftRadius: m.role === "system" ? 0 : "14px",
                                        fontSize: "13px", lineHeight: "1.4"
                                    }}>
                                        {m.content}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding: "15px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px" }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Ask anything..."
                            style={{ flex: 1, padding: "10px", borderRadius: "20px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", color: "var(--text-primary)", outline: "none" }}
                        />
                        <button onClick={handleSend} style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 700 }}>
                            Send
                        </button>
                    </div>
                </div>
            )}
            <style>{`
        @keyframes slideUp { 0% { opacity: 0; transform: translateY(20px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
        </>
    );
}
