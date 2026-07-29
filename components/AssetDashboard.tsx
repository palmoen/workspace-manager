"use client";

import { useEffect, useState, useCallback } from "react";

type Asset = {
  id: string;
  status: string;
  produkttype?: { id: string; navn: string } | null;
  modell?: { id: string; navn: string; produsent: { id: string; navn: string } } | null;
  kunde?: { id: string; navn: string } | null;
  lokasjon?: { id: string; navn: string } | null;
  kjopsdato?: string | null;
  garantiMaaneder?: number | null;
  notat?: string | null;
  opprettet: string;
};

type FilterOption = { id: string; navn: string };

const STATUS_LABELS: Record<string, string> = {
  ubrukt: "Ubrukt",
  registrert: "Registrert",
  trenger_service: "Trenger service",
  kassert: "Kassert",
};

const s = {
  page: { display: "flex", flexDirection: "column", gap: "1rem" } as React.CSSProperties,
  card: { background: "white", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" } as React.CSSProperties,
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap" as const, gap: "0.75rem" } as React.CSSProperties,
  h1: { margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#1C2233" } as React.CSSProperties,
  filters: { display: "flex", flexWrap: "wrap" as const, gap: "0.5rem", marginBottom: "1rem", alignItems: "center" } as React.CSSProperties,
  select: { padding: "0.45rem 0.7rem", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.875rem", background: "white", color: "#374151" } as React.CSSProperties,
  input: { padding: "0.45rem 0.7rem", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.875rem", minWidth: 200, color: "#374151" } as React.CSSProperties,
  exportBtn: { padding: "0.45rem 1rem", background: "#16a34a", color: "white", border: "none", borderRadius: 7, fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "inline-block" } as React.CSSProperties,
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "0.85rem" } as React.CSSProperties,
  th: { textAlign: "left" as const, padding: "0.65rem 0.9rem", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", fontWeight: 600, color: "#374151", fontSize: "0.8rem", letterSpacing: "0.03em", whiteSpace: "nowrap" as const } as React.CSSProperties,
  td: { padding: "0.65rem 0.9rem", borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" as const, color: "#374151" } as React.CSSProperties,
  badge: (status: string): React.CSSProperties => ({
    display: "inline-block", padding: "0.15rem 0.5rem", borderRadius: 12, fontSize: "0.78rem", fontWeight: 500,
    background: status === "registrert" ? "#dcfce7" : status === "kassert" ? "#fee2e2" : status === "trenger_service" ? "#fef9c3" : "#f3f4f6",
    color: status === "registrert" ? "#166534" : status === "kassert" ? "#991b1b" : status === "trenger_service" ? "#854d0e" : "#374151",
  }),
  deleteBtn: { padding: "0.25rem 0.6rem", background: "none", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 6, fontSize: "0.78rem", cursor: "pointer" } as React.CSSProperties,
  editBtn: { padding: "0.25rem 0.65rem", background: "#1C2233", color: "white", border: "none", borderRadius: 6, fontSize: "0.78rem", fontWeight: 500, cursor: "pointer", textDecoration: "none", display: "inline-block" } as React.CSSProperties,
  link: { color: "#2563eb", textDecoration: "none", fontWeight: 500, fontFamily: "monospace", fontSize: "0.82rem" } as React.CSSProperties,
  notat: { fontSize: "0.8rem", color: "#6b7280", maxWidth: 180, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", display: "block" } as React.CSSProperties,
  empty: { padding: "4rem", textAlign: "center" as const, color: "#9ca3af" } as React.CSSProperties,
};

export function AssetDashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [produkttyper, setProdukttyper] = useState<FilterOption[]>([]);
  const [kunder, setKunder] = useState<FilterOption[]>([]);

  const [sok, setSok] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterKunde, setFilterKunde] = useState("");

  const hentAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterType) params.set("produkttypeId", filterType);
    if (filterKunde) params.set("kundeId", filterKunde);
    if (sok.trim()) params.set("sok", sok.trim());
    const res = await fetch(`/api/assets?${params}`);
    if (res.ok) setAssets(await res.json());
    setLoading(false);
  }, [sok, filterStatus, filterType, filterKunde]);

  useEffect(() => {
    hentAssets();
  }, [hentAssets]);

  useEffect(() => {
    fetch("/api/produkttyper").then((r) => r.json()).then((data) => setProdukttyper(data ?? []));
  }, []);

  useEffect(() => {
    fetch("/api/kunder").then((r) => r.json()).then((data) => setKunder(data ?? []));
  }, []);

  async function slettAsset(id: string) {
    if (!confirm(`Skjul asset ${id}? (Kan ikke angres i appen)`)) return;
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  function formaterDato(iso?: string | null) {
    if (!iso) return "–";
    return new Date(iso).toLocaleDateString("nb-NO");
  }

  function garantiSlutt(a: Asset) {
    if (!a.kjopsdato || !a.garantiMaaneder) return "–";
    const d = new Date(a.kjopsdato);
    d.setMonth(d.getMonth() + a.garantiMaaneder);
    return d.toLocaleDateString("nb-NO");
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.h1}>Assets ({assets.length})</h1>
        <a href="/api/assets/export" style={s.exportBtn as never}>
          ↓ Eksporter til Excel
        </a>
      </div>

      <div style={s.filters}>
        <input
          style={s.input}
          placeholder="Søk ID, kunde, modell, notat…"
          value={sok}
          onChange={(e) => setSok(e.target.value)}
        />
        <select style={s.select} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Alle statuser</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select style={s.select} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Alle typer</option>
          {produkttyper.map((t) => <option key={t.id} value={t.id}>{t.navn}</option>)}
        </select>
        <select style={s.select} value={filterKunde} onChange={(e) => setFilterKunde(e.target.value)}>
          <option value="">Alle kunder</option>
          {kunder.map((k) => <option key={k.id} value={k.id}>{k.navn}</option>)}
        </select>
      </div>

      <div style={s.card}>
      {loading ? (
        <p style={s.empty}>Laster…</p>
      ) : assets.length === 0 ? (
        <p style={s.empty}>Ingen assets funnet</p>
      ) : (
        <div className="wm-table-wrap">
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Asset-ID</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Type</th>
              <th style={s.th}>Produsent / Modell</th>
              <th style={s.th}>Kunde</th>
              <th style={s.th}>Lokasjon</th>
              <th style={s.th}>Kjøpsdato</th>
              <th style={s.th}>Garanti utløper</th>
              <th style={s.th}>Kommentar</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <td style={s.td}>
                  <a href={`/asset/${a.id}`} style={s.link}>{a.id}</a>
                </td>
                <td style={s.td}>
                  <span style={s.badge(a.status)}>{STATUS_LABELS[a.status] ?? a.status}</span>
                </td>
                <td style={s.td}>{a.produkttype?.navn ?? "–"}</td>
                <td style={s.td}>
                  {a.modell ? `${a.modell.produsent.navn} ${a.modell.navn}` : "–"}
                </td>
                <td style={s.td}>{a.kunde?.navn ?? "–"}</td>
                <td style={s.td}>{a.lokasjon?.navn ?? "–"}</td>
                <td style={s.td}>{formaterDato(a.kjopsdato)}</td>
                <td style={s.td}>{garantiSlutt(a)}</td>
                <td style={s.td}>
                  <span style={s.notat} title={a.notat ?? ""}>{a.notat || "–"}</span>
                </td>
                <td style={s.td}>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <a href={`/asset/${a.id}`} style={s.editBtn}>Rediger</a>
                    <button style={s.deleteBtn} onClick={() => slettAsset(a.id)}>Slett</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
      </div>
    </div>
  );
}
