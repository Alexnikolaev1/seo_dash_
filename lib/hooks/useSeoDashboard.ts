"use client";

import { useCallback, useEffect, useState } from "react";
import type { GscApiResponse, Ga4ApiResponse, GSCRow, GA4Summary } from "@/types/seo";

function isGA4Summary(data: Ga4ApiResponse["data"]): data is GA4Summary {
  return (
    typeof data === "object" &&
    data !== null &&
    "sessions" in data &&
    typeof (data as GA4Summary).sessions === "number"
  );
}

export function useSeoDashboard(period: number, propertyId: string | null) {
  const [gscData, setGscData] = useState<GSCRow[] | null>(null);
  const [ga4Data, setGa4Data] = useState<GA4Summary | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ga4Url =
        propertyId != null && propertyId.length > 0
          ? `/api/ga4?days=${period}&propertyId=${encodeURIComponent(propertyId)}`
          : `/api/ga4?days=${period}`;

      const [gscRes, ga4Res] = await Promise.all([
        fetch(`/api/gsc?days=${period}`),
        fetch(ga4Url),
      ]);

      if (!gscRes.ok) throw new Error("GSC: ошибка загрузки");
      if (!ga4Res.ok) throw new Error("GA4: ошибка загрузки");

      const gscJson = (await gscRes.json()) as GscApiResponse;
      const ga4Json = (await ga4Res.json()) as Ga4ApiResponse;

      setGscData(gscJson.data);
      if (isGA4Summary(ga4Json.data)) {
        setGa4Data(ga4Json.data);
      } else {
        setGa4Data(null);
      }
      setIsDemo(Boolean(gscJson.isDemo || ga4Json.isDemo));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [period, propertyId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { gscData, ga4Data, isDemo, loading, error, reload: load };
}
