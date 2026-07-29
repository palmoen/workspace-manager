import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tenantId = process.env.WM_TENANT_ID!;
  const kunder = await prisma.kunde.findMany({
    where: { tenantId },
    select: { id: true, navn: true },
    orderBy: { navn: "asc" },
  });
  return NextResponse.json(kunder);
}
