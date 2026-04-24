import { randomBytes } from "crypto";
import {
  YANDEX_COOKIE_STATE,
  YANDEX_OAUTH_AUTHORIZE,
} from "@/lib/yandex/constants";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.YANDEX_CLIENT_ID?.trim();
  /** Должен совпадать с Callback URL в кабинете Яндекса — берём хост из запроса. */
  const base = req.nextUrl.origin;
  if (!clientId) {
    return NextResponse.json(
      { error: "Задайте YANDEX_CLIENT_ID." },
      { status: 500 }
    );
  }

  const state = randomBytes(24).toString("hex");
  const redirectUri = `${base}/api/yandex/oauth/callback`;
  /**
   * Не подставляем scope по умолчанию: при «Метрика + Вебмастер» в кабинете приложения
   * запрос только metrika:read даёт invalid_scope. Без параметра scope Яндекс
   * использует все права, выданные приложению при регистрации.
   * Явный список — только через YANDEX_OAUTH_SCOPE (через пробел).
   */
  const scope = process.env.YANDEX_OAUTH_SCOPE?.trim();

  const url = new URL(YANDEX_OAUTH_AUTHORIZE);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  /** Всегда показывать окно согласия — иначе Яндекс молча переиспользует старый токен
   * без новых прав (например, без metrika:read, если они были добавлены позже). */
  url.searchParams.set("force_confirm", "yes");
  if (scope) {
    url.searchParams.set("scope", scope);
  }

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
