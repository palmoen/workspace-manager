import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAssetId } from "@/lib/assetId";
import { isAuthenticatedFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const produkttypeId = searchParams.get("produkttypeId") ?? undefined;
  const kundeId = searchParams.get("kundeId") ?? undefined;
  const sok = searchParams.get("sok") ?? undefined;
  const tenantId = process.env.WM_TENANT_ID!;

  const assets = await prisma.asset.findMany({
    where: {
      tenantId,
      slettet: false,
      ...(status ? { status: status as never } : {}),
      ...(produkttypeId ? { produkttypeId } : {}),
      ...(kundeId ? { kundeId } : {}),
      ...(sok
        ? {
            OR: [
              { id: { contains: sok, mode: "insensitive" } },
              { notat: { contains: sok, mode: "insensitive" } },
              { kunde: { navn: { contains: sok, mode: "insensitive" } } },
              { lokasjon: { navn: { contains: sok, mode: "insensitive" } } },
              { modell: { navn: { contains: sok, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      kunde: true,
      lokasjon: true,
      modell: { include: { produsent: true } },
      produkttype: true,
      _count: { select: { meldinger: { where: { behandlet: false } } } },
    },
    orderBy: { opprettet: "desc" },
  });

  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
  }

  const body = await req.json();
  const { antall, tenantId, modellId, kundeId, kjopsdato, garantiMaaneder } = body;
  let { produkttypeId } = body as { produkttypeId?: string | null };
  const n = Math.max(1, Math.min(500, Number(antall) || 1));

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId påkrevd" }, { status: 400 });
  }

  const harForhaandsdata = produkttypeId || modellId || kundeId || kjopsdato || garantiMaaneder;

  if (!produkttypeId && modellId) {
    const modell = await prisma.modell.findUnique({ where: { id: modellId }, select: { produkttypeId: true } });
    produkttypeId = modell?.produkttypeId ?? null;
  }

  const assets = await prisma.$transaction(
    Array.from({ length: n }, () =>
      prisma.asset.create({
        data: {
          id: generateAssetId(),
          tenantId,
          ...(harForhaandsdata && {
            status: "registrert",
            modellId: modellId ?? null,
            produkttypeId,
            kundeId: kundeId ?? null,
            kjopsdato: kjopsdato ? new Date(kjopsdato) : null,
            garantiMaaneder: garantiMaaneder ? Number(garantiMaaneder) : null,
          }),
        },
      })
    )
  );

  return NextResponse.json({ assets }, { status: 201 });
}
