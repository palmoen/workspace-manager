"use client";

import { useState, useEffect } from "react";

interface Produkttype {
  id: string;
  navn: string;
}

interface Produsent {
  id: string;
  navn: string;
  modeller: { id: string; navn: string }[];
}

interface Hendelse {
  id: string;
  tekst: string;
  opprettet: string;
}

interface AssetData {
  id: string;
  status: string;
  kundeId: string | null;
  lokasjonId: string | null;
  modellId: string | null;
  produkttypeId: string | null;
  kjopsdato: string | null;
  garantiMaaneder: number | null;
  notat: string | null;
  bilder: string[];
  kunde: { navn: string } | null;
  lokasjon: { navn: string } | null;
  modell: { navn: string; produsent: { id: string; navn: string }; produkttype: { id: string; navn: string } | null } | null;
  produkttype: { id: string; navn: string } | null;
  hendelser: Hendelse[];
}

interface Props {
  assetId: string;
  initial?: AssetData;
  tenantId: string;
}

const LS_KEY = "wm_last_used";

function loadLastUsed(): { produkttypeId: string; produsentId: string; modellId: string } {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
  } catch {
    return { produkttypeId: "", produsentId: "", modellId: "" };
  }
}

function saveLastUsed(data: { produkttypeId: string; produsentId: string; modellId: string }) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export function AssetForm({ assetId, initial, tenantId }: Props) {
  const erNy = !initial || initial.status === "ubrukt";

  const [produkttyper, setProdukttyper] = useState<Produkttype[]>([]);
  const [produsenter, setProdusenter] = useState<Produsent[]>([]);

  const [produkttypeId, setProduktypeId] = useState(initial?.produkttypeId ?? initial?.modell?.produkttype?.id ?? "");
  const [produsentId, setProdusentId] = useState(initial?.modell?.produsent.id ?? "");
  const [modellId, setModellId] = useState(initial?.modellId ?? "");
  const [kjopsdato, setKjopsdato] = useState(initial?.kjopsdato ? new Date(initial.kjopsdato).toISOString().slice(0, 10) : "");
  const [garantiMaaneder, setGarantiMaaneder] = useState(initial?.garantiMaaneder?.toString() ?? "");
  const [kundeNavn, setKundeNavn] = useState(initial?.kunde?.navn ?? "");
  const [lokasjonNavn, setLokasjonNavn] = useState(initial?.lokasjon?.navn ?? "");
  const [notat, setNotat] = useState(initial?.notat ?? "");
  const [bilder, setBilder] = useState<string[]>(initial?.bilder ?? []);
  const [hendelser, setHendelser] = useState<Hendelse[]>(initial?.hendelser ?? []);

  const [nyProdusent, setNyProdusent] = useState("");
  const [nyModell, setNyModell] = useState("");
  const [nyType, setNyType] = useState("");
  const [nyHendelse, setNyHendelse] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [hendelseLoading, setHendelseLoading] = useState(false);

  // Last produkryper, og sett opp evt. forhåndsutfylling for nye assets
  useEffect(() => {
    fetch("/api/produkttyper")
      .then((r) => r.json())
      .then((typer: Produkttype[]) => {
        setProdukttyper(typer);
        if (erNy && !initial?.produkttypeId) {
          const lu = loadLastUsed();
          if (lu.produkttypeId && typer.some((t) => t.id === lu.produkttypeId)) {
            setProduktypeId(lu.produkttypeId);
          }
        }
      });
  }, []);

  // Last produsenter filtrert på type
  useEffect(() => {
    const url = produkttypeId
      ? `/api/produsenter?produkttypeId=${produkttypeId}`
      : "/api/produsenter";
    fetch(url)
      .then((r) => r.json())
      .then((liste: Produsent[]) => {
        setProdusenter(liste);
        if (erNy) {
          const lu = loadLastUsed();
          if (lu.produsentId && liste.some((p) => p.id === lu.produsentId)) {
            setProdusentId(lu.produsentId);
          } else if (!liste.some((p) => p.id === produsentId)) {
            setProdusentId("");
            setModellId("");
          }
        }
      });
  }, [produkttypeId]);

  // Sett modell fra localStorage når produsent-lista er klar
  useEffect(() => {
    if (!erNy || !produsentId) return;
    const lu = loadLastUsed();
    const valgt = produsenter.find((p) => p.id === produsentId);
    if (valgt && lu.modellId && valgt.modeller.some((m) => m.id === lu.modellId)) {
      setModellId(lu.modellId);
    } else if (!valgt?.modeller.some((m) => m.id === modellId)) {
      setModellId("");
    }
  }, [produsentId, produsenter]);

  const valgtProdusent = produsenter.find((p) => p.id === produsentId);
  const modeller = valgtProdusent?.modeller ?? [];

  async function leggTilType() {
    if (!nyType.trim()) return;
    const res = await fetch("/api/produkttyper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ navn: nyType.trim() }),
    });
    if (res.ok) {
      const t: Produkttype = await res.json();
      setProdukttyper((prev) => [...prev.filter((x) => x.id !== t.id), t].sort((a, b) => a.navn.localeCompare(b.navn)));
      setProduktypeId(t.id);
      setNyType("");
    }
  }

  async function leggTilProdusent() {
    if (!nyProdusent.trim()) return;
    const res = await fetch("/api/produsenter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ navn: nyProdusent.trim() }),
    });
    if (res.ok) {
      const p: Produsent = await res.json();
      setProdusenter((prev) => [...prev.filter((x) => x.id !== p.id), p].sort((a, b) => a.navn.localeCompare(b.navn)));
      setProdusentId(p.id);
      setNyProdusent("");
    }
  }

  async function leggTilModell() {
    if (!nyModell.trim() || !produsentId) return;
    const res = await fetch("/api/modeller", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ navn: nyModell.trim(), produsentId, produkttypeId: produkttypeId || null }),
    });
    if (res.ok) {
      const m = await res.json();
      setProdusenter((prev) =>
        prev.map((p) =>
          p.id === produsentId
            ? { ...p, modeller: [...p.modeller.filter((x) => x.id !== m.id), m].sort((a: { navn: string }, b: { navn: string }) => a.navn.localeCompare(b.navn)) }
            : p
        )
      );
      setModellId(m.id);
      setNyModell("");
    }
  }

  async function lastOppBilde(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.ok) {
        const { url } = await res.json();
        setBilder((prev) => [...prev, url]);
      } else {
        setError("Bildeopplasting feilet – sjekk at Supabase Storage er konfigurert");
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function leggTilHendelse() {
    if (!nyHendelse.trim()) return;
    setHendelseLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/hendelser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tekst: nyHendelse.trim() }),
      });
      if (res.ok) {
        const h: Hendelse = await res.json();
        setHendelser((prev) => [h, ...prev]);
        setNyHendelse("");
      }
    } finally {
      setHendelseLoading(false);
    }
  }

  async function lagre(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const kundeId = initial?.kundeId ?? null;
    const lokasjonId = initial?.lokasjonId ?? null;
    try {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modellId: modellId || null,
          produkttypeId: produkttypeId || null,
          kjopsdato: kjopsdato || null,
          garantiMaaneder: garantiMaaneder ? Number(garantiMaaneder) : null,
          kundeId,
          lokasjonId,
          kundeNavn: kundeNavn.trim() || null,
          lokasjonNavn: lokasjonNavn.trim() || null,
          notat: notat.trim() || null,
          bilder,
          tenantId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Noe gikk galt");
      } else {
        saveLastUsed({ produkttypeId, produsentId, modellId });
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div style={s.success}>
        <p style={{ margin: 0 }}>✓ Asset <strong>{assetId}</strong> er registrert.</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <h2 style={s.heading}>Registrer Asset</h2>
        <p style={s.idText}>{assetId}</p>
      </div>

      <form onSubmit={lagre}>
        <div className="wm-asset-layout">
          {/* Venstre kolonne */}
          <div style={s.col}>
            <fieldset style={s.fieldset}>
              <legend style={s.legend}>Produkttype</legend>
              <select value={produkttypeId} onChange={(e) => { setProduktypeId(e.target.value); setProdusentId(""); setModellId(""); }} style={s.select}>
                <option value="">– velg type –</option>
                {produkttyper.map((t) => <option key={t.id} value={t.id}>{t.navn}</option>)}
              </select>
              <div style={s.row}>
                <input value={nyType} onChange={(e) => setNyType(e.target.value)} placeholder="Ny type…" style={s.input} />
                <button type="button" onClick={leggTilType} style={s.addBtn}>+ Legg til</button>
              </div>
            </fieldset>

            <fieldset style={s.fieldset}>
              <legend style={s.legend}>Produsent</legend>
              <select value={produsentId} onChange={(e) => { setProdusentId(e.target.value); setModellId(""); }} style={s.select}>
                <option value="">– velg –</option>
                {produsenter.map((p) => <option key={p.id} value={p.id}>{p.navn}</option>)}
              </select>
              <div style={s.row}>
                <input value={nyProdusent} onChange={(e) => setNyProdusent(e.target.value)} placeholder="Ny produsent…" style={s.input} />
                <button type="button" onClick={leggTilProdusent} style={s.addBtn}>+ Legg til</button>
              </div>
            </fieldset>

            <fieldset style={s.fieldset}>
              <legend style={s.legend}>Modell</legend>
              <select value={modellId} onChange={(e) => setModellId(e.target.value)} style={s.select} disabled={!produsentId}>
                <option value="">– velg –</option>
                {modeller.map((m) => <option key={m.id} value={m.id}>{m.navn}</option>)}
              </select>
              <div style={s.row}>
                <input value={nyModell} onChange={(e) => setNyModell(e.target.value)} placeholder="Ny modell…" style={s.input} disabled={!produsentId} />
                <button type="button" onClick={leggTilModell} style={s.addBtn} disabled={!produsentId}>+ Legg til</button>
              </div>
            </fieldset>

            <label style={s.label}>
              Kunde
              <input value={kundeNavn} onChange={(e) => setKundeNavn(e.target.value)} placeholder="f.eks. Norwegian" style={s.input} />
            </label>

            <label style={s.label}>
              Lokasjon
              <input value={lokasjonNavn} onChange={(e) => setLokasjonNavn(e.target.value)} placeholder="f.eks. Fornebu, avd. X" style={s.input} />
            </label>

            <label style={s.label}>
              Notat
              <textarea value={notat} onChange={(e) => setNotat(e.target.value)} placeholder="Kommentarer, tilstand, merknader…" rows={4} style={{ ...s.input, resize: "vertical" as const }} />
            </label>
          </div>

          {/* Høyre kolonne */}
          <div style={s.col}>
            <label style={s.label}>
              Kjøpsdato
              <input type="date" value={kjopsdato} onChange={(e) => setKjopsdato(e.target.value)} style={s.input} />
            </label>

            <div style={s.label}>
              Garantitid
              <select value={garantiMaaneder} onChange={(e) => setGarantiMaaneder(e.target.value)} style={s.input}>
                <option value="">– Ikke valgt –</option>
                <option value="60">5 år (60 mnd)</option>
                <option value="120">10 år (120 mnd)</option>
              </select>
              {kjopsdato && garantiMaaneder && (() => {
                const slutt = new Date(kjopsdato);
                slutt.setMonth(slutt.getMonth() + Number(garantiMaaneder));
                return <span style={{ fontSize: "0.85rem", color: "#555", marginTop: 4 }}>Garanti utløper: {slutt.toLocaleDateString("nb-NO")}</span>;
              })()}
            </div>

            <fieldset style={s.fieldset}>
              <legend style={s.legend}>Bilder</legend>
              <div style={s.bildeGrid}>
                {bilder.map((url, i) => (
                  <div key={i} style={s.bildeWrap}>
                    <img src={url} alt={`Bilde ${i + 1}`} style={s.bildeImg} />
                    <button type="button" onClick={() => setBilder((prev) => prev.filter((_, j) => j !== i))} style={s.slettBildeBtn}>✕</button>
                  </div>
                ))}
              </div>
              <div style={s.row}>
                <label style={s.uploadLabel}>
                  {uploading ? "Laster opp…" : "📷 Produktbilde"}
                  <input type="file" accept="image/*" onChange={lastOppBilde} disabled={uploading} style={{ display: "none" }} />
                </label>
                <label style={s.uploadLabel}>
                  {uploading ? "…" : "🏷 Garantilapp"}
                  <input type="file" accept="image/*" onChange={lastOppBilde} disabled={uploading} style={{ display: "none" }} />
                </label>
              </div>
            </fieldset>
          </div>
        </div>

        {error && <p style={s.error}>{error}</p>}

        <button type="submit" disabled={saving} style={s.saveBtn}>
          {saving ? "Lagrer…" : "Lagre registrering"}
        </button>
      </form>

      {/* Hendelseslogg */}
      <div style={s.loggSection}>
        <h3 style={s.loggHeading}>Hendelseslogg</h3>
        <div style={s.row}>
          <input
            value={nyHendelse}
            onChange={(e) => setNyHendelse(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); leggTilHendelse(); } }}
            placeholder="Beskriv hendelse, service, reklamasjon…"
            style={{ ...s.input, flex: 1 }}
          />
          <button type="button" onClick={leggTilHendelse} disabled={hendelseLoading || !nyHendelse.trim()} style={s.addBtn}>
            {hendelseLoading ? "…" : "Legg til"}
          </button>
        </div>

        {hendelser.length === 0 ? (
          <p style={s.loggTom}>Ingen hendelser registrert ennå.</p>
        ) : (
          <ul style={s.loggListe}>
            {hendelser.map((h) => (
              <li key={h.id} style={s.loggItem}>
                <span style={s.loggDato}>{new Date(h.opprettet).toLocaleString("nb-NO", { dateStyle: "short", timeStyle: "short" })}</span>
                <span style={s.loggTekst}>{h.tekst}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { background: "white", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.08)", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" },
  topBar: { display: "flex", alignItems: "baseline", gap: "1rem", flexWrap: "wrap", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem" },
  col: { display: "flex", flexDirection: "column", gap: "1rem" },
  heading: { margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#1C2233" },
  idText: { margin: 0, fontFamily: "monospace", fontSize: "0.95rem", color: "#6b7280" },
  fieldset: { border: "1px solid #ddd", borderRadius: 6, padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" },
  legend: { fontWeight: 600, fontSize: "0.9rem", padding: "0 4px" },
  label: { display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.9rem", fontWeight: 500 },
  select: { padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc", fontSize: "1rem" },
  input: { padding: "0.5rem", borderRadius: 6, border: "1px solid #ccc", fontSize: "1rem", boxSizing: "border-box" as const, width: "100%" },
  row: { display: "flex", gap: "0.5rem", alignItems: "center" },
  addBtn: { padding: "0.5rem 0.75rem", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap" as const, fontSize: "0.875rem" },
  saveBtn: { padding: "0.75rem", background: "#1a1a1a", color: "white", border: "none", borderRadius: 6, fontSize: "1rem", cursor: "pointer" },
  error: { color: "#c00", margin: 0, fontSize: "0.875rem" },
  success: { padding: "2rem", textAlign: "center" as const, color: "#1a1a1a" },
  bildeGrid: { display: "flex", flexWrap: "wrap" as const, gap: "0.5rem" },
  bildeWrap: { position: "relative" as const, width: 80, height: 80 },
  bildeImg: { width: 80, height: 80, objectFit: "cover" as const, borderRadius: 4, border: "1px solid #ddd" },
  slettBildeBtn: { position: "absolute" as const, top: 2, right: 2, background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 11, lineHeight: "20px", padding: 0, textAlign: "center" as const },
  uploadLabel: { padding: "0.5rem 0.75rem", background: "#f0f0f0", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer", fontSize: "0.875rem", userSelect: "none" as const },
  loggSection: { marginTop: "2rem", borderTop: "1px solid #e0e0e0", paddingTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" },
  loggHeading: { margin: 0, fontSize: "1rem", fontWeight: 600 },
  loggTom: { color: "#888", fontSize: "0.875rem", margin: 0 },
  loggListe: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" },
  loggItem: { display: "flex", gap: "0.75rem", padding: "0.5rem 0.75rem", background: "#f9f9f9", borderRadius: 6, fontSize: "0.875rem" },
  loggDato: { color: "#888", whiteSpace: "nowrap" as const, flexShrink: 0 },
  loggTekst: { color: "#1a1a1a" },
};
