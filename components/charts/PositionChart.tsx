"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { GSCRow } from "@/types/seo";

export function PositionChart({ data }: { data: GSCRow[] | undefined }) {
  const chartData =
    data?.map((r) => ({
      query: r.keys[0]?.slice(0, 28) + (r.keys[0]?.length > 28 ? "…" : ""),
      position: r.position,
    })) ?? [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-gray-100">
        Позиции по запросам
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
              <Bar dataKey="position" fill="#16a34a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
