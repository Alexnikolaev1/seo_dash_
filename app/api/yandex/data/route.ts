import {
  getDemoYandexHistory,
  getDemoYandexMetrica,
  getDemoYandexWebmasterQueries,
} from "@/lib/demo-data";
import { aggregateWebmasterQueries } from "@/lib/yandex/aggregate";
import {
  YANDEX_COOKIE_ACCESS,
  YANDEX_COOKIE_REFRESH,
} from "@/lib/yandex/constants";
import { yandexDateRange } from "@/lib/yandex/dates";
import {
  fetchMetricaCounters,
  fetchMetricaSummary,
} from "@/lib/yandex/metrica";
import { resolveYandexAccessToken } from "@/lib/yandex/oauth-token";
import { refreshYandexAccessToken } from "@/lib/yandex/refresh";
import {
  fetchAllQueriesHistory,
  fetchPopularQueries,
  fetchWebmasterHosts,
  fetchWebmasterUserId,
  pickHost,
  type WmHost,
} from "@/lib/yandex/webmaster";
import type {
  YandexDashboardResponse,
  YandexHistoryPoint,
  YandexWebmasterQueryRow,
} from "@/types/yandex";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 340,
};

function parseDays(raw: string | null): number {
  const n = Number(raw ?? 28);
  if (!Number.isFinite(n)) return 28;
  return Math.min(365, Math.max(1, Math.floor(n)));
}

function parseCounter(raw: string | null): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function GET(req: NextRequest) {
  const jar = cookies();
  const { searchParams } = req.nextUrl;
  const days = parseDays(searchParams.get("days"));
  const hostIdParam = searchParams.get("hostId")?.trim() || null;
  const counterParam = parseCounter(searchParams.get("counterId"));

  const envHost = process.env.YANDEX_WEBMASTER_HOST_ID?.trim() || null;
  const envCounter = parseCounter(process.env.YANDEX_METRICA_COUNTER_ID ?? null);
  const fromEnvToken = Boolean(process.env.YANDEX_OAUTH_TOKEN?.trim());

  let token = resolveYandexAccessToken(jar);
  const refreshCookie = jar.get(YANDEX_COOKIE_REFRESH)?.value ?? null;
  const refreshed: { access?: string; refresh?: string } = {};

  async function ensureWorkingToken(): Promise<string | null> {
    if (!token) return null;
    let uid = await fetchWebmasterUserId(token);
    if (uid != null) return token;
    if (!refreshCookie) return null;
    const t = await refreshYandexAccessToken(refreshCookie);
    if (!t?.access_token) return null;
    token = t.access_token;
    refreshed.access = t.access_token;
    if (t.refresh_token) refreshed.refresh = t.refresh_token;
    uid = await fetchWebmasterUserId(token);
    return uid != null ? token : null;
  }

  const workingToken = await ensureWorkingToken();
  const hasCredentials = Boolean(workingToken || fromEnvToken);

  function attachCookies(res: NextResponse) {
    if (refreshed.access) {
      res.cookies.set(YANDEX_COOKIE_ACCESS, refreshed.access, COOKIE_OPTS);
    }
    if (refreshed.refresh) {
      res.cookies.set(YANDEX_COOKIE_REFRESH, refreshed.refresh, COOKIE_OPTS);
    }
  }

  /** Полный демо-режим (нет валидного токена) */
  if (!workingToken) {
    const q = getDemoYandexWebmasterQueries(days);
    const res = NextResponse.json({
      isDemo: true,
      warning: hasCredentials
        ? "Токен Яндекса недействителен. Подключите аккаунт снова или задайте YANDEX_OAUTH_TOKEN."
        : null,
      webmaster: {
        queries: q,
        history: getDemoYandexHistory(days),
        totals: aggregateWebmasterQueries(q),
      },
      metrica: getDemoYandexMetrica(days),
      meta: {
        hostId: null,
        hostUrl: null,
        counterId: null,
        availableHosts: [],
        availableCounters: [],
        yandexConnected: hasCredentials,
      },
    } satisfies YandexDashboardResponse);
    attachCookies(res);
    return res;
  }

  const userId = await fetchWebmasterUserId(workingToken);
  if (userId == null) {
    const q = getDemoYandexWebmasterQueries(days);
    const res = NextResponse.json({
      isDemo: true,
      warning: "Не удалось определить пользователя Вебмастера по токену.",
      webmaster: {
        queries: q,
        history: getDemoYandexHistory(days),
        totals: aggregateWebmasterQueries(q),
      },
      metrica: getDemoYandexMetrica(days),
      meta: {
        hostId: null,
        hostUrl: null,
        counterId: null,
        availableHosts: [],
        availableCounters: [],
        yandexConnected: true,
      },
    } satisfies YandexDashboardResponse);
    attachCookies(res);
    return res;
  }

  let hosts: WmHost[] = [];
  let counters: Awaited<ReturnType<typeof fetchMetricaCounters>> = [];
  try {
    [hosts, counters] = await Promise.all([
      fetchWebmasterHosts(workingToken, userId),
      fetchMetricaCounters(workingToken),
    ]);
  } catch {
    const q = getDemoYandexWebmasterQueries(days);
    const res = NextResponse.json({
      isDemo: true,
      warning: "Не удалось загрузить списки сайтов или счётчиков.",
      webmaster: {
        queries: q,
        history: getDemoYandexHistory(days),
        totals: aggregateWebmasterQueries(q),
      },
      metrica: getDemoYandexMetrica(days),
      meta: {
        hostId: null,
        hostUrl: null,
        counterId: null,
        availableHosts: [],
        availableCounters: [],
        yandexConnected: true,
      },
    } satisfies YandexDashboardResponse);
    attachCookies(res);
    return res;
  }

  const preferredHostId = hostIdParam ?? envHost;
  const host = pickHost(hosts, preferredHostId);

  const resolvedCounterId =
    counterParam ?? envCounter ?? counters[0]?.id ?? null;

  const { dateFrom, dateTo } = yandexDateRange(days);

  const warnings: string[] = [];
  let queries: YandexWebmasterQueryRow[] = [];
  let history: YandexHistoryPoint[] = [];
  let webmasterLive = false;
  let metricaLive = false;

  if (host) {
    try {
      const [pop, hist] = await Promise.all([
        fetchPopularQueries(
          workingToken,
          userId,
          host.host_id,
          dateFrom,
          dateTo,
          500
        ),
        fetchAllQueriesHistory(
          workingToken,
          userId,
          host.host_id,
          dateFrom,
          dateTo
        ),
      ]);
      queries = pop;
      history = hist;
      webmasterLive = true;
      if (!pop.length) {
        warnings.push(
          "Вебмастер: за период нет популярных запросов (или сайт без данных)."
        );
      }
      if (!hist.length && pop.length) {
        warnings.push(
          "Вебмастер: нет дневной истории «все запросы» за период (возможна задержка загрузки)."
        );
      }
    } catch {
      warnings.push("Ошибка запроса к API Вебмастера.");
      queries = getDemoYandexWebmasterQueries(days);
      history = getDemoYandexHistory(days);
      webmasterLive = false;
    }
  } else {
    warnings.push(
      "Сайт не найден в Вебмастере. Добавьте и подтвердите сайт или передайте hostId / YANDEX_WEBMASTER_HOST_ID."
    );
    queries = getDemoYandexWebmasterQueries(days);
    history = getDemoYandexHistory(days);
    webmasterLive = false;
  }

  let metrica = getDemoYandexMetrica(days);
  if (resolvedCounterId != null) {
    try {
      const m = await fetchMetricaSummary(
        workingToken,
        resolvedCounterId,
        dateFrom,
        dateTo
      );
      if (m) {
        metrica = m;
        metricaLive = true;
        if (
          m.sessions === 0 &&
          m.channels.every((c) => c.sessions === 0)
        ) {
          warnings.push(
            "Метрика: за период нет визитов или данные ещё не собраны."
          );
        }
      } else {
        warnings.push("Метрика: пустой ответ API (проверьте id счётчика и доступ).");
      }
    } catch {
      warnings.push("Ошибка запроса к API Метрики.");
    }
  } else {
    warnings.push(
      "Счётчик Метрики не выбран: привяжите счётчик в Яндекс OAuth или задайте YANDEX_METRICA_COUNTER_ID."
    );
  }

  const totals = aggregateWebmasterQueries(queries);
  const isDemo = !(webmasterLive && metricaLive);

  const payload: YandexDashboardResponse = {
    isDemo,
    warning: warnings.length ? warnings.join(" ") : null,
    webmaster: {
      queries,
      history,
      totals,
    },
    metrica,
    meta: {
      hostId: host?.host_id ?? null,
      hostUrl: host?.unicode_host_url ?? null,
      counterId: resolvedCounterId,
      availableHosts: hosts.map((h) => ({
        id: h.host_id,
        url: h.unicode_host_url ?? h.host_id,
      })),
      availableCounters: counters.map((c) => ({
        id: c.id,
        name: c.name ?? `Счётчик ${c.id}`,
        site: c.site ?? "",
      })),
      yandexConnected: true,
    },
  };

  const res = NextResponse.json(payload);
  attachCookies(res);
  return res;
}
