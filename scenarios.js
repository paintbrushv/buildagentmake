import {SCHEMA_VERSION} from './domain.js';
const checks=['Buyer-approved drawing and acceptance criteria','Material traceability and first article plan','Supplier-confirmed capacity, price and lead time'];
const request=(id,part,process,material,tolerance,quantity,qualification,story)=>({id,revision:1,drawingRevision:'DEMO-A',part,process,material,maxToleranceInches:tolerance,quantity,qualification,story,customer:'Prairie Survey Robotics (fictional)',dueDate:'2026-11-20',usManufacturingRequired:true,sourceId:`INTAKE-${id}`,sourceNote:'Fictional commercial inspection-drone program',captured:'2026-10-21',checks:[...checks]});
export const scenarios=[
 request('REQ-UAS-BRACKET','Camera mounting bracket','CNC milling','Aluminum 6061',0.001,100,'ISO 9001:2015','Find a machine shop for a camera bracket. Every required capability check must pass before a person approves RFQ drafting.'),
 request('REQ-UAS-STANDOFF','Electronics stack standoffs','CNC turning','Aluminum 6061',0.001,1600,'ISO 9001:2015','A larger production lot changes the shortlist. Recorded turning and capacity determine which supplier fits.'),
 request('REQ-UAS-TRAY','Electronics isolation tray','CNC milling','Acetal',0.003,80,'ISO 9001:2015','Match the requested polymer as well as the manufacturing process. Missing material support stays visible.'),
 request('REQ-UAS-CLEVIS','Landing-gear clevis','5-axis milling','Aluminum 7075',0.001,200,'AS9100D','Resolve an expired qualification: open a follow-up, review a new synthetic evidence packet, approve the next step, and export the record.')
];
const ev=(id,kind,status,siteId)=>({id,kind,status,siteId,sourceRef:`DEMO-CERT-${id}`,sourceLabel:'Synthetic certificate packet',observed:'2026-10-18',validFrom:'2026-01-01',validUntil:status==='expired'?'2026-10-01':'2027-10-01',scopeConfirmed:status==='verified',verifiedBy:status==='verified'?'Demo quality reviewer':null,reviewedAt:'2026-10-18T12:00:00Z',note:'Fictional qualification evidence. No real certificate attached.'});
const shop=(id,name,city,processes,materials,tol,cap,qual)=>({id,name,description:'Fictional domestic manufacturing capability profile',synthetic:true,recordType:'reviewed-demo',site:{id:`SITE-${id}`,city,region:'Texas',country:'US',status:'reviewed',sourceRef:`DEMO-SITE-${id}`,reviewedBy:'Demo quality reviewer',reviewedAt:'2026-10-18T12:00:00Z'},capabilities:{processes,materials,maxToleranceInches:tol,maxLotSize:cap},source:{id:`DEMO-CAP-${id}`,label:'Synthetic supplier capability card',url:null,observed:'2026-10-18'},evidence:qual.map(([kind,status],i)=>ev(`${id}-${i+1}`,kind,status,`SITE-${id}`))});
export const demoSuppliers=[
 shop('SUP-DEMO-001','Northline Precision (fictional)','Gainesville',['CNC milling','CNC turning'],['Aluminum 6061'],0.0008,1200,[['ISO 9001:2015','verified']]),
 shop('SUP-DEMO-002','Red River Toolworks (fictional)','Muenster',['CNC turning','5-axis milling'],['Aluminum 6061','Aluminum 7075'],0.0005,2000,[['ISO 9001:2015','verified'],['AS9100D','expired']]),
 shop('SUP-DEMO-003','Texoma Polymer Works (fictional)','Sherman',['CNC milling'],['Acetal'],0.002,500,[['ISO 9001:2015','verified']]),
 shop('SUP-DEMO-004','Prairie Airframe Components (fictional)','Denton',['5-axis milling'],['Aluminum 7075'],0.0008,400,[['AS9100D','review']])
];
export const makeSeed=()=>({schemaVersion:SCHEMA_VERSION,selectedRequirementId:scenarios[0].id,requirements:structuredClone(scenarios),suppliers:structuredClone(demoSuppliers),decisions:[],followups:[],activity:[]});
export const sampleCard=`Manufacturer: Lone Oak Micro Manufacturing (fictional)
Location: Gainesville, Texas
Country: US
Processes: 5 axis CNC milling, CNC turning
Materials: 7075 aluminum, 6061 aluminum
Tolerance: 0.0005
Capacity: 300
Source: DEMO-CAPABILITY-CARD-501
Description: Fictional precision machining profile for a commercial drone component demo.`;
