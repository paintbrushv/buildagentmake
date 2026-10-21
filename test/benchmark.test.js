import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {verifyFixtures,worksheetReference,percentile,intakeTask} from '../scripts/benchmark.mjs';
import {makeSeed} from '../scenarios.js';
const fixture=JSON.parse(await readFile(new URL('../validation/fixtures.json',import.meta.url),'utf8'));
test('independent explicit matrix, fixed seed, intake and packet contract hold',()=>{
  const result=verifyFixtures();
  assert.equal(result.seedSupplierRequestPairs,16);assert.equal(result.falseReadySeedPairs,0);assert.equal(result.falseBlockedSeedPairs,0);assert.equal(result.expiredCertificateAdvanceBlocked,true);assert.equal(result.humanBaseline.completedTimedTrials,0);
});
test('worksheet reference treats certificate end date inclusively then blocks next day',()=>{
  const row=structuredClone(fixture.supplierRows[1]),request=fixture.requests[3];
  row.as9100Status='verified';row.as9100ScopeConfirmed=true;row.qualificationReviewer='Synthetic quality reviewer';
  assert.equal(worksheetReference(row,request,'2026-10-01').ready,true);
  assert.deepEqual(worksheetReference(row,request,'2026-10-02').blockers,['qualification']);
});
test('new intake remains separate from the four seed reference rows',()=>{
  const state=makeSeed(),before=structuredClone(state.suppliers);const result=intakeTask(state);
  assert.equal(state.suppliers.length,5);assert.deepEqual(state.suppliers.slice(1),before);assert.deepEqual(result.supplier.evidence,[]);assert.equal(result.supplier.site.reviewedBy,null);assert.equal(result.clevis.ready,false);
});
test('nearest-rank percentile definition is stable without mutating raw observations',()=>{
  const samples=[9,1,7,3];assert.equal(percentile(samples,.5),3);assert.equal(percentile(samples,.95),9);assert.deepEqual(samples,[9,1,7,3]);
});
