import assert from "node:assert/strict";
import {generateKeyPairSync,createHash,sign} from "node:crypto";
import {anchorClaims} from "./release_incident_anchor_provenance.mjs";
import {manualRotationClaims} from "./release_incident_manual_rotation_acceptance.mjs";
import {HANDOFF_PREFIX,prepareHandoff,crossAnchorHistory} from "./release_incident_rotation_handoff_receipts.mjs";
import {canonicalBytes,digestRegister,verifyExternalRotationRegister,
 reconcileExternalRotationRegister,fetchExternalRotationRegister}
 from "./release_incident_external_rotation_register.mjs";
const pair=()=>generateKeyPairSync("ed25519");
const archive=pair(),owner=pair(),external=pair(),forger=pair();
const pem=k=>k.publicKey.export({format:"pem",type:"spki"});
const fingerprint=k=>createHash("sha256").update(k.publicKey.export({format:"der",type:"spki"})).digest("hex");
const signed=(claims,k)=>({algorithm:"Ed25519",claims,
 signature:sign(null,Buffer.from(JSON.stringify(claims)),k.privateKey).toString("base64")});
const before={repository:"RosevearCreations/rosiedazzlers",issueNumber:77,
 key:"rosie/audit/77/before.json",versionId:"version-before",expectedDigest:"a".repeat(64),
 previousHash:null,ownerApprovalRef:"owner:initial",independentEvidenceRef:"independent:before"};
const after={...before,key:"rosie/audit/77/after.json",versionId:"version-after",
 expectedDigest:"b".repeat(64),previousHash:before.expectedDigest,
 ownerApprovalRef:"owner:successor",independentEvidenceRef:"independent:after"};
const time=new Date("2026-10-20T06:00:00.000Z");
const evidence={prior:before,successor:after,
 priorAttestation:signed(anchorClaims(before,{signedAt:"2026-10-19T10:00:00.000Z",signer:"independent-archive"}),archive),
 successorAttestation:signed(anchorClaims(after,{signedAt:"2026-10-19T11:00:00.000Z",signer:"independent-archive"}),archive),
 priorPublicKeyPem:pem(archive),successorPublicKeyPem:pem(archive),
 priorFingerprint:fingerprint(archive),successorFingerprint:fingerprint(archive),
 ownerPublicKeyPem:pem(owner),ownerFingerprint:fingerprint(owner),
 ownerApproval:signed(manualRotationClaims({prior:before,successor:after,
 approvalRef:"owner:rotation-587",issuedAt:"2026-10-19T12:00:00.000Z"}),owner),
 priorReview:{status:"VERIFIED",digest:before.expectedDigest,versionId:before.versionId,expiry:{status:"ACTIVE"}},
 successorReview:{status:"VERIFIED",digest:after.expectedDigest,versionId:after.versionId,expiry:{status:"ACTIVE"}},
 now:time};
const handoff=prepareHandoff({evidence,issuedAt:"2026-10-20T05:00:00.000Z"});
const make=(r,id=101,author="RosevearCreations")=>({id,user:{login:author},
 created_at:"2026-10-20T05:00:00Z",updated_at:"2026-10-20T05:00:00Z",
 body:HANDOFF_PREFIX+JSON.stringify(r)});
const comments=[make(handoff)];
const history=crossAnchorHistory({comments,expectedIssueNumber:77});
const columns=["commentId","receiptDigest","priorDigest","successorDigest","evidenceDigest",
 "approvalRef","priorVersionId","successorVersionId"];
const record={schema:"rosie.external-rotation-register.v1",
 repository:"RosevearCreations/rosiedazzlers",issueNumber:77,sequence:1,
 previousRegisterDigest:null,headDigest:handoff.receiptDigest,receiptCount:1,
 entries:history.entries.map(e=>Object.fromEntries(columns.map(k=>[k,e[k]]))),
 issuedAt:"2026-10-20T05:10:00.000Z",registerRef:"outside:register-587"};
const issue= r=>({algorithm:"Ed25519",register:r,
 signature:sign(null,canonicalBytes(r),external.privateKey).toString("base64")});
const signedRegister=issue(record),externalPin={registerDigest:digestRegister(record),
 headDigest:handoff.receiptDigest,sequence:1,externalReference:"physical-owner-log:587"};
const inputs={signedRegister,publicKeyPem:pem(external),
 trustedFingerprint:fingerprint(external),externalPin,now:time};
assert.equal(verifyExternalRotationRegister(inputs).status,"PINNED_REGISTER_SIGNATURE_VERIFIED");
assert.equal(reconcileExternalRotationRegister({...inputs,comments,
 evidenceByReceiptDigest:new Map([[handoff.receiptDigest,evidence]]),
 trustedFingerprintsByReceiptDigest:new Map([[handoff.receiptDigest,
 {owner:fingerprint(owner),prior:fingerprint(archive),successor:fingerprint(archive)}]])}).status,
 "VERIFIED_EXTERNAL_REGISTER_AND_SIGNED_HANDOFFS");
assert.throws(()=>verifyExternalRotationRegister({...inputs,publicKeyPem:pem(forger)}),/fingerprint/);
assert.throws(()=>verifyExternalRotationRegister({...inputs,signedRegister:{
 ...signedRegister,signature:issue({...record,headDigest:"f".repeat(64)}).signature}}),/signature/);
assert.throws(()=>verifyExternalRotationRegister({...inputs,externalPin:{
 ...externalPin,registerDigest:"e".repeat(64)}}),/pin/);
assert.throws(()=>verifyExternalRotationRegister({...inputs,now:new Date("2026-10-19T00:00:00Z")}),/future/);
assert.throws(()=>verifyExternalRotationRegister({...inputs,previousPin:{sequence:1,
 registerDigest:"f".repeat(64),headDigest:handoff.receiptDigest}}),/chain|Genesis/);
assert.throws(()=>reconcileExternalRotationRegister({...inputs,comments:[],
 evidenceByReceiptDigest:new Map(),trustedFingerprintsByReceiptDigest:new Map()}),/head|count/);
const alteredComments=[make({...handoff,ownerFingerprint:"f".repeat(64)})];
assert.throws(()=>reconcileExternalRotationRegister({...inputs,comments:alteredComments,
 evidenceByReceiptDigest:new Map(),trustedFingerprintsByReceiptDigest:new Map()}),/hash mismatch/);
assert.throws(()=>reconcileExternalRotationRegister({...inputs,comments,
 evidenceByReceiptDigest:new Map(),trustedFingerprintsByReceiptDigest:new Map()}),/missing/);
assert.throws(()=>reconcileExternalRotationRegister({...inputs,comments,
 evidenceByReceiptDigest:new Map([[handoff.receiptDigest,evidence]]),
 trustedFingerprintsByReceiptDigest:new Map()}),/fingerprint/);
assert.throws(()=>reconcileExternalRotationRegister({...inputs,comments:[...comments,make(handoff,102,"attacker")],
 evidenceByReceiptDigest:new Map(),trustedFingerprintsByReceiptDigest:new Map()}),/Unauthorized/);
const updated={...record,sequence:2,previousRegisterDigest:externalPin.registerDigest};
const updatedPin={...externalPin,registerDigest:digestRegister(updated),sequence:2};
assert.equal(verifyExternalRotationRegister({...inputs,signedRegister:issue(updated),
 externalPin:updatedPin,previousPin:externalPin}).sequence,2);
assert.throws(()=>verifyExternalRotationRegister({...inputs,signedRegister:issue(updated),
 externalPin:updatedPin,previousPin:{...externalPin,registerDigest:"f".repeat(64)}}),/chain/);
await assert.rejects(fetchExternalRotationRegister({url:"http://register.example.org/latest"}),/HTTPS/);
await assert.rejects(fetchExternalRotationRegister({url:"https://api.github.com/repos/test"}),/HTTPS/);
const mock=async(url,opts)=>{
 assert.equal(opts.method,"GET");
 return {ok:true,headers:{get:()=>null},text:async()=>JSON.stringify(signedRegister)};
};
assert.deepEqual((await fetchExternalRotationRegister({
 url:"https://audits.example.org/rotation-587.json",request:mock})).register,record);
await assert.rejects(fetchExternalRotationRegister({
 url:"https://audits.example.org/rotation-587.json",request:async()=>({ok:false,status:403})}),/HTTP 403/);
console.log("Build 587 externally pinned Ed25519 register, signed rotation evidence, rollback, drift and independent fetch PASS");
