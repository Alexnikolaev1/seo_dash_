/** Строка отчёта Search Console (dimensions: query, country, page) */
export interface GSCRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GA4Channel {
  name: string;
  sessions: number;
}

/** Упрощённая структура для виджетов (демо и агрегаты из API) */
export interface GA4Summary {
  sessions: number;
  users: number;
  pageviews: number;
  avgDuration: number;
  channels: GA4Channel[];
}

export interface GscApiResponse {
  data: GSCRow[];
  isDemo: boolean;
}

export interface Ga4ApiResponse {
  data: GA4Summary | Record<string, unknown>;
  isDemo: boolean;
}
