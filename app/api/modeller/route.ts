import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticatedFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const produsentId = searchParams.get("produsentId");
  const produkttypeId = searchParams.get("produkttypeId");

  const modeller = await prisma.modell.findMany({
    where: {
      ...(produsentId ? { produsentId } : {}),
      ...(produkttypeId ? { produkttypeId } : {}),
    },
    orderBy: { navn: "asc" },
    include: { produsent: true },
  });
  return NextResponse.json(modeller);
}

export async function POST(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }
  const { navn, produsentId, produkttypeId } = await req.json();
  if (!navn?.trim() || !produsentId) {
    return NextResponse.json({ error: "Navn og produsentId påkrevd" }, { status: 400 });
  }
  const modell = await prisma.modell.upsert({
    where: { produsentId_navn: { produsentId, navn: navn.trim() } },
    update: { produkttypeId: produkttypeId ?? null },
    create: { navn: navn.trim(), produsentId, produkttypeId: produkttypeId ?? null },
    include: { produsent: true },
  });
  return NextResponse.json(modell, { status: 201 });
}
