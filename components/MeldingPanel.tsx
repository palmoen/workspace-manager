"use client";

import { useState } from "react";

interface Melding {
  id: string;
  type: string;
  beskrivelse: string;
  innsender: string;
  bilder: string[];
  opprettet: Date | string;
  behandlet: boolean;
  serviceKommentar?: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  avvik: "Avvik",
  servicebehov: "Servicebehov",
  reklamasjon: "Reklamasjon",
};

const TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  avvik: { bg: "#fee2e2", color: "#b91c1c" },
  servicebehov: { bg: "#fef3c7", color: "#b45309" },
  reklamasjon: { bg: "#dbeafe", color: "#1d4ed8" },
};

export function MeldingPanel({ melding }: { melding: Melding }) {
  const [behandlet, setBehandlet] = useState(melding.behandlet);
  const [kommentar, setKommentar] = useState(melding.serviceKommentar ?? "");
  const [showForm, setShowForm] = useState(false);
  const [pin, setPin] = useState("");
  const [inputKommentar, setInputKommentar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tc = TYPE_COLOR[melding.type] ?? { bg: "#f3f4f6", color: "#6b7280" };
  const dato = new Date(melding.opprettet).toLocaleDateString("nb-NO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  async function bekreft() {
    setError("");
    if (!inputKommentar.trim()) { setError("Kommentar er påkrevd"); return; }
    if (!pin.trim()) { setError("PIN er påkrevd"); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/meldinger/${melding.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, kommentar: inputKommentar.trim() }),
      });
      if (res.ok) {
        setBehandlet(true);
        setKommentar(inputKommentar.trim());
        setShowForm(false);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Noe gikk galt");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ ...s.card, opacity: behandlet ? 0.7 : 1 }}>
      {/* Header */}
      <div style={s.top}>
        <div style={s.typeRow}>
          <span style={{ ...s.typeBadge, background: tc.bg, color: tc.color }}>
            {TYPE_LABEL[melding.type] ?? melding.type}
          </span>
          {behandlet && <span style={s.behandletBadge}>Behandlet</span>}
        </div>
        <span style={s.dato}>{dato}</span>
      </div>

      {/* Beskrivelse */}
      <p style={s.beskrivelse}>{melding.beskrivelse}</p>

      {/* Innmelder */}
      <div style={s.metaGrid}>
        {melding.innsender.split(" | ").map((v, i) => (
          <span key={i} style={s.metaChip}>{v}</span>
        ))}
      </div>

      {/* Bilder */}
      {melding.bilder.length > 0 && (
        <div style={s.bilder}>
          {melding.bilder.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer">
              <img src={url} alt="Vedlegg" style={s.thumb} />
            </a>
          ))}
        </div>
      )}

      {/* Servicekommentar (når behandlet) */}
      {behandlet && kommentar && (
        <div style={s.kommentarBoks}>
          <div style={s.kommentarLabel}>Servicekommentar</div>
          <p style={s.kommentarTekst}>{kommentar}</p>
        </div>
      )}

      {/* Footer-knapper */}
      <div style={s.footer}>
        <a
          href={`/admin/serviceskjema/${melding.id}`}
          target="_blank"
          rel="noreferrer"
          style={s.printBtn}
        >
          Skriv ut serviceskjema
        </a>
        {!behandlet && !showForm && (
          <button onClick={() => setShowForm(true)} style={s.behandletBtn}>
            Merk som behandlet
          </button>
        )}
      </div>

      {/* Inline-skjema for behandling */}
      {showForm && !behandlet && (
        <div style={s.behandlingForm}>
          <div style={s.behandlingTitle}>Bekreft behandling</div>

          <label style={s.fieldLabel}>
            Servicekommentar <span style={s.req}>*</span>
            <textarea
              value={inputKommentar}
              onChange={(e) => setInputKommentar(e.target.value)}
              placeholder="Hva ble gjort? Deler byttet, tiltak utført…"
              rows={3}
              style={s.textarea}
              autoFocus
            />
          </label>

          <label style={s.fieldLabel}>
            Admin-PIN <span style={s.req}>*</span>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              style={{ ...s.pinInput }}
              onKeyDown={(e) => e.key === "Enter" && bekreft()}
            />
          </label>

          {error && <p style={s.error}>{error}</p>}

          <div style={s.formActions}>
            <button
              onClick={() => { setShowForm(false); setError(""); setPin(""); setInputKommentar(""); }}
              style={s.avbrytBtn}
            >
              Avbryt
            </button>
            <button onClick={bekreft} disabled={loading} style={s.bekreftBtn}>
              {loading ? "Lagrer…" : "Bekreft behandlet"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: {
    background: "#f9fafb",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "0.9rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  top: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" },
  typeRow: { display: "flex", gap: "0.4rem", alignItems: "center" },
  typeBadge: { padding: "0.2rem 0.55rem", borderRadius: 99, fontSize: "0.78rem", fontWeight: 600 },
  behandletBadge: { padding: "0.2rem 0.55rem", borderRadius: 99, fontSize: "0.78rem", fontWeight: 600, background: "#dcfce7", color: "#16a34a" },
  dato: { fontSize: "0.75rem", color: "#9ca3af" },
  beskrivelse: { margin: 0, fontSize: "0.875rem", color: "#374151", whiteSpace: "pre-wrap" },
  metaGrid: { display: "flex", gap: "0.4rem", flexWrap: "wrap" },
  metaChip: { fontSize: "0.75rem", color: "#6b7280", background: "#f3f4f6", padding: "0.15rem 0.5rem", borderRadius: 99 },
  bilder: { display: "flex", gap: "0.4rem", flexWrap: "wrap" },
  thumb: { width: 64, height: 64, objectFit: "cover", borderRadius: 5, border: "1px solid #e2e8f0" },
  kommentarBoks: { background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "0.6rem 0.75rem" },
  kommentarLabel: { fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "#16a34a", marginBottom: "0.25rem" },
  kommentarTekst: { margin: 0, fontSize: "0.875rem", color: "#166534", whiteSpace: "pre-wrap" },
  footer: { paddingTop: "0.25rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" },
  printBtn: { padding: "0.35rem 0.75rem", background: "none", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.8rem", color: "#374151", textDecoration: "none", display: "inline-block" },
  behandletBtn: { padding: "0.35rem 0.75rem", background: "#16a34a", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 },
  behandlingForm: {
    marginTop: "0.25rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  behandlingTitle: { fontSize: "0.875rem", fontWeight: 600, color: "#1C2233" },
  fieldLabel: { display: "flex", flexDirection: "column" as const, gap: "0.3rem", fontSize: "0.8rem", fontWeight: 500, color: "#374151" },
  req: { color: "#dc2626" },
  textarea: { padding: "0.5rem 0.6rem", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem", resize: "vertical" as const, fontFamily: "inherit" },
  pinInput: { padding: "0.5rem 0.6rem", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: "0.875rem", maxWidth: 120, letterSpacing: "0.2em" },
  error: { margin: 0, fontSize: "0.8rem", color: "#dc2626" },
  formActions: { display: "flex", gap: "0.5rem", justifyContent: "flex-end" },
  avbrytBtn: { padding: "0.4rem 0.8rem", background: "none", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem", color: "#6b7280" },
  bekreftBtn: { padding: "0.4rem 0.9rem", background: "#16a34a", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 },
};
