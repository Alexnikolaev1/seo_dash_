"use client";

import type { YandexWebmasterQueryRow } from "@/types/yandex";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function YandexPositionChart({
  rows,
}: {
  rows: YandexWebmasterQueryRow[] | undefined;
}) {
  const chartData =
    rows
      ?.filter((r) => r.avgShowPosition != null)
      .slice(0, 8)
      .map((r) => ({
        query:
          r.queryText.slice(0, 28) + (r.queryText.length > 28 ? "…" : ""),
        position: r.avgShowPosition as number,
      })) ?? [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-gray-100">
        Позиции (Яндекс.Поиск)
      </h3>
      <div className="h-[300px] w-full">
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-500">Нет данных</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 8, right: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
              <XAxis type="number" domain={[0, "auto"]} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="query"
                width={120}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                formatter={(v: number) => [v.toFixed(1), "Позиция"]}
                labelFormatter={(l) => String(l)}
              />
              <Bar dataKey="position" fill="#dc2626" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
