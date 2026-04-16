import type { GSCRow } from "@/types/seo";

/** API GSC отдаёт CTR как долю 0–1; в UI везде проценты 0–100. */
export function normalizeGscRows(rows: unknown[]): GSCRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((raw) => {
    const r = raw as Record<string, unknown>;
    const keys = Array.isArray(r.keys) ? (r.keys as string[]) : [];
    const clicks = Number(r.clicks ?? 0);
    const impressions = Number(r.impressions ?? 0);
    let ctr = Number(r.ctr ?? 0);
    if (ctr <= 1 && ctr >= 0 && impressions > 0) {
      ctr = ctr * 100;
    }
    const position = Number(r.position ?? 0);
    return { keys, clicks, impressions, ctr, position };
  });
}
