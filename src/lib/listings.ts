import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCollector } from "@/lib/collectors";
import { enrichListing } from "@/lib/enrich";
import { scoreListing } from "@/lib/scoring";

export async function getListingRows() {
  const db = getSupabaseAdmin();
  if (db) {
    const { data, error } = await db.from("listings").select("*").order("score_total", { ascending:false }).limit(300);
    if (error) throw error;
    return data;
  }
  const raw = await getCollector().collect();
  const rows = await Promise.all(raw.map(async (x) => {
    const enriched = await enrichListing(x); const score = scoreListing(enriched);
    return { id:x.sourceId, source_id:x.sourceId, ...x, area_ping:x.areaPing, first_floor_ping:x.firstFloorPing ?? null, score_total:score.total, score_breakdown:score, enrichment:enriched, is_active:true };
  }));
  return rows.sort((a,b)=>b.score_total-a.score_total);
}
