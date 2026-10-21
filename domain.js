export const SCHEMA_VERSION = 3;
export const WEIGHTS = {process:35, material:25, tolerance:20, quantity:10, qualification:10};
const aliases = new Map([
  ['cnc mill','CNC milling'],['milling','CNC milling'],['cnc milling','CNC milling'],
  ['cnc turn','CNC turning'],['turning','CNC turning'],['cnc turning','CNC turning'],
  ['5 axis milling','5-axis milling'],['5-axis cnc milling','5-axis milling'],['5 axis cnc milling','5-axis milling'],['5-axis milling','5-axis milling'],
  ['6061','Aluminum 6061'],['6061 aluminum','Aluminum 6061'],['aluminium 6061','Aluminum 6061'],['aluminum 6061','Aluminum 6061'],
  ['7075','Aluminum 7075'],['7075 aluminum','Aluminum 7075'],['aluminum 7075','Aluminum 7075'],
  ['pom','Acetal'],['delrin','Acetal'],['acetal','Acetal'],['iso9001','ISO 9001:2015'],['iso 9001','ISO 9001:2015'],['iso 9001:2015','ISO 9001:2015'],['as9100','AS9100D'],['as9100d','AS9100D']
]);
export const canonical = value => aliases.get(String(value??'').trim().toLowerCase().replace(/\s+/g,' ')) ?? String(value??'').trim().replace(/\s+/g,' ');
const key = value => canonical(value).toLowerCase();
export const values = value => [...new Set((Array.isArray(value)?value:String(value??'').split(/[,;\n]/)).map(canonical).filter(Boolean))];
export const escapeHtml = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const day = (at=new Date().toISOString()) => at.slice(0,10);
const isDay = v => /^\d{4}-\d{2}-\d{2}$/.test(v??'') && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10)===v;
export function safeUrl(value) {try {const u=new URL(value);return u.protocol==='https:'||u.protocol==='http:'?u.href:null;}catch{return null;}}
function number(value, label, {optional=false,integer=false}={}) {
  if(optional && (value==='' || value==null))return null;
  const n=Number(value);if(!Number.isFinite(n)||n<=0||(integer&&!Number.isInteger(n)))throw new Error(`${label} must be a positive ${integer?'whole number':'number'}.`);return n;
}
export function validateRequirement(input) {
  const r={...input};
  for(const f of ['part','customer','process','material','qualification','drawingRevision'])if(!String(r[f]??'').trim())throw new Error(`${f} is required.`);
  r.process=canonical(r.process);r.material=canonical(r.material);r.qualification=canonical(r.qualification);
  r.maxToleranceInches=number(r.maxToleranceInches,'Tolerance');r.quantity=number(r.quantity,'Quantity',{integer:true});
  if(!isDay(r.dueDate))throw new Error('A valid requested delivery date is required.');return r;
}
export function qualificationState(supplier,requirement,asOf=day()) {
  const records=supplier.evidence.filter(e=>key(e.kind)===key(requirement.qualification)&&!e.supersededBy);
  const eligible=records.filter(e=>e.status==='verified'&&e.scopeConfirmed&&e.verifiedBy&&e.sourceRef&&e.siteId===supplier.site.id&&isDay(e.validFrom)&&isDay(e.validUntil)&&e.validFrom<=asOf&&e.validUntil>=asOf);
  if(eligible.length)return {status:'pass',record:eligible.sort((a,b)=>b.reviewedAt.localeCompare(a.reviewedAt))[0],reason:'Current evidence reviewed for the stated site and scope'};
  const expired=records.some(e=>e.status==='expired'||(isDay(e.validUntil)&&e.validUntil<asOf));
  return {status:'fail',record:records.at(-1)??null,reason:expired?'Required qualification evidence has expired':'Required qualification needs current, scoped human review'};
}
export function scoreSupplier(supplier,requirement,asOf=day()) {
  const c=supplier.capabilities;const q=qualificationState(supplier,requirement,asOf);
  const checks=[
    {key:'process',label:'Process',pass:c.processes.some(p=>key(p)===key(requirement.process)),required:requirement.process,actual:c.processes.join(', ')||'Unknown'},
    {key:'material',label:'Material',pass:c.materials.some(m=>key(m)===key(requirement.material)),required:requirement.material,actual:c.materials.join(', ')||'Unknown'},
    {key:'tolerance',label:'Tolerance',pass:Number.isFinite(c.maxToleranceInches)&&c.maxToleranceInches>0&&c.maxToleranceInches<=requirement.maxToleranceInches,required:`±${requirement.maxToleranceInches} in or tighter`,actual:c.maxToleranceInches?`±${c.maxToleranceInches} in`:'Unknown'},
    {key:'quantity',label:'Lot capacity',pass:Number.isInteger(c.maxLotSize)&&c.maxLotSize>=requirement.quantity,required:`${requirement.quantity} pieces`,actual:c.maxLotSize?`${c.maxLotSize} pieces`:'Unknown'},
    {key:'qualification',label:'Qualification',pass:q.status==='pass',required:requirement.qualification,actual:q.reason},
    {key:'domestic',label:'Manufacturing site',pass:!requirement.usManufacturingRequired||(supplier.site.country==='US'&&supplier.site.status==='reviewed'&&Boolean(supplier.site.sourceRef)&&Boolean(supplier.site.reviewedBy)),required:requirement.usManufacturingRequired?'Reviewed U.S. manufacturing-site declaration':'No country restriction',actual:`${supplier.site.city}, ${supplier.site.region} · ${supplier.site.country} · ${supplier.site.status}`}
  ];
  const parts=Object.fromEntries(checks.filter(c=>WEIGHTS[c.key]).map(c=>[c.key,c.pass?WEIGHTS[c.key]:0]));
  const score=Object.values(parts).reduce((a,b)=>a+b,0);const blockers=checks.filter(c=>!c.pass);
  return {score,parts,checks,blockers,gaps:blockers.map(c=>`${c.label}: ${c.actual}`),hardStop:blockers.length>0,qualificationVerified:q.status==='pass',ready:blockers.length===0,disposition:blockers.length?'Follow-up required':'Ready for human review'};
}
export const canAdvance = match => match.ready===true;
function stable(value) {if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));return value;}
export const snapshotKey = (supplier,requirement) => JSON.stringify(stable({requirement,capabilities:supplier.capabilities,evidence:supplier.evidence,site:supplier.site,source:supplier.source}));
export const activeRequirement = state => state.requirements.find(r=>r.id===state.selectedRequirementId);
export function decisionState(state,supplier,requirement=activeRequirement(state),asOf=day()) {
  const record=[...state.decisions].reverse().find(d=>d.supplierId===supplier.id&&d.requirementId===requirement.id);
  if(!record)return {status:'none',record:null};
  const current=record.snapshotKey===snapshotKey(supplier,requirement);
  const stillEligible=record.action!=='advance'||scoreSupplier(supplier,requirement,asOf).ready;
  return {status:current&&stillEligible?'current':'stale',record};
}
export function recordDecision(state,supplierId,action,reviewer,note,at=new Date().toISOString()) {
  if(!['advance','hold'].includes(action))throw new Error('Unknown review action.');
  if(!reviewer.trim()||!note.trim())throw new Error('Reviewer name and decision note are required.');
  const supplier=state.suppliers.find(s=>s.id===supplierId),req=activeRequirement(state);
  if(!supplier||!req)throw new Error('Supplier or request not found.');
  if(action==='advance'&&!canAdvance(scoreSupplier(supplier,req,day(at))))throw new Error('Resolve every required check before approving RFQ review.');
  const record={id:`DEC-${state.decisions.length+1}-${at}`,supplierId,requirementId:req.id,requirementRevision:req.revision,action,reviewer:reviewer.trim(),note:note.trim(),at,snapshotKey:snapshotKey(supplier,req)};
  state.decisions.push(record);state.activity.push({type:'decision',supplierId,requirementId:req.id,at,actor:record.reviewer,text:`${action==='advance'?'Approved for RFQ drafting':'Held for follow-up'}: ${record.note}`});return record;
}
export function updateRequirement(state,input,at=new Date().toISOString()) {
  const current=activeRequirement(state),next=validateRequirement({...current,...input,revision:current.revision+1});
  state.requirements[state.requirements.findIndex(r=>r.id===current.id)]=next;
  state.activity.push({type:'requirement',requirementId:current.id,at,actor:'Demo operator',text:`Requirement updated to revision ${next.revision}; previous decisions require fresh review.`});return next;
}
export function requestFollowup(state,supplierId,reviewer,note,at=new Date().toISOString()) {
  if(!reviewer.trim()||!note.trim())throw new Error('Reviewer name and requested information are required.');
  const req=activeRequirement(state);const previous=state.followups.find(f=>f.supplierId===supplierId&&f.requirementId===req.id&&f.status==='open');
  if(previous)return previous;
  const record={id:`FUP-${state.followups.length+1}`,supplierId,requirementId:req.id,status:'open',requestedBy:reviewer.trim(),note:note.trim(),at};
  state.followups.push(record);state.activity.push({type:'followup',supplierId,requirementId:req.id,at,actor:record.requestedBy,text:`Evidence follow-up opened: ${record.note}`});return record;
}
export function reviewEvidence(state,supplierId,input,at=new Date().toISOString()) {
  const supplier=state.suppliers.find(s=>s.id===supplierId),req=activeRequirement(state);
  if(!supplier)throw new Error('Supplier not found.');
  if(!input.reviewer?.trim()||!input.sourceRef?.trim()||!input.note?.trim())throw new Error('Reviewer, evidence reference and review note are required.');
  if(!input.scopeConfirmed)throw new Error('Confirm the required qualification scope and site.');
  if(!isDay(input.validFrom)||!isDay(input.validUntil)||input.validFrom>day(at)||input.validUntil<day(at)||input.validFrom>input.validUntil)throw new Error('Evidence validity must include the review date.');
  if(input.siteConfirmed&&supplier.site.country!=='US')throw new Error('A non-U.S. site cannot be reviewed as a U.S. manufacturing site.');
  const record={id:`EVD-${supplierId}-${supplier.evidence.length+1}-${at}`,kind:req.qualification,status:'verified',siteId:supplier.site.id,sourceRef:input.sourceRef.trim(),sourceLabel:'Synthetic qualification review packet',validFrom:input.validFrom,validUntil:input.validUntil,observed:day(at),reviewedAt:at,verifiedBy:input.reviewer.trim(),scopeConfirmed:true,note:input.note.trim()};
  for(const e of supplier.evidence)if(key(e.kind)===key(req.qualification)&&!e.supersededBy)e.supersededBy=record.id;
  supplier.evidence.push(record);
  if(input.siteConfirmed){supplier.site.status='reviewed';supplier.site.sourceRef=input.sourceRef.trim();supplier.site.reviewedBy=input.reviewer.trim();supplier.site.reviewedAt=at;}
  for(const f of state.followups)if(f.supplierId===supplierId&&f.status==='open'){
    const target=state.requirements.find(r=>r.id===f.requirementId);
    if(target&&scoreSupplier(supplier,target,day(at)).ready){f.status='resolved';f.resolvedAt=at;f.evidenceId=record.id;}
  }
  state.activity.push({type:'evidence',supplierId,requirementId:req.id,at,actor:input.reviewer.trim(),text:`Reviewed ${record.kind}, reference ${record.sourceRef}; earlier evidence preserved and superseded.`});return record;
}
export function parseCapabilityCard(text) {
  const fields={};const map={name:'name',manufacturer:'name',location:'location',city:'city',state:'region',region:'region',country:'country',processes:'processes',materials:'materials',tolerance:'tolerance',capacity:'maxLotSize','lot capacity':'maxLotSize',source:'sourceRef',url:'sourceUrl',description:'description'};
  for(const line of text.split('\n')){const i=line.indexOf(':');if(i<0)continue;const field=map[line.slice(0,i).trim().toLowerCase()];if(field)fields[field]=line.slice(i+1).trim();}
  if(fields.location){const [city,region]=fields.location.split(',').map(s=>s.trim());fields.city??=city;fields.region??=region;}
  return fields;
}
export function onboardSupplier(state,input,at=new Date().toISOString()) {
  if(!input.name?.trim()||!input.city?.trim())throw new Error('Manufacturer name and city are required.');
  const processes=values(input.processes);if(!processes.length)throw new Error('Add at least one manufacturing process.');
  if(input.sourceUrl&&!safeUrl(input.sourceUrl))throw new Error('Source link must be an HTTP or HTTPS URL.');
  const country=String(input.country??'US').toUpperCase().trim();if(!/^[A-Z]{2}$/.test(country))throw new Error('Use a two-letter country code.');
  const id=`SUP-LOCAL-${state.suppliers.length+1}-${Date.parse(at)}`;
  const record={id,name:input.name.trim(),description:input.description?.trim()??'',recordType:'self-reported',synthetic:true,createdAt:at,
    site:{id:`SITE-${id}`,city:input.city.trim(),region:input.region?.trim()??'',country,status:'self-reported',sourceRef:input.sourceRef?.trim()||'LOCAL-CAPABILITY-INTAKE',reviewedBy:null},
    capabilities:{processes,materials:values(input.materials),maxToleranceInches:number(input.tolerance,'Tolerance',{optional:true}),maxLotSize:number(input.maxLotSize,'Lot capacity',{optional:true,integer:true})},
    source:{id:input.sourceRef?.trim()||`LOCAL-INTAKE-${id}`,label:'Self-reported capability card',url:safeUrl(input.sourceUrl),observed:day(at)},evidence:[]};
  state.suppliers.unshift(record);state.activity.push({type:'onboarding',supplierId:id,at,actor:'Demo manufacturer',text:'Capability profile added and immediately searchable. Qualification review pending.'});return record;
}
export function searchSuppliers(suppliers,query='',filters={},requirements=[]) {
  const q=query.trim().toLowerCase();
  const inferred=requirements.find(r=>q&&r.part.toLowerCase().includes(q));
  return suppliers.filter(s=>{
    const text=[s.name,s.description,s.site.city,s.site.region,s.site.country,...s.capabilities.processes,...s.capabilities.materials].join(' ').toLowerCase();
    const queryMatch=!q||q.split(/\s+/).every(word=>text.includes(word))||(inferred&&s.capabilities.processes.some(p=>key(p)===key(inferred.process))&&s.capabilities.materials.some(m=>key(m)===key(inferred.material)));
    return queryMatch&&(!filters.process||s.capabilities.processes.some(p=>key(p)===key(filters.process)))&&(!filters.material||s.capabilities.materials.some(m=>key(m)===key(filters.material)))&&(!filters.country||s.site.country===filters.country);
  });
}
export function buildPacket(state,supplierId,at=new Date().toISOString()) {
  const supplier=state.suppliers.find(s=>s.id===supplierId);if(!supplier)throw new Error('Supplier not found.');
  const req=activeRequirement(state);const decision=decisionState(state,supplier,req,day(at));const match=scoreSupplier(supplier,req,day(at));
  const approved=decision.status==='current'&&decision.record?.action==='advance'&&match.ready;
  return {schemaVersion:SCHEMA_VERSION,id:`PACKET-${req.id}-R${req.revision}-${supplierId}`,notice:'Synthetic demonstration. Draft for human RFQ preparation; no supplier contact, award, price or delivery commitment.',generatedAt:at,status:approved?'Approved for RFQ drafting':'Review only — approval required',requirement:structuredClone(req),supplier:structuredClone(supplier),match,decision:decision.record?{action:decision.record.action,reviewer:decision.record.reviewer,note:decision.record.note,at:decision.record.at,requirementRevision:decision.record.requirementRevision,state:decision.status}:null,comparisons:state.suppliers.map(s=>({id:s.id,name:s.name,...scoreSupplier(s,req,day(at))})),followups:structuredClone(state.followups.filter(f=>f.supplierId===supplierId)),activity:structuredClone(state.activity.filter(a=>a.supplierId===supplierId||a.type==='requirement'))};
}
export function packetHtml(packet) {
  const e=escapeHtml,r=packet.requirement,s=packet.supplier;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Forgepath RFQ review packet</title><style>body{font:15px/1.6 system-ui;max-width:1000px;margin:40px auto;padding:20px;color:#172b35}h1,h2{line-height:1.2}table{border-collapse:collapse;width:100%;margin:18px 0}td,th{border:1px solid #c7d1d4;padding:9px;text-align:left;vertical-align:top}.note{padding:16px;background:#edf3f3}small{color:#50646b}@media print{button{display:none}body{margin:0}}</style><h1>Forgepath · RFQ review packet</h1><p class="note">${e(packet.notice)}</p><p><b>${e(packet.status)}</b><br>${e(packet.id)}<br>Generated ${e(packet.generatedAt)}</p><h2>Request snapshot</h2><p>${e(r.customer)} · ${e(r.part)} · request revision ${r.revision} · drawing ${e(r.drawingRevision)}</p><table><tr><th>Process / material</th><th>Tolerance / quantity</th><th>Requested date / qualification</th></tr><tr><td>${e(r.process)} / ${e(r.material)}</td><td>±${e(r.maxToleranceInches)} in / ${r.quantity}</td><td>${e(r.dueDate)} (not a supplier promise) / ${e(r.qualification)}</td></tr></table><p>Request source: ${e(r.sourceId)} · ${e(r.sourceNote)} · ${e(r.captured)}</p><h2>Selected supplier</h2><p>${e(s.name)} · ${e(s.site.city)}, ${e(s.site.region)} · ${e(s.site.country)}<br>Capability source: ${e(s.source.id)} · ${e(s.source.label)} · ${e(s.source.observed)}<br>Source URL: ${e(s.source.url||'Local fictional intake')}</p><table><tr><th>Required check</th><th>Requirement</th><th>Recorded evidence</th><th>Result</th></tr>${packet.match.checks.map(c=>`<tr><td>${e(c.label)}</td><td>${e(c.required)}</td><td>${e(c.actual)}</td><td>${c.pass?'PASS':'FOLLOW UP'}</td></tr>`).join('')}</table><h2>Supplier comparison</h2><table><tr><th>Supplier</th><th>Score</th><th>Required checks</th></tr>${packet.comparisons.map(c=>`<tr><td>${e(c.name)}</td><td>${c.score}/100</td><td>${c.ready?'All passed; human decision required':e(c.gaps.join('; '))}</td></tr>`).join('')}</table><h2>Evidence and provenance</h2>${s.evidence.map(v=>`<p><b>${e(v.kind)} · ${e(v.status)}${v.supersededBy?' · superseded':''}</b><br>${e(v.sourceRef)} · site ${e(v.siteId)} · valid ${e(v.validFrom||'unknown')} to ${e(v.validUntil||'unknown')}<br>Reviewed by ${e(v.verifiedBy||'pending')} · ${e(v.reviewedAt||'pending')}<br>${e(v.note)}</p>`).join('')||'<p>No reviewed qualification records.</p>'}<h2>Human decision</h2><p>${packet.decision?`${e(packet.decision.action)} · ${e(packet.decision.state)} · ${e(packet.decision.reviewer)} · ${e(packet.decision.at)}<br>${e(packet.decision.note)}`:'No decision recorded.'}</p><h2>Outstanding questions</h2><ul>${[...packet.match.gaps,...r.checks].map(c=>`<li>${e(c)}</li>`).join('')}</ul><h2>Follow-ups</h2>${packet.followups.map(f=>`<p>${e(f.id)} · ${e(f.status)} · ${e(f.requestedBy)}<br>${e(f.note)}<br>Requested ${e(f.at)} · resolved ${e(f.resolvedAt||'pending')}</p>`).join('')||'<p>No follow-ups recorded.</p>'}<h2>Activity record</h2>${packet.activity.map(a=>`<p><small>${e(a.at)} · ${e(a.actor)}</small><br>${e(a.text)}</p>`).join('')}<p class="note">Before sending a real RFQ: confirm drawings, current capacity, lead time, pricing, applicable material and quality requirements, and commercial terms. A reviewed site declaration does not establish domestic origin of every input.</p></html>`;
}
