/** Build 580: privileged read-only GitHub issue collection + chained audit snapshot.
 * A SHA-256 hash chain makes later modifications detectable against a separately retained
 * trusted head; it does not make GitHub artifacts or issue comments immutable.
 */
import {createHash} from "node:crypto";
import {receiptDashboard} from "./release_incident_receipt_dashboard.mjs";
const MAX=250;
const SHA=/^[0-9a-f]{64}$/;
export async function collectIssueComments({owner,repo,issueNumber,token,request=fetch}) {
  if(!/^[a-zA-Z0-9-]{1,80}$/.test(owner||"")||!/^[a-zA-Z0-9_.-]{1,100}$/.test(repo||"")||
     !Number.isSafeInteger(issueNumber)||issueNumber<1||typeof token!=="string"||!token)
    throw Error("Validated repository, issue and privileged token required");
  const all=[];
  for(let page=1;page<=3;page++){
    const url=`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments?per_page=100&page=${page}`;
    const response=await request(url,{headers:{Authorization:`Bearer ${token}`,Accept:"application/vnd.github+json"},
      signal:AbortSignal.timeout(20000)});
    if(!response.ok) throw Error("Privileged issue comment read HTTP "+response.status);
    const batch=await response.json();
    if(!Array.isArray(batch)) throw Error("Malformed issue comment response");
    if(all.length+batch.length>MAX) throw Error("Receipt pagination exceeded safe cap");
    all.push(...batch);
    if(batch.length<100) return all;
  }
  throw Error("Incomplete issue history: refusing partial snapshot");
}
const canonical=value=>JSON.stringify(value);
export function createAuditSnapshot({comments,owner,repository,issueNumber,previousHash=null,health=null}) {
  if(previousHash!==null&&!SHA.test(previousHash)) throw Error("Invalid previous trusted snapshot hash");
  if(!Array.isArray(comments)||comments.length>MAX) throw Error("Invalid bounded comment collection");
  const result=receiptDashboard({comments,owner,health});
  const source=comments.map(c=>({id:c.id,author:c.user?.login||null,
    updatedAt:c.updated_at||null,bodyDigest:createHash("sha256").update(String(c.body||"")).digest("hex")}))
    .sort((a,b)=>a.id-b.id);
  const payload={version:1,repository,issueNumber,previousHash,source,rows:result.rows,
    rejected:result.rejected,scanned:result.scanned};
  const digest=createHash("sha256").update(canonical(payload)).digest("hex");
  return {...payload,digest};
}
export function verifyAuditSnapshot(snapshot,previousHash=null) {
  if(!snapshot||snapshot.previousHash!==previousHash||!SHA.test(snapshot.digest||"")) return false;
  const {digest,...payload}=snapshot;
  return createHash("sha256").update(canonical(payload)).digest("hex")===digest;
}
