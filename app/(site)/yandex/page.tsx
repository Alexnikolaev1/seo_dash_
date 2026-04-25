"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { YandexTrendChart } from "@/components/charts/YandexTrendChart";
import { YandexPositionChart } from "@/components/charts/YandexPositionChart";
import { SourcesChart } from "@/components/charts/SourcesChart";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { YandexKpiGrid } from "@/components/widgets/YandexKpiGrid";
import { SeoAiAdvisor } from "@/components/widgets/SeoAiAdvisor";
import { useYandexDashboard } from "@/lib/hooks/useYandexDashboard";
import { buildYandexAdvisorPayload } from "@/lib/seo-advisor-payload";
import type { GA4Summary } from "@/types/seo";

function metricaToGa4Shape(m: {
  sessions: number;
  users: number;
  pageviews: number;
  avgDuration: number;
  channels: { name: string; sessions: number }[];
}): GA4Summary {
  return {
    sessions: m.sessions,
    users: m.users,
    pageviews: m.pageviews,
    avgDuration: m.avgDuration,
    channels: m.channels.map((c) => ({ name: c.name, sessions: c.sessions })),
  };
}

function YandexPageInner() {
  const searchParams = useSearchParams();
  const oauthBanner = useMemo(() => {
    const err = searchParams.get("error");
    const ok = searchParams.get("yandex");
    if (ok === "connected") {
      return {
        tone: "success" as const,
        text: "Яндекс ID подключён.",
      };
    }
    if (!err) return null;
    const map: Record<string, string> = {
      yandex_config: "Не настроены переменные OAuth Яндекса.",
      yandex_denied: "Доступ в Яндекс OAuth отклонён.",
      yandex_state: "Ошибка проверки state (CSRF). Попробуйте снова.",
      yandex_token: "Не удалось обменять код на токен.",
      yandex_invalid_scope:
        "Неверный scope OAuth. В Vercel удалите переменную YANDEX_OAUTH_SCOPE или оставьте пустой — тогда используются права из кабинета приложения Яндекса (Метрика + Вебмастер). Если задаёте scope вручную, перечислите через пробел только разрешённые для приложения идентификаторы.",
    };
    return {
      tone: "error" as const,
      text: map[err] ?? `OAuth: ${err}`,
    };
  }, [searchParams]);

  const [period, setPeriod] = useState(28);
  const [hostId, setHostId] = useState<string | null>(null);
  const [counterId, setCounterId] = useState<number | null>(null);
  /** Если API не вернул список счётчиков — ввод номера вручную */
  const [counterDraft, setCounterDraft] = useState("");

  const { data, loading, error, reload } = useYandexDashboard(
    period,
    hostId,
    counterId
  );

  const metricaAsGa = data?.metrica ? metricaToGa4Shape(data.metrica) : null;

  async function disconnectYandex() {
    await fetch("/api/yandex/oauth/disconnect", {
      method: "POST",
      credentials: "same-origin",
    });
    setHostId(null);
    setCounterId(null);
    void reload();
  }

  const hostValue = hostId ?? data?.meta.hostId ?? "";
  const counterValue =
    counterId ?? data?.meta.counterId ?? "";
  const showConnect = data && !data.meta.yandexConnected;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-medium text-gray-900 dark:text-gray-50">
          Яндекс: Поиск и Метрика
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          {data?.isDemo && <DemoBadge />}
          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
          >
            <option value={7}>7 дней</option>
            <option value={14}>14 дней</option>
            <option value={28}>28 дней</option>
            <option value={90}>90 дней</option>
          </select>
        </div>
      </div>

      {oauthBanner && (
        <p
          className={
            oauthBanner.tone === "success"
              ? "rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100"
              : "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          }
        >
          {oauthBanner.text}
        </p>
      )}

      {showConnect && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <p>
            Подключите Яндекс ID, чтобы загрузить Вебмастер и Метрику (OAuth,
            отдельно от входа через Google).
          </p>
          <a
            href="/api/yandex/oauth/start"
            className="inline-flex shrink-0 rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700"
          >
            Подключить Яндекс
          </a>
        </div>
      )}

      {data?.meta.yandexConnected && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void disconnectYandex()}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Выйти из Яндекса
          </button>
          {data.meta.yandexLogin && (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Аккаунт:{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {data.meta.yandexLogin}
              </span>
              {data.meta.yandexDisplayName &&
              data.meta.yandexDisplayName !== data.meta.yandexLogin
                ? ` (${data.meta.yandexDisplayName})`
                : ""}{" "}
              — этот аккаунт должен быть владельцем счётчика Метрики.
            </span>
          )}
        </div>
      )}

      {data?.meta.availableHosts.length ? (
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
            Сайт (Вебмастер)
            <select
              className="min-w-[220px] rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
              value={hostValue}
              onChange={(e) =>
                setHostId(e.target.value ? e.target.value : null)
              }
            >
              {data.meta.availableHosts.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.url || h.id}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
            Счётчик (Метрика)
            {data.meta.availableCounters.length > 0 ? (
              <select
                className="min-w-[220px] rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
                value={counterValue === "" ? "" : String(counterValue)}
                onChange={(e) => {
                  const v = e.target.value;
                  setCounterId(v ? Number(v) : null);
                }}
              >
                {data.meta.availableCounters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.site ? ` — ${c.site}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-amber-800 dark:text-amber-200">
                Список из API пуст — укажите номер ниже или в Vercel
                (YANDEX_METRICA_COUNTER_ID).
              </span>
            )}
          </label>
        </div>
      ) : null}

      {data?.meta.yandexConnected && data.meta.availableCounters.length === 0 ? (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/50">
          <label className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
            Номер счётчика Метрики
            <input
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="из настроек счётчика"
              className="w-48 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
              value={counterDraft}
              onChange={(e) => setCounterDraft(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            onClick={() => {
              const n = Number(counterDraft);
              if (Number.isFinite(n) && n > 0) setCounterId(n);
            }}
          >
            Загрузить
          </button>
        </div>
      ) : null}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      {data?.warning && (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <p>{data.warning}</p>
          {data.needsReauth && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {data.meta.yandexLogin && (
                <span className="text-xs">
                  Сейчас вы вошли как{" "}
                  <span className="font-semibold">
                    {data.meta.yandexLogin}
                  </span>
                  . Откройте{" "}
                  <a
                    href="https://metrika.yandex.ru/list"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    metrika.yandex.ru/list
                  </a>{" "}
                  и сверьте: в правом верхнем углу должен быть тот же логин и
                  столбец «Владелец» у нужного счётчика — этот же логин.
                </span>
              )}
              <a
                href="/api/yandex/oauth/start"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Переподключить Яндекс
              </a>
              <a
                href="/api/yandex/diagnose"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900"
              >
                Открыть диагностику
              </a>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : (
        data && (
          <>
            <YandexKpiGrid
              wm={data.webmaster.totals}
              metrica={data.metrica}
            />
            <SeoAiAdvisor
              title="SEO-советник по Яндексу (Gemini)"
              subtitle="Анализ Вебмастера и/или Метрики и практические шаги по оптимизации в Яндексе."
              ready={Boolean(
                data.webmaster.queries?.length || data.metrica
              )}
              emptyMessage="Нет данных ни Вебмастера, ни Метрики. Подключите Яндекс ID, выберите сайт и счётчик."
              buildPayload={() => buildYandexAdvisorPayload(period, data)}
            />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <YandexTrendChart data={data.webmaster.history} />
              <SourcesChart
                data={metricaAsGa}
                title="Каналы (Яндекс.Метрика)"
              />
            </div>
            <YandexPositionChart rows={data.webmaster.queries} />
          </>
        )
      )}
    </div>
  );
}

export default function YandexPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-gray-500">Загрузка…</div>
      }
    >
      <YandexPageInner />
    </Suspense>
  );
}
