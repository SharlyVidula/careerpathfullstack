import React, { useEffect, useState } from "react";
import theme from "../theme";

export default function ThemeToggle() {
    const [isLight, setIsLight] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("theme");
        if (stored === "light") {
            document.body.classList.add("light-mode");
            setIsLight(true);
        }
    }, []);

    const toggleTheme = () => {
        if (isLight) {
            document.body.classList.remove("light-mode");
            localStorage.setItem("theme", "dark");
            setIsLight(false);
        } else {
            document.body.classList.add("light-mode");
            localStorage.setItem("theme", "light");
            setIsLight(true);
        }
    };

    return (
        <button
            onClick={toggleTheme}
            style={{
                position: "fixed",
                bottom: "30px",
                right: "30px",
                height: "56px",
                width: "56px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                cursor: "pointer",
                background: isLight ? "#ffffff" : "var(--surface)",
                border: `1px solid var(--border)`,
                boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                zIndex: 9999,
                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease",
                color: "var(--text-primary)"
            }}
            className="button-hover"
            title="Toggle Light/Dark Mode"
            aria-label="Toggle Light/Dark Mode"
        >
            <div
                style={{
                    transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease",
                    transform: isLight ? "rotate(180deg) scale(0)" : "rotate(0deg) scale(1)",
                    opacity: isLight ? 0 : 1,
                    position: "absolute"
                }}
            >
                🌙
            </div>
            <div
                style={{
                    transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease",
                    transform: isLight ? "rotate(0deg) scale(1)" : "rotate(-180deg) scale(0)",
                    opacity: isLight ? 1 : 0,
                    position: "absolute"
                }}
            >
                ☀️
            </div>
        </button>
    );
}
