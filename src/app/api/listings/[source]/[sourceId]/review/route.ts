import { NextResponse } from "next/server";
import { isOwner, sameOrigin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { reviewSchema } from "@/lib/review";
import { z } from "zod";
export async function PUT(request: Request, context: { params: Promise<{ source: string; sourceId: string }> }) {
  if (!sameOrigin(request) || !await isOwner()) return NextResponse.json({ error: "請先登入管理者帳號" }, { status: 401 });
  const db = getSupabaseAdmin()!;
  const { source, sourceId } = await context.params;
  let input;
  try { input = z.object({ version: z.number().int().nonnegative(), review: reviewSchema }).strict().parse(await request.json()); }
  catch { return NextResponse.json({ error: "欄位格式不正確；戶數需有來源且 800m 不可少於 500m" }, { status: 400 }); }
  const { data, error } = await db.from("listings").update({ manual_review: input.review, review_version: input.version + 1,
    notes: input.review.notes, status: input.review.status,
  }).eq("source", source).eq("source_id", sourceId).eq("review_version", input.version).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "儲存失敗，請確認資料庫 migration 已執行" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "資料已由另一個視窗修改，請重新載入後再編輯" }, { status: 409 });
  return NextResponse.json({ saved: true });
}
