import test from "node:test";
import assert from "node:assert/strict";
import { listingSchema, importSchema } from "../src/lib/validation";
const row = { source: "591", sourceId: "district-test", title: "店面", address: "新北市蘆洲區", district: "蘆洲區", url: "https://example.com/listing", rent: 30000, areaPing: 20 };
test("imports accept both target districts and reject unsupported or missing districts", () => {
  assert.equal(importSchema.safeParse([row, { ...row, sourceId: "sanchong", district: "三重區" }]).success, true);
  for (const district of ["板橋區", "", undefined]) assert.equal(listingSchema.safeParse({ ...row, district }).success, false);
});
