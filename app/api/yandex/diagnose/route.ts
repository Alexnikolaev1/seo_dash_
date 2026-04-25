import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  METRICA_MANAGEMENT_API,
  METRICA_STAT_API,
} from "@/lib/yandex/constants";
import { resolveYandexAccessToken } from "@/lib/yandex/oauth-token";
import { fetchYandexUserInfo } from "@/lib/yandex/userinfo";
import { yandexDateRange } from "@/lib/yandex/dates";

interface ProbeResult {
  url: string;
  status: number | null;
  ok: boolean;
  bodyExcerpt: string | null;
  error: string | null;
}

async function probe(url: string, token: string): Promise<ProbeResult> {
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `OAuth ${token}`,
        Accept: "application/json",
      },
    });
    let body = "";
    try {
      body = await res.text();
    } catch {
      body = "";
    }
    return {
      url,
      status: res.status,
      ok: res.ok,
      bodyExcerpt: body ? body.slice(0, 500) : null,
      error: null,
    };
  } catch (e) {
    return {
      url,
      status: null,
      ok: false,
      bodyExcerpt: null,
      error: e instanceof Error ? e.message : "fetch error",
    };
  }
}

/**
 * Диагностический эндпоинт: показывает реальные ответы Яндекс API,
 * чтобы понять, в чём именно проблема с правами Метрики.
 */
export async function GET(req: NextRequest) {
  const jar = cookies();
  const token = resolveYandexAccessToken(jar);
  const counterIdRaw =
    req.nextUrl.searchParams.get("counterId") ??
    process.env.YANDEX_METRICA_COUNTER_ID ??
    "";
  const counterId = Number(counterIdRaw);

  if (!token) {
    return NextResponse.json({
      ok: false,
      message: "Нет OAuth-токена Яндекса. Подключите Яндекс на странице /yandex.",
    });
  }

  const userInfo = await fetchYandexUserInfo(token);
  const counters = await probe(
    `${METRICA_MANAGEMENT_API}?per_page=10`,
    token
  );

  let stat: ProbeResult | null = null;
  if (Number.isFinite(counterId) && counterId > 0) {
    const { dateFrom, dateTo } = yandexDateRange(7);
    const u = new URL(METRICA_STAT_API);
    u.searchParams.set("id", String(counterId));
    u.searchParams.set("date1", dateFrom);
    u.searchParams.set("date2", dateTo);
    u.searchParams.set("metrics", "ym:s:visits");
    u.searchParams.set("accuracy", "full");
    stat = await probe(u.toString(), token);
  }

  return NextResponse.json(
    {
      ok: true,
      hint:
        "Если counters.status или stat.status = 403 'Access is denied' — у токена нет права metrika:read или вы вошли не тем аккаунтом. " +
        "Сравните yandex.login с владельцем счётчика на metrika.yandex.ru/list.",
      yandex: {
        login: userInfo?.login ?? null,
        displayName: userInfo?.displayName ?? null,
        uid: userInfo?.uid ?? null,
      },
      env: {
        hasOAuthTokenEnv: Boolean(process.env.YANDEX_OAUTH_TOKEN?.trim()),
        hasClientIdEnv: Boolean(process.env.YANDEX_CLIENT_ID?.trim()),
        hasClientSecretEnv: Boolean(
          process.env.YANDEX_CLIENT_SECRET?.trim()
        ),
        scopeEnv: process.env.YANDEX_OAUTH_SCOPE ?? null,
        counterIdEnv: process.env.YANDEX_METRICA_COUNTER_ID ?? null,
        webmasterHostEnv: process.env.YANDEX_WEBMASTER_HOST_ID ?? null,
      },
      counterIdUsed: Number.isFinite(counterId) && counterId > 0 ? counterId : null,
      probes: {
        managementCounters: counters,
        statVisits: stat,
      },
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
