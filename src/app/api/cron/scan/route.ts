import { NextResponse } from "next/server";
import { getCollector } from "@/lib/collectors";
import { refreshAllListings } from "@/lib/scan";
import { getScanStore } from "@/lib/scan-store";
import { sendHighScoreNotification } from "@/lib/notify";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  const store = getScanStore();
  if (!db || !store) return NextResponse.json({ error: "尚未設定資料庫，掃描未執行" }, { status: 503 });
  const started = new Date().toISOString();
  try {
    const listings = await getCollector().collect();
    const { results, failed } = await refreshAllListings(listings, store, sendHighScoreNotification);
    await db.from("scan_runs").insert({ started_at: started, finished_at: new Date().toISOString(), status: failed.length ? "failed" : "success", scanned: results.length, error: failed.length ? `${failed.length} 筆更新失敗` : null });
    return NextResponse.json({ attempted: listings.length, scanned: results.length, failed, results }, { status: failed.length ? 502 : 200 });
  } catch {
    await db.from("scan_runs").insert({ started_at: started, finished_at: new Date().toISOString(), status: "failed", error: "掃描失敗，請檢查來源與服務設定" });
    return NextResponse.json({ error: "掃描失敗，已保留既有資料" }, { status: 502 });
  }
}
