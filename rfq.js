import {activeRequirement,decisionState,scoreSupplier,snapshotKey,day,escapeHtml} from './domain.js';

export const RESPONSE_SCHEMA = 'forgepath.rfq-response.v1';
const fields = ['schemaVersion','eventId','rfqId','lineId','requestId','requestRevision','supplierId','sequence','status','quantity','unit','deliveryDate','leadTimeDays','actor','sourceRef','occurredAt','note'];
const now = () => new Date().toISOString();
const clone = value => structuredClone(value);
const stable = value => JSON.stringify(sort(value));
function sort(value) {return Array.isArray(value)?value.map(sort):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,sort(value[k])])):value;}
const text = (value,label) => {if(typeof value!=='string'||!value.trim())throw new Error(`${label} is required.`);return value.trim();};
function instant(value,label='Timestamp') {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,19)!==value.slice(0,19))throw new Error(`${label} must be a valid UTC ISO timestamp.`);
  return value;
}
const validDay = value => typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const freeze = value => {if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
function validateRfqState(state) {
  if(!state||typeof state!=='object')throw new Error('Workspace is required.');
  for(const key of ['rfqs','rfqEvents','rfqReviews'])if(Object.hasOwn(state,key)&&!Array.isArray(state[key]))throw new Error(`Malformed workspace: ${key} must be an array.`);
}
export function ensureRfqState(state) {
  validateRfqState(state);
  for(const key of ['rfqs','rfqEvents','rfqReviews'])if(!Object.hasOwn(state,key))state[key]=[];
  return state;
}
function findRfq(state,id) {validateRfqState(state);const rfq=(state.rfqs??[]).find(r=>r.id===id);if(!rfq)throw new Error('RFQ not found.');return rfq;}
const eventsFor = (state,id) => (state.rfqEvents??[]).filter(e=>e.rfqId===id);
function context(state,rfq,at) {
  const requirement=state.requirements.find(r=>r.id===rfq.requestId),supplier=state.suppliers.find(s=>s.id===rfq.supplierId);
  const decision=requirement&&supplier?decisionState(state,supplier,requirement,day(at)):null;
  const fit=requirement&&supplier?scoreSupplier(supplier,requirement,day(at)):null;
  const currentKey=requirement&&supplier?snapshotKey(supplier,requirement):null;
  const approvalCurrent=currentKey===rfq.snapshotKey&&decision?.status==='current'&&decision.record?.action==='advance'&&stable(decision.record)===stable(rfq.snapshot.approval)&&Boolean(fit?.ready);
  return {requirement,supplier,decision,fit,currentKey,approvalCurrent};
}
export function createRfq(state,supplierId,input,at=now()) {
  instant(at);const reviewer=text(input?.reviewer,'Reviewer'),note=text(input?.note,'RFQ note');
  const req=activeRequirement(state),supplier=state.suppliers.find(s=>s.id===supplierId);
  if(!req||!supplier)throw new Error('Supplier or request not found.');
  const decision=decisionState(state,supplier,req,day(at));
  if(decision.status!=='current'||decision.record?.action!=='advance'||!scoreSupplier(supplier,req,day(at)).ready||!decision.record.reviewer?.trim())throw new Error('A current named human advance decision and every required check are required.');
  if(Date.parse(decision.record.at)>Date.parse(at))throw new Error('RFQ creation cannot precede approval.');
  ensureRfqState(state);const key=snapshotKey(supplier,req);
  const previous=state.rfqs.find(r=>r.snapshotKey===key&&stable(r.snapshot.approval)===stable(decision.record));if(previous)return previous;
  const id=`RFQ-${state.rfqs.length+1}-${Date.parse(at)}`;
  const rfq={id,lineId:`${id}-L1`,requestId:req.id,requestRevision:req.revision,supplierId,createdAt:at,createdBy:reviewer,note,unit:'pcs',snapshotKey:key,snapshot:freeze(clone({requirement:req,supplier,approval:decision.record}))};
  state.rfqs.push(rfq);return rfq;
}
export function getRfqState(state,rfqId,at=now()) {
  instant(at);const rfq=findRfq(state,rfqId),ctx=context(state,rfq,at),events=eventsFor(state,rfqId),latestResponse=events.at(-1)??null,exceptions=[];
  const add=(code,message)=>exceptions.push({code,message});
  if(!ctx.requirement)add('request_missing','The current request is missing.');
  else if(stable(ctx.requirement)!==stable(rfq.snapshot.requirement))add('requirement_changed','The request changed after RFQ creation; fresh approval and a new RFQ are required.');
  if(!ctx.supplier)add('supplier_missing','The current supplier is missing.');
  else for(const [field,code,label] of [['capabilities','capability_changed','Capabilities'],['evidence','evidence_changed','Qualification evidence'],['site','site_changed','Manufacturing site'],['source','source_changed','Supplier provenance']])if(stable(ctx.supplier[field])!==stable(rfq.snapshot.supplier[field]))add(code,`${label} changed after RFQ creation.`);
  if(!ctx.approvalCurrent)add('approval_stale','The captured RFQ approval is no longer current; response review cannot restore it.');
  if(ctx.fit&&!ctx.fit.ready)add('gates_failed',`Current required checks fail: ${ctx.fit.gaps.join('; ')}.`);
  if(latestResponse) {
    if(latestResponse.status==='decline')add('supplier_declined','The supplier declined this RFQ.');
    if(latestResponse.status==='clarification')add('clarification_requested','The supplier requested clarification.');
    if(latestResponse.status==='accept'&&latestResponse.quantity!==rfq.snapshot.requirement.quantity)add(latestResponse.quantity<rfq.snapshot.requirement.quantity?'quantity_shortfall':'quantity_mismatch',`The response quantity is ${latestResponse.quantity<rfq.snapshot.requirement.quantity?'below':'above'} the requested quantity.`);
    if(latestResponse.deliveryDate&&latestResponse.deliveryDate>rfq.snapshot.requirement.dueDate)add('delivery_late','The response delivery date is later than the requested date.');
    const prev=events.at(-2);
    if(prev&&['status','quantity','deliveryDate'].some(k=>latestResponse[k]!==prev[k]))add('response_changed','The latest supplier response changed status, quantity or delivery date; named human review is required.');
  }
  const contextKey=stable({currentKey:ctx.currentKey,approval:ctx.decision,ready:ctx.fit?.ready??false,response:latestResponse,exceptions});
  const review=[...(state.rfqReviews??[])].reverse().find(r=>r.rfqId===rfqId)??null;
  const reviewStatus=!latestResponse?'waiting':!review?'pending':review.contextKey!==contextKey?'stale':review.action==='hold'?'held':'acknowledged';
  return {rfq,latestResponse,approvalCurrent:ctx.approvalCurrent,exceptions,review,reviewStatus,canRespond:true,contextKey};
}
export function responseTemplate(state,rfqId,at=now()) {
  instant(at);const rfq=findRfq(state,rfqId),sequence=eventsFor(state,rfqId).length+1;
  return {schemaVersion:RESPONSE_SCHEMA,eventId:`${rfqId}-RESPONSE-${sequence}`,rfqId,lineId:rfq.lineId,requestId:rfq.requestId,requestRevision:rfq.requestRevision,supplierId:rfq.supplierId,sequence,status:'accept',quantity:rfq.snapshot.requirement.quantity,unit:'pcs',deliveryDate:rfq.snapshot.requirement.dueDate,leadTimeDays:null,actor:'Jordan Lee',sourceRef:'RR-QUOTE-104',occurredAt:at,note:'200 landing-gear clevises for buyer review; pricing and first-article plan to follow.'};
}
function validateResponse(state,rfq,input,receivedAt) {
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('A response object is required.');
  for(const key of Object.keys(input))if(!fields.includes(key))throw new Error(`Unknown response field: ${key}.`);
  for(const key of fields)if(!Object.hasOwn(input,key))throw new Error(`Missing response field: ${key}.`);
  const event=clone(input);
  if(event.schemaVersion!==RESPONSE_SCHEMA)throw new Error('Unsupported response schemaVersion.');
  for(const key of ['eventId','actor','sourceRef','note'])event[key]=text(event[key],key);
  for(const key of ['rfqId','lineId','requestId','requestRevision','supplierId'])if(event[key]!==rfq[key==='rfqId'?'id':key])throw new Error(`Response ${key} does not match the RFQ snapshot.`);
  if(event.unit!=='pcs')throw new Error('Response unit must be pcs.');
  if(!Number.isSafeInteger(event.sequence)||event.sequence<1)throw new Error('Response sequence must be a positive integer.');
  if(!['accept','decline','clarification'].includes(event.status))throw new Error('Unknown response status.');
  if(event.quantity!==null&&(!Number.isSafeInteger(event.quantity)||event.quantity<=0))throw new Error('Quantity must be a positive integer or null.');
  if(event.leadTimeDays!==null&&(!Number.isSafeInteger(event.leadTimeDays)||event.leadTimeDays<0||event.leadTimeDays>36500))throw new Error('Lead time must be a whole calendar-day count from 0 to 36500, or null.');
  if(event.deliveryDate!==null&&!validDay(event.deliveryDate))throw new Error('Delivery date must be a valid calendar date or null.');
  instant(event.occurredAt,'Response occurredAt');
  const occurred=Date.parse(event.occurredAt);
  if(occurred<Date.parse(rfq.createdAt)||occurred>Date.parse(receivedAt))throw new Error('Response time must be between RFQ creation and receipt.');
  if(event.leadTimeDays!==null) {
    const expected=new Date(Date.parse(`${day(event.occurredAt)}T00:00:00Z`)+event.leadTimeDays*86400000).toISOString().slice(0,10);
    if(event.deliveryDate!==null&&event.deliveryDate!==expected)throw new Error('Delivery date and calendar-day lead time disagree.');event.deliveryDate=expected;
  }
  if(event.status==='accept'&&(event.quantity===null||event.deliveryDate===null))throw new Error('Accept responses require quantity and a delivery date or lead time.');
  if(event.deliveryDate&&event.deliveryDate<day(event.occurredAt))throw new Error('Delivery date cannot precede the response date.');
  return event;
}
export function recordSupplierResponse(state,rfqId,input,at=now()) {
  instant(at);const rfq=findRfq(state,rfqId),event=validateResponse(state,rfq,input,at);
  const previousId=(state.rfqEvents??[]).find(e=>e.eventId===event.eventId);
  if(previousId){if(stable(previousId)!==stable(event))throw new Error('Conflicting duplicate eventId.');return {event:previousId,duplicate:true};}
  const prior=eventsFor(state,rfqId).at(-1);
  if(event.sequence!==(prior?.sequence??0)+1)throw new Error('Response sequence must be the next number without gaps.');
  if(prior&&Date.parse(event.occurredAt)<Date.parse(prior.occurredAt))throw new Error('Response occurredAt is out of order.');
  ensureRfqState(state);state.rfqEvents.push(event);return {event,duplicate:false};
}
export function reviewRfqResponse(state,rfqId,input,at=now()) {
  instant(at);const reviewer=text(input?.reviewer,'Reviewer'),note=text(input?.note,'Review note');
  if(!['acknowledge','hold'].includes(input?.action))throw new Error('Review action must be acknowledge or hold.');
  const current=getRfqState(state,rfqId,at);if(!current.latestResponse)throw new Error('A supplier response is required before human review.');
  if(Date.parse(at)<Date.parse(current.latestResponse.occurredAt))throw new Error('Review cannot precede the latest response.');
  const previousReview=[...(state.rfqReviews??[])].reverse().find(r=>r.rfqId===rfqId);
  const currentDecision=context(state,current.rfq,at).decision?.record;
  if([previousReview?.at,currentDecision?.at].filter(Boolean).some(time=>Date.parse(at)<Date.parse(time)))throw new Error('Review cannot precede the latest human review or current buyer decision.');
  ensureRfqState(state);
  const review={id:`RFQ-REVIEW-${state.rfqReviews.length+1}-${Date.parse(at)}`,rfqId,responseEventId:current.latestResponse.eventId,action:input.action,reviewer,note,at,contextKey:current.contextKey};
  state.rfqReviews.push(review);return review;
}
export function exportResponseCsv(event) {
  const cell=value=>`"${String(value??'').replace(/"/g,'""')}"`;
  return `${fields.join(',')}\r\n${fields.map(key=>cell(event[key])).join(',')}\r\n`;
}
function parseCsv(input) {
  const rows=[];let row=[],value='',quoted=false,closed=false;
  const pushCell=()=>{row.push(value);value='';closed=false;};
  for(let i=0;i<input.length;i++) {
    const c=input[i];
    if(quoted){if(c==='"'){if(input[i+1]==='"'){value+='"';i++;}else{quoted=false;closed=true;}}else value+=c;continue;}
    if(c==='"'){if(value||closed)throw new Error('Malformed CSV quoting.');quoted=true;}
    else if(c===',')pushCell();
    else if(c==='\n'||c==='\r'){if(c==='\r'&&input[i+1]==='\n')i++;pushCell();if(row.some(v=>v!==''))rows.push(row);row=[];}
    else {if(closed)throw new Error('Unexpected text after a CSV quote.');value+=c;}
  }
  if(quoted)throw new Error('Unclosed CSV quote.');pushCell();if(row.some(v=>v!==''))rows.push(row);
  const header=rows.shift();if(!header||header.length!==fields.length||new Set(header).size!==fields.length||header.some(k=>!fields.includes(k)))throw new Error('CSV must contain each response v1 column exactly once.');
  return rows.map(row=>{if(row.length!==header.length)throw new Error('CSV row has the wrong number of columns.');const result=Object.fromEntries(header.map((key,i)=>[key,row[i]]));for(const key of ['requestRevision','sequence','quantity','leadTimeDays']){if(result[key]===''&&['quantity','leadTimeDays'].includes(key))result[key]=null;else {if(!/^\d+$/.test(result[key]))throw new Error(`Invalid CSV integer: ${key}.`);result[key]=Number(result[key]);}}if(result.deliveryDate==='')result.deliveryDate=null;return result;});
}
export function importSupplierResponses(state,input,format,at=now()) {
  instant(at);if(typeof input!=='string'||new TextEncoder().encode(input).length>100000)throw new Error('Response import must be text of at most 100 KB.');
  let records;if(format==='csv')records=parseCsv(input);else if(format==='json'){const parsed=JSON.parse(input);records=Array.isArray(parsed)?parsed:[parsed];}else throw new Error('Response format must be json or csv.');
  if(!records.length||records.length>100)throw new Error('Import must contain 1 to 100 response events.');
  const draft=clone(state);ensureRfqState(draft);let imported=0,duplicates=0;const events=[];
  for(const record of records){const result=recordSupplierResponse(draft,record?.rfqId,record,at);events.push(result.event);result.duplicate?duplicates++:imported++;}
  // Commit only after the complete batch validates; preserve existing records and histories.
  ensureRfqState(state);state.rfqEvents.push(...draft.rfqEvents.slice(state.rfqEvents.length));
  return {imported,duplicates,events};
}
export function buildRfqPacket(state,rfqId,at=now()) {
  const status=getRfqState(state,rfqId,at),rfq=status.rfq;
  return clone({schemaVersion:'forgepath.rfq-packet.v1',generatedAt:at,notice:'Sample project: illustrative companies, people and records. No supplier contact, purchase order or commercial commitment. Named reviews preserve exceptions and approval history.',rfq,latestResponse:status.latestResponse,approvalCurrent:status.approvalCurrent,exceptions:status.exceptions,review:status.review,reviewStatus:status.reviewStatus,timeline:[{type:'created',at:rfq.createdAt,actor:rfq.createdBy,note:rfq.note},...eventsFor(state,rfqId).map(event=>({type:'supplier-response',...event})),...(state.rfqReviews??[]).filter(r=>r.rfqId===rfqId).map(review=>({type:'human-review',...review}))].sort((a,b)=>Date.parse(a.at??a.occurredAt)-Date.parse(b.at??b.occurredAt))});
}
export function rfqPacketHtml(packet) {
  const e=escapeHtml,r=packet.rfq,s=r.snapshot,response=packet.latestResponse,review=packet.review;
  const row=(label,requested,offered)=>`<tr><th>${e(label)}</th><td>${e(requested)}</td><td>${e(offered??'Not supplied')}</td></tr>`;
  const timeline=packet.timeline.map(item=>`<li><b>${e(item.type)} · ${e(item.at??item.occurredAt)}</b><br>${e(item.actor??item.reviewer)}${item.sequence?` · response ${e(item.sequence)} · ${e(item.status)} · source ${e(item.sourceRef)}`:''}${item.action?` · ${e(item.action)}`:''}<br>${e(item.note)}</li>`).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Forgepath RFQ response review</title><style>body{font:15px/1.6 system-ui;max-width:900px;margin:40px auto;padding:20px;color:#172b35}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#edf3f3;padding:16px}li{margin:12px 0}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbcbd0;padding:10px;text-align:left;vertical-align:top}.notice{background:#edf3f3;padding:16px}summary{cursor:pointer}@media print{body{margin:0}}</style><h1>Forgepath · RFQ response review</h1><p class="notice">${e(packet.notice)}</p><h2>${e(r.id)} · ${e(s.supplier.name)}</h2><p>${e(s.requirement.customer)} · ${e(s.requirement.part)}<br>Request ${e(r.requestId)} revision ${e(r.requestRevision)} · drawing ${e(s.requirement.drawingRevision)} · line ${e(r.lineId)}</p><p>Created ${e(r.createdAt)} by ${e(r.createdBy)}<br>${e(r.note)}</p><h2>Request and latest supplier response</h2><p>${response?`Response ${e(response.sequence)} · ${e(response.status)} · ${e(response.occurredAt)}<br>${e(response.actor)} · source ${e(response.sourceRef)}<br>${e(response.note)}`:'Waiting for a supplier response; no delivery has been accepted.'}</p><table><thead><tr><th>Line detail</th><th>Captured request</th><th>Latest supplier response</th></tr></thead><tbody>${row('Quantity',`${s.requirement.quantity} pcs`,response?.quantity==null?null:`${response.quantity} pcs`)}${row('Delivery date',s.requirement.dueDate,response?.deliveryDate)}${row('Calendar-day lead time','Supplier to state',response?.leadTimeDays)}${row('Process / material',`${s.requirement.process} / ${s.requirement.material}`,'Captured RFQ scope; response does not revise technical requirements')}${row('Qualification',s.requirement.qualification,'Current eligibility is checked separately below')}</tbody></table><h2>Approval and exceptions</h2><p>Captured approval: ${e(s.approval.reviewer)} · ${e(s.approval.at)}<br>${e(s.approval.note)}<br><b>Approval ${packet.approvalCurrent?'current':'stale'}</b></p><ul>${packet.exceptions.map(x=>`<li><b>${e(x.code)}</b>: ${e(x.message)}</li>`).join('')||`<li>No detected exceptions. ${['acknowledged','held'].includes(packet.reviewStatus)?'Named human review is recorded; no order is authorized.':'Named human review is required for the current response and context.'}</li>`}</ul><h2>Human review · ${e(packet.reviewStatus)}</h2><p>${review?`${e(review.reviewer)} · ${e(review.action)} · ${e(review.at)}<br>${e(review.note)}<br>Reviewed response ${e(review.responseEventId)}. ${packet.reviewStatus==='stale'?'This review applies to an earlier response or context.':''}`:'No named human review recorded.'}</p><p>Acknowledgement records review only. It does not resolve mismatches, restore stale approval, or authorize an order.</p><h2>Audit timeline</h2><ol>${timeline}</ol><details><summary>Immutable RFQ snapshot and provenance appendix</summary><pre>${e(JSON.stringify(s,null,2))}</pre></details></html>`;
}
