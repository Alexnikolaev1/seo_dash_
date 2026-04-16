import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") || 28);
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    period: days,
    reportTitle: `SEO Отчёт — последние ${days} дней`,
  });
}
