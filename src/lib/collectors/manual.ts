import "server-only";
import { getSupabaseAdmin } from "../supabase";
import type { ListingCandidate } from "../../types/listing";
import type { ListingCollector } from "./base";
export class ManualCollector implements ListingCollector {
  async collect(): Promise<ListingCandidate[]> {
    const db = getSupabaseAdmin();
    if (!db) throw new Error("Manual collector requires database");
    const data = [];
    let cursor = 0;
    while (true) {
      const { data: page, error } = await db.from("listings").select("id,source,source_id,title,url,address,district,rent,area_ping,first_floor_ping,enrichment").in("source", ["manual", "591"]).eq("is_active", true).gt("id", cursor).order("id", { ascending: true }).limit(500);
      if (error) throw error;
      if (!page.length) break;
      data.push(...page);
      cursor = page[page.length - 1].id;
    }
    return data.map(row => ({ source: row.source, sourceId: row.source_id, title: row.title, url: row.url, address: row.address, district: row.district,
      rent: row.rent, areaPing: row.area_ping, firstFloorPing: row.first_floor_ping, lat: row.enrichment?.lat, lng: row.enrichment?.lng }));
  }
}
