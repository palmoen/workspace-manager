import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticatedFromRequest } from "@/lib/auth";
import { Resend } from "resend";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET = "asset-image";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://wm.kontorcompaniet.no";

type Params = { params: Promise<{ id: string }> };

const TYPE_LABEL: Record<string, string> = {
  avvik: "Avvik",
  servicebehov: "Servicebehov",
  reklamasjon: "Reklamasjon",
};

export async function GET(req: NextRequest, { params }: Params) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }
  const { id } = await params;
  const meldinger = await prisma.assetMelding.findMany({
    where: { assetId: id },
    orderBy: { opprettet: "desc" },
  });
  return NextResponse.json(meldinger);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const asset = await prisma.asset.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!asset) return NextResponse.json({ error: "Asset ikke funnet" }, { status: 404 });

  const form = await req.formData();
  const type = (form.get("type") as string | null)?.trim();
  const beskrivelse = (form.get("beskrivelse") as string | null)?.trim();
  const innsender = (form.get("innsender") as string | null)?.trim();
  const bilde = form.get("bilde") as File | null;

  if (!type || !beskrivelse || !innsender || !bilde || bilde.size === 0) {
    return NextResponse.json({ error: "Alle felt er påkrevde" }, { status: 400 });
  }

  let bildeUrl = "";
  if (SUPABASE_URL && SERVICE_KEY) {
    const ext = bilde.name.split(".").pop() ?? "jpg";
    const filename = `saker/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const bytes = await bilde.arrayBuffer();
    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": bilde.type || "application/octet-stream",
        },
        body: bytes,
      }
    );
    if (uploadRes.ok) {
      bildeUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
    }
  }

  const melding = await prisma.assetMelding.create({
    data: {
      assetId: id,
      type: type as never,
      beskrivelse,
      innsender,
      bilder: bildeUrl ? [bildeUrl] : [],
    },
  });

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const resend = new Resend(resendKey);
    const label = TYPE_LABEL[type] ?? type;
    resend.emails
      .send({
        from: "noreply@kontorcompaniet.no",
        to: "palmoen81@gmail.com",
        subject: `Ny ${label} på asset ${id}`,
        html: `
          <h2 style="font-family:sans-serif">Ny ${label} innsendt</h2>
          <table style="font-family:sans-serif;border-collapse:collapse">
            <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Asset</td><td><a href="${BASE_URL}/asset/${id}">${id}</a></td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Type</td><td>${label}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Innsendt av</td><td>${innsender}</td></tr>
          </table>
          <p style="font-family:sans-serif;margin-top:1rem"><strong>Beskrivelse:</strong><br>${beskrivelse.replace(/\n/g, "<br>")}</p>
          ${bildeUrl ? `<p><img src="${bildeUrl}" style="max-width:500px;border-radius:8px" /></p>` : ""}
          <p style="font-family:sans-serif;margin-top:1.5rem">
            <a href="${BASE_URL}/asset/${id}?rediger=1" style="background:#1C2233;color:white;padding:0.5rem 1rem;border-radius:6px;text-decoration:none">Åpne asset og behandle sak →</a>
          </p>
        `.trim(),
      })
      .catch(() => {});
  }

  return NextResponse.json(melding, { status: 201 });
}
