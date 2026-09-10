import { test } from "node:test";
import assert from "node:assert/strict";
import { applyReview, reviewSchema } from "../src/lib/review";
import { importSchema } from "../src/lib/validation";
import { scoreListing } from "../src/lib/scoring";
import { enrichListing } from "../src/lib/enrich";
import { scanListings, type ScanStore } from "../src/lib/scan";
import type { ScoreInput, Competitor } from "../src/types/listing";

const base: ScoreInput = { source: "manual", sourceId: "unit-1", title: "測試", address: "測試地址", district: "三重區", rent: 30000, areaPing: 30, lat: 25, lng: 121, url: "https://example.com" };
const competitor: Competitor = { placeId: "store", name: "測試店", address: null, lat: 25.001, lng: 121, distanceMeters: 110, rating: null, reviewCount: null, openingHours: null, businessStatus: null, isOday: false, strength: "unknown" };
const observed: ScoreInput = { ...base, competitionAnalysis: { status: "available", searchRadiusMeters: 1200, competitors: [competitor] } };

test("review recomputes counts, Oday and exclusions without altering raw evidence", () => {
  const review = reviewSchema.parse({ competitors: { store: { strength: "strong", isOday: false, excluded: false, notes: "現勘" } } });
  const strong = applyReview(observed, review);
  assert.equal(strong.strongCompetitors500m, 1);
  assert.equal(strong.unknownCompetitors500m, 0);
  assert.equal(scoreListing(strong).competition, 20);
  assert.equal(observed.competitionAnalysis?.competitors[0].strength, "unknown");
  review.competitors.store.isOday = true;
  const oday = applyReview(observed, review);
  assert.equal(oday.strongCompetitors500m, 0);
  assert.equal(oday.nearestOdayMeters, 110);
  review.competitors.store.excluded = true;
  const excluded = applyReview(observed, review);
  assert.equal(excluded.nearestOdayMeters, null);
  assert.equal(excluded.competitors800m, 0);
  assert.equal(excluded.competitionAnalysis?.competitors.length, 1);
});

test("missing optional evidence remains unknown; manual notes are retained through failed refresh", async () => {
  const review = reviewSchema.parse({ notes: "已量測，保留", firstFloorPing: 20, allow24h: false, competitors: { store: { strength: "weak", isOday: false, excluded: false, notes: "設備老舊" } } });
  let storedReview = review;
  const store: ScanStore = {
    async find() { return { enrichment: observed, manual_review: storedReview, notified_high_score: true }; },
    async save(_, enriched) { assert.equal(enriched.competitionAnalysis?.status, "unavailable"); },
    async markNotified() { assert.fail("must not notify"); },
  };
  const results = await scanListings([base], store, async () => { assert.fail("must not notify"); }, x => enrichListing(x, { apiKey: "test", fetcher: async () => new Response("", { status: 503 }) }));
  assert.ok(results[0].score <= 59);
  assert.equal(storedReview.notes, "已量測，保留");
  const restored = applyReview(observed, storedReview);
  assert.equal(restored.weakCompetitors500m, 1);
  storedReview = reviewSchema.parse(storedReview);
  assert.deepEqual(applyReview(observed, storedReview), restored);
});

test("household estimates require evidence and consistent catchments", () => {
  assert.equal(reviewSchema.safeParse({ households500m: 3000 }).success, false);
  assert.equal(reviewSchema.safeParse({ households500m: 3000, households800m: 2000, demandSource: "測試來源" }).success, false);
  assert.equal(reviewSchema.safeParse({ households500m: 3000, households800m: 4000, demandSource: "官方資料 2026-08；GIS 面積估算" }).success, true);
  assert.equal(reviewSchema.safeParse({ score_total: 100 }).success, false);
  assert.equal(reviewSchema.safeParse({ allow24h: "true" }).success, false);
});

test("unknown ground-floor area earns no layout credit and confirmed blockers cap scores", () => {
  const unknown = scoreListing(base);
  assert.equal(unknown.storefront, 8);
  assert.ok(unknown.cons.some(x => x.includes("一樓可用面積未確認")));
  assert.equal(scoreListing({ ...base, firstFloorPing: 20 }).storefront, 15);
  for (const patch of [{ laundryAllowed: false }, { franchiseConflict: true }, { utilitiesReady: false }, { allow24h: false }]) {
    const result = scoreListing({ ...base, firstFloorPing: 20, ...patch });
    assert.ok(result.fatalFlags.length > 0);
    assert.ok(result.total <= 59);
  }
});

test("import rejects unsafe links, invalid numbers, injected fields and duplicates", () => {
  assert.equal(importSchema.safeParse([base]).success, true);
  for (const patch of [{ url: "javascript:alert(1)" }, { rent: -1 }, { district: "板橋區" }, { lat: null }, { sourceId: "../x" }, { areaPing: 0 }, { firstFloorPing: 40 }, { notes: "not allowed in automatic input" }]) {
    assert.equal(importSchema.safeParse([{ ...base, ...patch }]).success, false);
  }
  assert.equal(importSchema.safeParse([base, base]).success, false);
  assert.equal(importSchema.safeParse([]).success, false);
});
