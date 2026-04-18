import { randomBytes } from "crypto";
import {
  YANDEX_COOKIE_STATE,
  YANDEX_OAUTH_AUTHORIZE,
} from "@/lib/yandex/constants";
import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.YANDEX_CLIENT_ID?.trim();
  const base = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
  if (!clientId || !base) {
    return NextResponse.json(
      {
        error:
          "Задайте YANDEX_CLIENT_ID и NEXTAUTH_URL (базовый URL приложения для redirect_uri).",
      },
      { status: 500 }
    );
  }

  const state = randomBytes(24).toString("hex");
  const redirectUri = `${base}/api/yandex/oauth/callback`;
  const scope =
    process.env.YANDEX_OAUTH_SCOPE?.trim() ||
    "metrika:read";

  const url = new URL(YANDEX_OAUTH_AUTHORIZE);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", scope);

  const res = NextResponse.redirect(url.toString());
  res.cookies.set(YANDEX_COOKIE_STATE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });
  return res;
}
