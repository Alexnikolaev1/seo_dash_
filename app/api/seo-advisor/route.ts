import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import type {
  SeoAdvisorPayload,
  SeoAdvisorSource,
} from "@/lib/seo-advisor-payload";

const BASE_RULES = `Правила:
- Отвечай на русском языке.
- Опирайся только на цифры и запросы из JSON; не выдумывай метрик.
- Если isDemo === true, честно скажи, что это демо-данные и выводы условные — для точного разбора нужно подключить реальные счётчики.
- Давай только «белые» проверенные методы: технический SEO, E-E-A-T-контент, сниппеты, внутренняя перелинковка, Core Web Vitals / скорость, UX, структура URL, семантическая разметка.
- Учитывай ruleBasedHints как подсказки системы и дополняй их своим анализом.
- Структура ответа (используй заголовки ## и маркированные списки):
  ## Краткий вывод
  ## Приоритеты (что сделать в первую очередь)
  ## Конкретные шаги на 2–4 недели
  ## Что отслеживать дальше`;

const SYSTEM_BY_SOURCE: Record<SeoAdvisorSource, string> = {
  google: `Ты опытный SEO-консультант по Google. Тебе передают JSON со статистикой дашборда (Google Search Console + GA4). Поле source === "google".
${BASE_RULES}
- searchAggregate и topQueries — данные Google Search Console (impressions = показы, position = средняя позиция в Google).
- analytics — GA4 (сессии, пользователи, каналы).`,
  yandex: `Ты опытный SEO-консультант по Яндексу. Тебе передают JSON со статистикой дашборда (Яндекс.Вебмастер + Яндекс.Метрика). Поле source === "yandex".
${BASE_RULES}
- searchAggregate и topQueries — данные Яндекс.Вебмастера (impressions = показы, position = средняя позиция в Яндексе; CTR посчитан из clicks/impressions).
- analytics — Яндекс.Метрика в совместимом виде (сессии, пользователи, каналы).
- Источники могут отсутствовать: searchAggregate / topQueries бывают пустыми (новый или неподтверждённый сайт), analytics — null. Если данных Вебмастера нет, прямо отметь это и анализируй по тому, что есть (трафик, источники, поведение из Метрики); рекомендации по поисковым запросам в этом случае давать только как общие гипотезы, помеченные как «требует подтверждения данными Вебмастера».
- Учитывай специфику Яндекса: ИКС, поведенческие факторы (глубина, время на сайте, отказы из Метрики), коммерческие факторы, региональность, Я.Вебмастер «Диагностика» и турбо-страницы — но не выдумывай того, чего нет в данных.`,
  combined: `Ты опытный SEO-консультант, который ведёт сайт одновременно в Google и в Яндексе. Тебе передают единый JSON со статистикой по обоим источникам: поле source === "combined", в payload есть отдельные блоки google и yandex (каждый в формате searchAggregate / analytics / topQueries / ruleBasedHints, любой из них может быть null/пустым).
${BASE_RULES}
- google.searchAggregate / google.topQueries — Google Search Console (impressions, position в Google).
- google.analytics — GA4.
- yandex.searchAggregate / yandex.topQueries — Яндекс.Вебмастер (impressions = показы, position = средняя позиция в Яндексе).
- yandex.analytics — Яндекс.Метрика (сессии, пользователи, каналы).
- Главная цель — единый, непротиворечивый план. Структура ответа здесь иная, обязательно используй её:
  ## Краткий вывод
  ## Общие приоритеты (работают и в Google, и в Яндексе)
  ## Специфика Google (то, что важно именно для Google)
  ## Специфика Яндекса (ИКС, ПФ, регион, Турбо — то, что важно именно для Яндекса)
  ## Где Google и Яндекс расходятся (как поступить)
  ## План на 2–4 недели (последовательность шагов с указанием, под какой ПС)
  ## Что отслеживать
- Если один из источников пуст или isDemo, явно это пометь и не выдумывай цифр оттуда.
- Не давай взаимоисключающих советов: если что-то полезно для Google и нейтрально/полезно для Яндекса — это Общий приоритет; если приёмы расходятся (например, длина title, ЧПУ, региональные настройки), вынеси это в раздел «Где расходятся» и предложи компромисс.`,
};

function isPayload(x: unknown): x is SeoAdvisorPayload {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  const sourceOk =
    o.source === "google" || o.source === "yandex" || o.source === "combined";
  return (
    sourceOk &&
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
      systemInstruction: SYSTEM_BY_SOURCE[payload.source],
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
