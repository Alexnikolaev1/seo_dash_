"use client";

import { useMemo, useState } from "react";
import { KPIGrid } from "@/components/widgets/KPIGrid";
import { TrendChart } from "@/components/charts/TrendChart";
import { SourcesChart } from "@/components/charts/SourcesChart";
import { PositionChart } from "@/components/charts/PositionChart";
import { RecommendationsList } from "@/components/widgets/RecommendationsList";
import { SeoAiAdvisor } from "@/components/widgets/SeoAiAdvisor";
import { buildSeoAdvisorPayload } from "@/lib/seo-advisor-payload";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { generateRecommendations } from "@/lib/recommendations";
import { useSeoDashboard } from "@/lib/hooks/useSeoDashboard";

export default function DashboardPage() {
  const [period, setPeriod] = useState(28);
  const { gscData, ga4Data, isDemo, loading, error } =
    useSeoDashboard(period, null);

  const recommendations = useMemo(
    () => (gscData?.length ? generateRecommendations(gscData) : []),
    [gscData]
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-medium text-gray-900 dark:text-gray-50">
          Дашборд
        </h1>
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

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
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
        <>
          <KPIGrid gscData={gscData} ga4Data={ga4Data} />
          <SeoAiAdvisor
            title="SEO-советник по Google (Gemini)"
            subtitle="Анализ GSC + GA4 и практические шаги по оптимизации в Google."
            ready={Boolean(gscData?.length)}
            emptyMessage="Нет данных Google Search Console. Дождитесь загрузки или подключите сайт в GSC."
            buildPayload={() =>
              buildSeoAdvisorPayload(
                period,
                isDemo,
                gscData,
                ga4Data,
                recommendations
              )
            }
          />
          <RecommendationsList recommendations={recommendations} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TrendChart data={gscData} days={period} />
            <SourcesChart data={ga4Data} />
          </div>
          <PositionChart data={gscData?.slice(0, 8)} />
        </>
      )}
    </div>
  );
}
