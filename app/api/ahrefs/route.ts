import { NextRequest, NextResponse } from "next/server";
import { getDemoAhrefsData } from "@/lib/demo-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("target") || "example.com";
  const apiKey = process.env.AHREFS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ data: getDemoAhrefsData(), isDemo: true });
  }

  try {
    const res = await fetch(
      `https://api.ahrefs.com/v3/site-explorer/metrics?target=${encodeURIComponent(target)}&select=domain_rating,backlinks,organic_traffic`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!res.ok) {
      return NextResponse.json({ data: getDemoAhrefsData(), isDemo: true });
    }

    const json = await res.json();
    return NextResponse.json({ data: json, isDemo: false });
  } catch {
    return NextResponse.json({ data: getDemoAhrefsData(), isDemo: true });
  }
}
