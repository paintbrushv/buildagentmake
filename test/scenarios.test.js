import test from 'node:test';import assert from 'node:assert/strict';
import {makeSeed,demoSuppliers,scenarios} from '../scenarios.js';import {scoreSupplier} from '../domain.js';
for(const [i,id] of [[0,'SUP-DEMO-001'],[1,'SUP-DEMO-002'],[2,'SUP-DEMO-003']])test(`${scenarios[i].part}: intended supplier passes every required check`,()=>{const fits=demoSuppliers.filter(s=>scoreSupplier(s,scenarios[i],'2026-10-21').ready);assert.deepEqual(fits.map(s=>s.id),[id]);});
test('clevis begins blocked for all suppliers',()=>{assert.ok(demoSuppliers.every(s=>!scoreSupplier(s,scenarios[3],'2026-10-21').ready));});
test('workspace reset seeds are independent',()=>{const a=makeSeed(),b=makeSeed();a.suppliers[0].evidence[0].status='expired';a.requirements[0].quantity=5;assert.equal(b.suppliers[0].evidence[0].status,'verified');assert.equal(b.requirements[0].quantity,100);assert.equal(demoSuppliers[0].evidence[0].status,'verified');});
