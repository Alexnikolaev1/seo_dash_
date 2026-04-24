/** Строка популярного запроса из API Вебмастера (после нормализации) */
export interface YandexWebmasterQueryRow {
  queryId: string;
  queryText: string;
  shows: number;
  clicks: number;
  avgShowPosition: number | null;
}

/** Точка дневного ряда «все запросы» из /search-queries/all/history */
export interface YandexHistoryPoint {
  date: string;
  shows: number;
  clicks: number;
}

export interface YandexWebmasterTotals {
  shows: number;
  clicks: number;
  ctr: number;
  avgPosition: number | null;
}

export interface YandexMetricaChannel {
  name: string;
  sessions: number;
}

/** Совместимо с виджетами дашборда (как GA4Summary) */
export interface YandexMetricaSummary {
  sessions: number;
  users: number;
  pageviews: number;
  avgDuration: number;
  channels: YandexMetricaChannel[];
}

export interface YandexHostOption {
  id: string;
  url: string;
}

export interface YandexCounterOption {
  id: number;
  name: string;
  site: string;
}

export interface YandexDashboardMeta {
  hostId: string | null;
  hostUrl: string | null;
  counterId: number | null;
  availableHosts: YandexHostOption[];
  availableCounters: YandexCounterOption[];
  yandexConnected: boolean;
  /** Логин Яндекса, под которым выдан текущий OAuth-токен */
  yandexLogin: string | null;
  yandexDisplayName: string | null;
}

export interface YandexDashboardResponse {
  webmaster: {
    queries: YandexWebmasterQueryRow[];
    history: YandexHistoryPoint[];
    totals: YandexWebmasterTotals | null;
  };
  metrica: YandexMetricaSummary | null;
  meta: YandexDashboardMeta;
  isDemo: boolean;
  warning?: string | null;
  /** Нужна повторная OAuth-авторизация (например, 401/403 — у токена нет прав Метрики) */
  needsReauth?: boolean;
}
