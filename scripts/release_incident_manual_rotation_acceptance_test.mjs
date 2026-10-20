import assert from "node:assert/strict";
import {generateKeyPairSync,createHash,sign} from "node:crypto";
import {anchorClaims} from "./release_incident_anchor_provenance.mjs";
import {manualRotationClaims,reconcileManualRotation} from "./release_incident_manual_rotation_acceptance.mjs";
const keypair=()=>generateKeyPairSync("ed25519");
const archive=keypair(),ownerKeys=keypair(),untrusted=keypair();
const publicPem=k=>k.publicKey.export({format:"pem",type:"spki"});
const fp=k=>createHash("sha256").update(k.publicKey.export({format:"der",type:"spki"})).digest("hex");
const signed=(claims,key)=>({algorithm:"Ed25519",claims,
 signature:sign(null,Buffer.from(JSON.stringify(claims)),key.privateKey).toString("base64")});
const prior={repository:"RosevearCreations/rosiedazzlers",issueNumber:22,
 key:"rosie/audit/22/old.json",versionId:"s3-version-old",expectedDigest:"a".repeat(64),previousHash:null,
 ownerApprovalRef:"issue:22",independentEvidenceRef:"external-record:22"};
const successor={...prior,key:"rosie/audit/22/new.json",versionId:"s3-version-new",expectedDigest:"b".repeat(64),
 previousHash:prior.expectedDigest,ownerApprovalRef:"issue:23",independentEvidenceRef:"external-record:23"};
const now=new Date("2026-10-20T12:00:00.000Z");
const priorAttestation=signed(anchorClaims(prior,{signedAt:"2026-10-19T12:00:00.000Z",signer:"archive-auditor"}),archive);
const successorAttestation=signed(anchorClaims(successor,{signedAt:"2026-10-19T13:00:00.000Z",signer:"archive-auditor"}),archive);
const priorReview={status:"VERIFIED",digest:prior.expectedDigest,versionId:prior.versionId,expiry:{status:"ACTIVE"}};
const successorReview={status:"VERIFIED",digest:successor.expectedDigest,versionId:successor.versionId,expiry:{status:"ACTIVE"}};
const params={prior,successor,priorAttestation,successorAttestation,
 priorPublicKeyPem:publicPem(archive),successorPublicKeyPem:publicPem(archive),
 priorFingerprint:fp(archive),successorFingerprint:fp(archive),
 priorReview,successorReview,ownerPublicKeyPem:publicPem(ownerKeys),
 ownerFingerprint:fp(ownerKeys),now};
assert.equal(reconcileManualRotation(params).status,"OWNER_SIGNED_APPROVAL_REQUIRED");
const claims=manualRotationClaims({prior,successor,approvalRef:"owner:rotation-585",
 issuedAt:"2026-10-19T14:00:00.000Z"});
const approval=signed(claims,ownerKeys);
const accepted=reconcileManualRotation({...params,ownerApproval:approval});
assert.equal(accepted.status,"MANUAL_ACCEPTANCE_READY");
assert.equal(accepted.externalWritePerformed,false);
assert.equal(accepted.successorVersionId,"s3-version-new");
assert.equal(reconcileManualRotation({...params,ownerApproval:signed(claims,untrusted)}).status,"HOLD");
assert.equal(reconcileManualRotation({...params,ownerApproval:approval,ownerFingerprint:fp(untrusted)}).status,"HOLD");
assert.equal(reconcileManualRotation({...params,ownerApproval:approval,
 ownerPublicKeyPem:publicPem(archive),ownerFingerprint:fp(archive)}).status,"HOLD");
assert.equal(reconcileManualRotation({...params,ownerApproval:approval,
 successorReview:{...successorReview,versionId:"latest-mutable-version"}}).status,"HOLD");
assert.equal(reconcileManualRotation({...params,ownerApproval:approval,
 successorReview:{...successorReview,expiry:{status:"EXPIRING_SOON"}}}).status,"HOLD");
assert.equal(reconcileManualRotation({...params,ownerApproval:approval,
 successor:{...successor,previousHash:"c".repeat(64)}}).status,"HOLD");
assert.equal(reconcileManualRotation({...params,ownerApproval:approval,
 successorAttestation:priorAttestation}).status,"HOLD");
assert.equal(reconcileManualRotation({...params,ownerApproval:approval,
 now:new Date("2026-10-19T13:30:00.000Z")}).status,"HOLD");
assert.throws(()=>manualRotationClaims({prior,successor:{...successor,versionId:prior.versionId},
 approvalRef:"owner:rotation-585",issuedAt:"2026-10-19T14:00:00.000Z"}),/distinct/);
console.log("Build 585 two immutable versions, chained attestation, signed owner manual approval and HOLD paths PASS");
