import type { YandexHistoryPoint, YandexWebmasterQueryRow } from "@/types/yandex";
import {
  appendQueryIndicators,
  readJson,
  webmasterUrl,
  webmasterUserRootUrl,
} from "./http";

const WM_HEADERS = (token: string) => ({
  Authorization: `OAuth ${token}`,
  Accept: "application/json",
});

export async function fetchWebmasterUserId(
  token: string
): Promise<number | null> {
  const res = await fetch(webmasterUserRootUrl(), {
    headers: WM_HEADERS(token),
  });
  if (!res.ok) return null;
  const data = await readJson<Record<string, unknown>>(res);
  const raw =
    data.user_id ??
    data.userId ??
    (data.user &&
    typeof data.user === "object" &&
    data.user !== null &&
    "id" in data.user
      ? (data.user as { id?: unknown }).id
      : undefined);
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

export interface WmHost {
  host_id: string;
  unicode_host_url?: string;
  verified?: boolean;
}

export async function fetchWebmasterHosts(
  token: string,
  userId: number
): Promise<WmHost[]> {
  const res = await fetch(webmasterUrl(userId, "/hosts"), {
    headers: WM_HEADERS(token),
  });
  if (!res.ok) return [];
  const data = await readJson<{ hosts?: WmHost[] }>(res);
  return Array.isArray(data.hosts) ? data.hosts : [];
}

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export function pickHost(
  hosts: WmHost[],
  preferredId?: string | null
): WmHost | null {
  if (preferredId) {
    const found = hosts.find((h) => h.host_id === preferredId);
    if (found) return found;
  }
  const verified = hosts.filter((h) => h.verified !== false);
  return verified[0] ?? hosts[0] ?? null;
}

export async function resolveWebmasterHost(
  token: string,
  userId: number,
  preferredHostId?: string | null
): Promise<WmHost | null> {
  const hosts = await fetchWebmasterHosts(token, userId);
  return pickHost(hosts, preferredHostId);
}

interface PopularApiRow {
  query_id?: string;
  query_text?: string;
  indicators?: Record<string, number | string | undefined>;
}

export async function fetchPopularQueries(
  token: string,
  userId: number,
  hostId: string,
  dateFrom: string,
  dateTo: string,
  limit = 500
): Promise<YandexWebmasterQueryRow[]> {
  const url = new URL(
    webmasterUrl(
      userId,
      `/hosts/${encodeURIComponent(hostId)}/search-queries/popular`
    )
  );
  url.searchParams.set("order_by", "TOTAL_SHOWS");
  url.searchParams.set("date_from", dateFrom);
  url.searchParams.set("date_to", dateTo);
  url.searchParams.set("limit", String(Math.min(500, Math.max(1, limit))));
  url.searchParams.set("offset", "0");
  appendQueryIndicators(url.searchParams, [
    "TOTAL_SHOWS",
    "TOTAL_CLICKS",
    "AVG_SHOW_POSITION",
  ]);

  const res = await fetch(url.toString(), { headers: WM_HEADERS(token) });
  if (!res.ok) return [];
  const data = await readJson<{ queries?: PopularApiRow[] }>(res);
  const rows = Array.isArray(data.queries) ? data.queries : [];
  return rows.map((q) => {
    const ind = q.indicators ?? {};
    return {
      queryId: String(q.query_id ?? ""),
      queryText: String(q.query_text ?? ""),
      shows: num(ind.TOTAL_SHOWS),
      clicks: num(ind.TOTAL_CLICKS),
      avgShowPosition:
        ind.AVG_SHOW_POSITION !== undefined && ind.AVG_SHOW_POSITION !== null
          ? num(ind.AVG_SHOW_POSITION)
          : null,
    };
  });
}

export async function fetchAllQueriesHistory(
  token: string,
  userId: number,
  hostId: string,
  dateFrom: string,
  dateTo: string
): Promise<YandexHistoryPoint[]> {
  const url = new URL(
    webmasterUrl(
      userId,
      `/hosts/${encodeURIComponent(hostId)}/search-queries/all/history`
    )
  );
  appendQueryIndicators(url.searchParams, ["TOTAL_SHOWS", "TOTAL_CLICKS"]);
  url.searchParams.set("date_from", dateFrom);
  url.searchParams.set("date_to", dateTo);

  const res = await fetch(url.toString(), { headers: WM_HEADERS(token) });
  if (!res.ok) return [];
  const data = await readJson<{
    indicators?: {
      TOTAL_SHOWS?: { date?: string; value?: number }[];
      TOTAL_CLICKS?: { date?: string; value?: number }[];
    };
  }>(res);

  const shows = data.indicators?.TOTAL_SHOWS ?? [];
  const clicks = data.indicators?.TOTAL_CLICKS ?? [];
  const byDate = new Map<string, { shows: number; clicks: number }>();

  for (const p of shows) {
    const d = p.date?.slice(0, 10) ?? "";
    if (!d) continue;
    const cur = byDate.get(d) ?? { shows: 0, clicks: 0 };
    cur.shows = num(p.value);
    byDate.set(d, cur);
  }
  for (const p of clicks) {
    const d = p.date?.slice(0, 10) ?? "";
    if (!d) continue;
    const cur = byDate.get(d) ?? { shows: 0, clicks: 0 };
    cur.clicks = num(p.value);
    byDate.set(d, cur);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, v]) => ({
      date,
      shows: v.shows,
      clicks: v.clicks,
    }));
}
