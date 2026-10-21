// Run a copy from an OS temp directory linked to CODEX_PRIMARY_RUNTIME_NODE_MODULES.
// CODEX_PRIMARY_RUNTIME_NODE <temp>/create-manual-baseline.mjs <validation-directory>
import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const out = path.resolve(process.argv[2]);
const fixture = JSON.parse(await fs.readFile(path.join(out, 'fixtures.json'), 'utf8'));
const wb = Workbook.create();
const instructions = wb.worksheets.add('Instructions');
const work = wb.worksheets.add('Manual work');
const facts = wb.worksheets.add('Facts');
const raw = (v) => v === null || v === undefined ? 'not supplied' : Array.isArray(v) ? v.join(', ') : v;
const date = v => v ? new Date(v+'T00:00:00Z') : 'not supplied';
function base(sheet, end, widths) {
  sheet.showGridLines = false;
  sheet.getRange(`A1:L${end}`).format.font = {name:'Arial', size:10, color:'#243348'};
  sheet.getRange(`A1:L${end}`).format.verticalAlignment = 'center';
  sheet.getRange(`A1:L${end}`).format.rowHeight = 24;
  widths.forEach((n,i)=>sheet.getRangeByIndexes(0,i,end,1).format.columnWidth=n);
}
function title(s, row, text) {s.getCell(row-1,0).values=[[text]];s.getCell(row-1,0).format.font={name:'Arial',size:14,bold:true,color:'#162B40'};}
function text(s,row,value) {s.getCell(row-1,0).values=[[value]];}
function table(s,row,headers,rows,name) {
  const range=s.getRangeByIndexes(row-1,0,rows.length+1,headers.length);
  range.values=[headers,...rows];
  const t=s.tables.add(`A${row}:${String.fromCharCode(64+headers.length)}${row+rows.length}`,true,name);
  t.showFilterButton=true;
  const h=s.getRangeByIndexes(row-1,0,1,headers.length);
  h.format={fill:'#24445E',font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},wrapText:true,horizontalAlignment:'center',verticalAlignment:'center',rowHeight:38};
  return range;
}
base(instructions,30,[23,22,19,18,25,25,16,21,14,14,15,42]);
title(instructions,2,'Manual supplier desk baseline');
text(instructions,4,'Synthetic supplier exercise. Use the same fixed facts and as-of date for both methods.');
text(instructions,5,'Use normal spreadsheet filter, sort, Find, copy and formulas as you wish. Amber cells accept your work.');
text(instructions,6,'Facts are supplied on Facts. Enter outputs on Manual work. Do not add the intake supplier to the four-supplier comparison.');
text(instructions,8,'Task 1: Create a supplier profile from the capability card, then find that profile by its manufacturer name.');
text(instructions,9,'Task 2: For each of the four requests, identify every supplier ready for RFQ drafting and explain exclusions.');
text(instructions,10,'Task 3: Prepare a named review packet for the camera mounting bracket, including decision, rationale and source references.');
text(instructions,12,'Ready means exact process and material, tolerance no larger than requested and lot capacity at least quantity.');
text(instructions,13,'Required qualification must be verified, in-date, scope confirmed, source-referenced, match the site and have a named reviewer.');
text(instructions,14,'US manufacturing also requires country US, reviewed site, source reference and site reviewer. Missing evidence blocks readiness.');
text(instructions,15,'Use only supplied facts. Self-reported claims are not reviewed qualification or domestic manufacturing evidence.');
text(instructions,17,'Actual human results: pending (participants n=0). No completed human run is recorded.');
instructions.getRange('A18:B18').values=[['Timed tasks (n)',null]];
instructions.getRange('B18').setNumberFormat('0');
instructions.getRange('B18').formulas=[['=COUNT(G22:G27)']];
text(instructions,19,'Observer: record UTC start/end as Excel date-times. Leave untimed cells blank. Enter completion and error/help counts after each task.');
table(instructions,21,['Participant ID','Order (A/B)','Method','Task','Start UTC','End UTC','Elapsed sec','Completion','Errors','Help requests','Failed task','Observer notes'],
  ['Workbook','Forgepath'].flatMap(method=>[1,2,3].map(task=>[null,null,method,task,null,null,null,null,null,null,null,null])),'HumanTiming');
instructions.getRange('A22:B27').format.fill='#FFF1C7';
instructions.getRange('E22:F27').format.fill='#FFF1C7';
instructions.getRange('H22:L27').format.fill='#FFF1C7';
instructions.getRange('E22:F27').setNumberFormat('yyyy-mm-dd hh:mm:ss');
for(let r=22;r<=27;r++)instructions.getRange(`G${r}`).formulas=[[`=IF(OR(E${r}="",F${r}=""),"",IF(F${r}<E${r},"Check timestamps",ROUND((F${r}-E${r})*86400,0)))`]];
instructions.getRange('G22:K27').setNumberFormat('0');
instructions.getRange('H22:H27').dataValidation={rule:{type:'list',values:['Completed','Incomplete','Abandoned']}};
instructions.getRange('K22:K27').dataValidation={rule:{type:'list',values:['Yes','No']}};

base(work,65,[30,59,30,38,29,58]);
title(work,2,'Manual work');
text(work,3,'Fill amber cells. These fields are a starting point; normal spreadsheet tools and your own layout are allowed.');
table(work,5,['Intake field','Your entry'],[
  'Manufacturer name','City','Region','Country','Processes','Materials','Tolerance (inches)','Maximum lot size','Source reference','Description','Record type / evidence status','Found by manufacturer name?','Intake notes'
].map(label=>[label,null]),'IntakeWork');
work.getRange('B6:B18').format.fill='#FFF1C7';
title(work,20,'Supplier comparison');
table(work,22,['Request ID','Supplier name','Supplier ID','Ready / not ready','Exclusion reason(s)','Source references / notes'],fixture.requests.flatMap(r=>fixture.supplierRows.map(s=>[r.id,s.name,s.id,null,null,null])),'ManualComparisons');
work.getRange('D23:F38').format.fill='#FFF1C7';
work.getRange('D23:D38').dataValidation={rule:{type:'list',values:['Ready','Not ready']}};
title(work,41,'Camera mounting bracket review packet');
table(work,43,['Packet field','Your entry'],[
  'Request ID','Part / customer','Drawing revision / quantity','Selected supplier ID and name','Process / material / tolerance','Qualification evidence and validity','US manufacturing evidence','Source references','Decision (advance / hold)','Decision rationale / open issues','Named reviewer','Review date-time (UTC)','Packet status','RFQ draft scope / notes'
].map(label=>[label,null]),'ReviewPacket');
work.getRange('B44:B57').format.fill='#FFF1C7';
work.getRange('B55').setNumberFormat('yyyy-mm-dd hh:mm:ss');
text(work,60,'Name the reviewer and record the review decision before marking a packet approved for RFQ drafting.');
text(work,61,'The packet is a review exercise. Do not send an RFQ or contact any supplier.');
work.freezePanes.freezeRows(5);

base(facts,76,[27,57,26,29,25,25,29,36,29,30,23,23]);
title(facts,2,'Supplied facts');
text(facts,3,'Source: validation/fixtures.json, schemaVersion 1. Synthetic fixed fixtures; no real business data or external retrieval.');
facts.getRange('A4:B4').values=[['Fixed as-of date',date(fixture.asOf)]];
facts.getRange('B4').setNumberFormat('yyyy-mm-dd');
table(facts,6,['Request ID','Part','Process','Material','Max tolerance (inches)','Quantity','Qualification','US manufacturing required','Customer','Drawing revision','Request revision','Due date'],fixture.requests.map(r=>[r.id,r.part,r.process,r.material,r.maxToleranceInches,r.quantity,r.qualification,r.usManufacturingRequired,r.customer,r.drawingRevision,r.revision,date(r.dueDate)]),'RequestFacts');
facts.getRange('E7:E10').setNumberFormat('0.0000');
facts.getRange('F7:F10').setNumberFormat('#,##0');
facts.getRange('L7:L10').setNumberFormat('yyyy-mm-dd');
table(facts,14,['Supplier ID','Name','City','Region','Country','Processes','Materials','Max tolerance (inches)','Maximum lot size'],fixture.supplierRows.map(s=>[s.id,s.name,s.city,s.region,s.country,raw(s.processes),raw(s.materials),s.maxToleranceInches,s.maxLotSize]),'SupplierFacts');
facts.getRange('F15:G18').format.wrapText=true;
facts.getRange('A15:I18').format.rowHeight=42;
facts.getRange('H15:H18').setNumberFormat('0.0000');
facts.getRange('I15:I18').setNumberFormat('#,##0');
table(facts,22,['Supplier ID','Qualification','Status','Valid from','Valid until','Scope confirmed','Verified by','Certificate source reference','Certificate site ID','Reviewed at UTC','Observed'],fixture.supplierRows.flatMap(s=>[
  ...[['iso9001','ISO 9001:2015'],['as9100','AS9100D']].map(([k,label])=>[s.id,label,raw(s[k+'Status']),date(s[k+'ValidFrom']),date(s[k+'ValidUntil']),s[k+'ScopeConfirmed'],raw(s[k+'VerifiedBy']),raw(s[k+'SourceRef']),raw(s[k+'SiteId']),s[k+'ReviewedAt']?new Date(s[k+'ReviewedAt']):'not supplied',date(s[k+'Observed'])])
]),'QualificationFacts');
facts.getRange('D23:E30').setNumberFormat('yyyy-mm-dd');
facts.getRange('J23:J30').setNumberFormat('yyyy-mm-dd hh:mm:ss');
facts.getRange('K23:K30').setNumberFormat('yyyy-mm-dd');
table(facts,34,['Supplier ID','Site source reference','Site reviewed','Site reviewer','Site ID','Site reviewed UTC','Capability source ID','Capability source label','Capability observed','Qualification reviewer'],fixture.supplierRows.map(s=>[s.id,s.siteSourceRef,s.siteReviewed,s.siteReviewer,s.siteId,new Date(s.siteReviewedAt),s.capabilitySourceId,s.capabilitySourceLabel,date(s.capabilitySourceObserved),raw(s.qualificationReviewer)]),'SiteFacts');
facts.getRange('F35:F38').setNumberFormat('yyyy-mm-dd hh:mm:ss');
facts.getRange('I35:I38').setNumberFormat('yyyy-mm-dd');
title(facts,41,'Capability card for intake task');
const card=fixture.intake.text.split('\n').map(line=>{const i=line.indexOf(':');return [line.slice(0,i),line.slice(i+1).trim()];});
table(facts,43,['Card label','Supplied text'],card,'IntakeCard');
facts.getRange('B44:B52').format.wrapText=true;
facts.getRange('A44:B52').format.rowHeight=40;
text(facts,55,'Card claims are self-reported. No reviewed site or certificate evidence is supplied with this card.');
text(facts,57,'Interpretation: not supplied preserves a null source field; FALSE preserves an explicit false value.');
text(facts,58,'Use the exact process names. A claim of 5-axis milling does not by itself establish CNC milling capability.');
text(facts,59,'Tolerance is the largest stated deviation in inches. Smaller is more precise. Lot capacity is a maximum count.');
table(facts,62,['Supplier ID','Qualification','Source label','Source note'],fixture.supplierRows.flatMap(s=>[['iso9001','ISO 9001:2015'],['as9100','AS9100D']].map(([k,label])=>[s.id,label,raw(s[k+'SourceLabel']),raw(s[k+'Note'])])),'CertificateNotes');
facts.getRange('D63:D70').format.wrapText=true;
facts.getRange('A63:D70').format.rowHeight=44;
facts.freezePanes.freezeRows(6);

// Boundary tests of timing formulas are temporary and restored before final verification/export.
instructions.getRange('E22:F22').values=[[46000,46000+90/86400]];
wb.recalculate();
if(instructions.getRange('G22').values[0][0]!==90)throw Error('Elapsed calculation failed');
instructions.getRange('E22:F22').values=[[46000,46000]];
wb.recalculate();
if(instructions.getRange('G22').values[0][0]!==0)throw Error('Zero elapsed calculation failed');
instructions.getRange('E22:F22').values=[[46000,45999]];
wb.recalculate();
if(instructions.getRange('G22').values[0][0]!=='Check timestamps')throw Error('Reverse time not flagged');
instructions.getRange('E22:F22').clear({applyTo:'contents'});
wb.recalculate();
if(instructions.getRange('B18').values[0][0]!==0)throw Error('Blank timing count must be zero');
if(instructions.getRange('G22').values[0][0]!=='')throw Error('Untimed result must remain blank');
console.log((await wb.inspect({kind:'region',sheetId:'Instructions',range:'A18:L27',include:'values,formulas',maxChars:3300,tableMaxRows:11,tableMaxCols:12})).ndjson);
console.log((await wb.inspect({kind:'formula',sheetId:'Instructions',range:'A18:L27',include:'values,formulas',maxChars:2500,options:{maxResults:10}})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},summary:'Final formula error scan'})).ndjson);
const qa=path.join(process.cwd(),'qa');await fs.mkdir(qa,{recursive:true});
for(const [sheetName,range,name] of [
  ['Instructions','A1:L27','instructions'],['Manual work','A1:F38','manual-intake-comparison'],['Manual work','A41:F61','manual-packet'],
  ['Facts','A1:L18','facts-requests-suppliers'],['Facts','A21:K38','facts-evidence'],['Facts','A41:F59','facts-intake'],['Facts','A62:D70','facts-certificate-notes']
]) {const image=await wb.render({sheetName,range,scale:1,format:'png'});await fs.writeFile(path.join(qa,name+'.png'),new Uint8Array(await image.arrayBuffer()));}
const xlsx=await SpreadsheetFile.exportXlsx(wb);await xlsx.save(path.join(out,'manual-baseline.xlsx'));
await fs.rm(path.join(out,'manual-baseline.xlsx.inspect.ndjson'),{force:true});
console.log(JSON.stringify({output:path.join(out,'manual-baseline.xlsx'),qa,sheets:3,pairs:16,humanTimedTasks:0}));
