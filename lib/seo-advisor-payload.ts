import type { GSCRow, GA4Summary } from "@/types/seo";
import { aggregateGsc } from "@/lib/gsc-stats";
import type { Recommendation } from "@/lib/recommendations";

export interface SeoAdvisorPayload {
  periodDays: number;
  isDemo: boolean;
  gscAggregate: {
    clicks: number;
    impressions: number;
    avgPosition: number;
    ctr: number;
  } | null;
  ga4: GA4Summary | null;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  ruleBasedHints: Array<{ title: string; description: string }>;
}

export function buildSeoAdvisorPayload(
  periodDays: number,
  isDemo: boolean,
  gscData: GSCRow[] | null,
  ga4Data: GA4Summary | null,
  recommendations: Recommendation[]
): SeoAdvisorPayload {
  const gscAggregate =
    gscData?.length ? aggregateGsc(gscData) : null;

  const sorted = gscData?.length
    ? [...gscData].sort((a, b) => b.impressions - a.impressions)
    : [];

  const topQueries = sorted.slice(0, 25).map((r) => ({
    query: r.keys[0] ?? "",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));

  return {
    periodDays,
    isDemo,
    gscAggregate,
    ga4: ga4Data,
    topQueries,
    ruleBasedHints: recommendations.map((r) => ({
      title: r.title,
      description: r.description,
    })),
  };
}
