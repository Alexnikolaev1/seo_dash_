/** Даты для API Вебмастера и Метрики (YYYY-MM-DD) */
export function yandexDateRange(days: number): { dateFrom: string; dateTo: string } {
  const safe = Math.min(365, Math.max(1, Math.floor(days)));
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (safe - 1));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { dateFrom: fmt(start), dateTo: fmt(end) };
}
