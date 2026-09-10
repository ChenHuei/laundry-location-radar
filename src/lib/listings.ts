import "server-only";
import { getSupabaseAdmin } from "./supabase";
import { MockCollector } from "./collectors/mock";
import { enrichListing } from "./enrich";
import { scoreListing } from "./scoring";
import { applyReview } from "./review";
import type { ListingRow } from "./models";

export function reviewedRow(row: ListingRow): ListingRow {
  const input = applyReview(row.enrichment, row.manual_review);
  const score = scoreListing(input);
  return { ...row, enrichment: input, score_total: score.total, score_breakdown: score,
    first_floor_ping: input.firstFloorPing ?? null,
    status: row.manual_review?.status ?? row.status,
    notes: row.manual_review?.notes ?? row.notes };
}
export async function getListingRows(): Promise<ListingRow[]> {
  const db = getSupabaseAdmin();
  if (db) {
    const { data, error } = await db.from("listings").select("*").order("last_seen_at", { ascending: false }).limit(300);
    if (error) throw error;
    return (data as ListingRow[]).map(reviewedRow).sort((a,b) => b.score_total-a.score_total);
  }
  const raw = await new MockCollector().collect();
  return Promise.all(raw.map(async x => {
    const enriched = await enrichListing(x); const score = scoreListing(enriched);
    return { id:x.sourceId, source_id:x.sourceId, ...x, area_ping:x.areaPing, first_floor_ping:x.firstFloorPing ?? null, score_total:score.total, score_breakdown:score, enrichment:enriched, is_active:true, status: "new" };
  }));
}
export async function getListing(source: string, sourceId: string): Promise<ListingRow | null> {
  const db = getSupabaseAdmin();
  if (!db) return (await getListingRows()).find(x => x.source === source && x.source_id === sourceId) ?? null;
  const { data, error } = await db.from("listings").select("*").eq("source", source).eq("source_id", sourceId).maybeSingle();
  if (error) throw error;
  return data ? reviewedRow(data as ListingRow) : null;
}
