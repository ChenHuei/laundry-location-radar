import "server-only";
import { getSupabaseAdmin } from "./supabase";
import type { ScanStore } from "./scan";
export function getScanStore(): ScanStore | null {
  const db = getSupabaseAdmin();
  if (!db) return null;
  return {
    async find(listing) {
      const { data, error } = await db.from("listings").select("enrichment,manual_review,notified_high_score").eq("source", listing.source).eq("source_id", listing.sourceId).maybeSingle();
      if (error) throw error;
      return data;
    },
    async save(listing, enrichment, score) {
      const { error } = await db.from("listings").upsert({
        source: listing.source, source_id: listing.sourceId, title: listing.title, url: listing.url,
        address: listing.address, district: listing.district, rent: listing.rent, area_ping: listing.areaPing,
        first_floor_ping: listing.firstFloorPing ?? null, score_total: score.total, score_breakdown: score,
        enrichment, last_seen_at: new Date().toISOString(), is_active: true,
      }, { onConflict: "source,source_id" });
      if (error) throw error;
    },
    async markNotified(listing) {
      const { error } = await db.from("listings").update({ notified_high_score: true }).eq("source", listing.source).eq("source_id", listing.sourceId);
      if (error) throw error;
    },
  };
}
