import { YANDEX_OAUTH_TOKEN } from "./constants";
import { readJson } from "./http";

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

export async function refreshYandexAccessToken(
  refreshToken: string
): Promise<TokenResponse | null> {
  const clientId = process.env.YANDEX_CLIENT_ID?.trim();
  const clientSecret = process.env.YANDEX_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(YANDEX_OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) return null;
  return readJson<TokenResponse>(res);
}
