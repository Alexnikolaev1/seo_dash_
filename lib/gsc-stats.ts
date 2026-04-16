import type { GSCRow } from "@/types/seo";

export function aggregateGsc(rows: GSCRow[]) {
  let clicks = 0;
  let impressions = 0;
  let weightedPos = 0;
  for (const r of rows) {
    clicks += r.clicks;
    impressions += r.impressions;
    weightedPos += r.position * r.impressions;
  }
  const avgPosition =
    impressions > 0 ? weightedPos / impressions : 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  return { clicks, impressions, avgPosition, ctr };
}
