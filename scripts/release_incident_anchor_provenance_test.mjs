import assert from "node:assert/strict";
import {generateKeyPairSync,createHash,sign} from "node:crypto";
import {anchorClaims,verifyAnchorProvenance,rotationDecisionWorkbench} from "./release_incident_anchor_provenance.mjs";
const {publicKey,privateKey}=generateKeyPairSync("ed25519");
const pem=publicKey.export({format:"pem",type:"spki"});
const trustedFingerprint=createHash("sha256").update(publicKey.export({format:"der",type:"spki"})).digest("hex");
const m={repository:"RosevearCreations/rosiedazzlers",issueNumber:11,
 key:"rosie/audit/archive-584.json",versionId:"version-584",expectedDigest:"a".repeat(64),
 previousHash:null,ownerApprovalRef:"issue:11",independentEvidenceRef:"owner-log:584"};
const claims=anchorClaims(m,{signedAt:"2026-10-19T12:00:00.000Z",signer:"external-auditor"});
const attestation={algorithm:"Ed25519",claims,signature:sign(null,Buffer.from(JSON.stringify(claims)),privateKey).toString("base64")};
const args={manifest:m,attestation,publicKeyPem:pem,trustedFingerprint,now:new Date("2026-10-20T00:00:00Z")};
const proof=verifyAnchorProvenance(args);
assert.equal(proof.verified,true);
assert.throws(()=>verifyAnchorProvenance({...args,trustedFingerprint:"b".repeat(64)}),/fingerprint/);
assert.throws(()=>verifyAnchorProvenance({...args,manifest:{...m,expectedDigest:"c".repeat(64)}}),/mismatch/);
assert.throws(()=>verifyAnchorProvenance({...args,attestation:{...attestation,signature:"A".repeat(86)+"=="}}),/signature/);
assert.throws(()=>verifyAnchorProvenance({...args,now:new Date("2026-10-18T00:00:00Z")}),/future/);
const review={status:"VERIFIED",expiry:{status:"ACTIVE"}};
assert.equal(rotationDecisionWorkbench({manifest:m,provenance:proof,review}).status,"OWNER_REVIEW_REQUIRED");
assert.equal(rotationDecisionWorkbench({manifest:m,provenance:proof,review:{status:"HOLD"}}).status,"HOLD");
const decision={actor:"RosevearCreations",reference:"issue:12",action:"PROPOSE_ROTATION"};
const successor={...m,versionId:"version-585",key:"rosie/audit/archive-585.json",
 expectedDigest:"b".repeat(64),previousHash:m.expectedDigest};
const proposal=rotationDecisionWorkbench({manifest:m,provenance:proof,review,ownerDecision:decision,successor});
assert.equal(proposal.status,"ROTATION_PROPOSED");
assert.equal(proposal.requiresIndependentSignature,true);
assert.equal(rotationDecisionWorkbench({manifest:m,provenance:proof,review,ownerDecision:decision,
 successor:{...successor,previousHash:"c".repeat(64)}}).status,"HOLD");
assert.equal(rotationDecisionWorkbench({manifest:m,provenance:proof,review,ownerDecision:{...decision,actor:"stranger"},successor}).status,"HOLD");
assert.equal(rotationDecisionWorkbench({manifest:m,provenance:proof,review,
 ownerDecision:{...decision,action:"DEFER"}}).status,"DEFERRED");
console.log("Build 584 cryptographic provenance and owner rotation workbench PASS");
