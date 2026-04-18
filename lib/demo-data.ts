import type { GSCRow, GA4Summary } from "@/types/seo";
import type {
  YandexHistoryPoint,
  YandexMetricaSummary,
  YandexWebmasterQueryRow,
} from "@/types/yandex";

export function getDemoGSCData(days: number): GSCRow[] {
  const queries = [
    "купить ноутбук онлайн",
    "лучшие ноутбуки 2024",
    "ноутбук для работы",
    "MacBook Pro отзывы",
    "бюджетный ноутбук",
    "ноутбук игровой",
  ];
  return queries.map((query, i) => ({
    keys: [query, "RU", `/blog/page-${i}`],
    clicks: Math.round(3000 / (i + 1)),
    impressions: Math.round(40000 / (i * 0.5 + 1)),
    ctr: parseFloat((9 - i * 0.8).toFixed(2)),
    position: parseFloat((2 + i * 2.1).toFixed(1)),
  }));
}

export function getDemoGA4Data(days: number): GA4Summary {
  const factor = days / 28;
  return {
    sessions: Math.round(34000 * factor),
    users: Math.round(21000 * factor),
    pageviews: Math.round(89000 * factor),
    avgDuration: 187,
    channels: [
      { name: "Organic Search", sessions: Math.round(19720 * factor) },
      { name: "Direct", sessions: Math.round(7308 * factor) },
      { name: "Referral", sessions: Math.round(4176 * factor) },
      { name: "Social", sessions: Math.round(2088 * factor) },
      { name: "Email", sessions: Math.round(1044 * factor) },
    ],
  };
}

export function getDemoAhrefsData() {
  return {
    domainRating: 42,
    backlinks: 12840,
    organicTraffic: 28400,
    keywords: 3920,
  };
}

export function getDemoYandexWebmasterQueries(
  days: number
): YandexWebmasterQueryRow[] {
  const queries = [
    "доставка цветов москва",
    "интернет магазин подарков",
    "купить букет роз",
    "оформление свадьбы цена",
    "курьерская доставка сегодня",
    "подарочный сертификат онлайн",
    "цветы с доставкой спб",
    "оформление зала недорого",
  ];
  const factor = days / 28;
  return queries.map((queryText, i) => ({
    queryId: `demo-${i}`,
    queryText,
    shows: Math.round((12000 / (i + 1)) * factor),
    clicks: Math.round((900 / (i + 1)) * factor),
    avgShowPosition: parseFloat((4 + i * 1.2).toFixed(1)),
  }));
}

export function getDemoYandexHistory(days: number): YandexHistoryPoint[] {
  const out: YandexHistoryPoint[] = [];
  const end = new Date();
  for (let d = days - 1; d >= 0; d--) {
    const dt = new Date(end);
    dt.setDate(dt.getDate() - d);
    const label = dt.toISOString().slice(0, 10);
    const wave = 0.88 + 0.12 * Math.sin((d / 7) * Math.PI * 2);
    out.push({
      date: label,
      shows: Math.round(4200 * wave * (0.9 + d / (days * 3))),
      clicks: Math.round(310 * wave * (0.95 + d / (days * 4))),
    });
  }
  return out;
}

export function getDemoYandexMetrica(days: number): YandexMetricaSummary {
  const factor = days / 28;
  return {
    sessions: Math.round(28000 * factor),
    users: Math.round(17500 * factor),
    pageviews: Math.round(72000 * factor),
    avgDuration: 164,
    channels: [
      { name: "Переходы из поисковых систем", sessions: Math.round(15200 * factor) },
      { name: "Прямые заходы", sessions: Math.round(6100 * factor) },
      { name: "Переходы по рекламе", sessions: Math.round(3400 * factor) },
      { name: "Внутренние переходы", sessions: Math.round(2100 * factor) },
      { name: "Переходы из социальных сетей", sessions: Math.round(1200 * factor) },
    ],
  };
}
