"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { GA4Summary } from "@/types/seo";

const COLORS = ["#16a34a", "#2563eb", "#d97706", "#7c3aed", "#db2777"];

export function SourcesChart({
  data,
  title = "Каналы (GA4)",
}: {
  data: GA4Summary | null;
  title?: string;
}) {
  const chartData =
    data?.channels?.map((c) => ({
      name: c.name,
      value: c.sessions,
    })) ?? [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      <div className="h-[280px] w-full">
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-500">Нет данных</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [v.toLocaleString("ru-RU"), "Сессии"]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
