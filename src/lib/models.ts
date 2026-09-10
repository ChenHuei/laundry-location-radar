import type { ScoreInput, ScoreBreakdown } from "../types/listing";
import type { ManualReview } from "./review";
export interface ListingRow {
  id: string | number; source: "591" | "manual" | "mock"; source_id: string; title: string; address: string; district: string; url: string;
  rent: number; area_ping: number; first_floor_ping: number | null; score_total: number; score_breakdown: ScoreBreakdown;
  enrichment: ScoreInput; manual_review?: ManualReview | null; review_version?: number;
  is_active: boolean; status: string; notes?: string | null; first_seen_at?: string; last_seen_at?: string;
}
export function listingPath(row: { source: string; source_id: string }) { return `/listings/${encodeURIComponent(row.source)}/${encodeURIComponent(row.source_id)}`; }
