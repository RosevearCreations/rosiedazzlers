import assert from "node:assert/strict";
import {readFile,writeFile} from "node:fs/promises";
import {wormConfig,s3ComplianceAdapter} from "./release_incident_s3_worm_adapter.mjs";
import {createAuditSnapshot} from "./release_incident_audit_snapshot.mjs";
import {retainSnapshot,ownerAuditEvidence} from "./release_incident_trusted_retention.mjs";
const config=wormConfig({RD_WORM_BUCKET:"rd-independent-archive",RD_WORM_REGION:"ca-central-1",
  RD_WORM_ACCOUNT_ID:"123456789012",RD_WORM_RETENTION_DAYS:"90"});
assert.throws(()=>wormConfig({RD_WORM_BUCKET:"bad"}),/HOLD/);
const owner="RosevearCreations",sha="a".repeat(40);
const record={incidentSha:sha,decisionId:"incident-582",action:"observe",owner,reason:"review",state:"PROPOSED"};
const comments=[{id:1,user:{login:owner},body:"RD-REMEDIATION-RECEIPT "+JSON.stringify(record)}];
const snapshot=createAuditSnapshot({comments,owner,repository:"RosevearCreations/rosiedazzlers",issueNumber:1});
let stored="",mode="COMPLIANCE",locked=true,uploads=0,expires="2030-01-01T00:00:00Z";
const runner=async args=>{
  const cmd=args[1],find=flag=>args[args.indexOf(flag)+1];
  if(args[0]==="sts")return {Account:config.account};
  if(cmd==="get-object-lock-configuration")return {ObjectLockConfiguration:{ObjectLockEnabled:locked?"Enabled":"Disabled"}};
  if(cmd==="get-bucket-versioning")return {Status:"Enabled"};
  if(cmd==="put-object"){
    assert.equal(find("--if-none-match"),"*");
    assert.equal(find("--object-lock-mode"),"COMPLIANCE");
    uploads++;
    stored=await readFile(find("--body"),"utf8");
    return {VersionId:"version-1"};
  }
  if(cmd==="get-object-retention")return {Retention:{Mode:mode,RetainUntilDate:expires}};
  if(cmd==="head-object")return {VersionId:"version-1"};
  if(cmd==="get-object"){await writeFile(args[args.indexOf("--version-id")+2],stored);return {VersionId:"version-1"};}
  throw Error("Unexpected AWS request "+args.join(" "));
};
const adapter=s3ComplianceAdapter({config,run:runner,now:()=>new Date("2026-10-19T00:00:00Z")});
assert.equal((await adapter.ensureReady()).retentionMode,"COMPLIANCE");
const retained=await retainSnapshot({snapshot,adapter,key:"rosie/audit/582",ownerApproval:{approved:true,reference:"approval:582"}});
assert.equal(retained.status,"RETAINED");
assert.equal(uploads,1);
assert.equal((await ownerAuditEvidence({adapter,key:"rosie/audit/582",expectedDigest:snapshot.digest})).status,"VERIFIED");
const retentionProof=await adapter.retentionEvidence("rosie/audit/582","version-1");
assert.equal(retentionProof.mode,"COMPLIANCE");
assert.equal(retentionProof.versionId,"version-1");
const storedVersion=await adapter.readVersioned("rosie/audit/582","version-1");
assert.equal(storedVersion.snapshot.digest,snapshot.digest);
await assert.rejects(adapter.readVersioned("rosie/audit/582","null"),/VersionId/);
expires="2026-10-20T00:00:00Z";
await assert.rejects(adapter.createOnce("rosie/audit/short",{snapshot}),/COMPLIANCE|locked/);
expires="2030-01-01T00:00:00Z";
mode="GOVERNANCE";
await assert.rejects(adapter.read("rosie/audit/582"),/COMPLIANCE/);
mode="COMPLIANCE";
locked=false;
await assert.rejects(s3ComplianceAdapter({config,run:runner}).ensureReady(),/Object Lock/);
console.log("Build 582 WORM config, COMPLIANCE mode, independent account, immutable upload and readback PASS");
