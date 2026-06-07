import React, { useEffect, useState } from "react";

export default function RetroBootSequence() {
  const [visible, setVisible] = useState(true);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // If we've already booted in this tab session, skip the animation
    if (sessionStorage.getItem("sys_booted")) {
      setVisible(false);
      return;
    }

    const messages = [
      { text: "> LOAD SYSTEM_BIOS_V4.92...", delay: 100 },
      { text: "> MEMORY CHECK: 640KB OK", delay: 350 },
      { text: "> LINKING EXPRESS_CORE_DAEMON [PORT 5000]... OK", delay: 600 },
      { text: "> SYNCHRONIZING NEURAL MAPS...", delay: 900 },
      { text: "> RETRIEVING USER_METRICS_DB... COMPLETED", delay: 1200 },
      { text: "> ALL MODULES INTEGRATED.", delay: 1500 },
      { text: "> BOOT SEQUENCE COMPLETE. WELCOME USER.", delay: 1800 },
    ];

    messages.forEach((msg) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, msg.text]);
      }, msg.delay);
    });

    // Complete boot sequence
    const timer = setTimeout(() => {
      sessionStorage.setItem("sys_booted", "true");
      setVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.terminal}>
        <div style={styles.header}>
          <span style={styles.dotRed} />
          <span style={styles.dotYellow} />
          <span style={styles.dotGreen} />
          <span style={styles.title}>SYSBOOT - BENTO V2.9</span>
        </div>
        <div style={styles.body}>
          {logs.map((log, idx) => (
            <div key={idx} style={styles.line}>
              {log}
            </div>
          ))}
          <div style={styles.cursorLine}>
            <span style={styles.cursor} />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "#05040a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    fontFamily: "'Share Tech Mono', monospace",
    color: "#39ff14", // neon laser green
    padding: "20px",
  },
  terminal: {
    width: "100%",
    maxWidth: "520px",
    background: "#090812",
    borderRadius: "8px",
    border: "2px solid #39ff14",
    boxShadow: "0 0 30px rgba(57, 255, 20, 0.25)",
    overflow: "hidden",
  },
  header: {
    background: "rgba(57, 255, 20, 0.08)",
    borderBottom: "1px solid #39ff14",
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  dotRed: { width: "8px", height: "8px", borderRadius: "50%", background: "#ff3131" },
  dotYellow: { width: "8px", height: "8px", borderRadius: "50%", background: "#ff9900" },
  dotGreen: { width: "8px", height: "8px", borderRadius: "50%", background: "#39ff14" },
  title: {
    marginLeft: "8px",
    fontSize: "11px",
    color: "#39ff14",
    opacity: 0.8,
    letterSpacing: "1px",
  },
  body: {
    padding: "20px",
    minHeight: "220px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontSize: "13px",
  },
  line: {
    lineHeight: "1.4",
    textShadow: "0 0 4px rgba(57, 255, 20, 0.4)",
  },
  cursorLine: {
    display: "flex",
  },
  cursor: {
    display: "inline-block",
    width: "8px",
    height: "14px",
    background: "#39ff14",
    animation: "boot-cursor 0.8s step-end infinite",
    boxShadow: "0 0 6px #39ff14",
  },
};
