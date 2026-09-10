import type { ListingCandidate, ScoreInput } from "../types/listing";
import { analyzeCompetition, type PlacesOptions } from "./places/google";
import { businessConfig } from "./config";

export async function enrichListing(x: ListingCandidate, options?: PlacesOptions): Promise<ScoreInput> {
  const analysis = await analyzeCompetition(x, options);
  const ordinary = analysis.competitors.filter(p => !p.isOday);
  const primary = ordinary.filter(p => p.distanceMeters <= businessConfig.competition.primaryRadius);
  const oday = analysis.competitors.filter(p => p.isOday);
  const available = analysis.status !== "unavailable";
  return {
    ...x,
    competitionAnalysis: analysis,
    strongCompetitors500m: available ? primary.filter(p => p.strength === "strong").length : undefined,
    normalCompetitors500m: available ? primary.filter(p => p.strength === "normal").length : undefined,
    weakCompetitors500m: available ? primary.filter(p => p.strength === "weak").length : undefined,
    unknownCompetitors500m: available ? primary.filter(p => p.strength === "unknown").length : undefined,
    competitors800m: available ? ordinary.filter(p => p.distanceMeters <= businessConfig.competition.secondaryRadius).length : undefined,
    nearestOdayMeters: oday.length ? Math.min(...oday.map(p => p.distanceMeters)) : null,
  };
}
