/** Build 583: independently anchored, exact-version S3 WORM retrieval and owner audit review.
 * Read only. A manifest MUST be supplied from a separately controlled owner evidence record.
 * Neither this review nor an ordinary GitHub variable is a cryptographic owner signature.
 */
import {createHash} from "node:crypto";
import {verifyAuditSnapshot} from "./release_incident_audit_snapshot.mjs";
const SHA=/^[0-9a-f]{64}$/;
const REFERENCE=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const KEY=/^[A-Za-z0-9][A-Za-z0-9._/-]{2,180}$/;
const MAX=250,DAY=86400000;
export function validateOwnerEvidence(manifest){
  if(!manifest||!KEY.test(manifest.key||"")||!SHA.test(manifest.expectedDigest||"")||
     !REFERENCE.test(manifest.ownerApprovalRef||"")||
     !REFERENCE.test(manifest.independentEvidenceRef||"")||
     typeof manifest.versionId!=="string"||!manifest.versionId.trim()||
     manifest.versionId.length>256||manifest.versionId==="null"||
     !/^RosevearCreations\/rosiedazzlers$/.test(manifest.repository||"")||
     !Number.isSafeInteger(manifest.issueNumber)||manifest.issueNumber<1||
     !(manifest.previousHash===null||SHA.test(manifest.previousHash)))
    throw Error("Independently recorded exact version, digest and owner evidence required: HOLD");
  return Object.freeze({...manifest});
}
export function retentionExpiry({retainUntil,now=new Date(),warningDays=30}){
  if(!Number.isInteger(warningDays)||warningDays<1||warningDays>365||!Number.isFinite(Date.parse(retainUntil||"")))
    throw Error("Retention deadline or expiry policy unavailable: HOLD");
  const remainingMs=Date.parse(retainUntil)-new Date(now).getTime();
  if(!Number.isFinite(remainingMs))throw Error("Current review time unavailable: HOLD");
  return {status:remainingMs<=0?"EXPIRED":remainingMs<=warningDays*DAY?"EXPIRING_SOON":"ACTIVE",
    daysRemaining:Math.ceil(remainingMs/DAY),retainUntil};
}
export function compareArchivedIssue({snapshot,comments,owner="RosevearCreations"}){
  if(!Array.isArray(comments)||comments.length>MAX||!Array.isArray(snapshot?.source)||
     snapshot.source.length>MAX)throw Error("Complete bounded GitHub issue comments required: HOLD");
  const ids=new Set();
  for(const c of comments){
    if(!Number.isSafeInteger(c?.id)||ids.has(c.id))throw Error("Duplicate or invalid comment ID: HOLD");
    ids.add(c.id);
  }
  const current=new Map(comments.map(c=>[c.id,c]));
  const seen=new Set(),changed=[];
  for(const original of snapshot.source){
    if(!Number.isSafeInteger(original?.id)||seen.has(original.id))
      throw Error("Archived comment identity is incomplete: HOLD");
    seen.add(original.id);
    const c=current.get(original.id);
    if(!c||c.user?.login!==original.author||
       (c.updated_at||null)!==original.updatedAt||
       createHash("sha256").update(String(c.body||"")).digest("hex")!==original.bodyDigest)
      changed.push(original.id);
  }
  const added=comments.filter(c=>!seen.has(c.id)).map(c=>c.id);
  const nonOwner=comments.filter(c=>c.user?.login!==owner).map(c=>c.id);
  return {changed,added,nonOwner,sourceCount:snapshot.source.length};
}
export async function reviewTrustedAudit({adapter,manifest,comments,now=new Date(),warningDays=30}){
  const m=validateOwnerEvidence(manifest);
  if(!adapter||typeof adapter.retentionEvidence!=="function"||
     typeof adapter.readVersioned!=="function")
    throw Error("Exact-version independently locked provider unavailable: HOLD");
  const [lock,stored]=await Promise.all([
    adapter.retentionEvidence(m.key,m.versionId),
    adapter.readVersioned(m.key,m.versionId)
  ]);
  const s=stored?.snapshot;
  if(lock?.versionId!==m.versionId||lock?.mode!=="COMPLIANCE"||
     !s||s.digest!==m.expectedDigest||s.repository!==m.repository||
     s.issueNumber!==m.issueNumber||stored.ownerApprovalRef!==m.ownerApprovalRef||
     !verifyAuditSnapshot(s,m.previousHash))
    return {status:"HOLD",reason:"Exact-version owner anchor, snapshot or approval mismatch"};
  const expiry=retentionExpiry({retainUntil:lock.retainUntil,now,warningDays});
  if(expiry.status==="EXPIRED")
    return {status:"HOLD",reason:"Object Lock retention has expired; owner review required",expiry};
  const comparison=compareArchivedIssue({snapshot:s,comments});
  if(comparison.changed.length)
    return {status:"HOLD",reason:"Previously archived issue evidence changed or disappeared",
      changedCommentIds:comparison.changed,expiry};
  if(expiry.status==="EXPIRING_SOON"||comparison.added.length)
    return {status:"REVIEW",reason:expiry.status==="EXPIRING_SOON"?
      "Retention expires within warning window; owner must decide renewal":"New issue comments require independent owner reconciliation",
      newCommentIds:comparison.added,expiry};
  return {status:"VERIFIED",reason:"Owner anchor, exact S3 object version, lock and archived source evidence agree",
    digest:m.expectedDigest,versionId:m.versionId,independentEvidenceRef:m.independentEvidenceRef,
    expiry,sourceCount:comparison.sourceCount};
}
