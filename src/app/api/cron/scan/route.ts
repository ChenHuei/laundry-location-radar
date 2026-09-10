import { NextResponse } from "next/server";
import { getCollector } from "@/lib/collectors";
import { scanListings, type ScanStore } from "@/lib/scan";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendHighScoreNotification } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error:"unauthorized" }, { status:401 });
  }

  const collector = getCollector();
  const listings = await collector.collect();
  const db = getSupabaseAdmin();
  const store: ScanStore | null = db ? {
    async find(listing) {
      const { data, error } = await db.from("listings").select("enrichment,notified_high_score").eq("source", listing.source).eq("source_id", listing.sourceId).maybeSingle();
      if (error) throw error;
      return data;
    },
    async save(listing, enriched, score) {
      const { error } = await db.from("listings").upsert({
        source: listing.source, source_id: listing.sourceId, title: listing.title, url: listing.url,
        address: listing.address, district: listing.district, rent: listing.rent, area_ping: listing.areaPing,
        first_floor_ping: listing.firstFloorPing ?? null, score_total: score.total, score_breakdown: score,
        enrichment: enriched, last_seen_at: new Date().toISOString(), is_active: true
      }, { onConflict: "source,source_id" });
      if (error) throw error;
    },
    async markNotified(listing) {
      const { error } = await db.from("listings").update({ notified_high_score: true }).eq("source", listing.source).eq("source_id", listing.sourceId);
      if (error) throw error;
    }
  } : null;
  const results = await scanListings(listings, store, sendHighScoreNotification);

  return NextResponse.json({ scanned:listings.length, results, mode: db ? "supabase" : "dry-run" });
}
