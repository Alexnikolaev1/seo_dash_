import type { GSCRow, GA4Summary } from "@/types/seo";

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
