import { YANDEX_COOKIE_ACCESS, YANDEX_COOKIE_REFRESH } from "./constants";

export function getYandexTokenFromEnv(): string | null {
  const t = process.env.YANDEX_OAUTH_TOKEN?.trim();
  return t ? t : null;
}

export function readYandexCookies(cookieStore: {
  get(name: string): { value: string } | undefined;
}): { access: string | null; refresh: string | null } {
  return {
    access: cookieStore.get(YANDEX_COOKIE_ACCESS)?.value ?? null,
    refresh: cookieStore.get(YANDEX_COOKIE_REFRESH)?.value ?? null,
  };
}

export function resolveYandexAccessToken(cookieStore: {
  get(name: string): { value: string } | undefined;
}): string | null {
  return getYandexTokenFromEnv() ?? readYandexCookies(cookieStore).access;
}
