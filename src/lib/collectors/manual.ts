import { businessConfig } from "../config";
import "server-only";
import { getSupabaseAdmin } from "../supabase";
import type { ListingCandidate } from "../../types/listing";
import type { ListingCollector } from "./base";
export class ManualCollector implements ListingCollector {
  async collect(): Promise<ListingCandidate[]> {
    const db = getSupabaseAdmin();
    if (!db) throw new Error("Manual collector requires database");
    const { data, error } = await db.from("listings").select("source,source_id,title,url,address,district,rent,area_ping,first_floor_ping,enrichment").in("source", ["manual", "591"]).eq("is_active", true).order("last_seen_at", { ascending: true }).limit(businessConfig.scanBatchSize);
    if (error) throw error;
    return data.map(row => ({ source: row.source, sourceId: row.source_id, title: row.title, url: row.url, address: row.address, district: row.district,
      rent: row.rent, areaPing: row.area_ping, firstFloorPing: row.first_floor_ping, lat: row.enrichment?.lat, lng: row.enrichment?.lng }));
  }
}
