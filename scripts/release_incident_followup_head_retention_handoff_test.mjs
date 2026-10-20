import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {build596Fixture} from "./release_incident_receipt_exception_followup_test.mjs";
import {prepareFollowUpRetentionEnvelope,authorizeManualFollowUpRetention,
 retainManualFollowUpHead,verifyIndependentlyRetainedFollowUpHead,
 manualFollowUpHandoffClaims,verifyManualFollowUpHandoff}
 from "./release_incident_followup_head_retention_handoff.mjs";
const {params,owner,impostor,pem,fp,signature,now}=build596Fixture;
const hash=x=>createHash("sha256").update(canonicalBytes(x)).digest("hex");
const issuedAt="2026-10-20T09:59:40.000Z";
const envelope=await prepareFollowUpRetentionEnvelope({reconciliationArguments:params,issuedAt,now});
assert.equal(envelope.payload.schema,"rosie.receipt-followup-head-retention.v1");
assert.equal(envelope.payload.decisionCount,2);
assert.equal(envelope.payload.issueNumber,77);
assert.equal(envelope.payload.incidentRef,"issue:77");
assert.equal(envelope.payload.ownerSignerFingerprint,fp(owner));
assert.equal(envelope.contentDigest,hash(envelope.payload));
assert.equal(envelope.payload.followUpHeadDigest,params.independentFollowUpHeadPin.headDigest);
const key="rosie/owner-followup/77/head-597.json";
let createdCount=0,retentionMode="COMPLIANCE",retainedUntil="2027-03-01T00:00:00.000Z";
const records=new Map();
const adapter={capabilities:{immutableCreate:true,retentionLock:true,independentTrustRoot:true},
 async ensureReady(){return {versioning:"enabled",objectLock:"enabled"};},
 async createOnce(objectKey,record){
   if(records.has(objectKey))return {created:false};
   createdCount++;records.set(objectKey,structuredClone(record));
   return {created:true,versionId:"immutable-head-v597"};
 },
 async retentionEvidence(objectKey,versionId){
   assert.equal(versionId,"immutable-head-v597");
   return {key:objectKey,versionId,mode:retentionMode,retainUntil:retainedUntil};
 },
 async readVersioned(objectKey,versionId){
   assert.equal(versionId,"immutable-head-v597");
   return records.get(objectKey);
 }};
const authorization={event:"workflow_dispatch",actor:"RosevearCreations",confirmed:true,
 approvalRef:"owner:retention-approval-597",
 expectedContentDigest:envelope.contentDigest,
 expectedFollowUpHeadDigest:envelope.payload.followUpHeadDigest,
 trustedOwnerFingerprint:fp(owner)};
const inputs={reconciliationArguments:params,issuedAt,now,
 adapter,objectKey:key,authorization,minRetentionDays:30};
assert.equal(authorizeManualFollowUpRetention({authorization,envelope}),true);
const attempt=change=>assert.rejects(retainManualFollowUpHead({...inputs,...change}));
await attempt({authorization:{...authorization,confirmed:false}});
await attempt({authorization:{...authorization,event:"schedule"}});
await attempt({authorization:{...authorization,actor:"stranger"}});
await attempt({authorization:{...authorization,expectedContentDigest:"f".repeat(64)}});
await attempt({adapter:{capabilities:{immutableCreate:true}}});
await attempt({minRetentionDays:20});
await attempt({reconciliationArguments:{...params,independentFollowUpHeadPin:null}});
assert.equal(createdCount,0);
const retained=await retainManualFollowUpHead(inputs);
assert.equal(retained.status,"WORM_FOLLOWUP_HEAD_EXTERNAL_PIN_PENDING");
assert.equal(retained.requiresIndependentExternalPin,true);
assert.equal(createdCount,1);
await attempt({});
const independentObjectPin={objectKey:key,versionId:retained.versionId,
 recordDigest:retained.recordDigest,followUpHeadDigest:retained.followUpHeadDigest,
 evidenceReceiptDigest:retained.evidenceReceiptDigest,exportDigest:retained.exportDigest,
 externalReference:"offline-owner-log:immutable-head-597"};
const verifyInputs={reconciliationArguments:params,issuedAt,adapter,independentObjectPin,now};
const verified=await verifyIndependentlyRetainedFollowUpHead(verifyInputs);
assert.equal(verified.status,"INDEPENDENTLY_PINNED_FOLLOWUP_HEAD_RETAINED");
assert.equal(verified.recordDigest,retained.recordDigest);
assert.equal(verified.issueNumber,77);
assert.equal(verified.externalWritePerformed,false);
await assert.rejects(verifyIndependentlyRetainedFollowUpHead({...verifyInputs,
 independentObjectPin:{...independentObjectPin,recordDigest:"f".repeat(64)}}),/pinned/);
await assert.rejects(verifyIndependentlyRetainedFollowUpHead({...verifyInputs,
 independentObjectPin:null}),/pinned/);
retentionMode="GOVERNANCE";
await assert.rejects(verifyIndependentlyRetainedFollowUpHead(verifyInputs),/COMPLIANCE/);
retentionMode="COMPLIANCE";
retainedUntil="2026-10-19T12:00:00.000Z";
await assert.rejects(verifyIndependentlyRetainedFollowUpHead(verifyInputs),/expired/);
retainedUntil="2027-03-01T00:00:00.000Z";
const claim1=manualFollowUpHandoffClaims({retained:verified,action:"REQUEST_MANUAL_RECONCILIATION",
 handoffRef:"owner:handoff-597-a",issuedAt:"2026-10-20T09:59:45.000Z"});
const receipt1=signature(claim1,owner),digest1=hash(receipt1);
const claim2=manualFollowUpHandoffClaims({retained:verified,action:"ACKNOWLEDGE_OPEN_EXCEPTION",
 handoffRef:"owner:handoff-597-b",issuedAt:"2026-10-20T09:59:50.000Z",
 previousHandoffDigest:digest1});
const receipt2=signature(claim2,owner),digest2=hash(receipt2);
const independentHandoffHeadPin={headDigest:digest2,receiptCount:2,
 recordDigest:verified.recordDigest,followUpHeadDigest:verified.followUpHeadDigest,
 issueNumber:77,externalReference:"offline-owner-log:handoff-597"};
const handoffArgs={retentionVerification:verifyInputs,
 ownerPublicKeyPem:pem(owner),pinnedOwnerFingerprint:fp(owner),
 receipts:[receipt1,receipt2],independentHandoffHeadPin,now};
const handoff=await verifyManualFollowUpHandoff(handoffArgs);
assert.equal(handoff.status,"SIGNED_MANUAL_FOLLOWUP_HANDOFF_VERIFIED");
assert.equal(handoff.handoffCount,2);
assert.equal(handoff.liveExceptionStatus,"UNCHANGED");
assert.equal(handoff.auditHoldCleared,false);
assert.equal(handoff.automaticClosure,false);
assert.equal(handoff.externalWritePerformed,false);
const check=x=>assert.rejects(verifyManualFollowUpHandoff({...handoffArgs,...x}));
await check({receipts:[receipt2]});
await check({receipts:[receipt1]});
await check({receipts:[receipt1,receipt1]});
await check({receipts:[receipt1,signature(claim2,impostor)]});
await check({receipts:[receipt1,{...receipt2,claims:{...claim2,action:"DEFER_MANUAL_REVIEW"}}]});
await check({ownerPublicKeyPem:pem(impostor)});
await check({pinnedOwnerFingerprint:fp(impostor)});
await check({independentHandoffHeadPin:null});
await check({independentHandoffHeadPin:{...independentHandoffHeadPin,headDigest:"f".repeat(64)}});
await check({retentionVerification:{...verifyInputs,independentObjectPin:null}});
assert.throws(()=>manualFollowUpHandoffClaims({retained:verified,
 action:"CLOSE_AUDIT_HOLD",handoffRef:"owner:bad",
 issuedAt:"2026-10-20T09:59:55.000Z"}),/HOLD/);
assert.throws(()=>manualFollowUpHandoffClaims({retained:{...verified,status:"VERIFIED"},
 action:"REQUEST_MANUAL_RECONCILIATION",handoffRef:"owner:bad",
 issuedAt:"2026-10-20T09:59:55.000Z"}),/HOLD/);
console.log("Build 597 manual-only WORM follow-up head, external pins and signed no-close owner handoff PASS");

// Build 598 reuses synthetic pinned WORM and signed manual owner handoff evidence.
export const build597Fixture={handoffArgs,owner,impostor,pem,fp,signature,now};
