import type { GSCRow } from "@/types/seo";

export interface Recommendation {
  type: "warn" | "info" | "ok";
  title: string;
  description: string;
}

export function generateRecommendations(gscData: GSCRow[]): Recommendation[] {
  const recs: Recommendation[] = [];

  const highImpLowPos = gscData.filter(
    (r) => r.impressions > 5000 && r.position > 20
  );
  if (highImpLowPos.length > 0) {
    recs.push({
      type: "warn",
      title: "Оптимизируйте мета-теги для высокочастотных запросов",
      description: `Запросы «${highImpLowPos[0].keys[0]}» имеют >5K показов, но позицию ниже 20. Улучшите заголовки H1 и meta description.`,
    });
  }

  const lowCtrGoodPos = gscData.filter((r) => r.ctr < 2 && r.position < 10);
  if (lowCtrGoodPos.length > 0) {
    recs.push({
      type: "warn",
      title: "Низкий CTR при хороших позициях",
      description: `${lowCtrGoodPos.length} запросов в топ-10 имеют CTR < 2%. Перепишите title и description — добавьте цифры, выгоды, призыв к действию.`,
    });
  }

  const borderline = gscData.filter(
    (r) => r.position >= 10 && r.position <= 15
  );
  if (borderline.length > 0) {
    recs.push({
      type: "info",
      title: `${borderline.length} запросов на грани топ-10`,
      description: `Запросы «${borderline[0].keys[0]}» на позициях 10–15 — небольшое улучшение контента выведет их в топ-10 и удвоит трафик.`,
    });
  }

  const topPerformers = gscData.filter((r) => r.position <= 3 && r.ctr > 7);
  if (topPerformers.length > 0) {
    recs.push({
      type: "ok",
      title: "Закрепите лидирующие позиции",
      description: `${topPerformers.length} запросов в топ-3 с CTR > 7%. Добавьте FAQ-разметку и Schema.org для защиты позиций.`,
    });
  }

  return recs.slice(0, 4);
}
