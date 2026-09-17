import test from 'node:test';
import assert from 'node:assert/strict';
import { refreshAllListings, type ScanStore } from '../src/lib/scan';
import type { ListingCandidate } from '../src/types/listing';
test('refresh visits all 95 records, isolates failures and remains idempotent', async () => {
  const rows: ListingCandidate[] = Array.from({length:95},(_,i)=>({source:'591',sourceId:String(i),title:'店面',url:'https://example.com',address:'新北市三重區',district:'三重區',rent:30000,areaPing:20}));
  const saved = new Map(); let active=0, peak=0;
  const store: ScanStore = { async find(){return {notified_high_score:true};}, async save(row){if(row.sourceId==='3') throw new Error('write failed');saved.set(row.sourceId,row);}, async markNotified(){assert.fail('existing record');} };
  const enrich = async (row: ListingCandidate) => {active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,1));active--;return row;};
  for(let i=0;i<2;i++) {const result=await refreshAllListings(rows,store,async()=>{assert.fail('must not notify');},enrich);assert.equal(result.results.length,94);assert.deepEqual(result.failed,['591:3']);}
  assert.equal(saved.size,94);assert.ok(saved.has('94'));assert.ok(peak<=5);
});
