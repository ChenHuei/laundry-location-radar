import { applyReview, type ManualReview } from "./review";
import type { ListingCandidate, ScoreInput, ScoreBreakdown } from "../types/listing";
import { enrichListing } from "./enrich";
import { scoreListing } from "./scoring";
import { businessConfig } from "./config";

type ExistingListing = { enrichment?: ScoreInput; manual_review?: ManualReview | null; notified_high_score: boolean };
export interface ScanStore {
  find(listing: ListingCandidate): Promise<ExistingListing | null>;
  save(listing: ListingCandidate, enrichment: ScoreInput, score: ScoreBreakdown): Promise<void>;
  markNotified(listing: ListingCandidate): Promise<void>;
}
export async function scanListings(listings: ListingCandidate[], store: ScanStore | null, notify: (listing: ListingCandidate, score: ScoreBreakdown) => Promise<{ skipped: boolean }>, enrich = enrichListing) {
  const results = [];
  for (const listing of listings) {
    const existing = store ? await store.find(listing) : null;
    // Previously entered site checks, demand inputs and notes survive automatic refreshes.
    const enriched = await enrich({ ...existing?.enrichment, ...listing });
    const effective = applyReview(enriched, existing?.manual_review);
    const score = scoreListing(effective);
    let notified = false;
    if (store) {
      await store.save(listing, enriched, score);
      if (!existing && score.total >= businessConfig.notificationThreshold && !score.fatalFlags.length) {
        const result = await notify(effective, score);
        if (!result.skipped) {
          await store.markNotified(listing);
          notified = true;
        }
      }
    }
    results.push({ sourceId: listing.sourceId, score: score.total, isNew: !existing, notified });
  }
  return results;
}
