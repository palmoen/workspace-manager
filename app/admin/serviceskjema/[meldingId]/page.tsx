import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { PinForm } from "@/components/PinForm";
import { AutoPrint } from "@/components/AutoPrint";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ meldingId: string }>;
  searchParams: Promise<{ pin_error?: string }>;
};

const TYPE_LABEL: Record<string, string> = {
  avvik: "Avvik",
  servicebehov: "Servicebehov",
  reklamasjon: "Reklamasjon",
};

function fmt(d: Date | string | null) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("nb-NO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function garantiUtloper(kjopsdato: Date | string | null, mnd: number | null) {
  if (!kjopsdato || !mnd) return null;
  const d = new Date(kjopsdato);
  d.setMonth(d.getMonth() + mnd);
  return d;
}

export default async function ServiceskjemaPage({ params, searchParams }: Props) {
  const { meldingId } = await params;
  const { pin_error } = await searchParams;

  const authed = await isAuthenticated();
  if (!authed) {
    return <PinForm returnTo={`/admin/serviceskjema/${meldingId}`} error={!!pin_error} />;
  }

  const melding = await prisma.assetMelding.findUnique({
    where: { id: meldingId },
    include: {
      asset: {
        include: {
          kunde: true,
          lokasjon: true,
          modell: { include: { produsent: true, produkttype: true } },
          produkttype: true,
        },
      },
    },
  });

  if (!melding) notFound();

  const { asset } = melding;
  const utloper = garantiUtloper(asset.kjopsdato, asset.garantiMaaneder);
  const [kontaktNavn, kontaktEpost, kontaktTlf] = melding.innsender.split(" | ");
  const typeLabel = TYPE_LABEL[melding.type] ?? melding.type;
  const produkttype = asset.modell?.produkttype?.navn ?? asset.produkttype?.navn ?? "–";
  const produsent = asset.modell?.produsent?.navn ?? "–";
  const modell = asset.modell?.navn ?? "–";
  const innsendt = new Date(melding.opprettet).toLocaleDateString("nb-NO", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <>
      <AutoPrint />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: white; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; }

        .doc {
          max-width: 794px;
          margin: 0 auto;
          padding: 2cm 1.8cm;
          color: #111;
        }

        /* Screen only — print button bar */
        .screen-bar {
          background: #1C2233;
          padding: 0.75rem 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .screen-bar a { color: #9ca3af; font-size: 0.85rem; text-decoration: none; font-family: sans-serif; }
        .screen-bar button {
          margin-left: auto;
          padding: 0.45rem 1rem;
          background: white;
          color: #1C2233;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.875rem;
        }

        /* Document header */
        .doc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
          padding-bottom: 0.9rem;
          border-bottom: 2px solid #1C2233;
        }
        .doc-title { font-size: 1.5rem; font-weight: 700; color: #1C2233; letter-spacing: 0.04em; text-transform: uppercase; }
        .doc-sub { font-size: 0.75rem; color: #6b7280; margin-top: 0.2rem; }

        /* Two-column info area */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-bottom: 1.25rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          overflow: hidden;
        }
        .info-col { padding: 0.9rem 1rem; }
        .info-col + .info-col { border-left: 1px solid #d1d5db; }
        .info-col-title {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6b7280;
          margin-bottom: 0.6rem;
          padding-bottom: 0.4rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-row { margin-bottom: 0.4rem; }
        .info-label { font-size: 0.7rem; color: #9ca3af; font-weight: 500; }
        .info-value { font-size: 0.875rem; color: #111; font-weight: 500; }
        .info-value.mono { font-family: "Courier New", monospace; font-size: 0.95rem; letter-spacing: 0.06em; }
        .info-value.large { font-size: 1.05rem; font-weight: 700; }
        .garanti-utlopt { color: #b91c1c; }
        .garanti-ok { color: #15803d; }

        /* Type badge */
        .type-badge {
          display: inline-block;
          padding: 0.25rem 0.7rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: #1C2233;
          color: white;
        }

        /* QR area */
        .qr-wrap { text-align: center; margin-top: 0.5rem; }
        .qr-wrap img { width: 90px; height: 90px; }
        .qr-wrap p { font-size: 0.65rem; color: #9ca3af; margin-top: 0.2rem; }

        /* Description box */
        .desc-section {
          margin-bottom: 1.25rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          overflow: hidden;
        }
        .section-title {
          background: #f3f4f6;
          padding: 0.4rem 1rem;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6b7280;
          border-bottom: 1px solid #d1d5db;
        }
        .desc-body { padding: 0.9rem 1rem; font-size: 0.875rem; line-height: 1.6; white-space: pre-wrap; color: #111; }

        /* Bilde */
        .bilde-row { display: flex; gap: 0.75rem; flex-wrap: wrap; padding: 0.75rem 1rem; border-top: 1px solid #e5e7eb; }
        .bilde-row img { max-height: 140px; max-width: 200px; object-fit: cover; border-radius: 4px; border: 1px solid #d1d5db; }

        /* Technician section */
        .tech-section {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 1.25rem;
        }
        .tech-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        .tech-cell {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
        }
        .tech-cell:nth-child(even) { border-right: none; }
        .tech-cell.full { grid-column: 1 / -1; border-right: none; }
        .tech-cell:last-child { border-bottom: none; }
        .tech-cell.full:last-child { border-bottom: none; }
        .field-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; margin-bottom: 0.6rem; }
        .field-line { border-bottom: 1px solid #374151; min-height: 1.5rem; margin-top: 0.25rem; }
        .field-line-tall { border-bottom: 1px solid #374151; min-height: 3.5rem; margin-top: 0.25rem; }

        /* Footer */
        .doc-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.75rem;
          border-top: 1px solid #d1d5db;
          font-size: 0.7rem;
          color: #9ca3af;
        }

        @media print {
          .screen-bar { display: none !important; }
          .doc { padding: 1cm 1.5cm; max-width: 100%; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      {/* Screen only — top bar */}
      <div className="screen-bar">
        <a href={`/asset/${asset.id}?rediger=1`}>← Tilbake til asset</a>
        <button onClick={() => window.print()}>Skriv ut</button>
      </div>

      <div className="doc">
        {/* Header */}
        <div className="doc-header">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-horisontal.svg" alt="Kontorcompaniet" style={{ height: 36, marginBottom: "0.5rem" }} />
            <div className="doc-title">Serviceskjema</div>
            <div className="doc-sub">Utskrift: {fmt(new Date())}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="type-badge">{typeLabel}</span>
            <div className="doc-sub" style={{ marginTop: "0.5rem" }}>Innsendt: {innsendt}</div>
            <div className="doc-sub">Saksnr: {melding.id.slice(-8).toUpperCase()}</div>
          </div>
        </div>

        {/* Info grid */}
        <div className="info-grid">
          {/* Asset col */}
          <div className="info-col">
            <div className="info-col-title">Utstyr</div>
            <div className="info-row">
              <div className="info-label">Asset-ID</div>
              <div className="info-value mono large">{asset.id}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Type</div>
              <div className="info-value">{produkttype}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Produsent</div>
              <div className="info-value">{produsent}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Modell</div>
              <div className="info-value">{modell}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Kunde</div>
              <div className="info-value">{asset.kunde?.navn ?? "–"}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Lokasjon</div>
              <div className="info-value">{asset.lokasjon?.navn ?? "–"}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Kjøpsdato</div>
              <div className="info-value">{fmt(asset.kjopsdato)}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Garanti utløper</div>
              <div className={`info-value ${utloper ? (utloper < new Date() ? "garanti-utlopt" : "garanti-ok") : ""}`}>
                {utloper ? fmt(utloper) : "–"}
                {utloper && utloper < new Date() ? " (UTLØPT)" : ""}
              </div>
            </div>
          </div>

          {/* Sak + QR col */}
          <div className="info-col">
            <div className="info-col-title">Innmelder</div>
            <div className="info-row">
              <div className="info-label">Navn</div>
              <div className="info-value">{kontaktNavn ?? melding.innsender}</div>
            </div>
            {kontaktEpost && (
              <div className="info-row">
                <div className="info-label">E-post</div>
                <div className="info-value">{kontaktEpost}</div>
              </div>
            )}
            {kontaktTlf && (
              <div className="info-row">
                <div className="info-label">Telefon</div>
                <div className="info-value">{kontaktTlf}</div>
              </div>
            )}

            <div className="qr-wrap" style={{ marginTop: "1rem" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/qr/${encodeURIComponent(asset.id)}`} alt="QR" />
              <p>Scan for å åpne asset</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="desc-section">
          <div className="section-title">Beskrivelse fra innmelder</div>
          <div className="desc-body">{melding.beskrivelse}</div>
          {melding.bilder.length > 0 && (
            <div className="bilde-row">
              {melding.bilder.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt={`Bilde ${i + 1}`} />
              ))}
            </div>
          )}
        </div>

        {/* Technician section */}
        <div className="tech-section">
          <div className="section-title">Tekniker — fylles ut ved mottak og utførelse</div>
          <div className="tech-grid">
            <div className="tech-cell">
              <div className="field-label">Mottatt dato</div>
              <div className="field-line" />
            </div>
            <div className="tech-cell">
              <div className="field-label">Utført av</div>
              <div className="field-line" />
            </div>
            <div className="tech-cell full">
              <div className="field-label">Beskrivelse av tiltak</div>
              <div className="field-line-tall" />
            </div>
            <div className="tech-cell full">
              <div className="field-label">Deler / komponenter byttet</div>
              <div className="field-line-tall" />
            </div>
            <div className="tech-cell">
              <div className="field-label">Ferdigdato</div>
              <div className="field-line" />
            </div>
            <div className="tech-cell">
              <div className="field-label">Signatur</div>
              <div className="field-line" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="doc-footer">
          <span>Kontorcompaniet AS — wm.kontorcompaniet.no</span>
          <span style={{ fontFamily: "monospace", letterSpacing: "0.06em" }}>{asset.id}</span>
        </div>
      </div>
    </>
  );
}
