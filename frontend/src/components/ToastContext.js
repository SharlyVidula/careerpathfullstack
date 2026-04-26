import React, { createContext, useContext, useState, useCallback } from "react";
import theme from "../theme";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "success") => {
        const id = Date.now().toString() + Math.random().toString();
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4500); // Wait 4.5 seconds to read
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}

            {/* Container for absolute toasts */}
            <div
                style={{
                    position: "fixed",
                    top: "30px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 100000,
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    pointerEvents: "none",
                }}
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        style={{
                            padding: "14px 26px",
                            borderRadius: theme.radii.xl,
                            background: t.type === "error"
                                ? "rgba(239, 68, 68, 0.15)"
                                : t.type === "info"
                                    ? "rgba(56, 189, 248, 0.15)"
                                    : "rgba(52, 211, 153, 0.15)",
                            border: `1px solid ${t.type === "error"
                                    ? "rgba(239, 68, 68, 0.4)"
                                    : t.type === "info"
                                        ? "rgba(56, 189, 248, 0.4)"
                                        : "rgba(52, 211, 153, 0.4)"
                                }`,
                            color: "var(--text-primary)",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            fontSize: "15px",
                            fontWeight: 600,
                            letterSpacing: "0.2px",
                            boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
                            animation: "toastSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                            transformOrigin: "top center"
                        }}
                    >
                        {t.message}
                    </div>
                ))}
            </div>
            <style>
                {`
          @keyframes toastSlide {
            0% { opacity: 0; transform: translateY(-40px) scale(0.9); filter: blur(10px); }
            100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
          }
        `}
            </style>
        </ToastContext.Provider>
    );
};
