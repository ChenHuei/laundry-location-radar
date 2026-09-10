import { importSchema } from "../validation";
import { ListingCollector } from "./base";
import { ListingCandidate } from "@/types/listing";

/**
 * 591 adapter boundary.
 * Intentionally isolated because 591 does not expose a general public listing API.
 * Production implementation should only access pages/endpoints permitted by current terms/robots,
 * avoid bypassing anti-bot controls, and keep the request rate low.
 */
export class Source591Collector implements ListingCollector {
  async collect(): Promise<ListingCandidate[]> {
    const sourceUrl = process.env.LISTING_SOURCE_URL;
    if (!sourceUrl) throw new Error("LISTING_SOURCE_URL is required when LISTING_SOURCE=591");

    const res = await fetch(sourceUrl, { headers: { "User-Agent": "LaundryLocationRadar/0.1 (+manual-owner-operated-monitor)" }, cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`591 source returned ${res.status}`);

    // Keep parsing provider-specific markup out of core logic. Implement only after confirming
    // the allowed source format. A JSON bridge/export endpoint can be used here if direct HTML
    // collection is unsuitable.
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error("Configured 591 source is not JSON. Add an allowed parser/bridge in Source591Collector.");
    }
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Expected an array of listing records");
    return importSchema.parse(data);
  }
}
