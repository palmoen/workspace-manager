import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticatedFromRequest } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }

  const tenantId = process.env.WM_TENANT_ID!;
  const assets = await prisma.asset.findMany({
    where: { tenantId, slettet: false },
    include: {
      kunde: true,
      lokasjon: true,
      modell: { include: { produsent: true } },
      produkttype: true,
    },
    orderBy: { opprettet: "desc" },
  });

  const rows = assets.map((a) => {
    const kjopsdato = a.kjopsdato ? new Date(a.kjopsdato).toLocaleDateString("nb-NO") : "";
    let garantiSlutt = "";
    if (a.kjopsdato && a.garantiMaaneder) {
      const d = new Date(a.kjopsdato);
      d.setMonth(d.getMonth() + a.garantiMaaneder);
      garantiSlutt = d.toLocaleDateString("nb-NO");
    }
    return {
      "Asset-ID": a.id,
      Status: a.status,
      Type: a.produkttype?.navn ?? "",
      Produsent: a.modell?.produsent?.navn ?? "",
      Modell: a.modell?.navn ?? "",
      Kunde: a.kunde?.navn ?? "",
      Lokasjon: a.lokasjon?.navn ?? "",
      Kjøpsdato: kjopsdato,
      "Garanti (mnd)": a.garantiMaaneder ?? "",
      "Garanti utløper": garantiSlutt,
      Notat: a.notat ?? "",
      Opprettet: new Date(a.opprettet).toLocaleDateString("nb-NO"),
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Assets");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="assets-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
