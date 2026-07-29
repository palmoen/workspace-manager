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
  const [loading, setLoading] = useState(false);
  const tc = TYPE_COLOR[melding.type] ?? { bg: "#f3f4f6", color: "#6b7280" };
  const dato = new Date(melding.opprettet).toLocaleDateString("nb-NO", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  async function markerBehandlet() {
    setLoading(true);
    try {
      const res = await fetch(`/api/meldinger/${melding.id}`, { method: "PATCH" });
      if (res.ok) setBehandlet(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ ...s.card, opacity: behandlet ? 0.65 : 1 }}>
      <div style={s.top}>
        <div style={s.typeRow}>
          <span style={{ ...s.typeBadge, background: tc.bg, color: tc.color }}>
            {TYPE_LABEL[melding.type] ?? melding.type}
          </span>
          {behandlet && <span style={s.behandletBadge}>Behandlet</span>}
        </div>
        <span style={s.dato}>{dato}</span>
      </div>

      <p style={s.beskrivelse}>{melding.beskrivelse}</p>

      <div style={s.meta}>
        <span>Fra: <strong>{melding.innsender}</strong></span>
      </div>

      {melding.bilder.length > 0 && (
        <div style={s.bilder}>
          {melding.bilder.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer">
              <img src={url} alt="Vedlegg" style={s.thumb} />
            </a>
          ))}
        </div>
      )}

      <div style={s.footer}>
        <a
          href={`/admin/serviceskjema/${melding.id}`}
          target="_blank"
          rel="noreferrer"
          style={s.printBtn}
        >
          Skriv ut serviceskjema
        </a>
        {!behandlet && (
          <button onClick={markerBehandlet} disabled={loading} style={s.behandletBtn}>
            {loading ? "Lagrer…" : "Merk som behandlet"}
          </button>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: { background: "#f9fafb", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0.9rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" },
  top: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" },
  typeRow: { display: "flex", gap: "0.4rem", alignItems: "center" },
  typeBadge: { padding: "0.2rem 0.55rem", borderRadius: 99, fontSize: "0.78rem", fontWeight: 600 },
  behandletBadge: { padding: "0.2rem 0.55rem", borderRadius: 99, fontSize: "0.78rem", fontWeight: 600, background: "#dcfce7", color: "#16a34a" },
  dato: { fontSize: "0.75rem", color: "#9ca3af" },
  beskrivelse: { margin: 0, fontSize: "0.875rem", color: "#374151", whiteSpace: "pre-wrap" },
  meta: { fontSize: "0.78rem", color: "#6b7280" },
  bilder: { display: "flex", gap: "0.4rem", flexWrap: "wrap" },
  thumb: { width: 64, height: 64, objectFit: "cover", borderRadius: 5, border: "1px solid #e2e8f0" },
  footer: { paddingTop: "0.25rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" as const },
  printBtn: { padding: "0.35rem 0.75rem", background: "none", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem", color: "#374151", textDecoration: "none", display: "inline-block" },
  behandletBtn: { padding: "0.35rem 0.75rem", background: "#16a34a", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 },
};
