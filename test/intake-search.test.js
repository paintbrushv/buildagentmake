import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeCapabilityIntake,parseCapabilityCard,onboardSupplier,discoverSuppliers,interpretSupplierQuery,searchSuppliers,scoreSupplier,packetHtml,buildPacket} from '../domain.js';
import {makeSeed,sampleCard} from '../scenarios.js';

const at='2026-10-21T14:00:00Z';
const paragraph='We are Lone Oak Micro Manufacturing (fictional), based in Gainesville, Texas. We offer 5-axis CNC milling and CNC turning in aluminum 7075 and aluminum 6061.';
const ids=result=>result.results.map(s=>s.id);

test('paragraph extraction uses explicit source claims, canonical aliases and no inferred country or numbers',()=>{
  const analysis=analyzeCapabilityIntake(paragraph);
  assert.equal(analysis.format,'paragraph');
  assert.equal(analysis.fields.name,'Lone Oak Micro Manufacturing (fictional)');
  assert.equal(analysis.fields.city,'Gainesville');
  assert.equal(analysis.fields.region,'Texas');
  assert.equal(analysis.fields.processes,'5-axis milling, CNC turning');
  assert.equal(analysis.fields.materials,'Aluminum 7075, Aluminum 6061');
  for(const field of ['country','tolerance','maxLotSize'])assert.equal(analysis.fields[field],undefined);
  for(const entry of analysis.evidence)assert.ok(paragraph.includes(entry.excerpt),entry.excerpt);
  const state=makeSeed(),supplier=onboardSupplier(state,analysis.fields,at);
  assert.equal(supplier.site.country,'');
  assert.equal(supplier.site.status,'self-reported');
  assert.deepEqual(supplier.evidence,[]);
  assert.equal(supplier.capabilities.maxToleranceInches,null);
});

test('explicit country, supported numeric units and claim excerpts survive paragraph extraction',()=>{
  const text='We are Prairie Creek Precision (fictional), based in Gainesville, Texas, USA. We offer CNC milling and CNC turning in Aluminum 6061 and Acetal. Our stated tolerance is ±0.005 inches and our lot capacity is 250 pieces.';
  const {fields,evidence}=analyzeCapabilityIntake(text);
  assert.equal(fields.country,'US');assert.equal(fields.tolerance,'0.005');assert.equal(fields.maxLotSize,'250');
  assert.ok(evidence.every(e=>text.includes(e.excerpt)));
});

test('labeled cards retain the old parser API, aliases and optional numeric units',()=>{
  assert.deepEqual(parseCapabilityCard(sampleCard),analyzeCapabilityIntake(sampleCard).fields);
  const result=analyzeCapabilityIntake('Manufacturer: Unit Test\nCity: Tulsa\nProcesses: Tube bending\nMaterials: Titanium\nTolerance: ±0.005 in\nCapacity: 500 pieces');
  assert.equal(result.format,'card');assert.equal(result.fields.processes,'Tube bending');
  assert.equal(result.fields.tolerance,'0.005');assert.equal(result.fields.maxLotSize,'500');
});

test('one-row CSV handles quoted delimiters and doubled quotes without fetching anything',()=>{
  const text='Manufacturer,City,Country,Processes,Materials,URL\n"A, B ""Precision""",Tulsa,US,"CNC milling, CNC turning","6061, Delrin",https://example.invalid/capabilities';
  const analysis=analyzeCapabilityIntake(text);
  assert.equal(analysis.format,'csv');assert.equal(analysis.fields.name,'A, B "Precision"');
  assert.equal(analysis.fields.materials,'Aluminum 6061, Acetal');
  assert.equal(analysis.fields.sourceUrl,'https://example.invalid/capabilities');
  assert.ok(analysis.evidence.every(e=>text.includes(e.excerpt)));
});

for(const text of ['Manufacturer,City\nShop,Tulsa\nOther,Dallas','Manufacturer,City\n"Shop,Tulsa','Manufacturer,City\nShop,Tulsa,US'])test(`malformed or multi-row CSV fails closed: ${text.slice(0,30)}`,()=>{
  const analysis=analyzeCapabilityIntake(text);assert.deepEqual(analysis.fields,{});assert.deepEqual(analysis.evidence,[]);assert.ok(analysis.warnings.length);
});

test('unrecognized and oversized intake has no extracted claims',()=>{
  for(const text of ['https://example.invalid/only-a-link','nothing recognizable','x'.repeat(12001)]){
    const result=analyzeCapabilityIntake(text);assert.deepEqual(result.fields,{});assert.deepEqual(result.evidence,[]);assert.ok(result.warnings.length);
  }
});

test('negated and conflicting process or material claims are never promoted',()=>{
  const result=analyzeCapabilityIntake('We offer CNC milling in aluminum 6061. We do not offer CNC milling. We do not work with aluminum 6061. We offer CNC turning in Acetal.');
  assert.equal(result.fields.processes,'CNC turning');assert.equal(result.fields.materials,'Acetal');
  assert.ok(result.warnings.some(w=>/Conflicting/.test(w)));
  for(const field of ['Processes: CNC milling\nProcesses: not CNC milling','Materials: Aluminum 6061, not Aluminum 7075']){
    const a=analyzeCapabilityIntake(field);assert.equal(a.fields.processes,undefined);assert.equal(a.fields.materials,undefined);assert.ok(a.warnings.some(w=>/Negated/.test(w)));
  }
});

test('uncertain and historical capability statements need manual confirmation',()=>{
  for(const text of ['We may offer CNC milling and could support Aluminum 6061.','CNC milling may be available. Aluminum 6061 cannot be processed.','We once offered CNC milling but no longer offer it.','We used to offer CNC milling in aluminum6061.']){
    const result=analyzeCapabilityIntake(text);assert.equal(result.fields.processes,undefined);assert.equal(result.fields.materials,undefined);assert.ok(result.warnings.some(w=>/uncertain|Historical/i.test(w)));
  }
});

test('numeric claims respect preceding negation and contradictions',()=>{
  for(const text of ['We cannot hold tolerances of 0.001 inches. We have no lot capacity of 500 pieces.','Tolerance is 0.005 inches; tolerance is 0.001 inches. Capacity is 500 pieces; capacity is 250 pieces.','Tolerance is 0.001 inches. Tolerance is not 0.001 inches. Capacity is 500 pieces. Capacity is not 500 pieces.','Tolerance: not 0.001\nCapacity: not 500']){
    const result=analyzeCapabilityIntake(text);assert.equal(result.fields.tolerance,undefined);assert.equal(result.fields.maxLotSize,undefined);assert.ok(result.warnings.some(w=>/uncertain|Conflicting|Unrecognized/.test(w)));
  }
});

test('location conflicts are flagged and a country is never interpreted as a city',()=>{
  const result=analyzeCapabilityIntake('City: Gainesville\nLocation: Dallas, Texas\nCountry: US\nCountry: CA');
  assert.equal(result.fields.city,undefined);assert.equal(result.fields.country,undefined);assert.ok(result.warnings.some(w=>/Conflicting city/.test(w)));
  const country=analyzeCapabilityIntake('We are Test, based in Canada. We offer CNC milling.');
  assert.equal(country.fields.city,undefined);assert.equal(country.fields.country,'CA');
});

test('compact alloys and material aliases normalize only explicit supported grades',()=>{
  const result=analyzeCapabilityIntake('We offer CNC milling in aluminum7075 and aluminium6061 and Delrin.');
  assert.equal(result.fields.materials,'Aluminum 7075, Aluminum 6061, Acetal');
  assert.equal(analyzeCapabilityIntake('We offer CNC milling in aluminum.').fields.materials,undefined);
});

test('qualification language never creates reviewed evidence or verified sites',()=>{
  const state=makeSeed(),analysis=analyzeCapabilityIntake(paragraph+' We are ISO 9001 certified and our site is verified.');
  const supplier=onboardSupplier(state,analysis.fields,at);
  assert.deepEqual(supplier.evidence,[]);assert.equal(supplier.site.status,'self-reported');assert.equal(supplier.site.reviewedBy,null);
  assert.ok(analysis.warnings.some(w=>/unverified/.test(w)));
  assert.equal(scoreSupplier(supplier,state.requirements[3],'2026-10-21').ready,false);
});

test('confirmed intake retains detached original extraction and correction provenance only on source',()=>{
  const state=makeSeed(),analysis=analyzeCapabilityIntake(paragraph);
  const supplier=onboardSupplier(state,{...analysis.fields,name:'Corrected <img src=x onerror=alert(1)>',intakeText:paragraph,intakeEvidence:analysis.evidence,intakeFields:analysis.fields},at);
  assert.equal(supplier.source.intakeText,paragraph);assert.deepEqual(supplier.source.intakeEvidence,analysis.evidence);
  assert.ok(supplier.source.corrections.some(c=>c.field==='name'&&c.extracted===analysis.fields.name&&c.confirmed===supplier.name));
  analysis.evidence.length=0;assert.ok(supplier.source.intakeEvidence.length);
  assert.deepEqual(supplier.evidence,[]);
  const html=packetHtml(buildPacket(state,supplier.id,at));assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;img'));
  const plain=onboardSupplier(makeSeed(),{name:'Plain',city:'Tulsa',processes:'Tube bending'},at);
  assert.equal(plain.source.intakeText,undefined);
});

test('ordinary buyer language exposes sample request process and grade as editable assumptions',()=>{
  const state=makeSeed(),query='Need a shop to make aluminum camera brackets';
  const result=discoverSuppliers(state.suppliers,query,{},state.requirements);
  assert.deepEqual(ids(result),['SUP-DEMO-001']);assert.deepEqual(result.interpretation.filters,{process:'CNC milling',material:'Aluminum 6061'});
  assert.ok(result.interpretation.notes.some(n=>n.includes('Sample request')&&n.includes('Aluminum 6061')));
  assert.ok(result.explanations['SUP-DEMO-001'].some(n=>n.includes('qualification')));assert.deepEqual(result.relaxed,[]);
  assert.deepEqual(searchSuppliers(state.suppliers,query,{},state.requirements),result.results);
});

test('generic aluminum alone does not silently assert a grade',()=>{
  const state=makeSeed(),result=discoverSuppliers(state.suppliers,'aluminium',{},state.requirements);
  assert.equal(result.interpretation.filters.material,'Aluminum');assert.equal(result.results.length,3);
  assert.ok(result.interpretation.notes.some(n=>n.includes('no specific alloy')));
});

test('aliases and known city or city-region phrases become strict explainable filters',()=>{
  const state=makeSeed(),result=discoverSuppliers(state.suppliers,'Find milling near Gainesville, Texas in 6061 aluminum',{},state.requirements);
  assert.deepEqual(ids(result),['SUP-DEMO-001']);assert.equal(result.interpretation.filters.location,'Gainesville, Texas');assert.equal(result.interpretation.filters.material,'Aluminum 6061');
  assert.equal(interpretSupplierQuery('5-axis',state.suppliers,state.requirements).filters.process,'5-axis milling');
});

test('explicit filters including empty strings override assumptions, and incompatible filters never relax',()=>{
  const state=makeSeed();
  assert.equal(discoverSuppliers(state.suppliers,'camera',{process:'CNC turning'},state.requirements).results.length,2);
  const cleared=discoverSuppliers(state.suppliers,'camera',{process:'',material:''},state.requirements);
  assert.equal(cleared.results.length,4);assert.deepEqual(cleared.interpretation.filters,{});
  const incompatible=discoverSuppliers(state.suppliers,'camera',{country:'CA'},state.requirements);
  assert.deepEqual(incompatible.results,[]);assert.deepEqual(incompatible.relaxed,[]);assert.equal(incompatible.interpretation.filters.country,'CA');
});

test('explicit selection resolves a multiple-process interpretation without silent relaxation',()=>{
  const state=makeSeed();
  assert.deepEqual(discoverSuppliers(state.suppliers,'CNC milling and CNC turning',{},state.requirements).results,[]);
  const selected=discoverSuppliers(state.suppliers,'CNC milling and CNC turning',{process:'CNC milling'},state.requirements);
  assert.equal(selected.results.length,2);assert.deepEqual(selected.interpretation.unsupported,[]);
});

test('unsupported processes, qualifications and negative query clauses return no irrelevant matches',()=>{
  const state=makeSeed();
  for(const query of ['Need titanium laser welding','CNC milling with AS9100D','CNC milling without aluminum6061']){
    const result=discoverSuppliers(state.suppliers,query,{},state.requirements);assert.deepEqual(result.results,[]);assert.ok(result.interpretation.unsupported.length);assert.deepEqual(result.relaxed,[]);
  }
});

test('arbitrary exact manufacturing processes and partial manufacturer names stay discoverable',()=>{
  const state=makeSeed(),supplier=onboardSupplier(state,{name:'Arbitrary Foundry',city:'Tulsa',country:'US',processes:'Titanium laser welding',materials:'Titanium'},at);
  assert.deepEqual(ids(discoverSuppliers(state.suppliers,'Need titanium laser welding')), [supplier.id]);
  assert.deepEqual(ids(discoverSuppliers(state.suppliers,'Arbitrary Foundry')), [supplier.id]);
  assert.equal(searchSuppliers(state.suppliers,'Red River').length,1);
});

test('an exact full manufacturer name takes precedence over process and location words in its name',()=>{
  const state=makeSeed(),supplier=onboardSupplier(state,{name:'Texas Turning (fictional)',city:'Austin',processes:'Laser cutting'},at);
  const result=discoverSuppliers(state.suppliers,supplier.name,{},state.requirements);
  assert.deepEqual(ids(result),[supplier.id]);assert.deepEqual(result.interpretation.filters,{});
  assert.deepEqual(discoverSuppliers(state.suppliers,supplier.name,{process:'CNC turning'},state.requirements).results,[]);
});

test('discovery remains read-only and cannot convert a self-reported profile into an eligible supplier',()=>{
  const state=makeSeed(),supplier=onboardSupplier(state,{name:'Unverified Camera Shop',city:'Gainesville',country:'US',processes:'CNC milling',materials:'6061',tolerance:'.0005',maxLotSize:500},at);
  const before=JSON.stringify(state);const result=discoverSuppliers(state.suppliers,'camera',{},state.requirements);
  assert.ok(ids(result).includes(supplier.id));assert.equal(JSON.stringify(state),before);assert.equal(scoreSupplier(supplier,state.requirements[0],'2026-10-21').ready,false);
});
