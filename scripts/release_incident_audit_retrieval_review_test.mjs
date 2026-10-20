import assert from "node:assert/strict";
import {createAuditSnapshot} from "./release_incident_audit_snapshot.mjs";
import {reviewTrustedAudit,retentionExpiry,compareArchivedIssue,validateOwnerEvidence} from "./release_incident_audit_retrieval_review.mjs";
const sha="a".repeat(40),owner="RosevearCreations",body="RD-REMEDIATION-RECEIPT ";
const decision={incidentSha:sha,decisionId:"incident-583",action:"observe",owner,reason:"Owner review",state:"PROPOSED"};
const comments=[{id:15,user:{login:owner},body:body+JSON.stringify(decision),updated_at:"2026-10-18T12:00:00Z"}];
const snapshot=createAuditSnapshot({comments,owner,repository:"RosevearCreations/rosiedazzlers",issueNumber:22});
const manifest={key:"rosie/release-incident/22/evidence.json",versionId:"s3-version-583",
  expectedDigest:snapshot.digest,previousHash:null,ownerApprovalRef:"issue:22",
  independentEvidenceRef:"owner-record:583",repository:"RosevearCreations/rosiedazzlers",issueNumber:22};
const until="2027-12-01T00:00:00Z",now=new Date("2026-10-19T00:00:00Z");
const adapter={
  async retentionEvidence(key,version){assert.equal(key,manifest.key);assert.equal(version,manifest.versionId);
    return {versionId:version,mode:"COMPLIANCE",retainUntil:until};},
  async readVersioned(key,version){assert.equal(version,manifest.versionId);
    return {snapshot,ownerApprovalRef:manifest.ownerApprovalRef};}
};
assert.equal(validateOwnerEvidence(manifest).key,manifest.key);
assert.throws(()=>validateOwnerEvidence({...manifest,expectedDigest:"bad"}),/HOLD/);
assert.throws(()=>validateOwnerEvidence({...manifest,independentEvidenceRef:""}),/HOLD/);
assert.throws(()=>validateOwnerEvidence({...manifest,versionId:"null"}),/HOLD/);
let result=await reviewTrustedAudit({adapter,manifest,comments,now});
assert.equal(result.status,"VERIFIED");
assert.equal(result.digest,snapshot.digest);
assert.equal(result.expiry.status,"ACTIVE");
const later=new Date("2027-11-20T00:00:00Z");
result=await reviewTrustedAudit({adapter,manifest,comments,now:later});
assert.equal(result.status,"REVIEW");
assert.equal(result.expiry.status,"EXPIRING_SOON");
result=await reviewTrustedAudit({adapter,manifest,comments,now:new Date("2027-12-02T00:00:00Z")});
assert.equal(result.status,"HOLD");
assert.equal(result.expiry.status,"EXPIRED");
assert.equal((await reviewTrustedAudit({adapter,manifest:{...manifest,expectedDigest:"b".repeat(64)},comments,now})).status,"HOLD");
const amended=[{...comments[0],body:"tampered"}];
assert.equal((await reviewTrustedAudit({adapter,manifest,comments:amended,now})).status,"HOLD");
assert.equal((await reviewTrustedAudit({adapter,manifest,comments:[],now})).status,"HOLD");
const newItem={id:16,user:{login:"outsider"},body:"hello",updated_at:"2026-10-19"};
result=await reviewTrustedAudit({adapter,manifest,comments:[...comments,newItem],now});
assert.equal(result.status,"REVIEW");
assert.deepEqual(result.newCommentIds,[16]);
assert.deepEqual(compareArchivedIssue({snapshot,comments}).changed,[]);
assert.throws(()=>compareArchivedIssue({snapshot,comments:[...comments,comments[0]]}),/Duplicate/);
assert.throws(()=>retentionExpiry({retainUntil:"unknown",now}),/HOLD/);
await assert.rejects(reviewTrustedAudit({adapter:{},manifest,comments,now}),/HOLD/);
console.log("Build 583 pinned retrieval, expiry, drift, owner anchor and reconciliation PASS");
