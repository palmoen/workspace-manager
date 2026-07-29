"use client";

import { useState, useRef } from "react";
import { resizeImage } from "@/lib/resizeImage";

type Props = { assetId: string };

type MeldingType = "avvik" | "servicebehov" | "reklamasjon";

const TYPE_LABELS: Record<MeldingType, string> = {
  avvik: "Avvik",
  servicebehov: "Servicebehov",
  reklamasjon: "Reklamasjon",
};

const GRID_STYLE = `
  .wm-kontakt-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.75rem;
  }
  @media (max-width: 600px) {
    .wm-kontakt-grid { grid-template-columns: 1fr; }
  }
`;

export function OpprettSakForm({ assetId }: Props) {
  const [type, setType] = useState<MeldingType | "">("");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [navn, setNavn] = useState("");
  const [epost, setEpost] = useState("");
  const [telefon, setTelefon] = useState("");
  const [bilde, setBilde] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function velgBilde(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setBilde(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!type) { setError("Velg type sak"); return; }
    if (!beskrivelse.trim()) { setError("Beskrivelse er påkrevd"); return; }
    if (!navn.trim()) { setError("Navn er påkrevd"); return; }
    if (!epost.trim()) { setError("E-post er påkrevd"); return; }
    if (!telefon.trim()) { setError("Telefon er påkrevd"); return; }
    if (!bilde) { setError("Bilde er påkrevd"); return; }

    setSending(true);
    try {
      const resized = await resizeImage(bilde);
      const form = new FormData();
      form.append("type", type);
      form.append("beskrivelse", beskrivelse.trim());
      form.append("navn", navn.trim());
      form.append("epost", epost.trim());
      form.append("telefon", telefon.trim());
      form.append("bilde", resized);

      const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}/meldinger`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Noe gikk galt. Prøv igjen.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Nettverksfeil. Prøv igjen.");
    } finally {
      setSending(false);
    }
  }

  if (success) {
    return (
      <div style={s.successCard}>
        <div style={s.successIcon}>✓</div>
        <h2 style={s.successTitle}>Sak opprettet</h2>
        <p style={s.successText}>
          Takk! Vi har mottatt din henvendelse og vil ta kontakt.
        </p>
        <a href={`/asset/${assetId}`} style={s.backLink}>← Tilbake til asset</a>
      </div>
    );
  }

  return (
    <>
      <style>{GRID_STYLE}</style>
      <div style={s.card}>
        <div style={s.cardHeader}>
          <h2 style={s.title}>Opprett sak</h2>
          <p style={s.sub}>Asset: <span style={s.id}>{assetId}</span></p>
        </div>

        <form onSubmit={send} style={s.form}>
          <label style={s.label}>
            Type sak <span style={s.req}>*</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MeldingType | "")}
              style={s.select}
              required
            >
              <option value="">– velg –</option>
              {(Object.keys(TYPE_LABELS) as MeldingType[]).map((k) => (
                <option key={k} value={k}>{TYPE_LABELS[k]}</option>
              ))}
            </select>
          </label>

          <label style={s.label}>
            Beskrivelse <span style={s.req}>*</span>
            <textarea
              value={beskrivelse}
              onChange={(e) => setBeskrivelse(e.target.value)}
              rows={5}
              placeholder="Beskriv avviket, servicebehovet eller reklamasjonen…"
              style={s.textarea}
              required
            />
          </label>

          <div className="wm-kontakt-grid">
            <label style={s.label}>
              Navn <span style={s.req}>*</span>
              <input
                type="text"
                value={navn}
                onChange={(e) => setNavn(e.target.value)}
                placeholder="Fullt navn"
                style={s.input}
                required
              />
            </label>
            <label style={s.label}>
              E-post <span style={s.req}>*</span>
              <input
                type="email"
                value={epost}
                onChange={(e) => setEpost(e.target.value)}
                placeholder="din@epost.no"
                style={s.input}
                required
              />
            </label>
            <label style={s.label}>
              Telefon <span style={s.req}>*</span>
              <input
                type="tel"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="Mobilnummer"
                style={s.input}
                required
              />
            </label>
          </div>

          <div style={s.label}>
            Bilde <span style={s.req}>*</span>
            <div style={s.uploadArea} onClick={() => fileRef.current?.click()}>
              {preview ? (
                <img src={preview} alt="Forhåndsvisning" style={s.previewImg} />
              ) : (
                <div style={s.uploadPlaceholder}>
                  <span style={s.uploadIcon}>📷</span>
                  <span>Klikk for å legge til bilde</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={velgBilde}
              style={{ display: "none" }}
              required
            />
            {bilde && <p style={s.filnavn}>{bilde.name}</p>}
          </div>

          {error && <p style={s.error}>{error}</p>}

          <div style={s.actions}>
            <a href={`/asset/${assetId}`} style={s.avbryt}>Avbryt</a>
            <button type="submit" disabled={sending} style={s.submitBtn}>
              {sending ? "Sender…" : "Send inn sak"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: {
    background: "white",
    borderRadius: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    overflow: "hidden",
    maxWidth: 580,
    margin: "0 auto",
  },
  cardHeader: { background: "#1C2233", padding: "1.25rem 1.5rem" },
  title: { margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "white" },
  sub: { margin: "0.25rem 0 0", fontSize: "0.82rem", color: "#9ca3af" },
  id: { fontFamily: "monospace", letterSpacing: "0.08em", color: "#d1d5db" },
  form: { padding: "1.5rem", display: "flex", flexDirection: "column" as const, gap: "1rem" },
  label: { display: "flex", flexDirection: "column" as const, gap: "0.35rem", fontSize: "0.875rem", fontWeight: 500, color: "#374151" },
  req: { color: "#dc2626", marginLeft: 1 },
  select: { padding: "0.5rem 0.6rem", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.9rem", background: "white" },
  input: { padding: "0.5rem 0.6rem", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.9rem" },
  textarea: { padding: "0.5rem 0.6rem", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: "0.9rem", resize: "vertical" as const, fontFamily: "inherit" },
  uploadArea: {
    border: "2px dashed #e2e8f0",
    borderRadius: 8,
    minHeight: 120,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden",
    background: "#f9fafb",
  },
  uploadPlaceholder: { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.4rem", color: "#9ca3af", fontSize: "0.875rem" },
  uploadIcon: { fontSize: "1.75rem" },
  previewImg: { width: "100%", maxHeight: 220, objectFit: "cover" as const },
  filnavn: { fontSize: "0.75rem", color: "#6b7280", margin: 0 },
  error: { color: "#dc2626", fontSize: "0.875rem", margin: 0 },
  actions: { display: "flex", gap: "0.75rem", justifyContent: "flex-end", paddingTop: "0.5rem" },
  avbryt: { padding: "0.55rem 1rem", fontSize: "0.9rem", color: "#6b7280", border: "1px solid #e2e8f0", borderRadius: 7, textDecoration: "none", display: "inline-flex", alignItems: "center" },
  submitBtn: { padding: "0.55rem 1.25rem", background: "#1C2233", color: "white", border: "none", borderRadius: 7, cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 },
  successCard: { background: "white", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "2.5rem 2rem", textAlign: "center" as const, maxWidth: 480, margin: "0 auto" },
  successIcon: { width: 56, height: 56, borderRadius: "50%", background: "#16a34a", color: "white", fontSize: "1.75rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" },
  successTitle: { margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "#1C2233" },
  successText: { margin: "0 0 1.5rem", color: "#6b7280", fontSize: "0.9rem" },
  backLink: { color: "#2563eb", fontSize: "0.9rem" },
};
