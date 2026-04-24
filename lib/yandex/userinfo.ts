const LOGIN_INFO_URL = "https://login.yandex.ru/info?format=json";

export interface YandexUserInfo {
  /** Логин Яндекса, напр. "ivanov" */
  login: string | null;
  /** Отображаемое имя */
  displayName: string | null;
  /** Yandex UID (строкой) */
  uid: string | null;
}

interface YandexLoginInfoRaw {
  login?: string;
  display_name?: string;
  real_name?: string;
  id?: string | number;
  default_email?: string;
}

export async function fetchYandexUserInfo(
  token: string
): Promise<YandexUserInfo | null> {
  try {
    const res = await fetch(LOGIN_INFO_URL, {
      headers: {
        Authorization: `OAuth ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as YandexLoginInfoRaw;
    return {
      login: j.login ?? null,
      displayName: j.display_name ?? j.real_name ?? j.default_email ?? null,
      uid: j.id != null ? String(j.id) : null,
    };
  } catch {
    return null;
  }
}
