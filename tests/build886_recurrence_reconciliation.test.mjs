import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileAudits886} from '../functions/api/_lib/roadside-recurrence-v886.js';
const now=Date.parse('2026-11-14T00:00:00Z'),sha='a'.repeat(64);
const record=(hours,run_id)=>({schema:'rosie885-original-continuity-audit-v1',
 run_id,recorded_at:new Date(now-hours*3600000).toISOString(),chain_state:'VERIFIED',
 latest_checkpoint_sha256:sha,sla:{'4h':'VERIFIED','24h':'VERIFIED','7d':'VERIFIED','30d':'VERIFIED'}});
const audits=[record(31*24,'1'),record(7*24,'2'),record(24,'3'),record(4,'4'),record(0,'5')];
const owner={original_owner_verified:true,recorded_at:new Date(now).toISOString(),
 audit_run_id:'5',latest_checkpoint_sha256:sha};
test('complete original evidence yields verified',()=>assert.equal(reconcileAudits886(audits,{now,ownerRenewal:owner}).state,'VERIFIED'));
test('missing owner renewal remains HOLD',()=>assert.match(reconcileAudits886(audits,{now}).reasons.join(),/OWNER_RENEWAL/));
test('duplicate original run is held',()=>assert.match(reconcileAudits886([...audits,record(1,'5')],{now,ownerRenewal:owner}).reasons.join(),/DUPLICATE/));
test('immature 30 day coverage is held',()=>assert.equal(reconcileAudits886([record(1,'5')],{now,ownerRenewal:owner}).horizons['30d'].state,'HOLD_IMMATURE'));
test('owner checkpoint mismatch is held',()=>assert.match(reconcileAudits886(audits,{now,ownerRenewal:{...owner,latest_checkpoint_sha256:'b'.repeat(64)}}).reasons.join(),/OWNER_RENEWAL/));
test('stale latest audit is held',()=>assert.match(reconcileAudits886(audits.slice(0,-1),{now,ownerRenewal:owner}).reasons.join(),/STALE/));
test('future timestamp is held',()=>assert.match(reconcileAudits886([...audits,record(-1,'6')],{now,ownerRenewal:owner}).reasons.join(),/FUTURE/));
