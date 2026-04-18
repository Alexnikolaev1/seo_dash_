"use client";

import type { YandexHistoryPoint } from "@/types/yandex";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatDayLabel(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return `${d.toString().padStart(2, "0")}.${m.toString().padStart(2, "0")}`;
}

export function YandexTrendChart({
  data,
}: {
  data: YandexHistoryPoint[] | null;
}) {
  const chartData =
    data?.map((p) => ({
      label: formatDayLabel(p.date),
      clicks: p.clicks,
      impressions: p.shows,
    })) ?? [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-gray-100">
        Динамика (Яндекс.Вебмастер, все запросы)
      </h3>
      <div className="h-[280px] w-full">
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-500">Нет данных за период</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-40" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                labelFormatter={(v) => `Дата: ${v}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="clicks"
                name="Клики"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="impressions"
                name="Показы"
                stroke="#dc2626"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
