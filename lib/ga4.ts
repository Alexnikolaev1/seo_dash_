import type { GA4Channel, GA4Summary } from "@/types/seo";

export interface Ga4ReportJson {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
}

const EMPTY_SUMMARY: GA4Summary = {
  sessions: 0,
  users: 0,
  pageviews: 0,
  avgDuration: 0,
  channels: [],
};

/**
 * Преобразует ответ runReport с dimension sessionDefaultChannelGroup
 * и метриками sessions, totalUsers, screenPageViews, averageSessionDuration.
 * Пустой `rows` — валидный ответ GA4 (нет данных за период), возвращаем нули, не null.
 */
export function mapGa4ReportToSummary(json: Ga4ReportJson): GA4Summary {
  const rows = json.rows;
  if (!rows?.length) return { ...EMPTY_SUMMARY };

  let totalSessions = 0;
  let totalUsers = 0;
  let totalPageviews = 0;
  let weightedDuration = 0;
  const channels: GA4Channel[] = [];

  for (const row of rows) {
    const name = row.dimensionValues?.[0]?.value ?? "Other";
    const m = row.metricValues;
    if (!m || m.length < 4) continue;

    const sessions = Number(m[0]?.value ?? 0);
    const users = Number(m[1]?.value ?? 0);
    const pageviews = Number(m[2]?.value ?? 0);
    const avgDur = Number(m[3]?.value ?? 0);

    totalSessions += sessions;
    totalUsers += users;
    totalPageviews += pageviews;
    weightedDuration += avgDur * sessions;
    channels.push({ name, sessions });
  }

  return {
    sessions: totalSessions,
    users: totalUsers,
    pageviews: totalPageviews,
    avgDuration:
      totalSessions > 0 ? Math.round(weightedDuration / totalSessions) : 0,
    channels,
  };
}
