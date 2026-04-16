import type { GSCRow } from "@/types/seo";

/** Синтетический ряд по дням на основе агрегатов GSC (API не отдаёт дневную разбивку в этом демо-потоке). */
export function buildTrendSeries(
  rows: GSCRow[],
  days: number
): { label: string; clicks: number; impressions: number }[] {
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const out: { label: string; clicks: number; impressions: number }[] = [];
  for (let d = 0; d < days; d++) {
    const t = (d + 1) / days;
    const wave = 0.85 + 0.15 * Math.sin((d / 7) * Math.PI * 2);
    out.push({
      label: `Д${d + 1}`,
      clicks: Math.max(0, Math.round((totalClicks / days) * wave * t)),
      impressions: Math.max(
        0,
        Math.round((totalImpressions / days) * wave * (1.1 - t * 0.05))
      ),
    });
  }
  return out;
}
