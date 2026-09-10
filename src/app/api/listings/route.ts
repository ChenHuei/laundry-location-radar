import { isOwner } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getListingRows } from "@/lib/listings";

export async function GET() {
  if (getSupabaseAdmin() && !await isOwner()) return NextResponse.json({ error: "請先登入" }, { status: 401 });
  try { return NextResponse.json(await getListingRows()); }
  catch { return NextResponse.json({ error: "無法取得物件資料" }, { status: 500 }); }
}
