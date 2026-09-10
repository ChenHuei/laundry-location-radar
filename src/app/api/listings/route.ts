import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCollector } from "@/lib/collectors";
import { enrichListing } from "@/lib/enrich";
import { scoreListing } from "@/lib/scoring";

export async function GET() {
  const db = getSupabaseAdmin();
  if (db) {
    const { data, error } = await db.from("listings").select("*").order("score_total", { ascending:false }).limit(300);
    if (error) return NextResponse.json({ error:error.message }, { status:500 });
    return NextResponse.json(data);
  }
  const raw = await getCollector().collect();
  const rows = await Promise.all(raw.map(async (x) => {
    const enriched = await enrichListing(x); const score = scoreListing(enriched);
    return { id:x.sourceId, source_id:x.sourceId, ...x, score_total:score.total, score_breakdown:score, enrichment:enriched, is_active:true };
  }));
  return NextResponse.json(rows.sort((a,b)=>b.score_total-a.score_total));
}
