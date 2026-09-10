import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeCompetition, distanceMeters } from "../src/lib/places/google";
import { enrichListing } from "../src/lib/enrich";
import { scoreListing } from "../src/lib/scoring";
import { scanListings, type ScanStore } from "../src/lib/scan";
import type { ListingCandidate, ScoreInput } from "../src/types/listing";

const listing: ListingCandidate = { source: "manual", sourceId: "test", title: "測試", address: "測試地址", district: "三重區", rent: 26000, areaPing: 20, lat: 25.06, lng: 121.49, url: "https://example.com" };
const place = (id: string, name = "測試洗衣店", latitude = 25.061) => ({ id, displayName: { text: name }, location: { latitude, longitude: 121.49 } });
const reply = (body: unknown, status = 200): typeof fetch => async () => new Response(JSON.stringify(body), { status });

test("requests server Places fields, deduplicates and separates Oday without inventing ratings", async () => {
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(url, "https://places.googleapis.com/v1/places:searchNearby");
    assert.equal(new Headers(init?.headers).get("X-Goog-Api-Key"), "test-key");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.locationRestriction.circle.radius, 1200);
    assert.equal(body.rankPreference, "DISTANCE");
    return new Response(JSON.stringify({ places: [place("a"), place("a"), place("b", "Oday 自助洗衣"), { ...place("c"), businessStatus: "CLOSED_PERMANENTLY" }] }));
  };
  const result = await enrichListing(listing, { apiKey: "test-key", fetcher });
  assert.equal(result.competitionAnalysis?.status, "available");
  assert.equal(result.competitionAnalysis?.competitors.length, 2);
  assert.equal(result.unknownCompetitors500m, 1);
  assert.equal(result.competitors800m, 1);
  assert.ok(result.nearestOdayMeters! > 100 && result.nearestOdayMeters! < 120);
  assert.equal(result.competitionAnalysis?.competitors[0].rating, null);
  assert.equal(result.competitionAnalysis?.competitors[0].reviewCount, null);
});

test("missing coordinates/key and demo records skip network; errors never become zero competitors", async () => {
  const forbidden: typeof fetch = async () => { assert.fail("must not call Places"); };
  for (const input of [{ ...listing, lat: null }, { ...listing, lat: NaN }, { ...listing, source: "mock" as const }]) {
    assert.equal((await analyzeCompetition(input, { apiKey: "test", fetcher: forbidden })).status, "unavailable");
  }
  assert.equal((await analyzeCompetition(listing, { apiKey: "", fetcher: forbidden })).status, "unavailable");
  for (const fetcher of [reply({}, 429), reply({ places: "bad" }), (async () => { throw new Error("secret-key"); }) as typeof fetch]) {
    const result = await enrichListing(listing, { apiKey: "test", fetcher });
    assert.equal(result.competitionAnalysis?.status, "unavailable");
    assert.equal(result.unknownCompetitors500m, undefined);
    assert.equal(scoreListing(result).competition, 12);
    assert.ok(!JSON.stringify(result).includes("secret-key"));
  }
});

test("empty successful result differs from missing data; truncation and invalid rows are partial", async () => {
  const empty = await enrichListing(listing, { apiKey: "test", fetcher: reply({}) });
  assert.equal(empty.unknownCompetitors500m, 0);
  assert.equal(scoreListing(empty).competition, 25);
  for (const places of [[{}], Array.from({ length: 20 }, (_, i) => place(String(i)))]) {
    const result = await enrichListing(listing, { apiKey: "test", fetcher: reply({ places }) });
    assert.equal(result.competitionAnalysis?.status, "partial");
    assert.ok(scoreListing(result).competition <= 12);
  }
});

test("distance bands, unknown strength and Oday thresholds are deterministic", async () => {
  assert.equal(distanceMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 }), 0);
  const result = await enrichListing(listing, { apiKey: "test", fetcher: reply({ places: [place("a"), place("b", "洗衣店", 25.066), place("c", "洗衣店", 25.069)] }) });
  assert.equal(result.unknownCompetitors500m, 1);
  assert.equal(result.competitors800m, 2);
  assert.equal(scoreListing(result).competition, 22);
  assert.deepEqual(scoreListing(result), scoreListing(result));
  for (const [meters, expected] of [[500, 10], [800, 16], [1200, 21]]) {
    assert.equal(scoreListing({ ...listing, competitionAnalysis: { status: "available", competitors: [], searchRadiusMeters: 1200 }, nearestOdayMeters: meters }).competition, expected);
  }
});

test("repeated scans preserve manual site inputs and only notify unchanged high-score listing once", async () => {
  let row: { enrichment: ScoreInput; notified_high_score: boolean } | null = null;
  let calls = 0;
  const store: ScanStore = {
    async find() { return row; },
    async save(_, enrichment) { row = { enrichment, notified_high_score: row?.notified_high_score ?? false }; },
    async markNotified() { row!.notified_high_score = true; },
  };
  const enrich = (x: ListingCandidate) => enrichListing(x, { apiKey: "test", fetcher: reply({}) });
  const input: ScoreInput = { ...listing, households500m: 5000, rentalDemand: "high", oldApartmentDemand: "high", utilitiesReady: true, allow24h: true, parking: "good", frontage: "good", notes: "保留現勘筆記" };
  const notify = async () => { calls++; return { skipped: false }; };
  const first = await scanListings([input], store, notify, enrich);
  const second = await scanListings([listing], store, notify, enrich);
  assert.equal(first[0].score, 100);
  assert.equal(first[0].notified, true);
  assert.equal(second[0].score, 100);
  assert.equal(second[0].isNew, false);
  assert.equal(calls, 1);
  assert.equal((await store.find(listing))?.enrichment?.notes, "保留現勘筆記");
});

test("optional API failure does not abort scan and skipped notifications are not recorded as sent", async () => {
  let marked = 0;
  const store: ScanStore = { async find() { return null; }, async save() {}, async markNotified() { marked++; } };
  const failedEnrich = (x: ListingCandidate) => enrichListing(x, { apiKey: "test", fetcher: reply({}, 503) });
  const results = await scanListings([listing, { ...listing, sourceId: "two" }], store, async () => ({ skipped: true }), failedEnrich);
  assert.equal(results.length, 2);
  const input: ScoreInput = { ...listing, households500m: 5000, rentalDemand: "high", oldApartmentDemand: "high", utilitiesReady: true, allow24h: true };
  const high = await scanListings([input], store, async () => ({ skipped: true }), x => enrichListing(x, { apiKey: "test", fetcher: reply({}) }));
  assert.ok(high[0].score >= 80);
  assert.equal(high[0].notified, false);
  assert.equal(marked, 0);
  assert.ok(scoreListing({ ...input, allow24h: false }).fatalFlags.length > 0);
});
