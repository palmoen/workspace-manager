import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticatedFromRequest } from "@/lib/auth";

export async function GET() {
  const typer = await prisma.produkttype.findMany({ orderBy: { navn: "asc" } });
  return NextResponse.json(typer);
}

export async function POST(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }
  const { navn } = await req.json();
  if (!navn?.trim()) {
    return NextResponse.json({ error: "Navn påkrevd" }, { status: 400 });
  }
  const type = await prisma.produkttype.upsert({
    where: { navn: navn.trim() },
    update: {},
    create: { navn: navn.trim() },
  });
  return NextResponse.json(type, { status: 201 });
}
