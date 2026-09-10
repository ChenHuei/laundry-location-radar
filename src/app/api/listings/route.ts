import { NextResponse } from "next/server";
import { getListingRows } from "@/lib/listings";

export async function GET() {
  try { return NextResponse.json(await getListingRows()); }
  catch { return NextResponse.json({ error: "無法取得物件資料" }, { status: 500 }); }
}
