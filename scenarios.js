import {SCHEMA_VERSION} from './domain.js';
const checks=['Buyer-approved drawing and acceptance criteria','Material traceability and first article plan','Supplier-confirmed capacity, price and lead time'];
const request=(id,part,process,material,tolerance,quantity,qualification,story)=>({id,revision:1,drawingRevision:({ 'REQ-UAS-BRACKET':'PSR-CM-101','REQ-UAS-STANDOFF':'PSR-ES-102','REQ-UAS-TRAY':'PSR-ET-103','REQ-UAS-CLEVIS':'PSR-LG-104' }[id]+' Rev A'),part,process,material,maxToleranceInches:tolerance,quantity,qualification,story,customer:'Prairie Survey Robotics',dueDate:'2026-11-20',usManufacturingRequired:true,sourceId:`INTAKE-${id}`,sourceNote:'Scout inspection drone · sample project',captured:'2026-10-21',checks:[...checks]});
export const scenarios=[
 request('REQ-UAS-BRACKET','Camera mounting bracket','CNC milling','Aluminum 6061',0.001,100,'ISO 9001:2015','Find a machine shop for a camera bracket. Every required capability check must pass before a person approves RFQ drafting.'),
 request('REQ-UAS-STANDOFF','Electronics stack standoffs','CNC turning','Aluminum 6061',0.001,1600,'ISO 9001:2015','A larger production lot changes the shortlist. Recorded turning and capacity determine which supplier fits.'),
 request('REQ-UAS-TRAY','Electronics isolation tray','CNC milling','Acetal',0.003,80,'ISO 9001:2015','Match the requested polymer as well as the manufacturing process. Missing material support stays visible.'),
 request('REQ-UAS-CLEVIS','Landing-gear clevis','5-axis milling','Aluminum 7075',0.001,200,'AS9100D','Source 200 landing-gear joints for the Scout inspection drone. Compare five-axis machining and AS9100D records, then confirm whether an out-of-date certificate copy has been renewed.')
];
const ev=(id,kind,status,siteId)=>({id,kind,status,siteId,sourceRef:`CERT-${id.replace("SUP-DEMO-", "")}`,sourceLabel:'Supplier certificate record',observed:'2026-10-18',validFrom:'2026-01-01',validUntil:status==='expired'?'2026-10-01':'2027-10-01',scopeConfirmed:status==='verified',verifiedBy:status==='verified'?'Casey Turner':null,reviewedAt:'2026-10-18T12:00:00Z',note:status==='expired'?'The certificate copy on file ended October 1. Ask the supplier for renewal details; current certification status is unconfirmed.':status==='review'?'Certificate details received; scope and manufacturing-site review pending.':'Scope, site and validity recorded in the quality review.'});
const shop=(id,name,city,processes,materials,tol,cap,qual)=>({id,name,description:'Domestic machining capability profile',synthetic:true,recordType:'reviewed-demo',site:{id:`SITE-${id}`,city,region:'Texas',country:'US',status:'reviewed',sourceRef:`SITE-DECL-${id.replace("SUP-DEMO-", "")}`,reviewedBy:'Casey Turner',reviewedAt:'2026-10-18T12:00:00Z'},capabilities:{processes,materials,maxToleranceInches:tol,maxLotSize:cap},source:{id:`CAP-${id.replace("SUP-DEMO-", "")}`,label:'Manufacturer capability statement',url:null,observed:'2026-10-18'},evidence:qual.map(([kind,status],i)=>ev(`${id}-${i+1}`,kind,status,`SITE-${id}`))});
export const demoSuppliers=[
 shop('SUP-DEMO-001','Northline Precision','Gainesville',['CNC milling','CNC turning'],['Aluminum 6061'],0.0008,1200,[['ISO 9001:2015','verified']]),
 shop('SUP-DEMO-002','Red River Toolworks','Muenster',['CNC turning','5-axis milling'],['Aluminum 6061','Aluminum 7075'],0.0005,2000,[['ISO 9001:2015','verified'],['AS9100D','expired']]),
 shop('SUP-DEMO-003','Texoma Polymer Works','Sherman',['CNC milling'],['Acetal'],0.002,500,[['ISO 9001:2015','verified']]),
 shop('SUP-DEMO-004','Prairie Airframe Components','Denton',['5-axis milling'],['Aluminum 7075'],0.0008,400,[['AS9100D','review']])
];
export const makeSeed=()=>({schemaVersion:SCHEMA_VERSION,selectedRequirementId:scenarios[0].id,requirements:structuredClone(scenarios),suppliers:structuredClone(demoSuppliers),decisions:[],followups:[],activity:[]});
export const sampleCard=`Manufacturer: Lone Oak Micro Manufacturing
Location: Gainesville, Texas
Country: US
Processes: 5 axis CNC milling, CNC turning
Materials: 7075 aluminum, 6061 aluminum
Tolerance: 0.0005
Capacity: 300
Source: CAP-LO-501
Description: Precision machining for commercial drone components.`;
