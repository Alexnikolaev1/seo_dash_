import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getDemoGSCData } from "@/lib/demo-data";
import { normalizeGscRows } from "@/lib/gsc-normalize";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const siteUrl =
    searchParams.get("site") ??
    process.env.GSC_SITE_URL ??
    "https://example.com/";
  const days = Number(searchParams.get("days") || 28);

  if (!session?.accessToken) {
    return NextResponse.json({ data: getDemoGSCData(days), isDemo: true });
  }

  try {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - days * 86400000)
      .toISOString()
      .split("T")[0];

    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ["query", "country", "page"],
          rowLimit: 500,
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json({
        data: getDemoGSCData(days),
        isDemo: true,
      });
    }

    const json = (await res.json()) as { rows?: unknown[] };
    const data = normalizeGscRows(json.rows ?? []);
    return NextResponse.json({ data, isDemo: false });
  } catch {
    return NextResponse.json({ data: getDemoGSCData(days), isDemo: true });
  }
}
