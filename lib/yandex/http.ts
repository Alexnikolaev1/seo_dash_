import { WEBMASTER_API } from "./constants";

export function webmasterUserRootUrl(
  query?: Record<string, string | number | undefined>
): string {
  const base = `${WEBMASTER_API}/user`;
  if (!query || !Object.keys(query).length) return base;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `${base}?${q}` : base;
}

export function webmasterUrl(
  userId: string | number,
  path: string,
  query?: Record<string, string | number | undefined>
): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = `${WEBMASTER_API}/user/${userId}${p}`;
  if (!query || !Object.keys(query).length) return base;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === "") continue;
    sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `${base}?${q}` : base;
}

/** Повторяющиеся query_indicator для Вебмастера */
export function appendQueryIndicators(
  sp: URLSearchParams,
  indicators: string[]
) {
  for (const ind of indicators) {
    sp.append("query_indicator", ind);
  }
}

export async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}
