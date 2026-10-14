import {build556OwnerHoldIntake,HOLD_DEFINITIONS_556} from "./hold-evidence-intake-556.js";
const get=id=>document.getElementById(id);
const field=get("holdIntake556Json"),btn=get("holdIntake556Review"),status=get("holdIntake556Status"),list=get("holdIntake556Rows"),
 out=get("holdIntake556Export"),example=get("holdIntake556Template");
let last=null;
function show(report){
 list.replaceChildren();
 for(const r of report.items){
  const card=document.createElement("article");card.className="review-candidate";
  const heading=document.createElement("strong");heading.textContent=r.hold_id+" · "+r.status;
  const detail=document.createElement("p");detail.className="mini";
  detail.textContent=r.evidence_class+" · "+(r.gaps.join(", ")||"Unverified metadata eligible for independent manual review.");
  card.append(heading,detail);list.append(card);
 }
 status.textContent=report.manual_review_candidate_count+" candidate(s) for manual review; all seven canonical HOLDs remain OPEN.";
}
if(field&&btn&&status&&list&&out&&example){
 show(build556OwnerHoldIntake({rows:[]}));
 btn.addEventListener("click",()=>{
  if(btn.disabled)return;btn.disabled=true;btn.textContent="Reviewing locally…";
  try{
   if(field.value.length>32768)throw Error("Metadata exceeds 32 KB");
   last=build556OwnerHoldIntake(JSON.parse(field.value));show(last);out.disabled=false;
  }catch(e){last=null;out.disabled=true;status.textContent="Intake HOLD: "+e.message;}
  finally{btn.disabled=false;btn.textContent="Review intake metadata";}
 });
 example.addEventListener("click",()=>{
  const d=HOLD_DEFINITIONS_556.find(x=>x.id==="recovery_backup_evidence");
  field.value=JSON.stringify({schema:"rosie-hold-intake-556",rows:[{hold_id:d.id,evidence_class:d.kind,
   scope_key:"internal-scope",evidence:d.needs.map(type=>({type,source_system:"owner",
    source_reference:"replace-with-real-source",scope_key:"internal-scope",observed_at:"2026-10-13T20:00:00Z",outcome:"observed_pass"})),
   owner_review:{decision:"retain_hold",reviewer_reference:"replace-with-owner",reviewed_at:"2026-10-13T21:00:00Z",scope_key:"internal-scope"}}]},null,2);
  status.textContent="Format example only: replace all references, dates and observations with real evidence.";
 });
 out.addEventListener("click",()=>{
  if(!last)return;
  const blob=new Blob([JSON.stringify(last,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="rosie-build556-unverified-owner-hold-review.json";a.click();URL.revokeObjectURL(url);
  status.textContent="Local review summary exported. No canonical HOLD changed.";
 });
}
