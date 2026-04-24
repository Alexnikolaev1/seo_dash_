import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import type { SeoAdvisorPayload } from "@/lib/seo-advisor-payload";

const SYSTEM = `Ты опытный SEO-консультант. Тебе передают JSON со статистикой дашборда (Google Search Console, GA4, демо-режим или реальные данные).

Правила:
- Отвечай на русском языке.
- Опирайся на переданные цифры и запросы; не выдумывай метрики, которых нет в JSON.
- Если isDemo === true, явно скажи, что это демо-данные и советы условные — для точного разбора нужно подключить реальные GSC/GA4.
- Дай проверенные, практичные шаги (технический SEO, контент, сниппеты, внутренняя перелинковка, Core Web Vitals, структура URL) — без манипулятивных «серых» методов.
- Учитывай ruleBasedHints как подсказки системы, но дополни их своим анализом.
- Структура ответа (используй заголовки ## и маркированные списки):
  ## Краткий вывод
  ## Приоритеты (что сделать в первую очередь)
  ## Конкретные шаги на 2–4 недели
  ## Что отслеживать дальше`;

function isPayload(x: unknown): x is SeoAdvisorPayload {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.periodDays === "number" &&
    typeof o.isDemo === "boolean" &&
    Array.isArray(o.topQueries) &&
    Array.isArray(o.ruleBasedHints)
  );
}

/** Default: gemini-2.5-flash-lite — рекомендация Google для low-latency / high volume (см. google-genai codegen_instructions.md). */
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

export async function POST(req: NextRequest) {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Не задан GEMINI_API_KEY (или GOOGLE_API_KEY). Ключ: Google AI Studio → добавьте в .env",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const payload = typeof body === "object" && body !== null && "payload" in body
    ? (body as { payload: unknown }).payload
    : body;

  if (!isPayload(payload)) {
    return NextResponse.json(
      { error: "Неверная структура запроса" },
      { status: 400 }
    );
  }

  const modelName =
    process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM,
    });

    const userText = `Проанализируй данные и дай рекомендации по SEO:\n\n${JSON.stringify(payload, null, 2)}`;

    const result = await model.generateContent(userText);
    const text = result.response.text();

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "Пустой ответ модели" },
        { status: 502 }
      );
    }

    return NextResponse.json({ text });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Ошибка обращения к Gemini";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
