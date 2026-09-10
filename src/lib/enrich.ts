import { ListingCandidate, ScoreInput } from "@/types/listing";

/** Placeholder enrichment layer. Replace with Google Places + population/GIS adapters.
 * Keeping this deterministic allows the MVP to run before API keys are connected.
 */
export async function enrichListing(x: ListingCandidate): Promise<ScoreInput> {
  return {
    ...x,
    households500m: null,
    households800m: null,
    rentalDemand: "unknown",
    oldApartmentDemand: "unknown",
    strongCompetitors500m: 0,
    normalCompetitors500m: 0,
    weakCompetitors500m: 0,
    nearestOdayMeters: null,
    frontage: "unknown",
    parking: "unknown",
    utilitiesReady: null,
    allow24h: null
  };
}
