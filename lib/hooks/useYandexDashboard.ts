"use client";

import { useCallback, useEffect, useState } from "react";
import type { YandexDashboardResponse } from "@/types/yandex";

export function useYandexDashboard(
  period: number,
  hostId: string | null,
  counterId: number | null
) {
  const [data, setData] = useState<YandexDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ days: String(period) });
      if (hostId) params.set("hostId", hostId);
      if (counterId != null) params.set("counterId", String(counterId));
      const res = await fetch(`/api/yandex/data?${params.toString()}`, {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Не удалось загрузить данные Яндекса");
      const json = (await res.json()) as YandexDashboardResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, hostId, counterId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
