import type {
  YandexWebmasterQueryRow,
  YandexWebmasterTotals,
} from "@/types/yandex";

export function aggregateWebmasterQueries(
  rows: YandexWebmasterQueryRow[]
): YandexWebmasterTotals | null {
  if (!rows.length) return null;
  let shows = 0;
  let clicks = 0;
  let posWeighted = 0;
  let posWeight = 0;

  for (const r of rows) {
    shows += r.shows;
    clicks += r.clicks;
    if (r.avgShowPosition != null && r.shows > 0) {
      posWeighted += r.avgShowPosition * r.shows;
      posWeight += r.shows;
    }
  }

  const ctr = shows > 0 ? (clicks / shows) * 100 : 0;
  const avgPosition =
    posWeight > 0 ? posWeighted / posWeight : null;

  return {
    shows,
    clicks,
    ctr,
    avgPosition,
  };
}
