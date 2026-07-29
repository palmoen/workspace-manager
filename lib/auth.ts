import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "wm_session";
const MAX_AGE = 60 * 60 * 8; // 8 timer

function sign(value: string): string {
  const secret = process.env.WM_SESSION_SECRET!;
  const hmac = createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${hmac}`;
}

function verify(signed: string): string | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;
  const value = signed.slice(0, lastDot);
  const expected = Buffer.from(sign(value));
  const actual = Buffer.from(signed);
  if (expected.length !== actual.length) return null;
  if (!timingSafeEqual(expected, actual)) return null;
  return value;
}

export async function setPinCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, sign("authenticated"), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearPinCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return false;
  return verify(raw) === "authenticated";
}

export function isAuthenticatedFromRequest(req: NextRequest): boolean {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  if (!raw) return false;
  return verify(raw) === "authenticated";
}

export function checkPin(pin: string): boolean {
  const expected = Buffer.from(process.env.WM_PIN ?? "");
  const actual = Buffer.from(pin);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
