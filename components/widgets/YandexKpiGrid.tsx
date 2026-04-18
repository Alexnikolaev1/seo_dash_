"use client";

import type { YandexMetricaSummary, YandexWebmasterTotals } from "@/types/yandex";

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

export function YandexKpiGrid({
  wm,
  metrica,
}: {
  wm: YandexWebmasterTotals | null;
  metrica: YandexMetricaSummary | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <KpiCard
        label="Клики (Поиск)"
        value={wm ? wm.clicks.toLocaleString("ru-RU") : "—"}
        sub={wm ? `CTR ${wm.ctr.toFixed(2)}%` : undefined}
      />
      <KpiCard
        label="Показы"
        value={wm ? wm.shows.toLocaleString("ru-RU") : "—"}
      />
      <KpiCard
        label="Ср. позиция"
        value={wm?.avgPosition != null ? wm.avgPosition.toFixed(1) : "—"}
      />
      <KpiCard
        label="Визиты"
        value={metrica ? metrica.sessions.toLocaleString("ru-RU") : "—"}
      />
      <KpiCard
        label="Посетители"
        value={metrica ? metrica.users.toLocaleString("ru-RU") : "—"}
      />
      <KpiCard
        label="Просмотры"
        value={metrica ? metrica.pageviews.toLocaleString("ru-RU") : "—"}
        sub={
          metrica
            ? `Ср. время ${Math.round(metrica.avgDuration)} с`
            : undefined
        }
      />
    </div>
  );
}
