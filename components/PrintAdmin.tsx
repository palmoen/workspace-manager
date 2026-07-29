"use client";

import { useState } from "react";
import { AssetLabel } from "@/components/AssetLabel";

const TENANT_ID = process.env.NEXT_PUBLIC_WM_TENANT_ID ?? "";

interface Asset {
  id: string;
}

export function PrintAdmin() {
  const [authed, setAuthed] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  const [antall, setAntall] = useState("10");
  const [genererte, setGenererte] = useState<Asset[]>([]);
  const [reprints, setReprints] = useState<Asset[]>([]);
  const [reprIntId, setRePrintId] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [reprLoading, setReprLoading] = useState(false);
  const [error, setError] = useState("");

  async function loggInn() {
    const pinVal = (document.getElementById("wm-pin") as HTMLInputElement)?.value ?? "";
    if (!pinVal) {
      setPinError("Skriv inn PIN");
      return;
    }
    setPinLoading(true);
    setPinError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinVal }),
      });
      if (res.ok) {
        setAuthed(true);
      } else {
        setPinError("Feil PIN – prøv igjen");
        const el = document.getElementById("wm-pin") as HTMLInputElement;
        if (el) el.value = "";
      }
    } finally {
      setPinLoading(false);
    }
  }

  async function generer() {
    setGenLoading(true);
    setError("");
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ antall: Number(antall), tenantId: TENANT_ID }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Feil ved generering");
        return;
      }
      const { assets } = await res.json();
      setGenererte(assets);
      setReprints([]);
    } finally {
      setGenLoading(false);
    }
  }

  async function reprinte() {
    const id = reprIntId.trim().toUpperCase();
    if (!id) return;
    setReprLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/assets/${encodeURIComponent(id)}`);
      if (!res.ok) {
        setError(`Asset "${id}" finnes ikke`);
        return;
      }
      const asset = await res.json();
      setReprints([asset]);
      setGenererte([]);
    } finally {
      setReprLoading(false);
    }
  }

  if (!authed) {
    return (
      <div style={s.overlay}>
        <div style={s.card}>
          <h2 style={s.heading}>Skriv inn PIN</h2>
          <input
            id="wm-pin"
            type="password"
            inputMode="numeric"
            defaultValue=""
            placeholder="PIN"
            autoFocus
            style={s.pinInput}
          />
          {pinError && <p style={s.pinError}>{pinError}</p>}
          <button onClick={loggInn} disabled={pinLoading} style={s.loginBtn}>
            {pinLoading ? "Sjekker…" : "Logg inn"}
          </button>
        </div>
      </div>
    );
  }

  const visningsListe = reprints.length > 0 ? reprints : genererte;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        @media screen {
          .label-grid { display: flex; flex-wrap: wrap; gap: 4mm; padding: 1rem; }
        }
      `}</style>

      <div className="no-print" style={s.controls}>
        <h1 style={s.pageHeading}>Etikett-admin</h1>

        <section style={s.section}>
          <h2 style={s.subheading}>Generer nye etiketter</h2>
          <div style={s.row}>
            <input
              type="number"
              min="1"
              max="500"
              value={antall}
              onChange={(e) => setAntall(e.target.value)}
              style={s.numInput}
            />
            <button onClick={generer} disabled={genLoading} style={s.btn}>
              {genLoading ? "Genererer…" : `Generer ${antall} stk`}
            </button>
            {genererte.length > 0 && (
              <button onClick={() => window.print()} style={s.printBtn}>
                Skriv ut
              </button>
            )}
          </div>
        </section>

        <section style={s.section}>
          <h2 style={s.subheading}>Reprint (eksisterende ID)</h2>
          <div style={s.row}>
            <input
              value={reprIntId}
              onChange={(e) => setRePrintId(e.target.value)}
              placeholder="AC-XXXXXXXX"
              style={{ ...s.numInput, fontFamily: "monospace", letterSpacing: "0.1em", width: 160 }}
            />
            <button onClick={reprinte} disabled={reprLoading} style={s.btn}>
              {reprLoading ? "Søker…" : "Hent etikett"}
            </button>
            {reprints.length > 0 && (
              <button onClick={() => window.print()} style={s.printBtn}>
                Skriv ut
              </button>
            )}
          </div>
        </section>

        {error && <p style={s.error}>{error}</p>}

        {visningsListe.length > 0 && (
          <p style={s.info}>
            {reprints.length > 0
              ? `Reprint: ${reprints[0].id}`
              : `${genererte.length} etiketter klare`}
          </p>
        )}
      </div>

      {visningsListe.length > 0 && (
        <div className="label-grid">
          {visningsListe.map((a) => (
            <div key={a.id} className="label-page-break">
              <AssetLabel assetId={a.id} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f4f0" },
  card: { background: "white", borderRadius: 8, padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", width: "min(320px, 90vw)", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" },
  heading: { margin: 0, fontSize: "1.2rem", fontWeight: 600 },
  pinInput: { padding: "0.75rem", fontSize: "1.1rem", border: "1px solid #ccc", borderRadius: 6, textAlign: "center" as const, letterSpacing: "0.3em" },
  pinError: { margin: 0, color: "#c00", fontSize: "0.875rem" },
  loginBtn: { padding: "0.75rem", background: "#1a1a1a", color: "white", border: "none", borderRadius: 6, fontSize: "1rem", cursor: "pointer" },
  controls: { padding: "1.5rem", maxWidth: 600, fontFamily: "system-ui, sans-serif" },
  pageHeading: { margin: "0 0 1.5rem", fontSize: "1.5rem" },
  subheading: { margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 600 },
  section: { marginBottom: "1.5rem", padding: "1rem", border: "1px solid #e0e0e0", borderRadius: 8 },
  row: { display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" },
  numInput: { padding: "0.5rem 0.75rem", border: "1px solid #ccc", borderRadius: 6, fontSize: "1rem", width: 120 },
  btn: { padding: "0.5rem 1rem", background: "#1a1a1a", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.9rem" },
  printBtn: { padding: "0.5rem 1rem", background: "#2a6", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.9rem" },
  error: { color: "#c00", fontSize: "0.875rem" },
  info: { color: "#555", fontSize: "0.875rem" },
};
