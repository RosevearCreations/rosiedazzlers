/** Build 581 — trusted retention contract and owner evidence operations.
 * Storage adapter must guarantee conditional create, independent authorization,
 * WORM/retention controls and durable read. Never silently downgrade to mutable storage.
 */
import {verifyAuditSnapshot} from "./release_incident_audit_snapshot.mjs";
const SHA=/^[0-9a-f]{64}$/;
const KEY=/^[A-Za-z0-9][A-Za-z0-9._/-]{2,180}$/;
const APPROVAL_REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
export function validateRetentionAdapter(adapter) {
  if(!adapter||adapter.capabilities?.immutableCreate!==true||
      adapter.capabilities?.retentionLock!==true||
      adapter.capabilities?.independentTrustRoot!==true||
      typeof adapter.createOnce!=="function"||typeof adapter.read!=="function")
    throw Error("Trusted WORM retention adapter unavailable: HOLD");
  return adapter;
}
export async function retainSnapshot({snapshot,previousHash=null,adapter,key,ownerApproval}) {
  validateRetentionAdapter(adapter);
  if(!KEY.test(key||"")||!ownerApproval||ownerApproval.approved!==true||
     !APPROVAL_REF.test(ownerApproval.reference||"")||!verifyAuditSnapshot(snapshot,previousHash))
    throw Error("Snapshot or explicit owner retention approval invalid");
  const immutableRecord={snapshot,ownerApprovalRef:ownerApproval.reference};
  const result=await adapter.createOnce(key,immutableRecord);
  if(result?.created!==true) throw Error("Conditional immutable write unverified: HOLD");
  const stored=await adapter.read(key);
  if(JSON.stringify(stored)!==JSON.stringify(immutableRecord))
    throw Error("Read-back mismatch: retention not accepted");
  return {status:"RETAINED",key,digest:snapshot.digest,approvalRef:ownerApproval.reference};
}
export async function ownerAuditEvidence({adapter,key,expectedDigest}) {
  validateRetentionAdapter(adapter);
  if(!KEY.test(key||"")||!SHA.test(expectedDigest||"")) throw Error("Valid key and expected digest required");
  const record=await adapter.read(key);
  const snapshot=record?.snapshot;
  if(!snapshot||snapshot.digest!==expectedDigest||!verifyAuditSnapshot(snapshot,snapshot.previousHash))
    return {status:"HOLD",reason:"Trusted snapshot integrity unavailable or differs"};
  return {status:"VERIFIED",digest:expectedDigest,ownerApprovalRef:record.ownerApprovalRef};
}
