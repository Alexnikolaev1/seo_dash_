"use client";

import type { GSCRow, GA4Summary } from "@/types/seo";
import { aggregateGsc } from "@/lib/gsc-stats";

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-50">
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{sub}</p>
      )}
    </div>
  );
}

export function KPIGrid({
  gscData,
  ga4Data,
}: {
  gscData: GSCRow[] | null;
  ga4Data: GA4Summary | null;
}) {
  const g = gscData?.length ? aggregateGsc(gscData) : null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <KpiCard
        label="Клики (GSC)"
        value={g ? g.clicks.toLocaleString("ru-RU") : "—"}
        sub={g ? `CTR ${g.ctr.toFixed(2)}%` : undefined}
      />
      <KpiCard
        label="Показы"
        value={g ? g.impressions.toLocaleString("ru-RU") : "—"}
      />
      <KpiCard
        label="Средняя позиция"
        value={g ? g.avgPosition.toFixed(1) : "—"}
      />
      <KpiCard
        label="Сессии"
        value={ga4Data ? ga4Data.sessions.toLocaleString("ru-RU") : "—"}
      />
      <KpiCard
        label="Пользователи"
        value={ga4Data ? ga4Data.users.toLocaleString("ru-RU") : "—"}
      />
      <KpiCard
        label="Просмотры"
        value={ga4Data ? ga4Data.pageviews.toLocaleString("ru-RU") : "—"}
        sub={
          ga4Data
            ? `Ср. длительность ${Math.round(ga4Data.avgDuration)} с`
            : undefined
        }
      />
    </div>
  );
}
