// Kan brukes både i server- og klient-kontekst: henter QR via /api/qr/[id]
interface Props {
  assetId: string;
}

export function AssetLabel({ assetId }: Props) {
  return (
    <>
      <style>{`
        @media print {
          @page {
            /* 55×40mm – innhold er portrett, rotert 90° i print-CSS
               slik at papirrullen mates liggende gjennom Zebra ZD421 */
            size: 55mm 40mm;
            margin: 0;
          }
          body { margin: 0; background: white; }
          .label-page-break { page-break-after: always; }
          .label-page-break:last-child { page-break-after: avoid; }
        }
      `}</style>

      <div className="label-wrapper">
        <div className="label-qr">
          {/* SVG genereres server-side via /api/qr/[id] */}
          <img
            src={`/api/qr/${encodeURIComponent(assetId)}`}
            alt={`QR for ${assetId}`}
            width={120}
            height={120}
          />
        </div>
        <p className="label-id">{assetId}</p>
      </div>

      <style>{`
        .label-wrapper {
          width: 55mm;
          height: 40mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: white;
          padding: 2mm;
          box-sizing: border-box;
          overflow: hidden;
        }
        .label-qr {
          width: 30mm;
          height: 30mm;
          flex-shrink: 0;
        }
        .label-qr img {
          width: 100%;
          height: 100%;
          display: block;
        }
        .label-id {
          margin: 1mm 0 0;
          font-family: "Courier New", Courier, monospace;
          font-size: 7pt;
          font-weight: bold;
          letter-spacing: 0.05em;
          color: #000;
          text-align: center;
          line-height: 1;
        }
      `}</style>
    </>
  );
}
