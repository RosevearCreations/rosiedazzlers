import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {CONTRACT_854,MASTER_RESPONSE_KIND_854,canonicalMaster854,verifyMaster854,
  slaEvidence854,reconcileMaster854} from '../functions/api/_lib/jobday-atomic-854.js';
const crypto=globalThis.crypto||webcrypto;
const b64=v=>Buffer.from(v).toString('base64url');
const kp=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const old=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const device=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const consumer=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const pub=async k=>b64(await crypto.subtle.exportKey('raw',k.publicKey));
const sign=async(k,s)=>b64(await crypto.subtle.sign('Ed25519',k.privateKey,new TextEncoder().encode(s)));
const now=Date.now(),iso=t=>new Date(t).toISOString();
const source='a'.repeat(40),digest='b'.repeat(64);
const booking='11111111-1111-4111-8111-111111111111',project='22222222-2222-4222-8222-222222222222';
const post={id:'33333333-3333-4333-8333-333333333333',platform:'instagram'};
const auditId='44444444-4444-4444-8444-444444444444',caseId='rosie854case',incident='rosie854incident';
const env={CF_PAGES_COMMIT_SHA:source,
  ROSIE_AIDATA_INCIDENT_RESPONSE_ED25519_PUBLIC_KEY_854:await pub(kp),
  ROSIE_AIDATA_REPLAY_LEDGER_ED25519_PUBLIC_KEY_853:await pub(old),
  ROSIE_AIDATA_CONSUMER_DECISION_ED25519_PUBLIC_KEY_852:await pub(consumer),
  ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851:await pub(device)};
const r={version:1,kind:MASTER_RESPONSE_KIND_854,source_id:'rosiedazzlers',source_contract:CONTRACT_854,
  source_revision:source,consumer_id:'ai-data-platform',receiver_id:'master-response-reviewer',
  booking_id:booking,project_id:project,post_id:post.id,platform:post.platform,
  case_reference:caseId,incident_reference:incident,prior_ledger_sha256:digest,
  prior_ledger_sequence:16,prior_owner_incident_audit_id:auditId,
  disposition:'hold_response_acknowledged',permissions:'review_only_no_master_grant',
  nonce:'independentmaster854nonce123456789',issued_at:iso(now-25000),
  observed_at:iso(now-15000),expires_at:iso(now+180000),signer_id:'independent-incident-response'};
const context={bookingId:booking,projectId:project,post,caseReference:caseId,incidentReference:incident,
  ledgerDigest:digest,ledgerSequence:16,ownerAuditId:auditId,actor:'originalowner@rosie.ca',now};
const signature=await sign(kp,canonicalMaster854(r));
const ok=await verifyMaster854(env,r,signature,context);
assert.equal(ok.ok,true,JSON.stringify(ok));
assert.equal(ok.master_connection,'HOLD');assert.equal(ok.master_runtime_ack,false);
assert.equal(ok.durable_master_transport_verified,false);
assert.equal((await verifyMaster854(env,{...r,source_revision:'c'.repeat(40)},signature,context)).ok,false);
assert.equal((await verifyMaster854(env,{...r,disposition:'CONNECTED'},signature,context)).ok,false);
assert.equal((await verifyMaster854(env,{...r,permissions:'consumer_write'},signature,context)).ok,false);
assert.equal((await verifyMaster854(env,{...r,prior_ledger_sha256:'e'.repeat(64)},signature,context)).ok,false);
assert.equal((await verifyMaster854(env,{...r,nonce:'short'},signature,context)).ok,false);
assert.equal((await verifyMaster854(env,r,signature,{...context,ownerAuditId:'55555555-5555-4555-8555-555555555555'})).ok,false);
assert.equal((await verifyMaster854(env,r,signature,{...context,incidentReference:'wrongincident'})).ok,false);
assert.equal((await verifyMaster854(env,r,signature,{...context,ledgerSequence:17})).ok,false);
assert.equal((await verifyMaster854(env,r,await sign(old,canonicalMaster854(r)),context)).ok,false);
assert.equal((await verifyMaster854({...env,ROSIE_AIDATA_INCIDENT_RESPONSE_ED25519_PUBLIC_KEY_854:env.ROSIE_AIDATA_REPLAY_LEDGER_ED25519_PUBLIC_KEY_853},r,signature,context)).ok,false);
assert.equal((await verifyMaster854({...env,ROSIE_AIDATA_CONSUMER_DECISION_ED25519_PUBLIC_KEY_852:''},r,signature,context)).ok,false);
assert.equal((await verifyMaster854(env,r,signature,{...context,now:now+3600000})).ok,false);
assert.throws(()=>canonicalMaster854({...r,connected:true}));
const start=now-2*3600000;
let sla=slaEvidence854({incidentRecordedAt:iso(start),priority:'CRITICAL',route:'OWNER_CRITICAL_RECALL_REVIEW',observedAt:iso(now-3600000),now});
assert.equal(sla.decision,'SLA_REVIEW_ONLY');
assert.equal(sla.review_target_hours,4);assert.equal(sla.status,'SIGNED_RESPONSE_WITHIN_TARGET');
assert.equal(sla.master_transport_verified,false);
sla=slaEvidence854({incidentRecordedAt:iso(now-8*3600000),priority:'CRITICAL',route:'OWNER_CRITICAL_RECALL_REVIEW',observedAt:iso(now),now});
assert.equal(sla.status,'SIGNED_RESPONSE_AFTER_TARGET');
assert.equal(sla.review_target_hours,4);
sla=slaEvidence854({incidentRecordedAt:iso(now-20*3600000),priority:'HIGH',route:'SUPERVISOR_ESCALATION_REVIEW',now});
assert.equal(sla.status,'OVERDUE_REVIEW');assert.equal(sla.review_target_hours,12);
assert.equal(slaEvidence854({incidentRecordedAt:iso(now-3600000),priority:'CRITICAL',route:'SUPERVISOR_ESCALATION_REVIEW',now}).decision,'HOLD');
assert.equal(slaEvidence854({incidentRecordedAt:iso(now+3600000),priority:'CRITICAL',route:'OWNER_CRITICAL_RECALL_REVIEW',now}).decision,'HOLD');
assert.equal(slaEvidence854({incidentRecordedAt:'not-a-time',priority:'MONITOR',route:'OWNER_SCOPED_FOLLOWUP_REVIEW',now}).decision,'HOLD');
const snap={id:'66666666-6666-4666-8666-666666666666',kind:'ledger_snapshot'};
const sourceAudit={id:auditId};
const decision=reconcileMaster854({verdict:ok,sla:slaEvidence854({incidentRecordedAt:iso(start),priority:'CRITICAL',route:'OWNER_CRITICAL_RECALL_REVIEW',observedAt:iso(now-3600000),now}),atomicSnapshot:snap,incidentAudit:sourceAudit});
assert.equal(decision.decision,'SIGNED_MASTER_RESPONSE_REVIEW_ONLY');
assert.equal(decision.master_connection,'HOLD');assert.equal(decision.notification_sent,false);
assert.equal(reconcileMaster854({verdict:ok,atomicSnapshot:snap,incidentAudit:sourceAudit}).decision,'HOLD');
assert.equal(reconcileMaster854({verdict:ok,sla:{decision:'SLA_REVIEW_ONLY'},incidentAudit:sourceAudit}).decision,'HOLD');
console.log('Rosie 854 independent Master signature, exact ledger lineage, bounded SLA evidence and HOLD regression PASS');
