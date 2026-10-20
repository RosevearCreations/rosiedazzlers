import assert from "node:assert/strict";
import {createAuditSnapshot} from "./release_incident_audit_snapshot.mjs";
import {retainSnapshot,ownerAuditEvidence} from "./release_incident_trusted_retention.mjs";
const owner="RosevearCreations",sha="a".repeat(40);
const record={incidentSha:sha,decisionId:"incident-581",action:"observe",owner,reason:"review",state:"PROPOSED"};
const comments=[{id:1,user:{login:owner},body:"RD-REMEDIATION-RECEIPT "+JSON.stringify(record)}];
const snapshot=createAuditSnapshot({comments,owner,repository:"RosevearCreations/rosiedazzlers",issueNumber:1});
const store=new Map();
const adapter={capabilities:{immutableCreate:true,retentionLock:true,independentTrustRoot:true},
 async createOnce(key,value){if(store.has(key))return {created:false};store.set(key,structuredClone(value));return {created:true};},
 async read(key){return store.get(key)}};
await assert.rejects(retainSnapshot({snapshot,adapter:{...adapter,capabilities:{immutableCreate:true}},key:"audit/581",ownerApproval:{approved:true,reference:"approval:581"}}),/HOLD/);
await assert.rejects(retainSnapshot({snapshot,adapter,key:"audit/581",ownerApproval:{approved:false,reference:"approval:581"}}),/approval/);
const result=await retainSnapshot({snapshot,adapter,key:"audit/581",ownerApproval:{approved:true,reference:"approval:581"}});
assert.equal(result.status,"RETAINED");
assert.equal((await ownerAuditEvidence({adapter,key:"audit/581",expectedDigest:snapshot.digest})).status,"VERIFIED");
await assert.rejects(retainSnapshot({snapshot,adapter,key:"audit/581",ownerApproval:{approved:true,reference:"approval:581"}}),/unverified/);
assert.equal((await ownerAuditEvidence({adapter,key:"audit/581",expectedDigest:"b".repeat(64)})).status,"HOLD");
console.log("Build 581 trusted retention and owner audit controls PASS");
