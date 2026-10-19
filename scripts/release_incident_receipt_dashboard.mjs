/** Build 579: bounded, read-only receipt index over GitHub issue comments.
 * GitHub persists comments; this module never creates, edits, approves or executes a decision.
 * Receipts are accepted only when the authenticated GitHub comment author matches owner.
 */
import {reconcileDecision,recoveryFollowUp} from "./release_incident_decision_ledger.mjs";
const PREFIX="RD-REMEDIATION-RECEIPT ";
const MAX=250, SHA=/^[a-f0-9]{40}$/i;
export function parseReceipt(comment,repositoryOwner) {
  if(!comment || comment.user?.login?.toLowerCase()!==String(repositoryOwner||"").toLowerCase()) return null;
  const body=String(comment.body||"").trim();
  if(!body.startsWith(PREFIX)||body.length>4000) return null;
  let record;
  try { record=JSON.parse(body.slice(PREFIX.length)); } catch {return null;}
  if(!record||Array.isArray(record)||typeof record!=="object"||!SHA.test(record.incidentSha||"")) return null;
  return {decision:record,commentId:comment.id,sourceUrl:comment.html_url||null,createdAt:comment.created_at||null};
}
export function receiptDashboard({comments,owner,health=null}) {
  if(!Array.isArray(comments)||comments.length>MAX) throw Error("Receipt page limit exceeded; refuse incomplete ledger");
  const parsed=comments.map(c=>parseReceipt(c,owner)).filter(Boolean).sort((a,b)=>(a.commentId||0)-(b.commentId||0));
  const histories=new Map(),rejected=[];
  for(const receipt of parsed) {
    const id=receipt.decision?.decisionId;
    if(typeof id!=="string"||id.length>160){rejected.push(receipt.commentId);continue;}
    const prior=histories.get(id)||[];
    try{histories.set(id,reconcileDecision(prior,receipt.decision));}
    catch {rejected.push(receipt.commentId);}
  }
  const rows=[...histories.entries()].map(([id,history])=>{
    const latest=history[history.length-1];
    const outcome=health?recoveryFollowUp({decision:latest,health}):{accepted:false,reason:"Live production evidence not provided"};
    return {decisionId:id,incidentSha:latest.incidentSha,state:latest.state,owner:latest.owner,
      evidenceCount:history.length,recoveryVerified:outcome.accepted,reason:outcome.reason};
  });
  return {rows,rejected,scanned:comments.length,owner};
}
const safe=s=>String(s??"").replace(/[|<>\r\n]/g," ").slice(0,180);
export function dashboardMarkdown(result) {
  const lines=["## Rosie Dazzlers — owner remediation receipt dashboard","",
    "GitHub Issue comments are the persisted source. This is a read-only index, not an owner approval or production-green assertion.",
    "", "| Decision | Incident SHA | Owner | State | Receipts | Verified recovery |",
    "|---|---|---|---|---:|---|",
    ...result.rows.map(r=>`| ${safe(r.decisionId)} | \`${safe(r.incidentSha)}\` | ${safe(r.owner)} | ${safe(r.state)} | ${r.evidenceCount} | ${r.recoveryVerified?"YES":"NO"} |`),
    "",`Invalid or out-of-sequence receipts excluded: ${result.rejected.length}.`,
    "Verified recovery requires fresh exact-SHA Production AND business acceptance; a receipt alone is insufficient."];
  return lines.join("\n")+"\n";
}
export const RECEIPT_PREFIX=PREFIX;
