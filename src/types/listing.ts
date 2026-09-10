export type CompetitorStrength = "strong" | "normal" | "weak" | "unknown";

export interface ListingCandidate {
  sourceId: string;
  source: "591" | "manual" | "mock";
  title: string;
  url: string;
  address: string;
  district: string;
  rent: number;
  areaPing: number;
  firstFloorPing?: number | null;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
}

export interface Competitor {
  excluded?: boolean;
  notes?: string;
  placeId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  distanceMeters: number;
  rating: number | null;
  reviewCount: number | null;
  openingHours: string[] | null;
  businessStatus: string | null;
  isOday: boolean;
  strength: CompetitorStrength;
}

export interface CompetitionAnalysis {
  status: "available" | "partial" | "unavailable";
  reason?: string;
  searchRadiusMeters: number;
  competitors: Competitor[];
}

export interface ScoreInput extends ListingCandidate {
  laundryAllowed?: boolean | null;
  franchiseConflict?: boolean | null;
  demandSource?: string;
  competitionAnalysis?: CompetitionAnalysis;
  unknownCompetitors500m?: number;
  competitors800m?: number;
  households500m?: number | null;
  households800m?: number | null;
  rentalDemand?: "high" | "medium" | "low" | "unknown";
  oldApartmentDemand?: "high" | "medium" | "low" | "unknown";
  strongCompetitors500m?: number;
  normalCompetitors500m?: number;
  weakCompetitors500m?: number;
  nearestOdayMeters?: number | null;
  frontage?: "good" | "average" | "poor" | "unknown";
  parking?: "good" | "average" | "poor" | "unknown";
  utilitiesReady?: boolean | null;
  allow24h?: boolean | null;
}

export interface ScoreBreakdown {
  housing: number;
  competition: number;
  storefront: number;
  rentValue: number;
  access: number;
  total: number;
  pros: string[];
  cons: string[];
  fatalFlags: string[];
}
