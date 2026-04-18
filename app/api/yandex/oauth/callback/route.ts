import {
  YANDEX_COOKIE_ACCESS,
  YANDEX_COOKIE_REFRESH,
  YANDEX_COOKIE_STATE,
  YANDEX_OAUTH_TOKEN,
} from "@/lib/yandex/constants";
import { readJson } from "@/lib/yandex/http";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 340,
};

export async function GET(req: NextRequest) {
  const base = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
  const clientId = process.env.YANDEX_CLIENT_ID?.trim();
  const clientSecret = process.env.YANDEX_CLIENT_SECRET?.trim();

  const redirectYandex = (q: string) =>
    NextResponse.redirect(new URL(`/yandex?${q}`, base || req.nextUrl.origin));

  if (!base || !clientId || !clientSecret) {
    return redirectYandex("error=yandex_config");
  }

  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return redirectYandex(`error=yandex_${encodeURIComponent(oauthError)}`);
  }

  const expected = req.cookies.get(YANDEX_COOKIE_STATE)?.value;
  if (!code || !state || !expected || state !== expected) {
    return redirectYandex("error=yandex_state");
  }

  const redirectUri = `${base}/api/yandex/oauth/callback`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch(YANDEX_OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const tokenJson = await readJson<{
    access_token?: string;
    refresh_token?: string;
    error?: string;
  }>(tokenRes);

  if (!tokenRes.ok || !tokenJson.access_token) {
    return redirectYandex("error=yandex_token");
  }

  const res = redirectYandex("yandex=connected");
  res.cookies.delete(YANDEX_COOKIE_STATE);
  res.cookies.set(YANDEX_COOKIE_ACCESS, tokenJson.access_token, COOKIE_BASE);
  if (tokenJson.refresh_token) {
    res.cookies.set(YANDEX_COOKIE_REFRESH, tokenJson.refresh_token, COOKIE_BASE);
  }
  return res;
}
