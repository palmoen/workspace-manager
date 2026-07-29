import { NextRequest, NextResponse } from "next/server";
import { checkPin, setPinCookie, clearPinCookie, isAuthenticated } from "@/lib/auth";

export async function GET() {
  const ok = await isAuthenticated();
  return NextResponse.json({ ok });
}

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  if (!pin || !checkPin(String(pin))) {
    return NextResponse.json({ error: "Feil PIN" }, { status: 401 });
  }
  await setPinCookie();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearPinCookie();
  return NextResponse.json({ ok: true });
}
