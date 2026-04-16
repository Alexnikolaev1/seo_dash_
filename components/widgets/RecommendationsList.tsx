"use client";

import type { Recommendation } from "@/lib/recommendations";
import { cn } from "@/lib/utils";

export function RecommendationsList({
  recommendations,
}: {
  recommendations: Recommendation[];
}) {
  if (!recommendations.length) return null;

  const styles = {
    warn: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
    info: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40",
    ok: "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40",
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Рекомендации
      </h2>
      <ul className="grid gap-3 md:grid-cols-2">
        {recommendations.map((r, i) => (
          <li
            key={i}
            className={cn(
              "rounded-xl border p-4 text-sm",
              styles[r.type]
            )}
          >
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {r.title}
            </p>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              {r.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
