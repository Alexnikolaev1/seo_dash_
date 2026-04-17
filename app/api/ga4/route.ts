import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getDemoGA4Data } from "@/lib/demo-data";
import { mapGa4ReportToSummary, type Ga4ReportJson } from "@/lib/ga4";

const LOG = "[api/ga4]";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const propertyIdRaw =
    searchParams.get("propertyId") ?? process.env.GA4_PROPERTY_ID ?? "";
  const propertyId = propertyIdRaw.trim();
  const days = Number(searchParams.get("days") || 28);

  if (!session?.accessToken || !propertyId) {
    console.error(
      LOG,
      "demo: missing prerequisites",
      !session?.accessToken ? "no accessToken (re-login or session issue)" : null,
      !propertyId ? "GA4_PROPERTY_ID empty after trim" : null
    );
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

    const raw = await res.text();

    if (!res.ok) {
      console.error(
        LOG,
        "Google runReport failed",
        { status: res.status, statusText: res.statusText, propertyId },
        raw.slice(0, 2500)
      );
      return NextResponse.json({
        data: getDemoGA4Data(days),
        isDemo: true,
      });
    }

    let json: unknown;
    try {
      json = JSON.parse(raw) as unknown;
    } catch (e) {
      console.error(LOG, "invalid JSON from Google", raw.slice(0, 500), e);
      return NextResponse.json({
        data: getDemoGA4Data(days),
        isDemo: true,
      });
    }

    const summary = mapGa4ReportToSummary(json as Ga4ReportJson);
    const hasRows =
      Array.isArray((json as Ga4ReportJson).rows) &&
      (json as Ga4ReportJson).rows!.length > 0;
    if (!hasRows) {
      console.warn(
        LOG,
        "runReport OK but no rows (no traffic in period or data not ready yet)"
      );
    }
    return NextResponse.json({ data: summary, isDemo: false });
  } catch (e) {
    console.error(LOG, "exception", e);
    return NextResponse.json({
      data: getDemoGA4Data(days),
      isDemo: true,
    });
  }
}
