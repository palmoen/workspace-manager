import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticatedFromRequest } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const hendelser = await prisma.assetHendelse.findMany({
    where: { assetId: id },
    orderBy: { opprettet: "desc" },
  });
  return NextResponse.json(hendelser);
}

export async function POST(req: NextRequest, { params }: Params) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }
  const { id } = await params;
  const { tekst } = await req.json();
  if (!tekst?.trim()) {
    return NextResponse.json({ error: "Tekst påkrevd" }, { status: 400 });
  }
  const hendelse = await prisma.assetHendelse.create({
    data: { assetId: id, tekst: tekst.trim() },
  });
  return NextResponse.json(hendelse, { status: 201 });
}
