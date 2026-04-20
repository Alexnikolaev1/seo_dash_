import type { YandexMetricaSummary } from "@/types/yandex";
import { METRICA_MANAGEMENT_API, METRICA_STAT_API } from "./constants";
import { readJson } from "./http";

const MH = (token: string) => ({
  Authorization: `OAuth ${token}`,
  Accept: "application/json",
});

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

export interface MetricaCounterRow {
  id: number;
  name?: string;
  site?: string;
}

export async function fetchMetricaCounters(token: string): Promise<{
  counters: MetricaCounterRow[];
  /** HTTP-код ответа Management API (список счётчиков) */
  status: number;
}> {
  const url = new URL(METRICA_MANAGEMENT_API);
  url.searchParams.set("per_page", "1000");
  const res = await fetch(url.toString(), { headers: MH(token) });
  if (!res.ok) {
    return { counters: [], status: res.status };
  }
  const data = await readJson<{ counters?: MetricaCounterRow[] }>(res);
  return {
    counters: Array.isArray(data.counters) ? data.counters : [],
    status: res.status,
  };
}

function dimensionLabel(dim: unknown): string {
  if (typeof dim === "string") return dim;
  if (dim && typeof dim === "object" && "name" in dim) {
    return String((dim as { name?: string }).name ?? "—");
  }
  return "—";
}

interface StatDataResponse {
  data?: Array<{
    metrics?: number[];
    dimensions?: unknown[];
  }>;
  totals?: number[];
}

export async function fetchMetricaSummary(
  token: string,
  counterId: number,
  date1: string,
  date2: string
): Promise<YandexMetricaSummary | null> {
  const totalsUrl = new URL(METRICA_STAT_API);
  totalsUrl.searchParams.set("id", String(counterId));
  totalsUrl.searchParams.set("date1", date1);
  totalsUrl.searchParams.set("date2", date2);
  totalsUrl.searchParams.set(
    "metrics",
    "ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:avgVisitDurationSeconds"
  );
  totalsUrl.searchParams.set("accuracy", "full");

  const channelsUrl = new URL(METRICA_STAT_API);
  channelsUrl.searchParams.set("id", String(counterId));
  channelsUrl.searchParams.set("date1", date1);
  channelsUrl.searchParams.set("date2", date2);
  channelsUrl.searchParams.set("dimensions", "ym:s:trafficSource");
  channelsUrl.searchParams.set("metrics", "ym:s:visits");
  channelsUrl.searchParams.set("sort", "-ym:s:visits");
  channelsUrl.searchParams.set("limit", "20");
  channelsUrl.searchParams.set("accuracy", "full");

  const [totRes, chRes] = await Promise.all([
    fetch(totalsUrl.toString(), { headers: MH(token) }),
    fetch(channelsUrl.toString(), { headers: MH(token) }),
  ]);

  if (!totRes.ok) return null;

  const totJson = await readJson<StatDataResponse>(totRes);
  const totals =
    (Array.isArray(totJson.totals) ? totJson.totals : null) ??
    totJson.data?.[0]?.metrics ??
    [];

  const sessions = num(totals[0]);
  const users = num(totals[1]);
  const pageviews = num(totals[2]);
  const avgDuration = num(totals[3]);

  const channels: { name: string; sessions: number }[] = [];
  if (chRes.ok) {
    const chJson = await readJson<StatDataResponse>(chRes);
    const rows = chJson.data ?? [];
    for (const row of rows) {
      const name = dimensionLabel(row.dimensions?.[0]);
      const vis = num(row.metrics?.[0]);
      channels.push({ name, sessions: vis });
    }
  }

  return {
    sessions,
    users,
    pageviews,
    avgDuration,
    channels,
  };
}
