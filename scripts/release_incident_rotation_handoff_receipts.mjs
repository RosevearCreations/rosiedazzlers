/** Build 586: authorized owner rotation handoff receipts in GitHub issues.
 * Issue comments are durable but MUTABLE. Never call them WORM, or independent
 * audit evidence without an externally pinned receipt-head digest.
 * No AWS calls, signing, automated approvals or retention modifications.
 */
import {createHash} from "node:crypto";
import {reconcileManualRotation} from "./release_incident_manual_rotation_acceptance.mjs";
import {validateOwnerEvidence} from "./release_incident_audit_retrieval_review.mjs";
import {collectIssueComments} from "./release_incident_audit_snapshot.mjs";
export const HANDOFF_PREFIX="RD-ROTATION-HANDOFF-V1 ";
const SHA=/^[a-f0-9]{64}$/;
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,180}$/;
const MAX=250;
function canonical(value){
  if(Array.isArray(value)) return value.map(canonical);
  if(value&&typeof value==="object"){
    const result={};
    for(const k of Object.keys(value).sort())result[k]=canonical(value[k]);
    return result;
  }
  return value;
}
export const evidenceDigest=evidence=>createHash("sha256")
  .update(JSON.stringify(canonical(evidence))).digest("hex");
function digestPayload(payload){return evidenceDigest(payload);}
export function prepareHandoff({evidence,previousReceiptDigest=null,issuedAt=new Date().toISOString()}){
  if(previousReceiptDigest!==null&&!SHA.test(previousReceiptDigest))throw Error("Independent previous receipt digest invalid: HOLD");
  if(!Number.isFinite(Date.parse(issuedAt))||new Date(issuedAt).toISOString()!==issuedAt)
    throw Error("Canonical receipt time required: HOLD");
  const verification=reconcileManualRotation(evidence);
  if(verification.status!=="MANUAL_ACCEPTANCE_READY")
    throw Error("Signed two-version owner acceptance not verified: HOLD");
  const prior=validateOwnerEvidence(evidence.prior),next=validateOwnerEvidence(evidence.successor);
  const approvalRef=verification.approvalRef;
  if(!REF.test(approvalRef||""))throw Error("Missing signed manual approval reference: HOLD");
  const data={schema:"rosie.rotation-handoff.v1",repository:prior.repository,
    issueNumber:prior.issueNumber,priorDigest:prior.expectedDigest,successorDigest:next.expectedDigest,
    priorKey:prior.key,successorKey:next.key,priorVersionId:prior.versionId,
    successorVersionId:next.versionId,approvalRef,
    ownerFingerprint:verification.ownerKeyFingerprint,previousReceiptDigest,
    independentPriorRef:prior.independentEvidenceRef,
    independentSuccessorRef:next.independentEvidenceRef,
    evidenceDigest:evidenceDigest({
      prior,successor:next,priorAttestation:evidence.priorAttestation,
      successorAttestation:evidence.successorAttestation,ownerApproval:evidence.ownerApproval
    }),issuedAt};
  return {...data,receiptDigest:digestPayload(data)};
}
export function parseHandoff(comment,owner="RosevearCreations"){
  const body=String(comment?.body||"");
  if(!body.startsWith(HANDOFF_PREFIX))return null;
  if(comment?.user?.login!==owner||body.length>5000)throw Error("Unauthorized or oversized rotation receipt: HOLD");
  if(!Number.isSafeInteger(comment.id)||comment.id<1)throw Error("Comment identity not trustworthy: HOLD");
  if(comment.created_at&&comment.updated_at&&
     Date.parse(comment.updated_at)>Date.parse(comment.created_at)+1000)
    throw Error("Owner rotation receipt has been edited: HOLD");
  let record;
  try{record=JSON.parse(body.slice(HANDOFF_PREFIX.length));}
  catch{throw Error("Malformed signed owner rotation receipt: HOLD")}
  if(!record||Array.isArray(record)||record.schema!=="rosie.rotation-handoff.v1"||
    !SHA.test(record.receiptDigest||"")||
    !SHA.test(record.priorDigest||"")||!SHA.test(record.successorDigest||"")||
    !SHA.test(record.evidenceDigest||"")||!SHA.test(record.ownerFingerprint||"")||
    !(record.previousReceiptDigest===null||SHA.test(record.previousReceiptDigest||""))||
    !REF.test(record.approvalRef||"")||
    record.repository!=="RosevearCreations/rosiedazzlers"||
    !Number.isSafeInteger(record.issueNumber)||record.issueNumber<1||
    !REF.test(record.independentPriorRef||"")||!REF.test(record.independentSuccessorRef||"")||
    typeof record.priorKey!=="string"||typeof record.successorKey!=="string"||
    typeof record.priorVersionId!=="string"||typeof record.successorVersionId!=="string"||
    !Number.isFinite(Date.parse(record.issuedAt||"")))
    throw Error("Invalid rotation handoff receipt schema: HOLD");
  const {receiptDigest,...fields}=record;
  if(digestPayload(fields)!==receiptDigest)throw Error("Rotation receipt body hash mismatch: HOLD");
  return {record,commentId:comment.id,url:comment.html_url||null};
}
export function crossAnchorHistory({comments,owner="RosevearCreations",independentHeadDigest=null,
  expectedIssueNumber=null}){
  if(!Array.isArray(comments)||comments.length>MAX)throw Error("Complete bounded handoff history required: HOLD");
  if(independentHeadDigest!==null&&!SHA.test(independentHeadDigest))
    throw Error("Independent owner receipt head digest invalid: HOLD");
  let last=null;const entries=[],unauthorized=[];
  for(const comment of [...comments].sort((a,b)=>a.id-b.id)){
    if(!String(comment?.body||"").startsWith(HANDOFF_PREFIX))continue;
    if(comment?.user?.login!==owner){unauthorized.push(comment.id);continue;}
    const parsed=parseHandoff(comment,owner),r=parsed.record;
    if(expectedIssueNumber!==null&&r.issueNumber!==expectedIssueNumber)
      throw Error("Receipt bound to wrong incident issue: HOLD");
    if(last){
      if(r.previousReceiptDigest!==last.receiptDigest||r.priorDigest!==last.successorDigest||
         r.priorKey!==last.successorKey||r.priorVersionId!==last.successorVersionId||
         parsed.commentId<=entries[entries.length-1].commentId)
        throw Error("Gap, duplicate or diverged owner receipt and audit anchor history: HOLD");
    }else if(r.previousReceiptDigest!==null){
      throw Error("First receipt must have independent genesis link: HOLD");
    }
    entries.push({commentId:parsed.commentId,receiptDigest:r.receiptDigest,
      priorDigest:r.priorDigest,successorDigest:r.successorDigest,
      evidenceDigest:r.evidenceDigest,approvalRef:r.approvalRef,
      priorVersionId:r.priorVersionId,successorVersionId:r.successorVersionId,
      url:parsed.url});
    last=r;
  }
  const headDigest=last?.receiptDigest||null;
  if(independentHeadDigest!==null&&headDigest!==independentHeadDigest)
    throw Error("External owner anchor does not match current receipt head: HOLD");
  return {status:entries.length===0?"EMPTY":independentHeadDigest?"INDEPENDENTLY_ANCHORED":"OWNER_REVIEW_REQUIRED",
    headDigest,entries,unauthorized};
}
/** Explicit manual GitHub issue-comment write. Avoid storing raw signed evidence or secrets. */
export async function persistRotationHandoff({
  evidence,owner="RosevearCreations",repo="rosiedazzlers",issueNumber,token,
  authorization,request=fetch,now=()=>new Date().toISOString()
}){
  if(owner!=="RosevearCreations"||repo!=="rosiedazzlers"||
     !Number.isSafeInteger(issueNumber)||issueNumber<1||typeof token!=="string"||!token||
     authorization?.event!=="workflow_dispatch"||
     authorization?.actor!==owner||authorization?.confirmed!==true||
     !REF.test(authorization.reference||""))
    throw Error("Manually authorized owner write and authenticated issue required: HOLD");
  if(authorization.reference!==evidence?.ownerApproval?.claims?.approvalRef)
    throw Error("Manual GitHub approval does not match independently signed consent: HOLD");
  const opts={owner,repo,issueNumber,token,request};
  const comments=await collectIssueComments(opts);
  const history=crossAnchorHistory({comments,owner,expectedIssueNumber:issueNumber});
  const prepared=prepareHandoff({evidence,previousReceiptDigest:history.headDigest,issuedAt:now()});
  if(prepared.issueNumber!==issueNumber)throw Error("Handoff bound to different issue: HOLD");
  const previous=history.entries.at(-1);
  if(previous&&
     (previous.successorDigest!==prepared.priorDigest||
      previous.successorVersionId!==prepared.priorVersionId))
    throw Error("Rotation handoff is not contiguous with persisted history: HOLD");
  const body=HANDOFF_PREFIX+JSON.stringify(prepared);
  if(body.length>5000)throw Error("Receipt too large to persist safely: HOLD");
  const api="https://api.github.com/repos/"+owner+"/"+repo+"/issues/"+issueNumber+"/comments";
  const headers={Authorization:"Bearer "+token,Accept:"application/vnd.github+json",
    "Content-Type":"application/json"};
  const response=await request(api,{method:"POST",headers,body:JSON.stringify({body})});
  if(response.status!==201)throw Error("Authenticated issue comment create failed: HTTP "+response.status);
  const created=await response.json();
  if(!Number.isSafeInteger(created?.id)||created.user?.login!==owner||created.body!==body)
    throw Error("New owner receipt author or returned content mismatch: HOLD");
  const read=await request("https://api.github.com/repos/"+owner+"/"+repo+"/issues/comments/"+created.id,
    {method:"GET",headers});
  if(!read.ok)throw Error("Owner receipt readback failed: HTTP "+read.status);
  const actual=await read.json();
  if(actual.id!==created.id||actual.user?.login!==owner||actual.body!==body)
    throw Error("Owner receipt readback author/content mismatch: HOLD");
  const receipt=parseHandoff(actual,owner);
  return {status:"PERSISTED_MUTABLE_GITHUB_RECEIPT",commentId:receipt.commentId,
    receiptDigest:receipt.record.receiptDigest,previousReceiptDigest:history.headDigest,
    url:receipt.url,requiresIndependentHeadPin:true};
}
