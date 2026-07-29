import QRCode from "qrcode";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wm.kontorcompaniet.no";

// Returnerer en SVG-streng med QR-koden for gitt asset-ID.
// Bruker feilkorreksjonsnivå H slik at logo-overlay (~15% av arealet) ikke ødelegger avlesing.
export async function generateQrSvg(assetId: string): Promise<string> {
  const url = `${BASE_URL}/asset/${assetId}`;

  const svgString = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });

  // Pakk inn i en gruppe med kjent størrelse slik at vi kan legge logo over
  const withLogo = svgString.replace(
    /<svg([^>]*)>/,
    (_, attrs) =>
      `<svg${attrs} style="display:block;width:100%;height:100%;">` +
      `<rect width="100%" height="100%" fill="white"/>`,
  ).replace(
    "</svg>",
    // Logo-symbol sentrert i hvit firkant (22% av QR-bredden)
    `<g transform="translate(50%,50%)">` +
      `<rect x="-11%" y="-11%" width="22%" height="22%" fill="white"/>` +
      `<image href="/logo-symbol.svg" x="-9%" y="-9%" width="18%" height="18%"/>` +
    `</g></svg>`,
  );

  return withLogo;
}
