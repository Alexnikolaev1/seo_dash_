"use client";

import { useEffect, useState } from "react";
import { KeywordsTable } from "@/components/widgets/KeywordsTable";
import type { GSCRow } from "@/types/seo";

export default function KeywordsPage() {
  const [data, setData] = useState<GSCRow[]>([]);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    fetch("/api/gsc?days=28")
      .then((r) => r.json())
      .then((json: { data: GSCRow[]; isDemo: boolean }) => {
        setData(json.data ?? []);
        setIsDemo(Boolean(json.isDemo));
      })
      .catch(() => setData([]));
  }, []);

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-6 text-xl font-medium text-gray-900 dark:text-gray-50">
        Ключевые слова
      </h1>
      <KeywordsTable data={data} isDemo={isDemo} />
    </div>
  );
}
