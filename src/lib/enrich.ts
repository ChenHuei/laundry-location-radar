import type { ListingCandidate, ScoreInput } from "../types/listing";
import { analyzeCompetition, type PlacesOptions } from "./places/google";
import { summarizeCompetition } from "./review";

export async function enrichListing(x: ListingCandidate, options?: PlacesOptions): Promise<ScoreInput> {
  const analysis = await analyzeCompetition(x, options);
  return summarizeCompetition({ ...x, competitionAnalysis: analysis });
}
