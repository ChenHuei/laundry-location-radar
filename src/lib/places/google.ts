import "server-only";
import { z } from "zod";
import { businessConfig } from "../config";
import type { CompetitionAnalysis, Competitor, ListingCandidate } from "../../types/listing";

const locationSchema = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) });
const placeSchema = z.object({
  id: z.string().min(1),
  displayName: z.object({ text: z.string() }),
  location: locationSchema,
  formattedAddress: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  userRatingCount: z.number().int().nonnegative().optional(),
  businessStatus: z.string().optional(),
  regularOpeningHours: z.object({ weekdayDescriptions: z.array(z.string()).optional() }).optional(),
});
const responseSchema = z.object({ places: z.array(z.unknown()).optional() });

export function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const rad = (n: number) => n * Math.PI / 180;
  const h = Math.sin(rad(b.latitude - a.latitude) / 2) ** 2
    + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export interface PlacesOptions { apiKey?: string; fetcher?: typeof fetch }

export async function analyzeCompetition(listing: ListingCandidate, options: PlacesOptions = {}): Promise<CompetitionAnalysis> {
  const config = businessConfig.competition;
  const base = { searchRadiusMeters: config.searchRadius, competitors: [] as Competitor[] };
  // Demo addresses must never generate paid requests or be mistaken for real observations.
  if (listing.source === "mock") return { ...base, status: "unavailable", reason: "示範物件未查詢 Google Places" };
  const center = locationSchema.safeParse({ latitude: listing.lat, longitude: listing.lng });
  if (!center.success) return { ...base, status: "unavailable", reason: "缺少有效座標，需先定位地址" };
  const key = options.apiKey ?? process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return { ...base, status: "unavailable", reason: "尚未設定 Google Places" };
  try {
    const response = await (options.fetcher ?? fetch)("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.formattedAddress,places.rating,places.userRatingCount,places.businessStatus,places.regularOpeningHours.weekdayDescriptions",
      },
      body: JSON.stringify({ includedTypes: ["laundry"], maxResultCount: config.maxResults, rankPreference: "DISTANCE", languageCode: "zh-TW", locationRestriction: { circle: { center: center.data, radius: config.searchRadius } } }),
      cache: "no-store", signal: AbortSignal.timeout(config.timeoutMs),
    });
    if (!response.ok) return { ...base, status: "unavailable", reason: `Places 查詢失敗（HTTP ${response.status}）` };
    const data = responseSchema.parse(await response.json());
    const raw = data.places ?? [];
    const competitors = new Map<string, Competitor>();
    let invalid = false;
    for (const item of raw) {
      const parsed = placeSchema.safeParse(item);
      if (!parsed.success) { invalid = true; continue; }
      const p = parsed.data;
      if (p.businessStatus === "CLOSED_PERMANENTLY") continue;
      const distance = distanceMeters(center.data, p.location);
      if (distance > config.searchRadius) continue;
      competitors.set(p.id, {
        placeId: p.id, name: p.displayName.text, address: p.formattedAddress ?? null,
        lat: p.location.latitude, lng: p.location.longitude, distanceMeters: distance,
        rating: p.rating ?? null, reviewCount: p.userRatingCount ?? null,
        openingHours: p.regularOpeningHours?.weekdayDescriptions ?? null,
        businessStatus: p.businessStatus ?? null,
        isOday: /\bo[\s-]*day\b/i.test(p.displayName.text.normalize("NFKC")),
        strength: "unknown",
      });
    }
    const partial = invalid || raw.length >= config.maxResults;
    return { ...base, status: partial ? "partial" : "available",
      reason: partial ? "結果達上限或部分資料無效，附近店家可能未完整列出" : undefined,
      competitors: [...competitors.values()].sort((a, b) => a.distanceMeters - b.distanceMeters || a.placeId.localeCompare(b.placeId)),
    };
  } catch {
    // Do not expose upstream bodies/errors, which may contain credentials.
    return { ...base, status: "unavailable", reason: "Places 逾時、連線失敗或回傳格式無效" };
  }
}
