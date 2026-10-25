export const SCHEMA_VERSION = 3;
export const WEIGHTS = {process:35, material:25, tolerance:20, quantity:10, qualification:10};
const aliases = new Map([
  ['cnc mill','CNC milling'],['milling','CNC milling'],['cnc milling','CNC milling'],
  ['cnc turn','CNC turning'],['turning','CNC turning'],['cnc turning','CNC turning'],
  ['5 axis milling','5-axis milling'],['5-axis cnc milling','5-axis milling'],['5 axis cnc milling','5-axis milling'],['5-axis milling','5-axis milling'],['5-axis','5-axis milling'],['5 axis','5-axis milling'],
  ['6061','Aluminum 6061'],['6061 aluminum','Aluminum 6061'],['aluminium 6061','Aluminum 6061'],['aluminum 6061','Aluminum 6061'],
  ['7075','Aluminum 7075'],['7075 aluminum','Aluminum 7075'],['aluminum 7075','Aluminum 7075'],['aluminum7075','Aluminum 7075'],['aluminium7075','Aluminum 7075'],['aluminum6061','Aluminum 6061'],['aluminium6061','Aluminum 6061'],
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
  return {status:'fail',record:records.at(-1)??null,reason:expired?'Certificate on file is out of date; current certification status is unconfirmed':'Required qualification needs current, scoped human review'};
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
  state.activity.push({type:'requirement',requirementId:current.id,at,actor:'Workspace operator',text:`Requirement updated to revision ${next.revision}; previous decisions require fresh review.`});return next;
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
  const record={id:`EVD-${supplierId}-${supplier.evidence.length+1}-${at}`,kind:req.qualification,status:'verified',siteId:supplier.site.id,sourceRef:input.sourceRef.trim(),sourceLabel:'Qualification review packet',validFrom:input.validFrom,validUntil:input.validUntil,observed:day(at),reviewedAt:at,verifiedBy:input.reviewer.trim(),scopeConfirmed:true,note:input.note.trim()};
  for(const e of supplier.evidence)if(key(e.kind)===key(req.qualification)&&!e.supersededBy)e.supersededBy=record.id;
  supplier.evidence.push(record);
  if(input.siteConfirmed){supplier.site.status='reviewed';supplier.site.sourceRef=input.sourceRef.trim();supplier.site.reviewedBy=input.reviewer.trim();supplier.site.reviewedAt=at;}
  for(const f of state.followups)if(f.supplierId===supplierId&&f.status==='open'){
    const target=state.requirements.find(r=>r.id===f.requirementId);
    if(target&&scoreSupplier(supplier,target,day(at)).ready){f.status='resolved';f.resolvedAt=at;f.evidenceId=record.id;}
  }
  state.activity.push({type:'evidence',supplierId,requirementId:req.id,at,actor:input.reviewer.trim(),text:`Reviewed ${record.kind}, reference ${record.sourceRef}; earlier evidence preserved and superseded.`});return record;
}
const INTAKE_LIMIT = 12000;
const intakeMap = {name:'name',manufacturer:'name',location:'location',city:'city',state:'region',region:'region',country:'country',process:'processes',processes:'processes',material:'materials',materials:'materials',tolerance:'tolerance',capacity:'maxLotSize','lot capacity':'maxLotSize',source:'sourceRef',url:'sourceUrl',description:'description'};
const intakeField = label => Object.hasOwn(intakeMap,label)?intakeMap[label]:undefined;
const processNames = ['5-axis milling','CNC milling','CNC turning'];
const materialNames = ['Aluminum 6061','Aluminum 7075','Acetal'];
const normalized = value => String(value??'').toLowerCase().replace(/aluminium/g,'aluminum').replace(/[‐‑–—-]/g,' ').replace(/\s+/g,' ').trim();
const reEscape = value => value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function phrasesFor(value) {
  return [...new Set([value,...[...aliases].filter(([,v])=>v===value).map(([a])=>a)])].sort((a,b)=>b.length-a.length);
}
function entityMatches(text, entities) {
  const matches=[];
  for(const value of entities)for(const phrase of phrasesFor(value)) {
    const pattern=normalized(phrase).split(' ').map(reEscape).join('[\\s‐‑–—-]+').replace(/aluminum/g,'alumin(?:um|ium)');
    const rx=new RegExp(`(?<![a-z0-9])${pattern}(?![a-z0-9])`,'gi');
    for(const match of text.matchAll(rx))matches.push({value,index:match.index,end:match.index+match[0].length,excerpt:match[0]});
  }
  // Longest phrases win, so 5-axis CNC milling never also means generic CNC milling.
  const chosen=[];
  for(const match of matches.sort((a,b)=>(b.end-b.index)-(a.end-a.index)||a.index-b.index))if(!chosen.some(m=>match.index<m.end&&match.end>m.index))chosen.push(match);
  return chosen.sort((a,b)=>a.index-b.index);
}
function claimContext(text,index,end) {
  const before=text.slice(0,index).split(/[!?;\n]|\.\s+|\bbut\b/i).at(-1);
  const after=text.slice(end).split(/[!?;\n]|\.\s+|\bbut\b/i)[0];
  return {excerpt:(before+text.slice(index,end)+after).trim(),uncertain:/\b(?:no|not|never|without|cannot|can't|don't|doesn't|unable|unsupported|may|might|could|would|plan|planning|hope|wish|considering|once|previously|formerly|historically)\b/i.test(before)||/^\s+(?:(?:is|are)\s+(?:not|unsupported|unavailable)|may|might|could|cannot|can't|would|isn't|aren't)\b/i.test(after)};
}
function csvRows(text) {
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(quoted||!cell)quoted=!quoted;else throw new Error('Malformed CSV quoting.');}
    else if(c===','&&!quoted){row.push(cell.trim());cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw new Error('Unclosed CSV quote.');
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
}
/** Local, deterministic extraction only. Every populated field has a source excerpt. */
export function analyzeCapabilityIntake(input) {
  const text=String(input??'');const fields={},evidence=[],warnings=[];let format='unknown';
  if(!text.trim())return {fields,evidence,warnings:['Paste a capability paragraph, labeled card, or one-row CSV.'],format};
  if(text.length>INTAKE_LIMIT)return {fields,evidence,warnings:[`Input exceeds ${INTAKE_LIMIT} characters. Shorten it before extraction.`],format};
  const claims=new Map();
  const add=(field,value,excerpt)=>{value=String(value??'').trim();if(!value)return;const entries=claims.get(field)??[];entries.push({field,value,excerpt});claims.set(field,entries);};
  const labeled=text.split(/\r?\n/).map(line=>{const i=line.indexOf(':');return {line,field:intakeField(line.slice(0,i).trim().toLowerCase()),value:line.slice(i+1).trim()};}).filter(x=>x.field);
  if(labeled.length){format='card';for(const item of labeled)add(item.field,item.value,item.line);}
  else {
    const first=text.split(/\r?\n/)[0];
    if(first.includes(',')&&first.split(',').some(v=>intakeField(v.trim().replace(/^"|"$/g,'').toLowerCase()))) {
      format='csv';
      try {const rows=csvRows(text);if(rows.length!==2||rows[0].length!==rows[1].length)throw new Error('CSV needs a header and exactly one supplier row with matching columns.');
        const seen=new Set();rows[0].forEach((header,i)=>{const field=intakeField(header.toLowerCase());if(!field){warnings.push(`Unrecognized CSV column: ${header}.`);return;}if(seen.has(field))throw new Error(`Repeated CSV column: ${header}.`);seen.add(field);add(field,rows[1][i],text.trim());});
      }catch(error){return {fields:{},evidence:[],warnings:[error.message],format};}
    }else {
      format='paragraph';
      const name=text.match(/(?:^|[.!?]\s+)(?:we are|our (?:company|shop) is|manufacturer(?: name)? is)\s+([^.!?\n]+?)(?=,?\s+(?:based|located|and we)\b|[.!?\n]|$)/i);
      if(name&&!/^(?:not|possibly|maybe)\b/i.test(name[1]))add('name',name[1].replace(/,\s*$/,''),name[0].trim());
      for(const location of text.matchAll(/\b(?:based|located) in\s+([^,;.!?\n]+)(?:,\s*([^,;.!?\n]+))?(?:,\s*(USA|US|United States|CA|Canada|Mexico|MX)\b)?/gi)) {
        const context=claimContext(text,location.index,location.index+location[0].length);
        if(context.uncertain){warnings.push('Negated or uncertain location claim omitted.');continue;}
        if(!/^(?:United States|USA|US|Canada|CA|Mexico|MX)$/i.test(location[1].trim()))add('city',location[1],location[0]);
        if(location[2])add('region',location[2],location[0]);if(location[3])add('country',location[3],location[0]);
      }
      for(const country of text.matchAll(/\b(?:country(?: is|:)?|manufacturing (?:site|facility) in|based in|located in)\s+(United States|USA|US|Canada|CA|Mexico|MX)\b/gi)) {
        if(!claimContext(text,country.index,country.index+country[0].length).uncertain)add('country',country[1],country[0]);
      }
      for(const [field,entities] of [['processes',processNames],['materials',materialNames]]) {
        const positive=[],negative=[];
        for(const match of entityMatches(text,entities)) {
          const context=claimContext(text,match.index,match.end);
          (context.uncertain?negative:positive).push({...match,excerpt:context.excerpt});
        }
        for(const match of negative)warnings.push(`Negated or uncertain ${field}: ${match.value}; omitted from extracted claims.`);
        for(const match of positive)if(negative.some(n=>n.value===match.value))warnings.push(`Conflicting ${field} claim for ${match.value}; omitted. `);else add(field,match.value,match.excerpt);
      }
      for(const [field,rx] of [
        ['tolerance',/\b(?:tolerance(?:s)?(?: of| is|:)?|hold(?:ing)? tolerances?(?: of| to)?)\s*(?:not |no )?(?:±|\+\/-)?\s*(0?\.\d+)\s*(?:inches|inch|in\b|")/gi],
        ['maxLotSize',/\b(?:max(?:imum)? (?:lot(?: size)?|capacity)|lot capacity|capacity(?: of| is|:)?)\s*(?:of |is |up to )?(?:not |no )?(\d+)\s*(?:pieces|parts|units)\b/gi]
      ]) {
        const matches=[...text.matchAll(rx)];const blocked=matches.some(m=>claimContext(text,m.index,m.index+m[0].length).uncertain||/\b(?:not|no)\b/i.test(m[0]));
        if(blocked){warnings.push(`Negated or uncertain ${field} claim; left blank for confirmation.`);continue;}
        for(const match of matches)add(field,match[1],claimContext(text,match.index,match.index+match[0].length).excerpt);
      }
      warnings.push('Only recognized explicit phrases were extracted. Review the original for omitted or ambiguous claims.');
      if(/\b(?:ISO\s*9001|AS\s*9100|certif|verified|qualification)/i.test(text))warnings.push('Qualification and verification statements remain unverified; human evidence review is required.');
    }
  }
  if(format==='paragraph'&&/\b(?:no longer|used to|once offered|previously offered|formerly offered)\b/i.test(text)) {
    claims.delete('processes');claims.delete('materials');warnings.push('Historical or withdrawn capability language requires manual confirmation; capability claims left blank.');
  }
  if(claims.has('location')) {
    for(const entry of claims.get('location')){const parts=entry.value.split(',').map(v=>v.trim());if(parts[0])add('city',parts[0],entry.excerpt);if(parts[1])add('region',parts[1],entry.excerpt);}
    claims.delete('location');
  }
  for(const [field,entries] of claims) {
    if(field==='processes'||field==='materials') {
      const accepted=[];
      if(entries.some(entry=>/\b(?:not|no|without|cannot|unsupported|may|might|could)\b/i.test(entry.value))){warnings.push(`Negated or uncertain ${field} field omitted; confirm capabilities manually.`);continue;}
      for(const entry of entries){if(/\b(?:not|no|without|cannot|unsupported)\b/i.test(entry.value)){warnings.push(`Negated or ambiguous ${field} field omitted; enter confirmed positive capabilities manually.`);continue;}for(const value of values(entry.value)){accepted.push(value);evidence.push({...entry,value});}}
      if(accepted.length)fields[field]=[...new Set(accepted)].join(', ');
    }else {
      if(field==='tolerance'||field==='maxLotSize') {
        const rx=field==='tolerance'?/^(?:±|\+\/-)?\s*(\d*\.?\d+)\s*(?:in|inch|inches|")?$/i:/^(\d+)\s*(?:pieces|parts|units)?$/i;
        if(entries.some(entry=>!rx.test(entry.value)||Number(entry.value.match(rx)?.[1])<=0)) {warnings.push(`Unrecognized or nonpositive ${field}; left blank. Use a positive ${field==='tolerance'?'inch value':'whole-piece count'}.`);continue;}
        for(const entry of entries)entry.value=entry.value.match(rx)[1];
      }
      const distinct=[...new Set(entries.map(e=>field==='country'?({USA:'US','UNITED STATES':'US',CANADA:'CA',MEXICO:'MX'}[e.value.toUpperCase()]??e.value.toUpperCase()):e.value))];
      if(distinct.length>1){warnings.push(`Conflicting ${field} values; left blank for confirmation.`);continue;}
      fields[field]=distinct[0];evidence.push({...entries[0],value:distinct[0]});
    }
  }
  if(!Object.keys(fields).length){format='unknown';warnings.push('No supported capability claims recognized. Use a labeled card or edit the fields manually.');}
  for(const field of ['name','city','country','processes','materials','tolerance','maxLotSize'])if(!fields[field])warnings.push(`${field} is unknown; no value was inferred.`);
  return {fields,evidence,warnings:[...new Set(warnings)],format};
}
export function parseCapabilityCard(text) {return analyzeCapabilityIntake(text).fields;}
export function onboardSupplier(state,input,at=new Date().toISOString()) {
  if(!input.name?.trim()||!input.city?.trim())throw new Error('Manufacturer name and city are required.');
  const processes=values(input.processes);if(!processes.length)throw new Error('Add at least one manufacturing process.');
  if(input.sourceUrl&&!safeUrl(input.sourceUrl))throw new Error('Source link must be an HTTP or HTTPS URL.');
  const country=String(input.country??'').toUpperCase().trim();if(country&&!/^[A-Z]{2}$/.test(country))throw new Error('Use a two-letter country code.');
  const id=`SUP-LOCAL-${state.suppliers.length+1}-${Date.parse(at)}`;
  const record={id,name:input.name.trim(),description:input.description?.trim()??'',recordType:'self-reported',synthetic:true,createdAt:at,
    site:{id:`SITE-${id}`,city:input.city.trim(),region:input.region?.trim()??'',country,status:'self-reported',sourceRef:input.sourceRef?.trim()||'LOCAL-CAPABILITY-INTAKE',reviewedBy:null},
    capabilities:{processes,materials:values(input.materials),maxToleranceInches:number(input.tolerance,'Tolerance',{optional:true}),maxLotSize:number(input.maxLotSize,'Lot capacity',{optional:true,integer:true})},
    source:{id:input.sourceRef?.trim()||`LOCAL-INTAKE-${id}`,label:'Self-reported capability card',url:safeUrl(input.sourceUrl),observed:day(at)},evidence:[]};
  if(typeof input.intakeText==='string') {
    record.source.intakeText=input.intakeText;
    record.source.intakeEvidence=Array.isArray(input.intakeEvidence)?structuredClone(input.intakeEvidence):[];
    record.source.confirmedFields=Object.fromEntries(['name','city','region','country','processes','materials','tolerance','maxLotSize','sourceRef','sourceUrl','description'].map(field=>[field,String(input[field]??'').trim()]));
    if(input.intakeFields&&typeof input.intakeFields==='object') {
      record.source.intakeFields=structuredClone(input.intakeFields);
      record.source.corrections=Object.entries(record.source.confirmedFields).filter(([field,value])=>String(input.intakeFields[field]??'').trim()!==value).map(([field,confirmed])=>({field,extracted:String(input.intakeFields[field]??''),confirmed}));
    }
  }
  state.suppliers.unshift(record);state.activity.push({type:'onboarding',supplierId:id,at,actor:'Manufacturer',text:'Capability profile added and immediately searchable. Qualification review pending.'});return record;
}
const queryStopwords=new Set('a an the i we our me us need needs want wants looking look find for to make makes making manufacture manufacturing manufacturer manufacturers machine shop shops supplier suppliers with that can capable of and or in near around at based located please some any part parts component components'.split(' '));
const queryTokens = text => normalized(text).match(/[a-z0-9]+/g)??[];
const singular = word => word.length>3&&word.endsWith('s')?word.slice(0,-1):word;
const materialMatches = (actual,expected) => key(actual)===key(expected)||(normalized(expected)==='aluminum'&&normalized(actual).startsWith('aluminum '));
/** Interpretation never changes qualification or manufacturing readiness. */
export function interpretSupplierQuery(query='',suppliers=[],requirements=[]) {
  const text=String(query??'').trim(),filters={},terms=[],notes=[],unsupported=[];
  if(!text)return {filters,terms,notes,unsupported};
  if(text.length>2000)return {filters,terms,notes,unsupported:['Query exceeds 2000 characters. Shorten it before searching.']};
  const named=suppliers.find(s=>normalized(s.name)===normalized(text));
  if(named)return {filters,terms:[normalized(named.name)],notes:[`Exact manufacturer name: ${named.name}. Process and location words in the name are treated as the name.`],unsupported};
  if(/\b(?:not|without|exclude|excluding|except|never)\b/i.test(text))return {filters,terms,notes,unsupported:['Negative search criteria need explicit filter edits; no negative clause was applied.']};
  const occupied=[];
  const consume=matches=>{for(const m of matches)occupied.push([m.index,m.end]);};
  const remaining=()=>{let rest=text;for(const [a,b] of occupied.sort((a,b)=>b[0]-a[0]))rest=rest.slice(0,a)+' '.repeat(b-a)+rest.slice(b);return rest;};
  const tokens=queryTokens(text).map(singular);
  const candidates=requirements.map(r=>({r,words:queryTokens(r.part).map(singular).filter(w=>!['mounting','part','component'].includes(w))})).map(item=>({...item,hits:item.words.filter(w=>tokens.includes(w))}));
  const inferred=candidates.filter(c=>c.hits.length&&c.hits.some(w=>!['electronics','bracket'].includes(w))||c.hits.length>=2).sort((a,b)=>b.hits.length-a.hits.length)[0];
  if(inferred){filters.process=canonical(inferred.r.process);filters.material=canonical(inferred.r.material);notes.push(`Sample request “${inferred.r.part}” suggests process ${filters.process} and material ${filters.material}. These are editable search assumptions; qualification, tolerance and capacity are not inferred.`);
    for(const word of inferred.words){const rx=new RegExp(`(?<![a-z0-9])${reEscape(word)}s?(?![a-z0-9])`,'gi');consume([...text.matchAll(rx)].map(m=>({index:m.index,end:m.index+m[0].length})));}
  }
  for(const [field,known] of [['process',[...processNames,...suppliers.flatMap(s=>s.capabilities.processes),...requirements.map(r=>r.process)]],['material',[...materialNames,...suppliers.flatMap(s=>s.capabilities.materials),...requirements.map(r=>r.material)]]]) {
    const matches=entityMatches(text,[...new Set(known.map(canonical))]);const choices=[...new Set(matches.map(m=>canonical(m.value)))];consume(matches);
    if(choices.length>1)unsupported.push(`Multiple ${field} criteria (${choices.join(', ')}) need one explicit filter selection.`);
    else if(choices.length){filters[field]=choices[0];notes.push(`Explicit ${field}: ${choices[0]}.`);}
  }
  const generic=entityMatches(remaining(),['Aluminum']);
  if(generic.length){consume(generic);if(!filters.material)filters.material='Aluminum';notes.push(filters.material==='Aluminum'?'Generic aluminum matches recorded aluminum grades; no specific alloy was assumed.':`Generic aluminum was supplied; ${filters.material} remains the editable assumption from the sample request.`);}
  const places=[...new Set(suppliers.flatMap(s=>[s.site.city,s.site.region]).filter(Boolean))];
  const locations=entityMatches(remaining(),places);const distinctPlaces=[...new Set(locations.map(m=>m.value))];consume(locations);
  const compoundPlace=distinctPlaces.length===2?suppliers.find(s=>distinctPlaces.includes(s.site.city)&&distinctPlaces.includes(s.site.region)):null;
  if(compoundPlace){filters.location=`${compoundPlace.site.city}, ${compoundPlace.site.region}`;notes.push(`Recorded location: ${filters.location}.`);}
  else if(distinctPlaces.length===1){filters.location=distinctPlaces[0];notes.push(`Recorded location: ${filters.location}.`);}
  else if(distinctPlaces.length>1)unsupported.push(`Multiple location criteria (${distinctPlaces.join(', ')}) need explicit filter edits.`);
  const countryRx=/\b(?:united states|u\.?s\.?a\.?|u\.?s\.?|canada|mexico|CA|MX)\b/gi;
  const countries=[...remaining().matchAll(countryRx)].filter(m=>normalized(m[0])!=='us'||m[0]==='US'||/united states|usa/i.test(m[0]));
  const codes=[...new Set(countries.map(m=>/canada|ca/i.test(m[0])?'CA':/mexico|mx/i.test(m[0])?'MX':'US'))];consume(countries.map(m=>({index:m.index,end:m.index+m[0].length})));
  if(codes.length===1){filters.country=codes[0];notes.push(`Explicit country: ${codes[0]}.`);}else if(codes.length>1)unsupported.push('Multiple country criteria need one explicit filter selection.');
  const residue=queryTokens(remaining()).filter(w=>!queryStopwords.has(w));
  const knownWords=new Set(suppliers.flatMap(s=>queryTokens([s.name,s.description,s.site.city,s.site.region,...s.capabilities.processes,...s.capabilities.materials].join(' '))));
  for(const word of [...new Set(residue)]){terms.push(word);if(!knownWords.has(word))unsupported.push(`Unrecognized search term: ${word}.`);}
  return {filters,terms,notes,unsupported};
}
/** An own-property empty filter deliberately clears that inferred criterion. No criteria are relaxed. */
export function discoverSuppliers(suppliers,query='',filters={},requirements=[]) {
  const interpretation=interpretSupplierQuery(query,suppliers,requirements);
  const effective={...interpretation.filters};
  for(const field of ['process','material','country','location'])if(Object.hasOwn(filters,field)){
    if(filters[field])effective[field]=String(filters[field]).trim();else delete effective[field];
    if(Object.hasOwn(interpretation.filters,field)&&String(filters[field]??'')!==interpretation.filters[field])interpretation.notes.push(`${field} ${filters[field]?`overridden to ${filters[field]}`:'cleared'} by the editable filter.`);
  }
  interpretation.unsupported=interpretation.unsupported.filter(note=>!(['process','material','country','location'].some(field=>Object.hasOwn(filters,field)&&note.startsWith(`Multiple ${field} criteria`))));
  interpretation.filters=effective;
  const explanations={};
  const results=interpretation.unsupported.length?[]:suppliers.filter(s=>{
    const c=s.capabilities,site=s.site;
    const checks=[!effective.process||c.processes.some(p=>key(p)===key(effective.process)),!effective.material||c.materials.some(m=>materialMatches(m,effective.material)),!effective.country||site.country===effective.country.toUpperCase(),!effective.location||[site.city,site.region,`${site.city}, ${site.region}`].some(v=>normalized(v)===normalized(effective.location))];
    const haystack=normalized([s.name,s.description,site.city,site.region,site.country,...c.processes,...c.materials].join(' '));
    if(!checks.every(Boolean)||!interpretation.terms.every(term=>haystack.includes(term)))return false;
    explanations[s.id]=[...Object.entries(effective).map(([field,value])=>`${field}: ${value}${field==='material'&&value==='Aluminum'?` (${c.materials.filter(m=>materialMatches(m,value)).join(', ')})`:''}`),...interpretation.terms.map(term=>`Recorded profile contains “${term}”.`),'Discovery result only; qualification and all required checks still need review.'];return true;
  });
  if(!results.length&&!interpretation.unsupported.length)interpretation.notes.push('No supplier matches every current criterion. Edit or clear a filter to try another search; no criteria were relaxed.');
  return {results,interpretation,explanations,relaxed:[]};
}
export function searchSuppliers(suppliers,query='',filters={},requirements=[]) {return discoverSuppliers(suppliers,query,filters,requirements).results;}
export function buildPacket(state,supplierId,at=new Date().toISOString()) {
  const supplier=state.suppliers.find(s=>s.id===supplierId);if(!supplier)throw new Error('Supplier not found.');
  const req=activeRequirement(state);const decision=decisionState(state,supplier,req,day(at));const match=scoreSupplier(supplier,req,day(at));
  const approved=decision.status==='current'&&decision.record?.action==='advance'&&match.ready;
  return {schemaVersion:SCHEMA_VERSION,id:`PACKET-${req.id}-R${req.revision}-${supplierId}`,notice:'Sample project: illustrative companies, people and records. RFQ preparation only; no supplier contact, order or delivery commitment.',generatedAt:at,status:approved?'Approved for RFQ drafting':'Review only — approval required',requirement:structuredClone(req),supplier:structuredClone(supplier),match,decision:decision.record?{action:decision.record.action,reviewer:decision.record.reviewer,note:decision.record.note,at:decision.record.at,requirementRevision:decision.record.requirementRevision,state:decision.status}:null,comparisons:state.suppliers.map(s=>({id:s.id,name:s.name,...scoreSupplier(s,req,day(at))})),followups:structuredClone(state.followups.filter(f=>f.supplierId===supplierId)),activity:structuredClone(state.activity.filter(a=>a.supplierId===supplierId||a.type==='requirement'))};
}
export function packetHtml(packet) {
  const e=escapeHtml,r=packet.requirement,s=packet.supplier;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Forgepath RFQ review packet</title><style>body{font:15px/1.6 system-ui;max-width:1000px;margin:40px auto;padding:20px;color:#172b35}h1,h2{line-height:1.2}table{border-collapse:collapse;width:100%;margin:18px 0}td,th{border:1px solid #c7d1d4;padding:9px;text-align:left;vertical-align:top}.note{padding:16px;background:#edf3f3}small{color:#50646b}@media print{button{display:none}body{margin:0}}</style><h1>Forgepath · RFQ review packet</h1><p class="note">${e(packet.notice)}</p><p><b>${e(packet.status)}</b><br>${e(packet.id)}<br>Generated ${e(packet.generatedAt)}</p><h2>Request snapshot</h2><p>${e(r.customer)} · ${e(r.part)} · request revision ${r.revision} · drawing ${e(r.drawingRevision)}</p><table><tr><th>Process / material</th><th>Tolerance / quantity</th><th>Requested date / qualification</th></tr><tr><td>${e(r.process)} / ${e(r.material)}</td><td>±${e(r.maxToleranceInches)} in / ${r.quantity}</td><td>${e(r.dueDate)} (not a supplier promise) / ${e(r.qualification)}</td></tr></table><p>Request source: ${e(r.sourceId)} · ${e(r.sourceNote)} · ${e(r.captured)}</p><h2>Selected supplier</h2><p>${e(s.name)} · ${e(s.site.city)}, ${e(s.site.region)} · ${e(s.site.country)}<br>Capability source: ${e(s.source.id)} · ${e(s.source.label)} · ${e(s.source.observed)}<br>Source URL: ${e(s.source.url||'Local capability intake')}</p><table><tr><th>Required check</th><th>Requirement</th><th>Recorded evidence</th><th>Result</th></tr>${packet.match.checks.map(c=>`<tr><td>${e(c.label)}</td><td>${e(c.required)}</td><td>${e(c.actual)}</td><td>${c.pass?'PASS':'FOLLOW UP'}</td></tr>`).join('')}</table><h2>Supplier comparison</h2><table><tr><th>Supplier</th><th>Score</th><th>Required checks</th></tr>${packet.comparisons.map(c=>`<tr><td>${e(c.name)}</td><td>${c.score}/100</td><td>${c.ready?'All passed; human decision required':e(c.gaps.join('; '))}</td></tr>`).join('')}</table><h2>Evidence and provenance</h2>${s.evidence.map(v=>`<p><b>${e(v.kind)} · ${e(v.status)}${v.supersededBy?' · superseded':''}</b><br>${e(v.sourceRef)} · site ${e(v.siteId)} · valid ${e(v.validFrom||'unknown')} to ${e(v.validUntil||'unknown')}<br>Reviewed by ${e(v.verifiedBy||'pending')} · ${e(v.reviewedAt||'pending')}<br>${e(v.note)}</p>`).join('')||'<p>No reviewed qualification records.</p>'}<h2>Human decision</h2><p>${packet.decision?`${e(packet.decision.action)} · ${e(packet.decision.state)} · ${e(packet.decision.reviewer)} · ${e(packet.decision.at)}<br>${e(packet.decision.note)}`:'No decision recorded.'}</p><h2>Outstanding questions</h2><ul>${[...packet.match.gaps,...r.checks].map(c=>`<li>${e(c)}</li>`).join('')}</ul><h2>Follow-ups</h2>${packet.followups.map(f=>`<p>${e(f.id)} · ${e(f.status)} · ${e(f.requestedBy)}<br>${e(f.note)}<br>Requested ${e(f.at)} · resolved ${e(f.resolvedAt||'pending')}</p>`).join('')||'<p>No follow-ups recorded.</p>'}<h2>Activity record</h2>${packet.activity.map(a=>`<p><small>${e(a.at)} · ${e(a.actor)}</small><br>${e(a.text)}</p>`).join('')}<p class="note">Before sending a real RFQ: confirm drawings, current capacity, lead time, pricing, applicable material and quality requirements, and commercial terms. A reviewed site declaration does not establish domestic origin of every input.</p></html>`;
}
