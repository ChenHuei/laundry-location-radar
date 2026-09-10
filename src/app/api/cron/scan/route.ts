import { NextResponse } from "next/server";
import { getCollector } from "@/lib/collectors";
import { enrichListing } from "@/lib/enrich";
import { scoreListing } from "@/lib/scoring";
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
  const results = [];

  for (const listing of listings) {
    const enriched = await enrichListing(listing);
    const score = scoreListing(enriched);
    let isNew = true;
    let notified = false;

    if (db) {
      const { data: existing } = await db.from("listings").select("id,notified_high_score").eq("source", listing.source).eq("source_id", listing.sourceId).maybeSingle();
      isNew = !existing;
      const payload = {
        source: listing.source, source_id: listing.sourceId, title: listing.title, url: listing.url,
        address: listing.address, district: listing.district, rent: listing.rent, area_ping: listing.areaPing,
        first_floor_ping: listing.firstFloorPing ?? null, score_total: score.total, score_breakdown: score,
        enrichment: enriched, last_seen_at: new Date().toISOString(), is_active: true
      };
      const { error } = await db.from("listings").upsert(payload, { onConflict:"source,source_id" });
      if (error) throw error;
      if (isNew && score.total >= 80 && !existing?.notified_high_score) {
        await sendHighScoreNotification(listing, score);
        await db.from("listings").update({ notified_high_score:true }).eq("source", listing.source).eq("source_id", listing.sourceId);
        notified = true;
      }
    }
    results.push({ sourceId:listing.sourceId, score:score.total, isNew, notified });
  }

  return NextResponse.json({ scanned:listings.length, results, mode: db ? "supabase" : "dry-run" });
}
