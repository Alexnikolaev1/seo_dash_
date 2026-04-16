import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getDemoGA4Data } from "@/lib/demo-data";
import { mapGa4ReportToSummary } from "@/lib/ga4";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const propertyId =
    searchParams.get("propertyId") ?? process.env.GA4_PROPERTY_ID ?? "";
  const days = Number(searchParams.get("days") || 28);

  if (!session?.accessToken || !propertyId) {
    return NextResponse.json({
      data: getDemoGA4Data(days),
      isDemo: true,
    });
  }

  try {
    const endDate = "today";
    const startDate = `${days}daysAgo`;

    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: "sessions" },
            { name: "totalUsers" },
            { name: "screenPageViews" },
            { name: "averageSessionDuration" },
          ],
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json({
        data: getDemoGA4Data(days),
        isDemo: true,
      });
    }

    const json = await res.json();
    const summary = mapGa4ReportToSummary(json);
    if (summary) {
      return NextResponse.json({ data: summary, isDemo: false });
    }
    return NextResponse.json({
      data: getDemoGA4Data(days),
      isDemo: true,
    });
  } catch {
    return NextResponse.json({
      data: getDemoGA4Data(days),
      isDemo: true,
    });
  }
}
