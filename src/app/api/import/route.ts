import { NextResponse } from "next/server";
import { isOwner, sameOrigin } from "@/lib/auth";
import { importSchema } from "@/lib/validation";
import { getScanStore } from "@/lib/scan-store";
import { scanListings } from "@/lib/scan";
export const maxDuration = 300;
export async function POST(request: Request) {
  if (!sameOrigin(request) || !await isOwner()) return NextResponse.json({ error: "請先登入管理者帳號" }, { status: 401 });
  const text = await request.text();
  if (text.length > 100000) return NextResponse.json({ error: "匯入檔案過大" }, { status: 413 });
  let rows;
  try { rows = importSchema.parse(JSON.parse(text)); }
  catch { return NextResponse.json({ error: "請使用正確 JSON 格式，每批 1–25 筆三重物件，租金及面積需為正數，ID 不可重複" }, { status: 400 }); }
  try {
    // Manual import is a review operation, not authorization to send LINE messages.
    const results = await scanListings(rows, getScanStore(), async () => ({ skipped: true }));
    return NextResponse.json({ imported: results.length });
  } catch { return NextResponse.json({ error: "匯入中斷；部分資料可能已儲存，可安全重送同批資料" }, { status: 502 }); }
}
