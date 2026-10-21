import {SCHEMA_VERSION, snapshotKey} from './domain.js';
import {makeSeed} from './scenarios.js';
import {ensureRfqState, recordSupplierResponse} from './rfq.js';

// Validation preserves historical claims; it never grants or refreshes qualification.
export const WORKSPACE_LIMITS = Object.freeze({bytes:2*1024*1024,records:500,history:1000,string:16000});
const fail = message => {throw new Error(`Workspace: ${message}.`);};
const object = (v,p) => {if(!v||typeof v!=='object'||Array.isArray(v))fail(`${p} must be an object`);return v;};
const str = (v,p,{empty=false,max=WORKSPACE_LIMITS.string}={}) => {if(typeof v!=='string'||(!empty&&!v.trim())||v.length>max)fail(`${p} must be ${empty?'':'nonempty '}text of at most ${max} characters`);return v;};
const optionalText = (v,p,options={}) => {if(v!==undefined&&v!==null)str(v,p,{empty:true,...options});};
const integer = (v,p,min=1,max=Number.MAX_SAFE_INTEGER) => {if(!Number.isSafeInteger(v)||v<min||v>max)fail(`${p} must be a safe whole number from ${min} to ${max}`);};
const positive = (v,p,nullable=false) => {if(nullable&&v===null)return;if(typeof v!=='number'||!Number.isFinite(v)||v<=0)fail(`${p} must be a positive finite number${nullable?' or null':''}`);};
const bool = (v,p) => {if(typeof v!=='boolean')fail(`${p} must be true or false`);};
const choice = (v,allowed,p) => {if(!allowed.includes(v))fail(`${p} is unsupported`);};
const arr = (v,p,max=WORKSPACE_LIMITS.history) => {if(!Array.isArray(v)||v.length>max)fail(`${p} must be an array of at most ${max} records`);return v;};
const texts = (v,p,{max=100,nonempty=false}={}) => {arr(v,p,max).forEach((s,i)=>str(s,`${p}[${i}]`,{max:500}));if(nonempty&&!v.length)fail(`${p} cannot be empty`);};
const date = (v,p) => {if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)fail(`${p} must be a valid calendar date`);};
const instant = (v,p) => {if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,19)!==v.slice(0,19))fail(`${p} must be a valid UTC timestamp`);};
const optionalDate = (v,p) => {if(v!==undefined&&v!==null&&v!=='')date(v,p);};
const optionalInstant = (v,p) => {if(v!==undefined&&v!==null)instant(v,p);};
const same = (a,b) => {const sort=v=>Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;return JSON.stringify(sort(a))===JSON.stringify(sort(b));};
function idMap(records,p,field='id') {
 const result=new Map();for(const r of records){object(r,p);str(r[field],`${p}.${field}`,{max:250});if(result.has(r[field]))fail(`${p} has duplicate ${field} ${r[field]}`);result.set(r[field],r);}return result;
}
const ref = (map,id,p) => {str(id,p,{max:250});if(!map.has(id))fail(`${p} references a missing record`);return map.get(id);};
function boundedTree(value,depth=0) {
 if(depth>30)fail('nested data is too deep');
 if(typeof value==='string'){if(value.length>WORKSPACE_LIMITS.bytes)fail('text is too large');}
 else if(typeof value==='number'&&!Number.isFinite(value))fail('numbers must be finite');
 else if(value&&typeof value==='object'){
  if(Array.isArray(value)&&value.length>WORKSPACE_LIMITS.history)fail('nested array is too large');
  for(const [k,v] of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(k))fail('unsupported object key');boundedTree(v,depth+1);}
 }
}
function requirement(r,p) {
 object(r,p);for(const f of ['id','part','customer','process','material','qualification','drawingRevision','sourceId'])str(r[f],`${p}.${f}`,{max:500});
 // The existing fictional scenario family is retained through buyer edits.
 if(!/fictional/i.test(r.customer)&&!(/fictional/i.test(r.sourceNote??'')&&/^REQ-UAS-/.test(r.id)))fail(`${p} must identify a fictional request`);
 for(const f of ['story','sourceNote'])str(r[f],`${p}.${f}`,{empty:true});
 integer(r.revision,`${p}.revision`);positive(r.maxToleranceInches,`${p}.maxToleranceInches`);integer(r.quantity,`${p}.quantity`);
 bool(r.usManufacturingRequired,`${p}.usManufacturingRequired`);date(r.dueDate,`${p}.dueDate`);date(r.captured,`${p}.captured`);texts(r.checks,`${p}.checks`);
}
function capabilities(c,p) {
 object(c,p);texts(c.processes,`${p}.processes`,{nonempty:true});texts(c.materials,`${p}.materials`);positive(c.maxToleranceInches,`${p}.maxToleranceInches`,true);if(c.maxLotSize!==null)integer(c.maxLotSize,`${p}.maxLotSize`);
}
function site(s,p) {
 object(s,p);str(s.id,`${p}.id`,{max:250});str(s.city,`${p}.city`,{max:500});str(s.region,`${p}.region`,{empty:true,max:500});str(s.country,`${p}.country`,{empty:true,max:2});if(s.country&&!/^[A-Z]{2}$/.test(s.country))fail(`${p}.country must be a two-letter country code or empty`);
 choice(s.status,['reviewed','self-reported'],`${p}.status`);str(s.sourceRef,`${p}.sourceRef`);optionalText(s.reviewedBy,`${p}.reviewedBy`);optionalInstant(s.reviewedAt,`${p}.reviewedAt`);
 if(s.status==='reviewed')str(s.reviewedBy,`${p}.reviewedBy`);
}
const intakeFields=['name','city','region','country','processes','materials','tolerance','maxLotSize','sourceRef','sourceUrl','description'];
function fieldValues(v,p) {object(v,p);for(const [key,value] of Object.entries(v)){if(!intakeFields.includes(key))fail(`${p}.${key} is unsupported`);str(value,`${p}.${key}`,{empty:true});}}
function source(s,p) {
 object(s,p);str(s.id,`${p}.id`);str(s.label,`${p}.label`);date(s.observed,`${p}.observed`);
 if(s.url!==null&&s.url!==undefined){str(s.url,`${p}.url`);let url;try{url=new URL(s.url);}catch{fail(`${p}.url is invalid`);}if(!['http:','https:'].includes(url.protocol))fail(`${p}.url must use HTTP or HTTPS`);}
 optionalText(s.intakeText,`${p}.intakeText`,{max:12000});
 for(const key of ['intakeFields','confirmedFields'])if(s[key]!==undefined)fieldValues(s[key],`${p}.${key}`);
 if(s.intakeEvidence!==undefined)for(const e of arr(s.intakeEvidence,`${p}.intakeEvidence`,200)){object(e,p);choice(e.field,intakeFields,`${p}.intakeEvidence.field`);str(e.value,`${p}.intakeEvidence.value`);str(e.excerpt,`${p}.intakeEvidence.excerpt`);}
 if(s.corrections!==undefined)for(const c of arr(s.corrections,`${p}.corrections`,100)){object(c,p);choice(c.field,intakeFields,`${p}.corrections.field`);str(c.extracted,`${p}.corrections.extracted`,{empty:true});str(c.confirmed,`${p}.corrections.confirmed`,{empty:true});}
}
function evidence(records,siteId,p) {
 const map=idMap(arr(records,p,500),p);for(const e of records){for(const f of ['kind','sourceRef','note'])str(e[f],`${p}.${f}`,{empty:f==='note'});choice(e.status,['verified','expired','review'],`${p}.status`);if(e.siteId!==siteId)fail(`${p}.siteId does not match the supplier site`);bool(e.scopeConfirmed,`${p}.scopeConfirmed`);optionalText(e.verifiedBy,`${p}.verifiedBy`);optionalText(e.sourceLabel,`${p}.sourceLabel`);optionalDate(e.observed,`${p}.observed`);optionalDate(e.validFrom,`${p}.validFrom`);optionalDate(e.validUntil,`${p}.validUntil`);optionalInstant(e.reviewedAt,`${p}.reviewedAt`);if(e.status==='verified'){str(e.verifiedBy,`${p}.verifiedBy`);instant(e.reviewedAt,`${p}.reviewedAt`);date(e.validFrom,`${p}.validFrom`);date(e.validUntil,`${p}.validUntil`);}if(e.validFrom&&e.validUntil&&e.validFrom>e.validUntil)fail(`${p} validity dates are reversed`);if(e.supersededBy!==undefined){ref(map,e.supersededBy,`${p}.supersededBy`);if(e.supersededBy===e.id)fail(`${p} cannot supersede itself`);}}
}
function supplier(s,p) {
 object(s,p);if(s.synthetic!==true)fail(`${p} must be a synthetic demonstration supplier`);str(s.id,`${p}.id`,{max:250});str(s.name,`${p}.name`,{max:500});str(s.description,`${p}.description`,{empty:true});choice(s.recordType,['reviewed-demo','self-reported'],`${p}.recordType`);optionalInstant(s.createdAt,`${p}.createdAt`);site(s.site,`${p}.site`);capabilities(s.capabilities,`${p}.capabilities`);source(s.source,`${p}.source`);evidence(s.evidence,s.site.id,`${p}.evidence`);
}
function capturedKey(key,p,expected={}) {
 str(key,p,{max:WORKSPACE_LIMITS.bytes});let data;try{data=JSON.parse(key);}catch{fail(`${p} is not a valid captured snapshot`);}object(data,p);boundedTree(data);requirement(data.requirement,`${p}.requirement`);site(data.site,`${p}.site`);capabilities(data.capabilities,`${p}.capabilities`);source(data.source,`${p}.source`);evidence(data.evidence,data.site.id,`${p}.evidence`);
 if(expected.requirementId&&data.requirement.id!==expected.requirementId)fail(`${p} request reference disagrees`);if(expected.requirementRevision&&data.requirement.revision!==expected.requirementRevision)fail(`${p} request revision disagrees`);if(expected.siteId&&data.site.id!==expected.siteId)fail(`${p} site reference disagrees`);return data;
}
function decision(d,p,suppliers,requirements) {
 object(d,p);str(d.id,`${p}.id`,{max:250});const s=ref(suppliers,d.supplierId,`${p}.supplierId`);const req=ref(requirements,d.requirementId,`${p}.requirementId`);integer(d.requirementRevision,`${p}.requirementRevision`,1,req.revision);choice(d.action,['advance','hold'],`${p}.action`);str(d.reviewer,`${p}.reviewer`);str(d.note,`${p}.note`);instant(d.at,`${p}.at`);capturedKey(d.snapshotKey,`${p}.snapshotKey`,{...d,siteId:s.site.id});
}
function validate(state) {
 object(state,'root');boundedTree(state);if(state.schemaVersion!==SCHEMA_VERSION)fail('unsupported schemaVersion');
 for(const key of ['requirements','suppliers','decisions','followups','activity'])arr(state[key],key,['requirements','suppliers'].includes(key)?500:1000);
 if(!state.requirements.length||!state.suppliers.length)fail('requirements and suppliers cannot be empty');
 // Only absent RFQ collections migrate. Malformed collections are never repaired.
 ensureRfqState(state);for(const key of ['rfqs','rfqEvents','rfqReviews'])arr(state[key],key,key==='rfqs'?500:1000);
 const requirements=idMap(state.requirements,'requirements'),suppliers=idMap(state.suppliers,'suppliers');
 state.requirements.forEach((r,i)=>requirement(r,`requirements[${i}]`));state.suppliers.forEach((s,i)=>supplier(s,`suppliers[${i}]`));
 ref(requirements,state.selectedRequirementId,'selectedRequirementId');
 const decisions=idMap(state.decisions,'decisions');state.decisions.forEach((d,i)=>decision(d,`decisions[${i}]`,suppliers,requirements));
 idMap(state.followups,'followups');for(const f of state.followups){const s=ref(suppliers,f.supplierId,'followups.supplierId');ref(requirements,f.requirementId,'followups.requirementId');choice(f.status,['open','resolved'],'followups.status');str(f.requestedBy,'followups.requestedBy');str(f.note,'followups.note');instant(f.at,'followups.at');optionalInstant(f.resolvedAt,'followups.resolvedAt');if(f.status==='resolved'){instant(f.resolvedAt,'followups.resolvedAt');ref(new Map(s.evidence.map(e=>[e.id,e])),f.evidenceId,'followups.evidenceId');if(f.resolvedAt<f.at)fail('followup resolution precedes request');}}
 for(const a of state.activity){object(a,'activity');choice(a.type,['decision','requirement','followup','evidence','onboarding'],'activity.type');instant(a.at,'activity.at');str(a.actor,'activity.actor');str(a.text,'activity.text');if(a.supplierId!==undefined)ref(suppliers,a.supplierId,'activity.supplierId');if(a.requirementId!==undefined)ref(requirements,a.requirementId,'activity.requirementId');}
 const rfqs=idMap(state.rfqs,'rfqs'),lines=new Set();for(const q of state.rfqs){str(q.lineId,'rfqs.lineId',{max:250});if(lines.has(q.lineId))fail('duplicate RFQ lineId');lines.add(q.lineId);ref(suppliers,q.supplierId,'rfqs.supplierId');ref(requirements,q.requestId,'rfqs.requestId');integer(q.requestRevision,'rfqs.requestRevision');instant(q.createdAt,'rfqs.createdAt');str(q.createdBy,'rfqs.createdBy');str(q.note,'rfqs.note');if(q.unit!=='pcs')fail('RFQ unit must be pcs');object(q.snapshot,'rfqs.snapshot');requirement(q.snapshot.requirement,'rfqs.snapshot.requirement');supplier(q.snapshot.supplier,'rfqs.snapshot.supplier');const approval=ref(decisions,q.snapshot.approval?.id,'rfqs.snapshot.approval');if(!same(approval,q.snapshot.approval)||approval.action!=='advance'||approval.supplierId!==q.supplierId||approval.requirementId!==q.requestId||approval.requirementRevision!==q.requestRevision||Date.parse(approval.at)>Date.parse(q.createdAt))fail('RFQ captured approval is inconsistent');if(q.snapshot.requirement.id!==q.requestId||q.snapshot.requirement.revision!==q.requestRevision||q.snapshot.supplier.id!==q.supplierId||q.snapshotKey!==snapshotKey(q.snapshot.supplier,q.snapshot.requirement)||approval.snapshotKey!==q.snapshotKey)fail('RFQ snapshot references disagree');}
 const events=idMap(state.rfqEvents,'rfqEvents','eventId');const replay={rfqs:state.rfqs,rfqEvents:[],rfqReviews:[]};for(const event of state.rfqEvents){for(const key of ['eventId','actor','sourceRef','note'])str(event[key],`rfqEvents.${key}`,{max:key==='eventId'?250:WORKSPACE_LIMITS.string});ref(rfqs,event.rfqId,'rfqEvents.rfqId');const result=recordSupplierResponse(replay,event.rfqId,event,event.occurredAt);if(!same(result.event,event))fail('response derived delivery date is inconsistent');}
 idMap(state.rfqReviews,'rfqReviews');const lastReview=new Map();for(const r of state.rfqReviews){ref(rfqs,r.rfqId,'rfqReviews.rfqId');const event=ref(events,r.responseEventId,'rfqReviews.responseEventId');if(event.rfqId!==r.rfqId)fail('review response belongs to a different RFQ');choice(r.action,['acknowledge','hold'],'rfqReviews.action');str(r.reviewer,'rfqReviews.reviewer');str(r.note,'rfqReviews.note');instant(r.at,'rfqReviews.at');if(Date.parse(r.at)<Date.parse(event.occurredAt)||Date.parse(r.at)<(lastReview.get(r.rfqId)??0))fail('review time precedes its response or previous review');lastReview.set(r.rfqId,Date.parse(r.at));str(r.contextKey,'rfqReviews.contextKey',{max:WORKSPACE_LIMITS.bytes});let ctx;try{ctx=JSON.parse(r.contextKey);}catch{fail('review contextKey is invalid');}object(ctx,'review context');boundedTree(ctx);if(!same(ctx.response,event))fail('review captured response disagrees');bool(ctx.ready,'review context.ready');arr(ctx.exceptions,'review context.exceptions',100).forEach(x=>{object(x,'review exception');str(x.code,'review exception.code');str(x.message,'review exception.message');});if(ctx.currentKey!==null)capturedKey(ctx.currentKey,'review context.currentKey',{requirementId:event.requestId});if(ctx.approval!==null){object(ctx.approval,'review context.approval');choice(ctx.approval.status,['none','current','stale'],'review context.approval.status');if(ctx.approval.record!==null){decision(ctx.approval.record,'review captured approval',suppliers,requirements);const captured=ref(decisions,ctx.approval.record.id,'review captured approval.id');if(!same(captured,ctx.approval.record)||captured.supplierId!==event.supplierId||captured.requirementId!==event.requestId||Date.parse(captured.at)>Date.parse(r.at))fail('review captured approval reference disagrees');}}}
 return state;
}

export function parseWorkspace(text) {
 if(typeof text!=='string'||text.length>WORKSPACE_LIMITS.bytes||new TextEncoder().encode(text).length>WORKSPACE_LIMITS.bytes)fail('JSON must be text of at most 2 MiB');
 let state;try{state=JSON.parse(text);}catch{fail('JSON could not be read');}return validate(state);
}
export function serializeWorkspace(state) {
 // Parse a copy: validation and legacy migration cannot mutate the live workspace.
 const copy=parseWorkspace(JSON.stringify(state));const text=JSON.stringify({...copy,notice:'Synthetic Forgepath workspace. Fictional records only; no supplier contact or purchase commitment.',exportedAt:new Date().toISOString()},null,2);if(new TextEncoder().encode(text).length>WORKSPACE_LIMITS.bytes)fail('export exceeds the 2 MiB workspace limit');return text;
}
export function previewRestore(text) {
 const state=parseWorkspace(text);return {state,summary:{suppliers:state.suppliers.length,requirements:state.requirements.length,rfqs:state.rfqs.length,responses:state.rfqEvents.length,reviews:state.rfqReviews.length}};
}
const fresh = () => ensureRfqState(makeSeed());
export function loadWorkspace(storage,key) {
 let text;try{text=storage.getItem(key);}catch{return {state:fresh(),status:'memory',message:'Device storage could not be read. This session is in memory; export your workspace to keep changes.'};}
 if(text===null)return {state:fresh(),status:'fresh',message:''};
 try{return {state:parseWorkspace(text),status:'saved',message:''};}catch(error){return {state:fresh(),status:'recovered',message:`Saved workspace could not be loaded. ${error.message} The original remains on this device; export a recovery copy before replacing it.`,recoverableText:text};}
}
export function saveWorkspace(storage,key,state) {
 try{const text=serializeWorkspace(state);storage.setItem(key,text);return {ok:true,message:''};}catch(error){return {ok:false,message:`Workspace could not be saved on this device. Export your workspace to keep this session. ${error.message}`};}
}
