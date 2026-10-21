import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSeed,sampleCard} from '../scenarios.js';
import {analyzeCapabilityIntake,onboardSupplier,recordDecision,updateRequirement,reviewEvidence,requestFollowup} from '../domain.js';
import {ensureRfqState,createRfq,responseTemplate,recordSupplierResponse,reviewRfqResponse,getRfqState} from '../rfq.js';
import {WORKSPACE_LIMITS,parseWorkspace,serializeWorkspace,previewRestore,loadWorkspace,saveWorkspace} from '../workspace.js';
const at='2026-10-21T14:00:00Z',later='2026-10-21T15:00:00Z',human={reviewer:'Named demo buyer',note:'Reviewed fictional requirements.'};
const read = state => parseWorkspace(JSON.stringify(state));
function populated(){
 const state=makeSeed(),supplier=state.suppliers[0];recordDecision(state,supplier.id,'advance',human.reviewer,human.note,at);const rfq=createRfq(state,supplier.id,human,at);recordSupplierResponse(state,rfq.id,responseTemplate(state,rfq.id,at),at);reviewRfqResponse(state,rfq.id,{...human,action:'acknowledge'},at);
 const intake=analyzeCapabilityIntake(sampleCard);onboardSupplier(state,{...intake.fields,name:'Human corrected fictional shop',intakeText:sampleCard,intakeFields:intake.fields,intakeEvidence:intake.evidence},later);return {state,supplier,rfq};
}
function storage(initial=null){let text=initial;return {reads:0,writes:0,getItem(){this.reads++;return text;},setItem(key,value){this.writes++;text=value;},get value(){return text;}};}

test('legacy 0.3/0.4 workspace migrates only missing RFQ collections without mutating its source',()=>{
 const state=makeSeed(),before=JSON.stringify(state),parsed=read(state);assert.deepEqual(parsed.rfqs,[]);assert.deepEqual(parsed.rfqEvents,[]);assert.deepEqual(parsed.rfqReviews,[]);assert.equal(JSON.stringify(state),before);assert.equal(parsed.schemaVersion,3);
 const current=ensureRfqState(makeSeed());assert.deepEqual(read(current),current);
});
test('populated export roundtrip preserves approvals, immutable RFQs, responses, reviews and intake provenance',()=>{
 const {state,rfq}=populated(),before=JSON.stringify(state),exported=serializeWorkspace(state),restored=parseWorkspace(exported);assert.equal(JSON.stringify(state),before);for(const [key,value] of Object.entries(state))assert.deepEqual(restored[key],value,key);assert.match(restored.notice,/Synthetic/);assert.ok(restored.exportedAt);assert.equal(getRfqState(restored,rfq.id,at).reviewStatus,'acknowledged');assert.equal(restored.suppliers[0].source.intakeText,sampleCard);assert.ok(restored.suppliers[0].source.corrections.length);
 const preview=previewRestore(exported);assert.deepEqual(preview.summary,{suppliers:5,requirements:4,rfqs:1,responses:1,reviews:1});assert.notEqual(preview.state,state);
});
test('historical stale approvals, changed requirement and renewed evidence remain restorable',()=>{
 const {state,supplier,rfq}=populated();updateRequirement(state,{quantity:101},later);reviewEvidence(state,supplier.id,{reviewer:'Demo quality person',sourceRef:'DEMO-RENEWAL',validFrom:'2026-10-21',validUntil:'2027-12-01',scopeConfirmed:true,note:'Historical renewal preserved.'},later);reviewRfqResponse(state,rfq.id,{...human,action:'hold'},later);const restored=read(state);assert.equal(restored.rfqs[0].snapshot.supplier.evidence.length,1);assert.equal(restored.suppliers.find(s=>s.id===supplier.id).evidence.length,2);assert.equal(getRfqState(restored,rfq.id,later).approvalCurrent,false);
});
test('expired historical qualifications are shape validated without granting freshness or dropping history',()=>{
 const {state,rfq}=populated();reviewRfqResponse(state,rfq.id,{...human,action:'acknowledge'},'2028-01-01T00:00:00Z');const restored=read(state);assert.equal(getRfqState(restored,rfq.id,'2028-01-01T00:00:00Z').approvalCurrent,false);assert.equal(restored.rfqReviews.length,2);
});
test('unknown optional profile claims remain empty through conservative legacy migration',()=>{
 const state=makeSeed();onboardSupplier(state,{name:'Fictional unknown shop',city:'Tulsa',processes:'Tube bending'},at);const restored=read(state),supplier=restored.suppliers[0];assert.equal(supplier.site.country,'');assert.equal(supplier.site.region,'');assert.equal(supplier.capabilities.maxToleranceInches,null);assert.equal(supplier.capabilities.maxLotSize,null);assert.deepEqual(supplier.evidence,[]);
});
test('fresh and saved loads are read-only and keep record counts',()=>{
 const empty=storage(),fresh=loadWorkspace(empty,'demo');assert.equal(fresh.status,'fresh');assert.equal(empty.writes,0);assert.deepEqual(fresh.state.rfqs,[]);
 const device=storage(serializeWorkspace(populated().state)),saved=loadWorkspace(device,'demo');assert.equal(saved.status,'saved');assert.equal(saved.state.rfqs.length,1);assert.equal(device.writes,0);assert.equal(saved.recoverableText,undefined);
});
for(const original of [' {broken JSON\n','null',JSON.stringify({...makeSeed(),selectedRequirementId:'MISSING'}),JSON.stringify({...makeSeed(),rfqEvents:{}})])test(`corrupt saved data preserves exact recovery source and never overwrites it: ${original.slice(0,25)}`,()=>{
 const device=storage(original),loaded=loadWorkspace(device,'demo');assert.equal(loaded.status,'recovered');assert.equal(loaded.recoverableText,original);assert.equal(device.value,original);assert.equal(device.writes,0);assert.equal(loaded.state.suppliers.length,4);assert.match(loaded.message,/original remains/);
});
test('storage read exception produces a usable in-memory session and a durable-warning message',()=>{
 const device={getItem(){throw new Error('SecurityError');},setItem(){assert.fail('must not write during load');}};const loaded=loadWorkspace(device,'demo');assert.equal(loaded.status,'memory');assert.equal(loaded.state.requirements.length,4);assert.match(loaded.message,/in memory; export/i);
});
test('quota and storage exceptions return save failures without altering the source workspace or previous value',()=>{
 const state=populated().state,before=JSON.stringify(state),device=storage('previous');device.setItem=()=>{throw new Error('QuotaExceededError');};const result=saveWorkspace(device,'demo',state);assert.equal(result.ok,false);assert.match(result.message,/Export/);assert.equal(JSON.stringify(state),before);assert.equal(device.value,'previous');
 const valid=storage();assert.equal(saveWorkspace(valid,'demo',state).ok,true);assert.equal(parseWorkspace(valid.value).rfqReviews.length,1);
});
test('failed validation cannot partially migrate or save an invalid live workspace',()=>{
 const state=makeSeed();state.suppliers[0].capabilities=null;const before=JSON.stringify(state),device=storage('original');assert.equal(saveWorkspace(device,'demo',state).ok,false);assert.equal(JSON.stringify(state),before);assert.equal(device.value,'original');assert.equal(device.writes,0);assert.throws(()=>serializeWorkspace(state));assert.equal(Object.hasOwn(state,'rfqs'),false);
});
for(const [label,mutate] of [
 ['missing selected request',s=>{s.selectedRequirementId='MISSING';}],
 ['malformed capabilities',s=>{s.suppliers[0].capabilities={};}],
 ['non-array processes',s=>{s.suppliers[0].capabilities.processes='CNC milling';}],
 ['missing nested site',s=>{delete s.suppliers[0].site;}],
 ['bad country',s=>{s.suppliers[0].site.country='USA';}],
 ['unsafe lot size',s=>{s.suppliers[0].capabilities.maxLotSize=Number.MAX_SAFE_INTEGER+1;}],
 ['unsafe requirement quantity',s=>{s.requirements[0].quantity=Number.MAX_SAFE_INTEGER+1;}],
 ['duplicate supplier ID',s=>{s.suppliers[1].id=s.suppliers[0].id;}],
 ['duplicate request ID',s=>{s.requirements[1].id=s.requirements[0].id;}],
 ['real supplier marker',s=>{s.suppliers[0].synthetic=false;}],
 ['real request marker',s=>{s.requirements[0].customer='Real corporation';s.requirements[0].sourceNote='Real program';}],
 ['malformed RFQ collection',s=>{s.rfqs=null;}],
 ['malformed response collection',s=>{s.rfqEvents={};}],
 ['malformed review collection',s=>{s.rfqReviews='';}],
 ['invalid evidence type',s=>{s.suppliers[0].evidence[0].scopeConfirmed='true';}],
 ['lost superseding evidence',s=>{s.suppliers[0].evidence[0].supersededBy='MISSING';}],
 ['malformed intake provenance',s=>{s.suppliers[0].source.corrections=[{field:'name',extracted:{},confirmed:'Demo'}];}],
 ['unsupported schema',s=>{s.schemaVersion=99;}]
])test(`restore rejects ${label} atomically`,()=>{const state=makeSeed();mutate(state);const text=JSON.stringify(state);assert.throws(()=>previewRestore(text));assert.equal(JSON.stringify(state),text);});
for(const [label,mutate] of [
 ['missing RFQ supplier',s=>{s.rfqs[0].supplierId='MISSING';}],
 ['missing snapshot',s=>{delete s.rfqs[0].snapshot;}],
 ['changed snapshot quantity',s=>{s.rfqs[0].snapshot.requirement.quantity+=1;}],
 ['lost approval history',s=>{s.decisions=[];}],
 ['approval mismatch',s=>{s.rfqs[0].snapshot.approval.reviewer='Different';}],
 ['unsafe event quantity',s=>{s.rfqEvents[0].quantity=Number.MAX_SAFE_INTEGER+1;}],
 ['wrong response correlation',s=>{s.rfqEvents[0].lineId='OTHER';}],
 ['missing response fields',s=>{delete s.rfqEvents[0].actor;}],
 ['response sequence gap',s=>{s.rfqEvents[0].sequence=2;}],
 ['duplicate response',s=>{s.rfqEvents.push(structuredClone(s.rfqEvents[0]));}],
 ['missing review response',s=>{s.rfqReviews[0].responseEventId='MISSING';}],
 ['bad review context',s=>{s.rfqReviews[0].contextKey='{}';}],
 ['mismatched review snapshot',s=>{const c=JSON.parse(s.rfqReviews[0].contextKey);c.response.quantity=999;s.rfqReviews[0].contextKey=JSON.stringify(c);}],
 ['review before response',s=>{s.rfqReviews[0].at='2026-10-20T00:00:00Z';}],
 ['bad decision snapshot',s=>{s.decisions[0].snapshotKey='{}';}]
])test(`populated history rejects ${label} without changing the input`,()=>{const state=JSON.parse(JSON.stringify(populated().state));mutate(state);const text=JSON.stringify(state);assert.throws(()=>parseWorkspace(text));assert.equal(JSON.stringify(state),text);});
test('oversized UTF-8, nested collections, row counts and unsafe object keys are rejected',()=>{
 assert.throws(()=>parseWorkspace(' '.repeat(WORKSPACE_LIMITS.bytes+1)),/2 MiB/);assert.throws(()=>parseWorkspace('"'+'é'.repeat(WORKSPACE_LIMITS.bytes/2)+'"'),/2 MiB/);
 const rows=makeSeed();rows.suppliers=Array.from({length:501},(_,i)=>({...rows.suppliers[0],id:`SUP-${i}`}));assert.throws(()=>read(rows),/500/);
 const nested=makeSeed();nested.suppliers[0].evidence=Array(1001).fill({});assert.throws(()=>read(nested),/array/);
 assert.throws(()=>parseWorkspace('{"__proto__":{}}'),/unsupported object key/);
 const deep=makeSeed();let cursor=deep;for(let i=0;i<32;i++){cursor.extra={};cursor=cursor.extra;}assert.throws(()=>read(deep),/too deep/);
});
test('resolved followup provenance is retained and dangling evidence rejected',()=>{
 const state=makeSeed(),supplier=state.suppliers[0];requestFollowup(state,supplier.id,human.reviewer,'Confirm synthetic packet.',at);reviewEvidence(state,supplier.id,{reviewer:'Demo quality person',sourceRef:'DEMO-RENEWAL',validFrom:'2026-10-21',validUntil:'2027-12-01',scopeConfirmed:true,note:'Reviewed renewal.'},later);assert.equal(read(state).followups[0].status,'resolved');state.followups[0].evidenceId='MISSING';assert.throws(()=>read(state),/missing record/);
});
