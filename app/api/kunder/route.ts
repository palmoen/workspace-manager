import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticatedFromRequest } from "@/lib/auth";

export async function GET() {
  const tenantId = process.env.WM_TENANT_ID!;
  const kunder = await prisma.kunde.findMany({
    where: { tenantId },
    select: { id: true, navn: true },
    orderBy: { navn: "asc" },
  });
  return NextResponse.json(kunder);
}

export async function POST(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }
  const tenantId = process.env.WM_TENANT_ID!;
  const { navn } = await req.json();
  if (!navn?.trim()) {
    return NextResponse.json({ error: "Navn påkrevd" }, { status: 400 });
  }
  const eksisterende = await prisma.kunde.findFirst({
    where: { navn: navn.trim(), tenantId },
  });
  if (eksisterende) return NextResponse.json(eksisterende);
  const kunde = await prisma.kunde.create({
    data: { navn: navn.trim(), tenantId },
    select: { id: true, navn: true },
  });
  return NextResponse.json(kunde, { status: 201 });
}
