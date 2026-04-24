"use client";

import { useCallback, useState, type ReactNode } from "react";
import type { SeoAdvisorPayload } from "@/lib/seo-advisor-payload";

function renderSimpleMarkdown(text: string) {
  const lines = text.split("\n");
  const out: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (keyBase: number) => {
    if (!listItems.length) return;
    out.push(
      <ul
        key={`ul-${keyBase}`}
        className="mt-1 list-disc space-y-1 pl-5 text-gray-700 dark:text-gray-300"
      >
        {listItems.map((item, i) => (
          <li key={i}>{item.replace(/^\-\s*/, "")}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      flushList(idx);
      out.push(
        <h3
          key={`h-${idx}`}
          className="mt-4 text-sm font-semibold text-gray-900 first:mt-0 dark:text-gray-50"
        >
          {trimmed.replace(/^##\s+/, "")}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(trimmed);
      return;
    }
    if (trimmed === "") {
      flushList(idx);
      return;
    }
    flushList(idx);
    out.push(
      <p
        key={`p-${idx}`}
        className="mt-2 text-gray-700 first:mt-0 dark:text-gray-300"
      >
        {trimmed}
      </p>
    );
  });
  flushList(lines.length);
  return out;
}

export function SeoAiAdvisor({
  title = "SEO-советник (Gemini)",
  subtitle,
  buildPayload,
  ready,
  emptyMessage = "Нет данных для анализа. Дождитесь загрузки или проверьте подключение.",
}: {
  title?: string;
  subtitle?: string;
  buildPayload: () => SeoAdvisorPayload;
  /** Готовы ли данные для отправки */
  ready: boolean;
  emptyMessage?: string;
}) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    setText(null);
    try {
      const payload = buildPayload();
      const res = await fetch("/api/seo-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      const json = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        throw new Error(json.error || `Ошибка ${res.status}`);
      }
      if (!json.text?.trim()) {
        throw new Error("Пустой ответ");
      }
      setText(json.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось получить ответ");
    } finally {
      setLoading(false);
    }
  }, [buildPayload]);

  return (
    <section className="rounded-xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white p-4 shadow-sm dark:border-violet-900/50 dark:from-violet-950/40 dark:to-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {subtitle ??
              "Анализ текущих метрик дашборда и практические шаги."}{" "}
            Нужен бесплатный ключ API — см.{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-700 underline underline-offset-2 dark:text-violet-300"
            >
              Google AI Studio
            </a>
            , в .env:{" "}
            <code className="rounded bg-violet-100 px-1 dark:bg-violet-950">
              GEMINI_API_KEY
            </code>{" "}
            или{" "}
            <code className="rounded bg-violet-100 px-1 dark:bg-violet-950">
              GOOGLE_API_KEY
            </code>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading || !ready}
          className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-400"
        >
          {loading ? "Анализ…" : "Получить анализ"}
        </button>
      </div>

      {!ready && !loading && (
        <p className="mt-3 text-xs text-amber-800 dark:text-amber-200">
          {emptyMessage}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      {text && (
        <div className="mt-4 rounded-lg border border-violet-100 bg-white/80 p-4 text-sm leading-relaxed dark:border-violet-900/40 dark:bg-gray-950/50">
          {renderSimpleMarkdown(text)}
        </div>
      )}
    </section>
  );
}
