import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSeed} from '../scenarios.js';
import {recordDecision,updateRequirement,reviewEvidence} from '../domain.js';
import {ensureRfqState,createRfq,getRfqState,responseTemplate,recordSupplierResponse,reviewRfqResponse,exportResponseCsv,importSupplierResponses,buildRfqPacket,rfqPacketHtml,RESPONSE_SCHEMA} from '../rfq.js';
const at='2026-10-21T14:00:00Z',later='2026-10-21T15:00:00Z';
const human={reviewer:'Named buyer',note:'Checked the fictional drawing and requirements.'};
function approved() {const state=makeSeed(),supplier=state.suppliers[0];recordDecision(state,supplier.id,'advance',human.reviewer,human.note,at);const rfq=createRfq(state,supplier.id,human,at);return {state,supplier,rfq};}
function accepted() {const fixture=approved();fixture.event=responseTemplate(fixture.state,fixture.rfq.id,at);recordSupplierResponse(fixture.state,fixture.rfq.id,fixture.event,at);return fixture;}
const review=(state,id,action='acknowledge',time=at)=>reviewRfqResponse(state,id,{...human,action},time);

test('old workspaces acquire RFQ arrays without changing schema or discarding malformed state',()=>{
 const state=makeSeed();ensureRfqState(state);assert.deepEqual(state.rfqs,[]);assert.equal(state.schemaVersion,3);const malformed={rfqEvents:null};assert.throws(()=>ensureRfqState(malformed),/Malformed/);assert.deepEqual(malformed,{rfqEvents:null});
});
test('RFQ creation needs current named advance approval, every gate and sensible chronology',()=>{
 const state=makeSeed(),id=state.suppliers[0].id;assert.throws(()=>createRfq(state,id,human,at),/advance/);
 recordDecision(state,id,'hold',human.reviewer,human.note,at);assert.throws(()=>createRfq(state,id,human,at),/advance/);
 recordDecision(state,id,'advance',human.reviewer,human.note,at);assert.throws(()=>createRfq(state,id,{...human,reviewer:''},at),/Reviewer/);assert.throws(()=>createRfq(state,id,human,'2026-10-21T13:00:00Z'),/precede approval/);
 state.suppliers[0].capabilities.maxLotSize=1;assert.throws(()=>createRfq(state,id,human,at),/advance/);
});
test('captured single-line RFQ is immutable and creation is idempotent for the exact approval',()=>{
 const {state,supplier,rfq}=approved();assert.equal(createRfq(state,supplier.id,{reviewer:'Other',note:'Retry'},later),rfq);assert.equal(state.rfqs.length,1);assert.equal(rfq.unit,'pcs');assert.equal(rfq.requestRevision,1);assert.ok(rfq.lineId.endsWith('-L1'));
 assert.throws(()=>{rfq.snapshot.requirement.quantity=999;},TypeError);supplier.capabilities.maxLotSize+=1;assert.notEqual(rfq.snapshot.supplier.capabilities.maxLotSize,supplier.capabilities.maxLotSize);
});
test('RFQ request context remains scoped when the selected component changes',()=>{
 const {state,rfq}=approved();state.selectedRequirementId=state.requirements[1].id;assert.equal(getRfqState(state,rfq.id,at).approvalCurrent,true);assert.equal(responseTemplate(state,rfq.id,at).requestId,rfq.requestId);
});
test('waiting, pending, acknowledged and held each mean exactly the recorded stage',()=>{
 const {state,rfq}=approved();assert.equal(getRfqState(state,rfq.id,at).reviewStatus,'waiting');assert.throws(()=>review(state,rfq.id),/response is required/);
 const event=responseTemplate(state,rfq.id,at);assert.equal(event.schemaVersion,RESPONSE_SCHEMA);recordSupplierResponse(state,rfq.id,event,at);assert.equal(getRfqState(state,rfq.id,at).reviewStatus,'pending');review(state,rfq.id);assert.equal(getRfqState(state,rfq.id,at).reviewStatus,'acknowledged');review(state,rfq.id,'hold');assert.equal(getRfqState(state,rfq.id,at).reviewStatus,'held');assert.equal(state.rfqReviews.length,2);
});
test('short, late, declined, clarification and changed responses surface exceptions',()=>{
 for(const [patch,expected] of [[{quantity:1},'quantity_shortfall'],[{quantity:1000},'quantity_mismatch'],[{deliveryDate:'2027-01-01'},'delivery_late'],[{status:'decline',quantity:null,deliveryDate:null},'supplier_declined'],[{status:'clarification',quantity:null,deliveryDate:null},'clarification_requested']]) {
  const {state,rfq}=approved();recordSupplierResponse(state,rfq.id,{...responseTemplate(state,rfq.id,at),...patch},at);assert.ok(getRfqState(state,rfq.id,at).exceptions.some(e=>e.code===expected));review(state,rfq.id);assert.ok(getRfqState(state,rfq.id,at).exceptions.some(e=>e.code===expected));
 }
 const {state,rfq}=accepted();review(state,rfq.id);recordSupplierResponse(state,rfq.id,{...responseTemplate(state,rfq.id,later),quantity:1},later);const view=getRfqState(state,rfq.id,later);assert.equal(view.reviewStatus,'stale');assert.ok(view.exceptions.some(e=>e.code==='response_changed'));
});
test('lead time derives a UTC calendar date and both supplied representations must agree',()=>{
 const {state,rfq}=approved(),base=responseTemplate(state,rfq.id,at);const event=recordSupplierResponse(state,rfq.id,{...base,deliveryDate:null,leadTimeDays:2},at).event;assert.equal(event.deliveryDate,'2026-10-23');assert.equal(recordSupplierResponse(state,rfq.id,{...base,deliveryDate:null,leadTimeDays:2},later).duplicate,true);
 const other=approved();assert.throws(()=>recordSupplierResponse(other.state,other.rfq.id,{...responseTemplate(other.state,other.rfq.id,at),deliveryDate:'2026-10-24',leadTimeDays:2},at),/disagree/);
});
for(const [label,patch] of [
 ['null envelope',null],['unknown field',{suplierId:'typo'}],['wrong schema',{schemaVersion:'v2'}],['foreign RFQ',{rfqId:'OTHER'}],['foreign line',{lineId:'OTHER'}],['foreign request',{requestId:'OTHER'}],['foreign revision',{requestRevision:99}],['foreign supplier',{supplierId:'OTHER'}],['wrong units',{unit:'kg'}],['null accept quantity',{quantity:null}],['zero quantity',{quantity:0}],['fractional quantity',{quantity:1.5}],['string quantity',{quantity:'10'}],['unsafe quantity',{quantity:Number.MAX_SAFE_INTEGER+1}],['bad date',{deliveryDate:'2026-02-31'}],['empty date',{deliveryDate:''}],['missing accept date',{deliveryDate:null}],['negative lead time',{leadTimeDays:-1}],['fractional lead time',{leadTimeDays:1.5}],['missing actor',{actor:''}],['missing reference',{sourceRef:''}],['missing note',{note:''}],['invalid status',{status:'ordered'}],['sequence gap',{sequence:2}],['zero sequence',{sequence:0}],['unsafe sequence',{sequence:Number.MAX_SAFE_INTEGER+1}],['response before creation',{occurredAt:'2026-10-21T13:59:59Z'}],['future response',{occurredAt:later}],['bad timestamp',{occurredAt:'2026-02-31T14:00:00Z'}],['nonUTC timestamp',{occurredAt:'2026-10-21T14:00:00+00:00'}]
])test(`response rejects ${label} without changing workspace`,()=>{
 const {state,rfq}=approved(),before=JSON.stringify(state),base=responseTemplate(state,rfq.id,at);assert.throws(()=>recordSupplierResponse(state,rfq.id,patch===null?null:{...base,...patch},at));assert.equal(JSON.stringify(state),before);
});
test('missing envelope field and malformed event ID reject rather than silently infer',()=>{
 const {state,rfq}=approved(),event=responseTemplate(state,rfq.id,at);delete event.requestId;assert.throws(()=>recordSupplierResponse(state,rfq.id,event,at),/Missing response field/);event.requestId=rfq.requestId;event.eventId=null;assert.throws(()=>recordSupplierResponse(state,rfq.id,event,at),/eventId/);
});
test('exact historical retries are idempotent, conflicts and out of order updates reject',()=>{
 const {state,rfq,event}=accepted();const second=responseTemplate(state,rfq.id,later);recordSupplierResponse(state,rfq.id,second,later);assert.equal(recordSupplierResponse(state,rfq.id,event,later).duplicate,true);assert.equal(state.rfqEvents.length,2);
 const before=JSON.stringify(state);assert.throws(()=>recordSupplierResponse(state,rfq.id,{...event,note:'Changed'},later),/Conflicting duplicate/);assert.throws(()=>recordSupplierResponse(state,rfq.id,{...responseTemplate(state,rfq.id,at)},later),/out of order/);assert.equal(JSON.stringify(state),before);
});
test('event IDs are globally unique across RFQs',()=>{
 const {state,rfq,event}=accepted(),req=state.requirements.find(r=>r.id===rfq.requestId);updateRequirement(state,{quantity:req.quantity+1},later);recordDecision(state,rfq.supplierId,'advance',human.reviewer,human.note,later);const second=createRfq(state,rfq.supplierId,human,later);assert.throws(()=>recordSupplierResponse(state,second.id,{...responseTemplate(state,second.id,later),eventId:event.eventId},later),/Conflicting duplicate/);assert.equal(state.rfqEvents.length,1);
});
test('new response, changed request, evidence, capabilities, buyer hold and expiry stale named review',()=>{
 for(const mutate of [
  ({state,rfq})=>recordSupplierResponse(state,rfq.id,responseTemplate(state,rfq.id,later),later),
  ({state})=>updateRequirement(state,{quantity:101},later),
  ({supplier})=>{supplier.capabilities.maxLotSize+=1;},
  ({supplier})=>{supplier.evidence[0].note+=' more context';},
  ({state,supplier})=>recordDecision(state,supplier.id,'hold',human.reviewer,'Hold after response',later)
 ]) {const f=accepted();review(f.state,f.rfq.id);mutate(f);assert.equal(getRfqState(f.state,f.rfq.id,later).reviewStatus,'stale');}
 const f=accepted();review(f.state,f.rfq.id);const expired='2028-01-01T00:00:00Z';assert.equal(getRfqState(f.state,f.rfq.id,expired).reviewStatus,'stale');review(f.state,f.rfq.id,'acknowledge',expired);const after=getRfqState(f.state,f.rfq.id,expired);assert.equal(after.reviewStatus,'acknowledged');assert.equal(after.approvalCurrent,false);assert.ok(after.exceptions.some(e=>e.code==='gates_failed'));
});
test('evidence renewal preserves earlier RFQ snapshot and creates a tracked exception',()=>{
 const {state,supplier,rfq}=approved();reviewEvidence(state,supplier.id,{reviewer:'Quality person',sourceRef:'NEW-SYNTHETIC-CERT',validFrom:'2026-10-21',validUntil:'2027-10-20',scopeConfirmed:true,note:'Renewal reviewed.'},later);assert.equal(rfq.snapshot.supplier.evidence.length,1);assert.ok(getRfqState(state,rfq.id,later).exceptions.some(e=>e.code==='evidence_changed'));assert.equal(getRfqState(state,rfq.id,later).approvalCurrent,false);
});
test('versioned JSON and quoted CSV roundtrip preserve correlation and free text',()=>{
 for(const format of ['json','csv']) {const {state,rfq}=approved(),event={...responseTemplate(state,rfq.id,at),note:'Includes a comma, "quotes"\nand a new line <script>.'};const input=format==='json'?JSON.stringify(event):exportResponseCsv(event);const result=importSupplierResponses(state,input,format,at);assert.equal(result.imported,1);assert.deepEqual(result.events[0],event);assert.equal(importSupplierResponses(state,input,format,at).duplicates,1);assert.equal(state.rfqEvents.length,1);}
});
test('imports are atomic across valid and invalid events, and enforce sizes and explicit schema',()=>{
 const {state,rfq}=approved(),first=responseTemplate(state,rfq.id,at),second={...first,eventId:'SECOND',sequence:2,quantity:0};const before=JSON.stringify(state);assert.throws(()=>importSupplierResponses(state,JSON.stringify([first,second]),'json',at));assert.equal(JSON.stringify(state),before);
 assert.throws(()=>importSupplierResponses(state,'x'.repeat(100001),'json',at),/100 KB/);assert.throws(()=>importSupplierResponses(state,JSON.stringify(Array(101).fill(first)),'json',at),/1 to 100/);assert.throws(()=>importSupplierResponses(state,'[]','json',at),/1 to 100/);assert.throws(()=>importSupplierResponses(state,JSON.stringify(first),'xml',at),/format/);
 assert.throws(()=>importSupplierResponses(state,exportResponseCsv(first).replace('supplierId','suplierId'),'csv',at),/column/);assert.throws(()=>importSupplierResponses(state,'"unclosed','csv',at),/quote/);assert.throws(()=>importSupplierResponses(state,exportResponseCsv(first).replace('"accept"','"accept"bad'),'csv',at),/after/);
});
test('multirow CSV imports sequential events and rejects a bad later row atomically',()=>{
 const {state,rfq}=approved(),first=responseTemplate(state,rfq.id,at),second={...first,eventId:'SECOND',sequence:2,note:'Changed response'};const csv=exportResponseCsv(first)+exportResponseCsv(second).split('\r\n').slice(1).join('\r\n');assert.equal(importSupplierResponses(state,csv,'csv',at).imported,2);
 const fresh=approved();const badCsv=exportResponseCsv(first)+exportResponseCsv({...second,unit:'box'}).split('\r\n').slice(1).join('\r\n');assert.throws(()=>importSupplierResponses(fresh.state,badCsv,'csv',at));assert.equal(fresh.state.rfqEvents.length,0);
});
test('review records require a named human, note, action and ordered timestamp',()=>{
 const {state,rfq}=accepted();for(const patch of [{reviewer:''},{note:''},{action:'approve-order'}])assert.throws(()=>reviewRfqResponse(state,rfq.id,{...human,action:'acknowledge',...patch},at));assert.throws(()=>review(state,rfq.id,'acknowledge','2026-10-21T13:00:00Z'),/precede/);assert.equal(state.rfqReviews.length,0);
});
test('download packet captures timeline and escaped evidence without changing legacy packets',()=>{
 const {state,supplier,rfq}=accepted();reviewRfqResponse(state,rfq.id,{reviewer:'<b>Human</b>',note:'<script>alert(1)</script>',action:'hold'},at);const packet=buildRfqPacket(state,rfq.id,at);const html=rfqPacketHtml(packet);assert.equal(packet.timeline.length,3);assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>alert'));assert.ok(html.includes('Immutable RFQ snapshot'));assert.ok(html.includes('No supplier contact'));supplier.name='Changed name';assert.notEqual(packet.rfq.snapshot.supplier.name,supplier.name);
});

test('older human reviews and acknowledgements before the current buyer decision reject atomically',()=>{
 const {state,rfq,supplier}=accepted();review(state,rfq.id,'hold','2026-10-21T14:04:00Z');const before=JSON.stringify(state);assert.throws(()=>review(state,rfq.id,'acknowledge','2026-10-21T14:03:00Z'),/latest human review/);assert.equal(JSON.stringify(state),before);
 recordDecision(state,supplier.id,'hold',human.reviewer,'Current hold','2026-10-21T14:05:00Z');assert.throws(()=>review(state,rfq.id,'acknowledge','2026-10-21T14:04:00Z'),/current buyer decision/);assert.equal(getRfqState(state,rfq.id,later).reviewStatus,'stale');
});
test('failed response recording does not initialize absent old-workspace collections',()=>{
 const old=makeSeed(),before=JSON.stringify(old);assert.throws(()=>recordSupplierResponse(old,'MISSING',null,at),/not found/);assert.equal(JSON.stringify(old),before);
});
