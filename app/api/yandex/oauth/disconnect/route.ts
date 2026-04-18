import {
  YANDEX_COOKIE_ACCESS,
  YANDEX_COOKIE_REFRESH,
} from "@/lib/yandex/constants";
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(YANDEX_COOKIE_ACCESS);
  res.cookies.delete(YANDEX_COOKIE_REFRESH);
  return res;
}
