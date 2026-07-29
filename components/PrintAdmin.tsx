"use client";

import { useState, useEffect } from "react";
import { AssetLabel } from "@/components/AssetLabel";

const TENANT_ID = process.env.NEXT_PUBLIC_WM_TENANT_ID ?? "";

type Produkttype = { id: string; navn: string };
type Produsent = { id: string; navn: string; modeller: { id: string; navn: string }[] };
type Kunde = { id: string; navn: string };

export function PrintAdmin() {
  const [antall, setAntall] = useState("10");
  const [genererte, setGenererte] = useState<{ id: string }[]>([]);
  const [reprints, setReprints] = useState<{ id: string }[]>([]);
  const [reprIntId, setRePrintId] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [reprLoading, setReprLoading] = useState(false);
  const [error, setError] = useState("");

  const [produkttyper, setProdukttyper] = useState<Produkttype[]>([]);
  const [produsenter, setProdusenter] = useState<Produsent[]>([]);
  const [kunder, setKunder] = useState<Kunde[]>([]);
  const [produkttypeId, setProduktypeId] = useState("");
  const [produsentId, setProdusentId] = useState("");
  const [modellId, setModellId] = useState("");
  const [kundeId, setKundeId] = useState("");
  const [kjopsdato, setKjopsdato] = useState("");
  const [garantiMaaneder, setGarantiMaaneder] = useState("");

  const [nyType, setNyType] = useState("");
  const [nyProdusent, setNyProdusent] = useState("");
  const [nyModell, setNyModell] = useState("");
  const [nyKunde, setNyKunde] = useState("");

  useEffect(() => {
    fetch("/api/produkttyper").then((r) => r.json()).then(setProdukttyper);
    fetch("/api/kunder").then((r) => r.json()).then(setKunder);
  }, []);

  useEffect(() => {
    const url = produkttypeId ? `/api/produsenter?produkttypeId=${produkttypeId}` : "/api/produsenter";
    fetch(url).then((r) => r.json()).then(setProdusenter);
    setProdusentId("");
    setModellId("");
  }, [produkttypeId]);

  const modeller = produsenter.find((p) => p.id === produsentId)?.modeller ?? [];

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
      body: JSON.stringify({ navn: nyModell.trim(), produsentId }),
    });
    if (res.ok) {
      const m: { id: string; navn: string } = await res.json();
      setProdusenter((prev) =>
        prev.map((p) =>
          p.id === produsentId
            ? { ...p, modeller: [...p.modeller.filter((x) => x.id !== m.id), m].sort((a, b) => a.navn.localeCompare(b.navn)) }
            : p
        )
      );
      setModellId(m.id);
      setNyModell("");
    }
  }

  async function leggTilKunde() {
    if (!nyKunde.trim()) return;
    const res = await fetch("/api/kunder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ navn: nyKunde.trim() }),
    });
    if (res.ok) {
      const k: Kunde = await res.json();
      setKunder((prev) => [...prev.filter((x) => x.id !== k.id), k].sort((a, b) => a.navn.localeCompare(b.navn)));
      setKundeId(k.id);
      setNyKunde("");
    }
  }

  async function generer() {
    setGenLoading(true);
    setError("");
    try {
      const harForhaandsdata = produkttypeId || modellId || kundeId || kjopsdato || garantiMaaneder;
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          antall: Number(antall),
          tenantId: TENANT_ID,
          ...(harForhaandsdata && {
            produkttypeId: produkttypeId || null,
            modellId: modellId || null,
            kundeId: kundeId || null,
            kjopsdato: kjopsdato || null,
            garantiMaaneder: garantiMaaneder ? Number(garantiMaaneder) : null,
          }),
        }),
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

          <div style={s.fieldGroup}>
            <p style={s.hint}>Valgfritt: forhåndsutfylte felt — assets får status <em>registrert</em>. La stå tomme for rene ubrukt-rader.</p>

            <div style={s.grid}>
              <div style={s.label}>
                Produkttype
                <div style={s.inputRow}>
                  <select value={produkttypeId} onChange={(e) => setProduktypeId(e.target.value)} style={{ ...s.select, flex: 1 }}>
                    <option value="">– velg type –</option>
                    {produkttyper.map((t) => <option key={t.id} value={t.id}>{t.navn}</option>)}
                  </select>
                  <input value={nyType} onChange={(e) => setNyType(e.target.value)} placeholder="Ny type…" style={s.addInput} />
                  <button type="button" onClick={leggTilType} style={s.addBtn} disabled={!nyType.trim()}>+ Legg til</button>
                </div>
              </div>

              <div style={s.label}>
                Produsent
                <div style={s.inputRow}>
                  <select value={produsentId} onChange={(e) => { setProdusentId(e.target.value); setModellId(""); }} style={{ ...s.select, flex: 1 }}>
                    <option value="">– velg –</option>
                    {produsenter.map((p) => <option key={p.id} value={p.id}>{p.navn}</option>)}
                  </select>
                  <input value={nyProdusent} onChange={(e) => setNyProdusent(e.target.value)} placeholder="Ny produsent…" style={s.addInput} />
                  <button type="button" onClick={leggTilProdusent} style={s.addBtn} disabled={!nyProdusent.trim()}>+ Legg til</button>
                </div>
              </div>

              <div style={s.label}>
                Modell
                <div style={s.inputRow}>
                  <select value={modellId} onChange={(e) => setModellId(e.target.value)} style={{ ...s.select, flex: 1 }} disabled={!produsentId}>
                    <option value="">– velg –</option>
                    {modeller.map((m) => <option key={m.id} value={m.id}>{m.navn}</option>)}
                  </select>
                  <input value={nyModell} onChange={(e) => setNyModell(e.target.value)} placeholder="Ny modell…" style={s.addInput} disabled={!produsentId} />
                  <button type="button" onClick={leggTilModell} style={s.addBtn} disabled={!produsentId || !nyModell.trim()}>+ Legg til</button>
                </div>
              </div>

              <div style={s.label}>
                Kunde
                <div style={s.inputRow}>
                  <select value={kundeId} onChange={(e) => setKundeId(e.target.value)} style={{ ...s.select, flex: 1 }}>
                    <option value="">– velg –</option>
                    {kunder.map((k) => <option key={k.id} value={k.id}>{k.navn}</option>)}
                  </select>
                  <input value={nyKunde} onChange={(e) => setNyKunde(e.target.value)} placeholder="Ny kunde…" style={s.addInput} />
                  <button type="button" onClick={leggTilKunde} style={s.addBtn} disabled={!nyKunde.trim()}>+ Legg til</button>
                </div>
              </div>

              <label style={s.label}>
                Kjøpsdato
                <input type="date" value={kjopsdato} onChange={(e) => setKjopsdato(e.target.value)} style={s.select} />
              </label>

              <label style={s.label}>
                Garantitid
                <select value={garantiMaaneder} onChange={(e) => setGarantiMaaneder(e.target.value)} style={s.select}>
                  <option value="">– ikke valgt –</option>
                  <option value="60">5 år (60 mnd)</option>
                  <option value="120">10 år (120 mnd)</option>
                </select>
              </label>
            </div>
          </div>

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
  controls: { fontFamily: "system-ui, sans-serif" },
  pageHeading: { margin: "0 0 1.5rem", fontSize: "1.4rem", fontWeight: 700, color: "#1C2233" },
  subheading: { margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 600, color: "#1C2233" },
  section: { marginBottom: "1.5rem", padding: "1.25rem", background: "white", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  fieldGroup: { marginBottom: "1rem" },
  hint: { fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.75rem" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" },
  label: { display: "flex", flexDirection: "column" as const, gap: "0.25rem", fontSize: "0.85rem", fontWeight: 500, color: "#374151" },
  select: { padding: "0.45rem 0.6rem", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.9rem", background: "white", color: "#1a1a1a" },
  inputRow: { display: "flex", gap: "0.4rem", alignItems: "center" },
  addInput: { width: 180, padding: "0.45rem 0.5rem", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.82rem", minWidth: 0 },
  addBtn: { padding: "0.45rem 0.65rem", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", fontSize: "0.82rem", whiteSpace: "nowrap" as const },
  row: { display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" as const },
  numInput: { padding: "0.5rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "1rem", width: 100 },
  btn: { padding: "0.5rem 1.1rem", background: "#1C2233", color: "white", border: "none", borderRadius: 7, cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 },
  printBtn: { padding: "0.5rem 1.1rem", background: "#16a34a", color: "white", border: "none", borderRadius: 7, cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 },
  error: { color: "#dc2626", fontSize: "0.875rem" },
  info: { color: "#6b7280", fontSize: "0.875rem", marginTop: "0.5rem" },
};
