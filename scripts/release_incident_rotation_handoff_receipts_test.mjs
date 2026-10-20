import assert from "node:assert/strict";
import {generateKeyPairSync,createHash,sign} from "node:crypto";
import {anchorClaims} from "./release_incident_anchor_provenance.mjs";
import {manualRotationClaims} from "./release_incident_manual_rotation_acceptance.mjs";
import {HANDOFF_PREFIX,prepareHandoff,parseHandoff,crossAnchorHistory,
 persistRotationHandoff,reconcileCrossAnchorProofHistory} from "./release_incident_rotation_handoff_receipts.mjs";
const archive=generateKeyPairSync("ed25519"),ownerSigner=generateKeyPairSync("ed25519");
const pem=k=>k.publicKey.export({format:"pem",type:"spki"});
const fp=k=>createHash("sha256").update(k.publicKey.export({format:"der",type:"spki"})).digest("hex");
const signClaims=(claims,k)=>({algorithm:"Ed25519",claims,
  signature:sign(null,Buffer.from(JSON.stringify(claims)),k.privateKey).toString("base64")});
const base={repository:"RosevearCreations/rosiedazzlers",issueNumber:77,
  key:"rosie/audit/77/first.json",versionId:"version-one",expectedDigest:"a".repeat(64),
  previousHash:null,ownerApprovalRef:"issue:77",independentEvidenceRef:"external:one"};
const second={...base,key:"rosie/audit/77/second.json",versionId:"version-two",
  expectedDigest:"b".repeat(64),previousHash:base.expectedDigest,
  ownerApprovalRef:"issue:78",independentEvidenceRef:"external:two"};
const third={...base,key:"rosie/audit/77/third.json",versionId:"version-three",
  expectedDigest:"c".repeat(64),previousHash:second.expectedDigest,
  ownerApprovalRef:"issue:79",independentEvidenceRef:"external:three"};
const now=new Date("2026-10-20T06:00:00Z");
const proof=(prior,successor,priorDate,successorDate,approvalDate,reference)=>{
  const priorAttestation=signClaims(anchorClaims(prior,{signedAt:priorDate,signer:"independent-auditor"}),archive);
  const successorAttestation=signClaims(anchorClaims(successor,{signedAt:successorDate,signer:"independent-auditor"}),archive);
  const ownerApproval=signClaims(manualRotationClaims({prior,successor,approvalRef:reference,issuedAt:approvalDate}),ownerSigner);
  return {prior,successor,priorAttestation,successorAttestation,
    priorPublicKeyPem:pem(archive),successorPublicKeyPem:pem(archive),
    priorFingerprint:fp(archive),successorFingerprint:fp(archive),
    ownerPublicKeyPem:pem(ownerSigner),ownerFingerprint:fp(ownerSigner),ownerApproval,now,
    priorReview:{status:"VERIFIED",digest:prior.expectedDigest,versionId:prior.versionId,expiry:{status:"ACTIVE"}},
    successorReview:{status:"VERIFIED",digest:successor.expectedDigest,versionId:successor.versionId,expiry:{status:"ACTIVE"}}};
};
const evidence=proof(base,second,"2026-10-19T10:00:00.000Z","2026-10-19T11:00:00.000Z",
  "2026-10-19T12:00:00.000Z","owner:rotation-77");
const record=prepareHandoff({evidence,issuedAt:"2026-10-20T05:00:00.000Z"});
assert.equal(record.previousReceiptDigest,null);
assert.equal(record.priorDigest,base.expectedDigest);
assert.equal(record.successorVersionId,second.versionId);
const make=(r,id,login="RosevearCreations")=>({id,created_at:"2026-10-20T05:00:00Z",
  updated_at:"2026-10-20T05:00:00Z",user:{login},body:HANDOFF_PREFIX+JSON.stringify(r),
  html_url:"https://github.com/RosevearCreations/rosiedazzlers/issues/77#issuecomment-"+id});
const first=make(record,101);
assert.equal(parseHandoff(first).record.receiptDigest,record.receiptDigest);
assert.equal(crossAnchorHistory({comments:[first],expectedIssueNumber:77}).status,"OWNER_REVIEW_REQUIRED");
assert.equal(crossAnchorHistory({comments:[first],independentHeadDigest:record.receiptDigest}).status,"INDEPENDENTLY_ANCHORED");
assert.throws(()=>crossAnchorHistory({comments:[first],independentHeadDigest:"c".repeat(64)}),/External owner anchor/);
assert.throws(()=>parseHandoff({...first,updated_at:"2026-10-20T05:30:00Z"}),/edited/);
assert.throws(()=>parseHandoff(make({...record,ownerFingerprint:"b".repeat(64)},102)),/hash mismatch/);
const secondEvidence=proof(second,third,"2026-10-19T11:00:00.000Z","2026-10-19T12:00:00.000Z",
  "2026-10-19T13:00:00.000Z","owner:rotation-78");
const secondReceipt=prepareHandoff({evidence:secondEvidence,previousReceiptDigest:record.receiptDigest,
  issuedAt:"2026-10-20T05:30:00.000Z"});
assert.equal(crossAnchorHistory({comments:[make(secondReceipt,102),first],expectedIssueNumber:77}).entries.length,2);
assert.throws(()=>crossAnchorHistory({comments:[first,make({...secondReceipt,previousReceiptDigest:"c".repeat(64)},102)]),/hash mismatch|diverged/);
const outsider=make(record,90,"unauthorized");
assert.deepEqual(crossAnchorHistory({comments:[outsider,first]}).unauthorized,[90]);
const independentEvidence=new Map([[record.receiptDigest,evidence],[secondReceipt.receiptDigest,secondEvidence]]);
const independentPins=new Map([[record.receiptDigest,{owner:fp(ownerSigner),prior:fp(archive),successor:fp(archive)}],
 [secondReceipt.receiptDigest,{owner:fp(ownerSigner),prior:fp(archive),successor:fp(archive)}]]);
const reconciled=reconcileCrossAnchorProofHistory({
 comments:[make(secondReceipt,102),first],independentHeadDigest:secondReceipt.receiptDigest,
 evidenceByReceiptDigest:independentEvidence,trustedFingerprintsByReceiptDigest:independentPins});
assert.equal(reconciled.status,"VERIFIED_WITH_EXTERNAL_HEAD_AND_SIGNATURES");
assert.equal(reconciled.verifiedReceipts,2);
assert.throws(()=>reconcileCrossAnchorProofHistory({
 comments:[first],independentHeadDigest:record.receiptDigest,
 evidenceByReceiptDigest:new Map(),trustedFingerprintsByReceiptDigest:independentPins}),/missing/);
assert.throws(()=>reconcileCrossAnchorProofHistory({
 comments:[first],independentHeadDigest:record.receiptDigest,
 evidenceByReceiptDigest:independentEvidence,trustedFingerprintsByReceiptDigest:new Map()}),/fingerprint/);

const authorization={event:"workflow_dispatch",actor:"RosevearCreations",confirmed:true,
 reference:"owner:rotation-77",trustedOwnerFingerprint:fp(ownerSigner),
 trustedPriorFingerprint:fp(archive),trustedSuccessorFingerprint:fp(archive)};
let written=null,postCalls=0;
const request=async (url,opts)=>{
  if(url.includes("comments?"))return {ok:true,json:async()=>[]};
  if(opts?.method==="POST"){
    postCalls++;
    assert.equal(opts.headers.Authorization,"Bearer test-token");
    written={id:777,user:{login:"RosevearCreations"},body:JSON.parse(opts.body).body,
      created_at:"2026-10-20T05:00:00Z",updated_at:"2026-10-20T05:00:00Z"};
    return {status:201,json:async()=>written};
  }
  if(url.includes("/issues/comments/777"))return {ok:true,json:async()=>written};
  throw Error("Unexpected GitHub API request "+url);
};
const params={evidence,owner:"RosevearCreations",repo:"rosiedazzlers",
  issueNumber:77,token:"test-token",authorization,request,
  now:()=>"2026-10-20T05:00:00.000Z"};
const persisted=await persistRotationHandoff(params);
assert.equal(persisted.status,"PERSISTED_MUTABLE_GITHUB_RECEIPT");
assert.equal(persisted.receiptDigest,record.receiptDigest);
assert.equal(postCalls,1);
await assert.rejects(persistRotationHandoff({...params,authorization:{...authorization,actor:"outsider"}}),/HOLD/);
await assert.rejects(persistRotationHandoff({...params,authorization:{...authorization,trustedOwnerFingerprint:"0".repeat(64)}}),/HOLD/);
await assert.rejects(persistRotationHandoff({...params,authorization:{...authorization,reference:"issue:wrong"}}),/HOLD|invalid/);
await assert.rejects(persistRotationHandoff({...params,evidence:{...evidence,ownerApproval:{...evidence.ownerApproval,signature:"invalid"}}}),/HOLD/);
await assert.rejects(persistRotationHandoff({...params,request:async(url,opts)=>{
  if(url.includes("comments?"))return {ok:true,json:async()=>[]};
  if(opts?.method==="POST")return {status:403};
}}),/HTTP 403/);
console.log("Build 586 durable-but-mutable GitHub owner receipts, signed rotation acceptance, chained history and readback PASS");
