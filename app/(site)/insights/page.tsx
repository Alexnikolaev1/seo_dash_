"use client";

import { useMemo, useState } from "react";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { SeoAiAdvisor } from "@/components/widgets/SeoAiAdvisor";
import { useSeoDashboard } from "@/lib/hooks/useSeoDashboard";
import { useYandexDashboard } from "@/lib/hooks/useYandexDashboard";
import { generateRecommendations } from "@/lib/recommendations";
import { buildCombinedAdvisorPayload } from "@/lib/seo-advisor-payload";

export default function InsightsPage() {
  const [period, setPeriod] = useState(28);

  const {
    gscData,
    ga4Data,
    isDemo: googleDemo,
    loading: googleLoading,
    error: googleError,
  } = useSeoDashboard(period, null);

  const {
    data: yandexData,
    loading: yandexLoading,
    error: yandexError,
  } = useYandexDashboard(period, null, null);

  const recommendations = useMemo(
    () => (gscData?.length ? generateRecommendations(gscData) : []),
    [gscData]
  );

  const loading = googleLoading || yandexLoading;
  const isDemo = googleDemo || yandexData?.isDemo === true;

  const hasGoogle = Boolean(gscData?.length || ga4Data);
  const hasYandex = Boolean(
    yandexData?.webmaster.queries?.length || yandexData?.metrica
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-gray-900 dark:text-gray-50">
            Сводный SEO-план
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Один анализ по обоим поисковикам сразу — без противоречий между
            Google и Яндексом.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isDemo && <DemoBadge />}
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

      {(googleError || yandexError) && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {googleError && <>Google: {googleError}. </>}
          {yandexError && <>Яндекс: {yandexError}.</>}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <SourceCard
          title="Google"
          subtitle={
            hasGoogle
              ? "Подключено: данные есть"
              : "Нет данных GSC/GA4 — будет учтено как пропуск"
          }
          ok={hasGoogle}
          loading={googleLoading}
        />
        <SourceCard
          title="Яндекс"
          subtitle={
            hasYandex
              ? "Подключено: данные есть"
              : "Нет данных Вебмастера/Метрики — будет учтено как пропуск"
          }
          ok={hasYandex}
          loading={yandexLoading}
        />
      </div>

      <SeoAiAdvisor
        title="Сводный SEO-советник (Google + Яндекс, Gemini)"
        subtitle="Один план по обоим поисковикам с разделением на общее и специфику."
        ready={!loading && (hasGoogle || hasYandex)}
        emptyMessage="Подключите хотя бы один источник: Google (страница «Дашборд») или Яндекс (страница «Яндекс»)."
        buildPayload={() =>
          buildCombinedAdvisorPayload({
            periodDays: period,
            google: hasGoogle
              ? {
                  isDemo: googleDemo,
                  gscData,
                  ga4Data,
                  recommendations,
                }
              : null,
            yandex: hasYandex ? yandexData : null,
          })
        }
      />
    </div>
  );
}

function SourceCard({
  title,
  subtitle,
  ok,
  loading,
}: {
  title: string;
  subtitle: string;
  ok: boolean;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {title}
        </p>
        {loading ? (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            загрузка…
          </span>
        ) : ok ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-200">
            OK
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            нет данных
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
        {subtitle}
      </p>
    </div>
  );
}
