import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {analyzeCapabilityIntake,onboardSupplier,discoverSuppliers,scoreSupplier,recordDecision,buildPacket,packetHtml} from '../domain.js';
import {makeSeed,sampleCard} from '../scenarios.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const fixture=JSON.parse(await readFile(path.join(root,'validation/fixtures.json'),'utf8'));
export const percentile=(samples,p)=>[...samples].sort((a,b)=>a-b)[Math.max(0,Math.ceil(samples.length*p)-1)];
const summarize=samples=>({medianMs:percentile(samples,.5),p95Ms:percentile(samples,.95),minMs:Math.min(...samples),maxMs:Math.max(...samples)});
const compactMatch=(supplier,req)=>{const m=scoreSupplier(supplier,req,fixture.asOf);return {supplierId:supplier.id,score:m.score,blockers:m.blockers.map(b=>b.key),ready:m.ready};};

// Deliberately independent worksheet-style reference. No production scoring,
// canonicalization, qualification, packet, discovery or ranking functions used.
export function worksheetReference(row,req,asOf=fixture.asOf) {
  const q=req.qualification==='ISO 9001:2015'?'iso9001':'as9100';
  const qualified=row[`${q}Status`]==='verified'&&row[`${q}ScopeConfirmed`]&&Boolean(row.qualificationReviewer)&&row[`${q}ValidFrom`]<=asOf&&row[`${q}ValidUntil`]>=asOf;
  const checks={process:row.processes.includes(req.process),material:row.materials.includes(req.material),tolerance:row.maxToleranceInches>0&&row.maxToleranceInches<=req.maxToleranceInches,quantity:Number.isInteger(row.maxLotSize)&&row.maxLotSize>=req.quantity,qualification:qualified,domestic:!req.usManufacturingRequired||(row.country==='US'&&row.siteReviewed&&Boolean(row.siteSourceRef)&&Boolean(row.siteReviewer))};
  const weights={process:35,material:25,tolerance:20,quantity:10,qualification:10};
  const blockers=Object.keys(checks).filter(k=>!checks[k]);
  return {supplierId:row.id,score:Object.entries(weights).reduce((n,[k,w])=>n+(checks[k]?w:0),0),blockers,ready:blockers.length===0};
}
export function intakeTask(state) {
  const analysis=analyzeCapabilityIntake(fixture.intake.text);
  const supplier=onboardSupplier(state,{...analysis.fields,intakeText:fixture.intake.text,intakeFields:analysis.fields,intakeEvidence:analysis.evidence},fixture.at);
  const discovered=discoverSuppliers(state.suppliers,fixture.intake.query,{},state.requirements);
  return {analysis,supplier,discoveredIds:discovered.results.map(s=>s.id),clevis:compactMatch(supplier,state.requirements[3])};
}
export function shortlistTask(state) {
  return state.requirements.map(req=>{const comparisons=state.suppliers.map(s=>compactMatch(s,req));return {requestId:req.id,comparisons,readySupplierIds:comparisons.filter(m=>m.ready).sort((a,b)=>b.score-a.score||a.supplierId.localeCompare(b.supplierId)).map(m=>m.supplierId)};});
}
export function reviewPacketTask(state) {
  return fixture.requests.map(req=>{
    state.selectedRequirementId=req.id;
    recordDecision(state,req.packetSupplierId,req.expectedDecisionAction,fixture.reviewer,fixture.reviewNote,fixture.at);
    const packet=buildPacket(state,req.packetSupplierId,fixture.at);
    return {packet,html:packetHtml(packet)};
  });
}
export function verifyFixtures() {
  const state=makeSeed();
  assert.equal(sampleCard,fixture.intake.text,'Fixture input must match current seeded sample card');
  assert.deepEqual(state.suppliers.map(s=>s.id),fixture.supplierRows.map(s=>s.id));
  for(const [i,req] of state.requirements.entries()) {
    const expected=fixture.requests[i];
    for(const field of ['id','part','process','material','maxToleranceInches','quantity','qualification','usManufacturingRequired','customer','drawingRevision','revision','dueDate'])assert.deepEqual(req[field],expected[field],`Request ${req.id} ${field}`);
  }
  for(const [i,s] of state.suppliers.entries()) {
    const r=fixture.supplierRows[i];
    for(const f of ['id','name'])assert.equal(s[f],r[f]);
    for(const f of ['city','region','country'])assert.equal(s.site[f],r[f]);
    assert.equal(s.site.status==='reviewed',r.siteReviewed);assert.equal(s.site.sourceRef,r.siteSourceRef);assert.equal(s.site.reviewedBy,r.siteReviewer);assert.equal(s.site.id,r.siteId);assert.equal(s.site.reviewedAt,r.siteReviewedAt);
    for(const [flat,field] of [['capabilitySourceId','id'],['capabilitySourceLabel','label'],['capabilitySourceObserved','observed']])assert.equal(s.source[field],r[flat]);
    for(const f of ['processes','materials','maxToleranceInches','maxLotSize'])assert.deepEqual(s.capabilities[f],r[f]);
    for(const [prefix,kind] of [['iso9001','ISO 9001:2015'],['as9100','AS9100D']]) {
      const e=s.evidence.find(e=>e.kind===kind&&!e.supersededBy);
      for(const [suffix,field] of [['Status','status'],['ValidFrom','validFrom'],['ValidUntil','validUntil'],['ScopeConfirmed','scopeConfirmed']])assert.deepEqual(e?.[field]??(suffix==='ScopeConfirmed'?false:null),r[prefix+suffix]);
      for(const [suffix,field] of [['SourceRef','sourceRef'],['SiteId','siteId'],['ReviewedAt','reviewedAt'],['VerifiedBy','verifiedBy'],['Observed','observed'],['SourceLabel','sourceLabel'],['Note','note']])assert.equal(e?.[field]??null,r[prefix+suffix]);
      if(e){assert.equal(e.siteId,s.site.id);assert.ok(e.sourceRef);assert.equal(e.verifiedBy,e.status==='verified'?r.qualificationReviewer:null);}
    }
  }
  const shortlist=shortlistTask(state);let falseReady=0,falseBlocked=0;
  for(const [i,actual] of shortlist.entries()) {
    const req=fixture.requests[i];const reference=fixture.supplierRows.map(row=>worksheetReference(row,req));
    assert.deepEqual(reference,req.expectedComparisons,'Independent worksheet reference must agree with explicit answers');
    for(const [j,m] of actual.comparisons.entries()) {falseReady+=Number(m.ready&&!reference[j].ready);falseBlocked+=Number(!m.ready&&reference[j].ready);}
    assert.deepEqual(actual.comparisons,req.expectedComparisons);assert.deepEqual(actual.readySupplierIds,req.expectedReadySupplierIds);
    assert.equal(actual.readySupplierIds[0]??null,req.expectedBestReadySupplierId);
  }
  const intake=intakeTask(makeSeed());assert.deepEqual(intake.analysis.fields,fixture.intake.expectedFields);
  assert.deepEqual(intake.discoveredIds,[intake.supplier.id]);assert.equal(intake.supplier.recordType,fixture.intake.expectedRecordType);
  assert.equal(intake.supplier.evidence.length,fixture.intake.expectedEvidenceCount);assert.equal(intake.supplier.site.status,fixture.intake.expectedSiteStatus);
  assert.deepEqual(intake.clevis.blockers,fixture.intake.expectedClevisBlockers);assert.equal(intake.clevis.ready,false);
  assert.ok(intake.analysis.evidence.every(e=>fixture.intake.text.includes(e.excerpt)));
  const packets=reviewPacketTask(makeSeed());
  for(const [i,{packet,html}] of packets.entries()) {
    const req=fixture.requests[i];assert.equal(packet.status,req.expectedPacketStatus);assert.equal(packet.decision.action,req.expectedDecisionAction);assert.equal(packet.decision.reviewer,fixture.reviewer);assert.equal(packet.decision.state,'current');
    assert.equal(packet.requirement.id,req.id);assert.equal(packet.supplier.id,req.packetSupplierId);assert.deepEqual(packet.comparisons.map(m=>({supplierId:m.id,score:m.score,blockers:m.blockers.map(b=>b.key),ready:m.ready})),req.expectedComparisons);
    assert.ok(html.startsWith('<!doctype html>'));assert.ok(html.includes(req.part));assert.ok(html.includes(fixture.reviewer));
  }
  const clevis=state.requirements[3],expiredSupplier=state.suppliers[1];
  assert.throws(()=>{state.selectedRequirementId=clevis.id;recordDecision(state,expiredSupplier.id,'advance',fixture.reviewer,fixture.reviewNote,fixture.at);},/Resolve every required check/);
  return {requestCount:4,seedSupplierCount:4,seedSupplierRequestPairs:16,expectedReadyPairs:3,expectedBlockedPairs:13,falseReadySeedPairs:falseReady,falseBlockedSeedPairs:falseBlocked,explicitComparisonMatches:16,intakeCardsChecked:1,intakeClevisFalseReady:0,packetsChecked:4,expiredCertificateAdvanceBlocked:true,humanBaseline:{participants:0,completedTimedTrials:0,status:'pending; no human time or savings measured'}};
}
function escape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function report(result) {
  const rows=result.tasks.map(t=>`<tr><th>${escape(t.label)}</th><td>${t.fixtureWork}</td><td>${t.core.medianMs.toFixed(4)}</td><td>${t.core.p95Ms.toFixed(4)}</td><td>${t.setup.medianMs.toFixed(4)}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Forgepath reproducible core benchmark</title><style>body{font:16px/1.55 system-ui;color:#1d303b;background:#f6f7f5;max-width:1060px;margin:40px auto;padding:24px}table{border-collapse:collapse;width:100%;background:white}th,td{text-align:left;border:1px solid #cdd7d9;padding:12px}th{font-weight:600}code{overflow-wrap:anywhere}small{color:#425966}.notice{border-left:4px solid #48796c;padding:14px;background:#e9f1ec}a{color:#175d77}</style><h1>Fixed-fixture core benchmark</h1><p class="notice"><strong>Measured local software execution only.</strong> All supplier and request records are synthetic. This measures deterministic core functions; it is not a browser test, human trial, spreadsheet timing, source retrieval study or adoption result.</p><p>Scenario as of <strong>${result.asOf}</strong>. Measured ${escape(result.measuredAt)} on ${escape(result.environment.node)} / ${escape(result.environment.platform)} ${escape(result.environment.arch)}. ${result.iterations} measured iterations and ${result.warmups} warmups per task.</p><table><thead><tr><th>Task</th><th>Work per iteration</th><th>Core median ms</th><th>Core p95 ms</th><th>Setup median ms</th></tr></thead><tbody>${rows}</tbody></table><p>Setup is a fresh <code>makeSeed()</code> clone, timed separately before each operation. Core includes the listed functions, result construction and HTML serialization where listed. No file I/O, browser rendering or human reading is inside the timer. Median is nearest-rank p50; p95 is nearest-rank p95. Single process; no subtractive overhead correction.</p><h2>Bounded correctness evidence</h2><p>Explicit expected answers and a separate worksheet-style software reference agree with all <strong>16 seed supplier/request pairs</strong>: 3 ready, 13 blocked, ${result.correctness.falseReadySeedPairs} false-ready and ${result.correctness.falseBlockedSeedPairs} false-blocked on these fixtures. One new card stays self-reported, searchable and blocked for clevis. Four packet outcomes checked. The expired AS9100D record (valid until 2026-10-01) blocks clevis advancement on 2026-10-21. These counts do not estimate real-world accuracy.</p><h2>Human worksheet comparison: pending</h2><p>Participants n=0; completed human timed trials n=0. No manual spreadsheet time, hours saved, percentage improvement, ROI or commercial adoption has been measured. The matched-input protocol is in <a href="MEASUREMENT.md">MEASUREMENT.md</a>; the four-row reference is software, not a human baseline.</p><h2>Reproduce and inspect</h2><p><code>node scripts/benchmark.mjs</code> from the source directory. <a href="benchmark-results.json">Raw samples, environment and hashes</a> · <a href="fixtures.json">Fixed inputs and explicit answers</a></p><p>Source SHA-256 (ordered path, NUL, bytes, NUL): <code>${result.sourceHash}</code></p><small>Latency is machine- and workload-specific. Tiny in-memory fixtures, synchronous process, timer and garbage-collection noise; no network, large-catalog, user-interface or operational-throughput claim. Reruns overwrite this report and raw measurements.</small></html>`;
}
export async function runBenchmark({warmups=100,iterations=1000}={}) {
  assert.ok(Number.isInteger(warmups)&&warmups>=1&&warmups<=10000);assert.ok(Number.isInteger(iterations)&&iterations>=10&&iterations<=100000);
  const correctness=verifyFixtures();
  const packageMetadata=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
  const sourceFiles=['domain.js','scenarios.js','scripts/benchmark.mjs','validation/fixtures.json'];const hash=createHash('sha256');const files=[];
  for(const name of sourceFiles){const bytes=await readFile(path.join(root,name));hash.update(name).update('\0').update(bytes).update('\0');files.push({path:name,sha256:createHash('sha256').update(bytes).digest('hex')});}
  const tasks=[];let consumed=0;
  for(const [id,label,fixtureWork,operation] of [['intake-discovery','Intake → discovery','1 card; extract, onboard, exact-name search',intakeTask],['requirement-shortlist','Requirement → shortlist','4 requests × 4 suppliers; all six gates',shortlistTask],['review-packet','Review → packet','4 decisions + packet snapshots + HTML strings',reviewPacketTask]]) {
    for(let i=0;i<warmups;i++)operation(makeSeed());
    const rawMs=[],setupRawMs=[];
    for(let i=0;i<iterations;i++) {
      let start=performance.now();const state=makeSeed();setupRawMs.push(performance.now()-start);
      start=performance.now();const output=operation(state);rawMs.push(performance.now()-start);
      consumed+=Array.isArray(output)?output.length:output.discoveredIds.length;
    }
    tasks.push({id,label,fixtureWork,functions:id==='intake-discovery'?['analyzeCapabilityIntake','onboardSupplier','discoverSuppliers']:id==='requirement-shortlist'?['scoreSupplier','filter and sort ready IDs']:['recordDecision','buildPacket','packetHtml'],core:{...summarize(rawMs),rawMs},setup:{operation:'makeSeed: clone synthetic requirements/suppliers and initialize empty arrays',...summarize(setupRawMs),rawMs:setupRawMs}});
  }
  assert.deepEqual(verifyFixtures(),correctness);
  const result={schemaVersion:1,kind:'deterministic-core-benchmark',asOf:fixture.asOf,measuredAt:new Date().toISOString(),warmups,iterations,unit:'milliseconds',percentileMethod:'nearest rank: sorted[ceil(n*p)-1]',timer:'node:perf_hooks performance.now()',execution:'sequential single Node process; fresh makeSeed before each operation; setup timed separately; no external I/O inside timing',environment:{application:packageMetadata.name,applicationVersion:packageMetadata.version,node:process.version,platform:process.platform,arch:process.arch,osRelease:os.release(),cpuModel:os.cpus()[0]?.model,cpuCount:os.cpus().length,totalMemoryBytes:os.totalmem()},sourceHash:hash.digest('hex'),sourceHashMethod:'SHA-256 over ordered relative path + NUL + file bytes + NUL',sourceFiles:files,correctness,tasks,consumedOutputCount:consumed,limitations:['Only fixed synthetic local fixtures; no real manufacturer data or source retrieval.','No browser, DOM, download, rendering, operator review, typing or network latency.','Worksheet reference is independent software; human trials n=0. No time saved or ROI result.','Tiny in-memory workload; machine, scheduling, timer and garbage-collection noise affect results.','Four review packets use supplier-decision core; RFQ response-event lifecycle is outside this benchmark.']};
  await mkdir(path.join(root,'validation'),{recursive:true});await writeFile(path.join(root,'validation/benchmark-results.json'),JSON.stringify(result,null,2)+'\n');await writeFile(path.join(root,'validation/benchmark-report.html'),report(result));
  return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const result=await runBenchmark();
  console.log(JSON.stringify({kind:result.kind,sourceHash:result.sourceHash,correctness:result.correctness,tasks:result.tasks.map(t=>({id:t.id,medianMs:t.core.medianMs,p95Ms:t.core.p95Ms,iterations:result.iterations}))},null,2));
}
