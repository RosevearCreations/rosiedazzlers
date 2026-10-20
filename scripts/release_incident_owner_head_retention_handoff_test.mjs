import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {canonicalBytes} from "./release_incident_external_rotation_register.mjs";
import {build590Fixture} from "./release_incident_owner_escalation_review_test.mjs";
import {verifiedReviewHeadEnvelope,retainOwnerReviewHead,verifyRetainedOwnerReviewHead,
  manualExceptionHandoffClaims,verifyManualExceptionHandoff}
  from "./release_incident_owner_head_retention_handoff.mjs";
const {args,owner,impostor,pem,fp,signature,now}=build590Fixture;
const issuedAt="2026-10-20T07:45:00.000Z";
const head=verifiedReviewHeadEnvelope({...args,issuedAt,now});
assert.equal(head.payload.schema,"rosie.owner-review-head-retention.v1");
assert.equal(head.payload.reviewReceiptCount,2);
assert.equal(head.payload.reviewHeadDigest,args.independentReviewHeadPin.headDigest);
const records=new Map();
let creates=0,lockMode="COMPLIANCE",until="2027-02-01T00:00:00.000Z";
const adapter={capabilities:{immutableCreate:true,retentionLock:true,independentTrustRoot:true},
 async ensureReady(){return {retentionMode:"COMPLIANCE"};},
 async createOnce(key,record){
   if(records.has(key))return {created:false};
   creates++;records.set(key,structuredClone(record));
   return {created:true,versionId:"locked-version-591"};
 },
 async retentionEvidence(key,versionId){
   assert.equal(versionId,"locked-version-591");
   return {key,versionId,mode:lockMode,retainUntil:until};
 },
 async readVersioned(key,versionId){
   assert.equal(versionId,"locked-version-591");
   return records.get(key);
 }};
const objectKey="rosie/owner-review/77/owner-head-591.json";
const authorization={event:"workflow_dispatch",actor:"RosevearCreations",
  confirmed:true,approvalRef:"owner:manual-retention-591",
  expectedDigest:head.contentDigest,
  expectedHeadDigest:head.payload.reviewHeadDigest,
  trustedOwnerFingerprint:head.payload.ownerSignerFingerprint};
const inputs={...args,adapter,objectKey,authorization,issuedAt,now,minRetentionDays:30};
await assert.rejects(retainOwnerReviewHead({...inputs,
  authorization:{...authorization,event:"schedule"}}),/manual/);
await assert.rejects(retainOwnerReviewHead({...inputs,
  authorization:{...authorization,actor:"stranger"}}),/manual/);
await assert.rejects(retainOwnerReviewHead({...inputs,
  authorization:{...authorization,expectedHeadDigest:"f".repeat(64)}}),/manual/);
await assert.rejects(retainOwnerReviewHead({...inputs,
  adapter:{capabilities:{immutableCreate:true}}}),/WORM/);
assert.equal(creates,0);
const retained=await retainOwnerReviewHead(inputs);
assert.equal(retained.status,"WORM_RETAINED_EXTERNAL_PIN_PENDING");
assert.equal(retained.independentPinRequired,true);
assert.equal(retained.reviewHeadDigest,head.payload.reviewHeadDigest);
assert.equal(creates,1);
await assert.rejects(retainOwnerReviewHead(inputs),/VersionId not confirmed/);
const independentStoredObjectPin={objectKey,versionId:retained.versionId,
  recordDigest:retained.recordDigest,reviewHeadDigest:retained.reviewHeadDigest,
  externalReference:"owner-offline:stored-head-591"};
const verifyArgs={...args,issuedAt,adapter,independentStoredObjectPin,now};
const proven=await verifyRetainedOwnerReviewHead(verifyArgs);
assert.equal(proven.status,"INDEPENDENTLY_PINNED_OWNER_HEAD_RETAINED");
assert.equal(proven.externalWritePerformed,false);
assert.equal(proven.recordDigest,retained.recordDigest);
await assert.rejects(verifyRetainedOwnerReviewHead({...verifyArgs,
  independentStoredObjectPin:{...independentStoredObjectPin,
    recordDigest:"f".repeat(64)}}),/pin unavailable/);
await assert.rejects(verifyRetainedOwnerReviewHead({...verifyArgs,
  independentStoredObjectPin:null}),/pin unavailable/);
lockMode="GOVERNANCE";
await assert.rejects(verifyRetainedOwnerReviewHead(verifyArgs),/COMPLIANCE/);
lockMode="COMPLIANCE";
until="2026-10-19T00:00:00.000Z";
await assert.rejects(verifyRetainedOwnerReviewHead(verifyArgs),/COMPLIANCE/);
until="2027-02-01T00:00:00.000Z";
const claims=manualExceptionHandoffClaims({retainedProof:proven,
  issueNumber:77,incidentRef:"issue:77",action:"REQUEST_MANUAL_REVIEW",
  handoffRef:"owner:handoff-591-a",issuedAt:"2026-10-20T08:05:00.000Z"});
const first=signature(claims,owner);
const firstDigest=createHash("sha256").update(canonicalBytes(first)).digest("hex");
const later=manualExceptionHandoffClaims({retainedProof:proven,
  issueNumber:77,incidentRef:"issue:77",action:"ACKNOWLEDGE_OPEN_HOLD",
  handoffRef:"owner:handoff-591-b",issuedAt:"2026-10-20T08:10:00.000Z",
  previousHandoffDigest:firstDigest});
const second=signature(later,owner);
const secondDigest=createHash("sha256").update(canonicalBytes(second)).digest("hex");
const handoffPin={headDigest:secondDigest,receiptCount:2,
  recordDigest:proven.recordDigest,externalReference:"owner-offline:handoff-pin-591"};
const handoffArgs={retentionVerification:verifyArgs,issueNumber:77,
  receipts:[first,second],ownerPublicKeyPem:pem(owner),
  pinnedOwnerFingerprint:fp(owner),
  independentHandoffHeadPin:handoffPin,
  now:new Date("2026-10-20T09:00:00.000Z")};
const verifiedHandoff=await verifyManualExceptionHandoff(handoffArgs);
assert.equal(verifiedHandoff.status,"SIGNED_MANUAL_EXCEPTION_HANDOFF_VERIFIED");
assert.equal(verifiedHandoff.ownerReviewRequired,true);
assert.equal(verifiedHandoff.auditHoldCleared,false);
assert.equal(verifiedHandoff.automaticClosure,false);
await assert.rejects(verifyManualExceptionHandoff({...handoffArgs,
  receipts:[second]}),/predecessor changed|mismatch/);
await assert.rejects(verifyManualExceptionHandoff({...handoffArgs,
  receipts:[first]}),/head pin missing/);
await assert.rejects(verifyManualExceptionHandoff({...handoffArgs,
  receipts:[first,signature(later,impostor)]}),/signature/);
await assert.rejects(verifyManualExceptionHandoff({...handoffArgs,
  receipts:[first,first]}),/predecessor changed|timestamp rollback/);
await assert.rejects(verifyManualExceptionHandoff({...handoffArgs,
  independentHandoffHeadPin:{...handoffPin,headDigest:"f".repeat(64)}}),/head pin missing/);
await assert.rejects(verifyManualExceptionHandoff({...handoffArgs,
  retentionVerification:{...verifyArgs,independentStoredObjectPin:{
    ...independentStoredObjectPin,recordDigest:"f".repeat(64)}}}),/pin unavailable/);
assert.throws(()=>manualExceptionHandoffClaims({retainedProof:proven,
  issueNumber:77,incidentRef:"issue:77",action:"CLOSE_AUDIT_HOLD",
  handoffRef:"owner:bad",issuedAt:"2026-10-20T08:05:00.000Z"}),/HOLD/);
assert.throws(()=>manualExceptionHandoffClaims({retainedProof:{
  ...proven,status:"VERIFIED"},issueNumber:77,incidentRef:"issue:77",
  action:"REQUEST_MANUAL_REVIEW",handoffRef:"owner:bad",
  issuedAt:"2026-10-20T08:05:00.000Z"}),/HOLD/);
console.log("Build 591 independent WORM head retention, separate object pin, owner handoff signatures and fail-closed governance PASS");
