/**
 * Build 578 — pure, fail-closed incident remediation ledger and follow-up reconciliation.
 * No network writes, deployment actions or implicit owner authorization.
 */
const SHA=/^[a-f0-9]{40}$/i;
const ACTIONS=new Set(["observe","request-retry","request-rollback","request-config-repair","request-source-fix"]);
const STATES=new Set(["PROPOSED","OWNER_APPROVED","OWNER_REJECTED","EXECUTED","VERIFIED","REOPENED"]);
const REF=/^[A-Za-z0-9][A-Za-z0-9._:/#-]{2,160}$/;
const clean=x=>typeof x==="string"?x.trim():"";
export function validateDecision(d) {
  if(!d||typeof d!=="object"||!SHA.test(d.incidentSha||"")) throw Error("Exact incident SHA required");
  if(!REF.test(clean(d.decisionId))) throw Error("Stable decision ID required");
  if(!ACTIONS.has(d.action)) throw Error("Unsupported remediation action");
  if(!REF.test(clean(d.owner))) throw Error("Named owner required");
  if(!clean(d.reason)||clean(d.reason).length>1000) throw Error("Bounded decision reason required");
  if(!STATES.has(d.state)) throw Error("Invalid remediation state");
  if(d.state!=="PROPOSED" && !REF.test(clean(d.evidenceRef))) throw Error("Decision evidence reference required");
  if(["OWNER_APPROVED","EXECUTED","VERIFIED"].includes(d.state) && !REF.test(clean(d.approvalRef)))
    throw Error("Separate owner approval reference required");
  if(["EXECUTED","VERIFIED"].includes(d.state) && !REF.test(clean(d.executionRef)))
    throw Error("Manual execution evidence required");
  if(d.state==="VERIFIED" && (!SHA.test(d.verifiedMainSha||"")||!REF.test(clean(d.productionProofRef))||!REF.test(clean(d.businessProofRef))))
    throw Error("Exact-main Production and business proof required");
  if(d.state==="VERIFIED" && d.verifiedMainSha!==d.incidentSha)
    throw Error("Incident/recovery SHA mismatch: create a separate verified successor decision instead");
  return Object.freeze({...d});
}
export function reconcileDecision(history, next) {
  const d=validateDecision(next);
  const prev=history?.length?validateDecision(history[history.length-1]):null;
  if(prev){
    if(prev.decisionId!==d.decisionId||prev.incidentSha!==d.incidentSha) throw Error("Decision identity changed");
    const allowed={
      PROPOSED:["OWNER_APPROVED","OWNER_REJECTED"],
      OWNER_APPROVED:["EXECUTED","OWNER_REJECTED"],
      OWNER_REJECTED:[],
      EXECUTED:["VERIFIED","REOPENED"],
      VERIFIED:["REOPENED"],
      REOPENED:["OWNER_APPROVED","OWNER_REJECTED"]
    };
    if(!allowed[prev.state].includes(d.state)) throw Error("Illegal or duplicate decision transition");
  }else if(d.state!=="PROPOSED") throw Error("Decision must start PROPOSED");
  return [...(history||[]),d];
}
export function recoveryFollowUp({decision,health}) {
  const d=validateDecision(decision);
  if(!health||health.state!=="GREEN") return {accepted:false,reason:"Exact-SHA Production health not GREEN"};
  if(d.state!=="VERIFIED") return {accepted:false,reason:"Owner decision has no verified closure receipt"};
  if(health.mainSha!==d.verifiedMainSha||health.productionSha!==d.verifiedMainSha)
    return {accepted:false,reason:"Production and decision SHA differ"};
  const checks=health.required||{};
  if(!["Cloudflare Pages","Verify exact Production deployment","Validate Production business acceptance source contract"].every(n=>checks[n]==="success"))
    return {accepted:false,reason:"Required Production and business checks not proven"};
  return {accepted:true,reason:"Exact-SHA recovery and owner evidence reconciled"};
}
