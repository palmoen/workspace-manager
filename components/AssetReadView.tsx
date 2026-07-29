import { MeldingPanel } from "@/components/MeldingPanel";

interface AssetData {
  id: string;
  status: string;
  kjopsdato: Date | string | null;
  garantiMaaneder: number | null;
  notat: string | null;
  bilder: string[];
  kunde: { navn: string } | null;
  lokasjon: { navn: string } | null;
  modell: { navn: string; produsent: { navn: string }; produkttype: { navn: string } | null } | null;
  produkttype: { navn: string } | null;
}

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

interface Props {
  asset: AssetData;
  authed: boolean;
  meldinger: Melding[];
}

const STATUS_LABEL: Record<string, string> = {
  ubrukt: "Ubrukt",
  registrert: "Registrert",
  trenger_service: "Trenger service",
  kassert: "Kassert",
};

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  ubrukt: { bg: "#f3f4f6", color: "#6b7280" },
  registrert: { bg: "#dbeafe", color: "#1d4ed8" },
  trenger_service: { bg: "#fef3c7", color: "#b45309" },
  kassert: { bg: "#fee2e2", color: "#b91c1c" },
};

function formatDate(d: Date | string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("nb-NO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function garantiUtloper(kjopsdato: Date | string | null, garantiMaaneder: number | null) {
  if (!kjopsdato || !garantiMaaneder) return null;
  const d = new Date(kjopsdato);
  d.setMonth(d.getMonth() + garantiMaaneder);
  return d;
}

export function AssetReadView({ asset, authed, meldinger }: Props) {
  const status = STATUS_COLOR[asset.status] ?? STATUS_COLOR.ubrukt;
  const statusLabel = STATUS_LABEL[asset.status] ?? asset.status;
  const produktnavn = asset.modell?.navn ?? asset.produkttype?.navn ?? null;
  const produsent = asset.modell?.produsent?.navn ?? null;
  const type = asset.modell?.produkttype?.navn ?? asset.produkttype?.navn ?? null;
  const utloper = garantiUtloper(asset.kjopsdato, asset.garantiMaaneder);
  const erUtlopt = utloper && utloper < new Date();
  const ubehandlet = meldinger.filter((m) => !m.behandlet).length;

  return (
    <div style={s.wrap}>
      {/* ID + status */}
      <div style={s.topRow}>
        <div>
          <div style={s.assetId}>{asset.id}</div>
          <span style={{ ...s.badge, background: status.bg, color: status.color }}>
            {statusLabel}
          </span>
        </div>
        <div style={s.actions}>
          <a href={`/asset/${asset.id}?sak=1`} style={s.sakBtn}>Opprett sak</a>
          <a href={`/asset/${asset.id}?rediger=1`} style={s.redigerBtn}>
            {authed ? "Rediger" : "🔒 Rediger"}
          </a>
        </div>
      </div>

      {/* Info grid */}
      <div style={s.grid}>
        {type && <InfoRow label="Produkttype" value={type} />}
        {produsent && <InfoRow label="Produsent" value={produsent} />}
        {produktnavn && <InfoRow label="Modell" value={produktnavn} />}
        {asset.kunde && <InfoRow label="Kunde" value={asset.kunde.navn} />}
        {asset.lokasjon && <InfoRow label="Lokasjon" value={asset.lokasjon.navn} />}
        {asset.kjopsdato && (
          <InfoRow label="Kjøpsdato" value={formatDate(asset.kjopsdato) ?? ""} />
        )}
        {utloper && (
          <InfoRow
            label="Garanti utløper"
            value={formatDate(utloper) ?? ""}
            valueStyle={erUtlopt ? { color: "#b91c1c", fontWeight: 600 } : { color: "#16a34a", fontWeight: 600 }}
          />
        )}
        {asset.notat && <InfoRow label="Notat" value={asset.notat} fullWidth />}
      </div>

      {/* Bilder */}
      {asset.bilder.length > 0 && (
        <div style={s.bilderSection}>
          <div style={s.sectionLabel}>Bilder</div>
          <div style={s.bilderRow}>
            {asset.bilder.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt={`Bilde ${i + 1}`} style={s.thumb} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Meldinger (kun synlig når innlogget) */}
      {authed && (
        <div style={s.meldingerSection}>
          <div style={s.meldingerHeader}>
            <span style={s.sectionLabel}>Saker / meldinger</span>
            {ubehandlet > 0 && (
              <span style={s.badge2}>{ubehandlet} ubehandlet{ubehandlet !== 1 ? "e" : ""}</span>
            )}
          </div>
          {meldinger.length === 0 ? (
            <p style={s.ingenMeldinger}>Ingen saker registrert</p>
          ) : (
            <div style={s.meldingListe}>
              {meldinger.map((m) => (
                <MeldingPanel key={m.id} melding={m} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  fullWidth,
  valueStyle,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div style={fullWidth ? { gridColumn: "1 / -1" } : {}}>
      <div style={s.infoLabel}>{label}</div>
      <div style={{ ...s.infoValue, ...valueStyle }}>{value}</div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    background: "white",
    borderRadius: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "1rem",
    padding: "1.25rem 1.5rem",
    background: "#1C2233",
  },
  assetId: {
    fontFamily: "monospace",
    fontSize: "1.4rem",
    letterSpacing: "0.08em",
    color: "white",
    fontWeight: 700,
    marginBottom: "0.4rem",
  },
  badge: {
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    borderRadius: 99,
    fontSize: "0.78rem",
    fontWeight: 600,
  },
  actions: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  sakBtn: {
    padding: "0.5rem 0.9rem",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: 7,
    color: "white",
    fontSize: "0.875rem",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  },
  redigerBtn: {
    padding: "0.5rem 0.9rem",
    background: "white",
    borderRadius: 7,
    color: "#1C2233",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0",
    padding: "0.25rem 0",
  },
  infoLabel: { fontSize: "0.75rem", color: "#9ca3af", padding: "0.6rem 1.5rem 0.1rem", fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  infoValue: { fontSize: "0.9rem", color: "#1a1a2e", padding: "0 1.5rem 0.6rem", fontWeight: 500 },
  bilderSection: { padding: "1rem 1.5rem", borderTop: "1px solid #f3f4f6" },
  sectionLabel: { fontSize: "0.75rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "0.5rem", display: "block" },
  bilderRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  thumb: { width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid #e2e8f0" },
  meldingerSection: { padding: "1rem 1.5rem", borderTop: "1px solid #f3f4f6" },
  meldingerHeader: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" },
  badge2: { padding: "0.2rem 0.6rem", background: "#fef3c7", color: "#b45309", borderRadius: 99, fontSize: "0.78rem", fontWeight: 600 },
  ingenMeldinger: { fontSize: "0.875rem", color: "#9ca3af", margin: 0 },
  meldingListe: { display: "flex", flexDirection: "column", gap: "0.75rem" },
};
