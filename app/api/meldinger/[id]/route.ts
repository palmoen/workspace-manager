import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  if (!body.pin || body.pin !== process.env.WM_PIN) {
    return NextResponse.json({ error: "Feil PIN" }, { status: 403 });
  }

  const kommentar = (body.kommentar as string | undefined)?.trim();
  if (!kommentar) {
    return NextResponse.json({ error: "Servicekommentar er påkrevd" }, { status: 400 });
  }

  const melding = await prisma.assetMelding.update({
    where: { id },
    data: { behandlet: true, serviceKommentar: kommentar },
  });

  return NextResponse.json(melding);
}
