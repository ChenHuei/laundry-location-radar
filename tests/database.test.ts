import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("database migration is repeatable; scans preserve review and history, stale edits fail", async () => {
  const db = new PGlite();
  try {
    const schema = await readFile("supabase/schema.sql", "utf8");
    const migration = await readFile("supabase/migrations/002_review.sql", "utf8");
    await db.exec(schema + migration);
    await db.exec(schema + migration);
    const insert = `insert into listings(source,source_id,title,url,rent,area_ping) values('manual','one','測試','https://example.com',$1,20) on conflict(source,source_id) do update set rent=excluded.rent`;
    await db.query(insert, [30000]);
    await db.query(`update listings set manual_review=$1,notes='保留筆記',status='visited',review_version=1,notified_high_score=true where source_id='one'`, [JSON.stringify({ notes: "保留筆記", firstFloorPing: 18 })]);
    await db.query(insert, [30000]);
    assert.equal((await db.query<{ n: number }>("select count(*)::int n from listings")).rows[0].n, 1);
    assert.equal((await db.query<{ n: number }>("select count(*)::int n from listing_history")).rows[0].n, 1);
    await db.query(insert, [28000]);
    const row = (await db.query<{ notes: string; status: string; review_version: number; notified_high_score: boolean; manual_review: { firstFloorPing: number } }>("select * from listings")).rows[0];
    assert.equal(row.notes, "保留筆記"); assert.equal(row.status, "visited");
    assert.equal(row.review_version, 1); assert.equal(row.notified_high_score, true);
    assert.equal(row.manual_review.firstFloorPing, 18);
    assert.equal((await db.query<{ n: number }>("select count(*)::int n from listing_history")).rows[0].n, 2);
    const stale = await db.query("update listings set notes='stale',review_version=1 where source_id='one' and review_version=0 returning id");
    assert.equal(stale.rows.length, 0);
    await db.exec("update listings set is_active=false where source_id='one'");
    assert.equal((await db.query<{ n: number }>("select count(*)::int n from listings")).rows[0].n, 1);
    const rls = await db.query<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where relname in ('listings','listing_history','scan_runs')");
    assert.ok(rls.rows.every(row => row.relrowsecurity));
  } finally { await db.close(); }
});
