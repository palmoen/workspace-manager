import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticatedFromRequest } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      kunde: true,
      lokasjon: true,
      modell: { include: { produsent: true, produkttype: true } },
      produkttype: true,
      hendelser: { orderBy: { opprettet: "desc" } },
    },
  });
  if (!asset) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  return NextResponse.json(asset);
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  let kundeId: string | null = body.kundeId ?? null;
  let lokasjonId: string | null = body.lokasjonId ?? null;

  if (body.kundeNavn?.trim() && body.tenantId) {
    const eksisterende = await prisma.kunde.findFirst({
      where: { navn: body.kundeNavn.trim(), tenantId: body.tenantId },
    });
    kundeId = eksisterende
      ? eksisterende.id
      : (await prisma.kunde.create({ data: { navn: body.kundeNavn.trim(), tenantId: body.tenantId } })).id;
  }

  if (body.lokasjonNavn?.trim() && kundeId) {
    const eksisterende = await prisma.lokasjon.findFirst({
      where: { navn: body.lokasjonNavn.trim(), kundeId },
    });
    lokasjonId = eksisterende
      ? eksisterende.id
      : (await prisma.lokasjon.create({ data: { navn: body.lokasjonNavn.trim(), kundeId } })).id;
  }

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      status: "registrert",
      kundeId,
      lokasjonId,
      modellId: body.modellId ?? null,
      produkttypeId: body.produkttypeId ?? null,
      kjopsdato: body.kjopsdato ? new Date(body.kjopsdato) : null,
      garantiMaaneder: body.garantiMaaneder ? Number(body.garantiMaaneder) : null,
      notat: body.notat ?? null,
      bilder: body.bilder ?? [],
    },
    include: {
      kunde: true,
      lokasjon: true,
      modell: { include: { produsent: true, produkttype: true } },
      produkttype: true,
      hendelser: { orderBy: { opprettet: "desc" } },
    },
  });

  return NextResponse.json(asset);
}
