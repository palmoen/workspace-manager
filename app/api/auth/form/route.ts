import { NextRequest, NextResponse } from "next/server";
import { checkPin } from "@/lib/auth";
import { createHmac } from "crypto";

const COOKIE_NAME = "wm_session";
const MAX_AGE = 60 * 60 * 8;

function sign(value: string): string {
  const secret = process.env.WM_SESSION_SECRET ?? "";
  const hmac = createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${hmac}`;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const pin = String(formData.get("pin") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/");
  const safeReturn = returnTo.startsWith("/") ? returnTo : "/";

  if (!checkPin(pin)) {
    const dest = new URL(safeReturn, req.url);
    dest.searchParams.set("pin_error", "1");
    return NextResponse.redirect(dest, { status: 303 });
  }

  const dest = new URL(safeReturn, req.url);
  const res = NextResponse.redirect(dest, { status: 303 });
  res.cookies.set(COOKIE_NAME, sign("authenticated"), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
  return res;
}
