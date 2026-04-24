import type { GSCRow, GA4Summary } from "@/types/seo";
import { aggregateGsc } from "@/lib/gsc-stats";
import type { Recommendation } from "@/lib/recommendations";
import type {
  YandexDashboardResponse,
  YandexMetricaSummary,
  YandexWebmasterQueryRow,
  YandexWebmasterTotals,
} from "@/types/yandex";

export type SeoAdvisorSource = "google" | "yandex";

export interface SeoAdvisorAggregate {
  clicks: number;
  impressions: number;
  avgPosition: number;
  ctr: number;
}

export interface SeoAdvisorQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SeoAdvisorPayload {
  source: SeoAdvisorSource;
  periodDays: number;
  isDemo: boolean;
  searchAggregate: SeoAdvisorAggregate | null;
  analytics: GA4Summary | null;
  topQueries: SeoAdvisorQuery[];
  ruleBasedHints: Array<{ title: string; description: string }>;
}

export function buildSeoAdvisorPayload(
  periodDays: number,
  isDemo: boolean,
  gscData: GSCRow[] | null,
  ga4Data: GA4Summary | null,
  recommendations: Recommendation[]
): SeoAdvisorPayload {
  const searchAggregate = gscData?.length ? aggregateGsc(gscData) : null;

  const sorted = gscData?.length
    ? [...gscData].sort((a, b) => b.impressions - a.impressions)
    : [];

  const topQueries: SeoAdvisorQuery[] = sorted.slice(0, 25).map((r) => ({
    query: r.keys[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));

  return {
    source: "google",
    periodDays,
    isDemo,
    searchAggregate,
    analytics: ga4Data,
    topQueries,
    ruleBasedHints: recommendations.map((r) => ({
      title: r.title,
      description: r.description,
    })),
  };
}

function aggregateYandex(
  totals: YandexWebmasterTotals | null
): SeoAdvisorAggregate | null {
  if (!totals) return null;
  return {
    clicks: totals.clicks,
    impressions: totals.shows,
    avgPosition: totals.avgPosition ?? 0,
    ctr: totals.ctr,
  };
}

function topYandexQueries(
  queries: YandexWebmasterQueryRow[]
): SeoAdvisorQuery[] {
  const sorted = [...queries].sort((a, b) => b.shows - a.shows).slice(0, 25);
  return sorted.map((q) => ({
    query: q.queryText,
    clicks: q.clicks,
    impressions: q.shows,
    ctr: q.shows > 0 ? (q.clicks / q.shows) * 100 : 0,
    position: q.avgShowPosition ?? 0,
  }));
}

function yandexMetricaToAnalytics(
  metrica: YandexMetricaSummary | null
): GA4Summary | null {
  if (!metrica) return null;
  return {
    sessions: metrica.sessions,
    users: metrica.users,
    pageviews: metrica.pageviews,
    avgDuration: metrica.avgDuration,
    channels: metrica.channels.map((c) => ({
      name: c.name,
      sessions: c.sessions,
    })),
  };
}

export function buildYandexAdvisorPayload(
  periodDays: number,
  data: YandexDashboardResponse | null
): SeoAdvisorPayload {
  return {
    source: "yandex",
    periodDays,
    isDemo: data?.isDemo ?? true,
    searchAggregate: aggregateYandex(data?.webmaster.totals ?? null),
    analytics: yandexMetricaToAnalytics(data?.metrica ?? null),
    topQueries: data?.webmaster.queries?.length
      ? topYandexQueries(data.webmaster.queries)
      : [],
    ruleBasedHints: [],
  };
}
