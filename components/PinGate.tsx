"use client";

import { useState, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function PinGate({ children }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        setAuthed(true);
      } else {
        setError("Feil PIN – prøv igjen");
        setPin("");
      }
    } finally {
      setLoading(false);
    }
  }

  if (authed) return <>{children}</>;

  return (
    <div style={styles.overlay}>
      <form onSubmit={submit} style={styles.card}>
        <h2 style={styles.heading}>Skriv inn PIN</h2>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          autoFocus
          style={styles.input}
        />
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" disabled={loading || !pin} style={styles.button}>
          {loading ? "Sjekker…" : "Logg inn"}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f4f0",
  },
  card: {
    background: "white",
    borderRadius: 8,
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    width: "min(320px, 90vw)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
  },
  heading: { margin: 0, fontSize: "1.2rem", fontWeight: 600 },
  input: {
    padding: "0.75rem",
    fontSize: "1.1rem",
    border: "1px solid #ccc",
    borderRadius: 6,
    textAlign: "center",
    letterSpacing: "0.3em",
  },
  error: { margin: 0, color: "#c00", fontSize: "0.875rem" },
  button: {
    padding: "0.75rem",
    background: "#1a1a1a",
    color: "white",
    border: "none",
    borderRadius: 6,
    fontSize: "1rem",
    cursor: "pointer",
  },
};
