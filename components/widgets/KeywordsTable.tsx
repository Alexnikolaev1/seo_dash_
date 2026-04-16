"use client";

import { useMemo, useState } from "react";
import type { GSCRow } from "@/types/seo";

const PER_PAGE = 20;

type SortField = "query" | "position" | "impressions" | "clicks" | "ctr";

function getSortValue(row: GSCRow, field: SortField): string | number {
  switch (field) {
    case "query":
      return row.keys[0]?.toLowerCase() ?? "";
    case "position":
      return row.position;
    case "impressions":
      return row.impressions;
    case "clicks":
      return row.clicks;
    case "ctr":
      return row.ctr;
    default:
      return 0;
  }
}

export function KeywordsTable({
  data,
  isDemo,
}: {
  data: GSCRow[];
  isDemo: boolean;
}) {
  const [filter, setFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("impressions");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const filtered = data.filter((r) => {
      const q = r.keys[0]?.toLowerCase() ?? "";
      return !filter || q.includes(filter.toLowerCase());
    });
    return filtered.sort((a, b) => {
      const va = getSortValue(a, sortField);
      const vb = getSortValue(b, sortField);
      if (typeof va === "string" && typeof vb === "string") {
        return sortDir * va.localeCompare(vb, "ru");
      }
      return sortDir * ((va as number) - (vb as number));
    });
  }, [data, filter, sortField, sortDir]);

  const pages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const slice = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortField(field);
      setSortDir(-1);
    }
    setPage(1);
  }

  function exportCSV() {
    const rows: (string | number)[][] = [
      ["Запрос", "Позиция", "Показы", "Клики", "CTR", "Страна"],
      ...sorted.map((r) => [
        `"${(r.keys[0] ?? "").replace(/"/g, '""')}"`,
        r.position,
        r.impressions,
        r.clicks,
        `${r.ctr}%`,
        r.keys[1] ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = `data:text/csv;charset=utf-8,\uFEFF${encodeURIComponent(csv)}`;
    a.download = "keywords.csv";
    a.click();
  }

  const posClass = (pos: number) =>
    pos <= 5
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : pos <= 15
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";

  const Th = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <th
      className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wide cursor-pointer select-none whitespace-nowrap ${
        sortField === field
          ? "text-green-600 dark:text-green-400"
          : "text-gray-500 dark:text-gray-400"
      }`}
      onClick={() => toggleSort(field)}
    >
      {label}{" "}
      {sortField === field ? (sortDir === -1 ? "↓" : "↑") : ""}
    </th>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
        <input
          className="min-w-[180px] flex-1 rounded-lg border border-gray-200 bg-transparent px-3 py-1.5 text-sm dark:border-gray-700"
          placeholder="Фильтр по запросу…"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
        />
        <button
          type="button"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          onClick={exportCSV}
        >
          ↓ CSV
        </button>
        {isDemo && (
          <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            демо
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <Th field="query" label="Запрос" />
              <Th field="position" label="Позиция" />
              <Th field="impressions" label="Показы" />
              <Th field="clicks" label="Клики" />
              <Th field="ctr" label="CTR" />
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr
                key={`${row.keys[0]}-${i}`}
                className="border-b border-gray-50 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
              >
                <td className="max-w-[240px] truncate px-3 py-2 font-sans">
                  {row.keys[0]}
                </td>
                <td className="px-3 py-2 font-mono">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${posClass(row.position)}`}
                  >
                    {row.position.toFixed(1)}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono">
                  {row.impressions.toLocaleString("ru-RU")}
                </td>
                <td className="px-3 py-2 font-mono">
                  {row.clicks.toLocaleString("ru-RU")}
                </td>
                <td className="px-3 py-2 font-mono">{row.ctr.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 p-3">
        <span className="text-xs text-gray-500">
          {sorted.length === 0
            ? "0 записей"
            : `${Math.min((page - 1) * PER_PAGE + 1, sorted.length)}–${Math.min(page * PER_PAGE, sorted.length)} из ${sorted.length}`}
        </span>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              className={`rounded border px-2 py-1 text-xs ${
                page === i + 1
                  ? "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
                  : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
