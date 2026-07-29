import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticatedFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const produkttypeId = searchParams.get("produkttypeId");

  const produsenter = await prisma.produsent.findMany({
    where: produkttypeId
      ? { modeller: { some: { produkttypeId } } }
      : undefined,
    orderBy: { navn: "asc" },
    include: {
      modeller: {
        where: produkttypeId ? { produkttypeId } : undefined,
        orderBy: { navn: "asc" },
      },
    },
  });
  return NextResponse.json(produsenter);
}

export async function POST(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }
  const { navn } = await req.json();
  if (!navn?.trim()) {
    return NextResponse.json({ error: "Navn påkrevd" }, { status: 400 });
  }
  const produsent = await prisma.produsent.upsert({
    where: { navn: navn.trim() },
    update: {},
    create: { navn: navn.trim() },
    include: { modeller: true },
  });
  return NextResponse.json(produsent, { status: 201 });
}
