import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAssetId } from "@/lib/assetId";
import { isAuthenticatedFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }

  const { antall, tenantId } = await req.json();
  const n = Math.max(1, Math.min(500, Number(antall) || 1));

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId påkrevd" }, { status: 400 });
  }

  const assets = await prisma.$transaction(
    Array.from({ length: n }, () =>
      prisma.asset.create({
        data: { id: generateAssetId(), tenantId },
      })
    )
  );

  return NextResponse.json({ assets }, { status: 201 });
}
