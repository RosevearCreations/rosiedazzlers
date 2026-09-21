// Build 439/449/459/469 — manual read-only owner-decision, activation-readiness + controlled-pilot decision UI.
(function(g){"use strict";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function init(){$("refreshOwnerApproval")?.addEventListener("click",refresh);setStatus("No owner-decision snapshot loaded. Refresh manually to compare unresolved terms with current operational evidence.","soft");}
async function refresh(){
 const button=$("refreshOwnerApproval"); if(button)button.disabled=true; setStatus("Loading bounded maintenance/fleet evidence…","soft");
 try{
  const response=await fetch("/api/admin/maintenance_fleet_owner_approval",{method:"GET",credentials:"include",cache:"no-store",headers:{Accept:"application/json"}});
  const data=await response.json().catch(()=>null);
  if(!response.ok||!data) throw new Error(data?.error||`Owner-decision snapshot returned HTTP ${response.status}.`);
  renderSummary(data);renderActivation(data.activation_readiness||{});renderControlledPilot(data.controlled_pilot_readiness||{});renderGroup("maintenanceDecisions",data.maintenance?.decisions||[]);renderGroup("fleetDecisions",data.fleet?.decisions||[]);renderCapacity(data.capacity||{});renderSources(data.source_status||{});
  setStatus(`Snapshot refreshed ${new Date(data.generated_at).toLocaleString("en-CA")}. ${data.summary?.owner_action_count||0} decision(s) remain owner_action. No term was approved or changed.`,"warn");
 }catch(error){setStatus(error?.message||"Could not load owner-decision evidence.","bad");}
 finally{if(button)button.disabled=false;}
}
function renderSummary(data){
 const s=data.summary||{},closure=data.decision_closure||{},mount=$("ownerApprovalSummary"); if(!mount)return;
 const a=data.activation_readiness||{},p=data.controlled_pilot_readiness||{}; const rows=[["Closure state",closure.status||s.closure_status||"owner_action"],["Activation readiness",a.status||"owner_action"],["Controlled pilot",p.status||"owner_action"],["Activation terms ready",`${a.source_approved_term_count||0}/${a.required_term_count||7}`],["Owner actions",s.owner_action_count||0],["Fleet inquiries",s.fleet_inquiry_total||0]];
 mount.innerHTML=rows.map(([l,v])=>`<div class="oa-stat"><span class="mini">${esc(l)}</span><strong>${esc(v)}</strong></div>`).join("");
}
function renderGroup(id,items){
 const mount=$(id); if(!mount)return;
 if(!items.length){mount.innerHTML='<div class="oa-empty">No decision evidence available.</div>';return;}
 mount.innerHTML=items.map(item=>`<article class="oa-card">
   <div class="oa-head"><h3>${esc(item.label)}</h3><span class="oa-pill">${esc(item.status)}</span></div>
   <p><strong>Owner decision:</strong> ${esc(item.question)}</p>
   <p class="mini">Canonical source: <code>${esc(item.source_authority)}</code> · source state: ${esc(item.source_status)}</p>
   <p class="mini"><strong>Owner decision path:</strong> <code>${esc(item.owner_decision_path||"not available")}</code></p>
   <p class="mini"><strong>Required closure fields:</strong> ${esc((item.required_fields||[]).join(", ")||"none reported")}</p>
   ${item.blocking_reason?`<p class="oa-boundary">${esc(item.blocking_reason)}</p>`:""}
   <div class="oa-evidence">${Object.entries(item.evidence||{}).map(([k,v])=>`<div><span class="mini">${esc(k.replaceAll("_"," "))}</span><strong>${esc(typeof v==="object"?JSON.stringify(v):v)}</strong></div>`).join("")}</div>
   <p class="oa-boundary">This screen cannot approve or write this term. Closure requires an explicit owner decision in canonical source.</p>
 </article>`).join("");
}
function renderActivation(a){
 const mount=$("activationReadiness"); if(!mount)return;
 const terms=Array.isArray(a.terms)?a.terms:[];
 const banner=`<div class="oa-card"><div class="oa-head"><h3>Activation-readiness decision</h3><span class="oa-pill">${esc(a.status||"owner_action")}</span></div><p><strong>Ready terms:</strong> ${esc(a.source_approved_term_count||0)} / ${esc(a.required_term_count||7)}</p><p class="mini">${esc(a.next_step||"Owner-approved commercial terms are required before activation review.")}</p><p class="oa-boundary">Readiness is review-only. No maintenance plan, fleet account, discount, invoice, booking, recurring billing, outreach, provider action or capacity reservation is activated here.</p></div>`;
 const cards=terms.map(t=>`<article class="oa-card"><div class="oa-head"><h3>${esc(t.label||t.id)}</h3><span class="oa-pill">${esc(t.status||"owner_action")}</span></div><p class="mini"><strong>Owner decision path:</strong> <code>${esc(t.owner_decision_path||"not available")}</code></p><p class="mini"><strong>Required fields:</strong> ${esc((t.required_fields||[]).join(", ")||"none reported")}</p><p class="oa-boundary">${t.owner_approved?"Canonical source reports this term approved; activation still requires separate operator authorization.":"Owner approval remains unresolved in canonical source."}</p></article>`).join("");
 mount.innerHTML=banner+(cards?`<div class="oa-grid" style="margin-top:12px">${cards}</div>`:"");
}
function renderControlledPilot(p){
 const mount=$("controlledPilotReadiness"); if(!mount)return;
 const safeguards=Array.isArray(p.safeguards)?p.safeguards:[];
 const bounds=p.bounds||{};
 const cards=safeguards.map(row=>`<article class="oa-card"><div class="oa-head"><h3>${esc(row.label||row.id)}</h3><span class="oa-pill">${esc(row.status||"required")}</span></div><p class="mini">Required for controlled-pilot decision: yes</p><p class="oa-boundary">This safeguard is evidence only. It does not authorize customer-facing activation.</p></article>`).join("");
 mount.innerHTML=`<div class="oa-card"><div class="oa-head"><h3>Controlled-pilot activation decision</h3><span class="oa-pill">${esc(p.status||"owner_action")}</span></div><p><strong>Decision package ready:</strong> ${esc(p.decision_package_ready===true?"yes":"no")}</p><p class="mini">${esc(p.next_step||"Owner-approved commercial terms and explicit pilot authorization are required.")}</p><p class="mini"><strong>Availability:</strong> <code>${esc(p.availability_authority||"/api/availability")}</code> · <strong>collision revalidation:</strong> <code>${esc(p.collision_revalidation_authority||"/api/checkout")}</code></p><p class="mini"><strong>Pilot participant limit:</strong> ${bounds.participant_limit==null?"not inferred":esc(bounds.participant_limit)} · <strong>duration:</strong> ${bounds.duration_days==null?"not inferred":esc(bounds.duration_days+" days")}</p><p class="oa-boundary">Explicit owner pilot authorization and explicit pilot bounds remain required. Participant selection stays manual; every real booking must revalidate current availability and checkout collision safety. No enrollment, outreach, booking, discount, invoice, recurring billing, provider action, service-area expansion or capacity reservation is performed here.</p></div>${cards?`<div class="oa-grid" style="margin-top:12px">${cards}</div>`:""}`;
}
function renderCapacity(c){
 const mount=$("capacityDecision"); if(!mount)return;
 mount.innerHTML=`<div class="oa-card"><div class="oa-head"><h3>Commercial capacity commitment</h3><span class="oa-pill">${esc(c.status||"unavailable")}</span></div><p><strong>Owner decision:</strong> ${esc(c.question||"Capacity commitments require explicit review.")}</p><p class="mini">${esc(c.explanation||"Live capacity is not inferred.")}</p><p class="mini"><strong>Commercial policy source:</strong> <code>${esc(c.commercial_policy_source||"config/maintenance-plan-business-rulebook.json#decisions.priority")}</code></p><p class="mini"><strong>Required closure fields:</strong> ${esc((c.required_fields||[]).join(", ")||"priority/capacity policy")}</p><p class="mini">Availability: <code>${esc(c.availability_authority||"/api/availability")}</code> · collision revalidation: <code>${esc(c.collision_revalidation_authority||"/api/checkout")}</code></p><p class="oa-boundary">No guaranteed slot or capacity reservation is created here. Commercial capacity policy and live slot availability remain separate.</p></div>`;
}
function renderSources(s){
 const mount=$("ownerApprovalSources"); if(!mount)return;
 mount.innerHTML=Object.entries(s).map(([k,v])=>`<div class="oa-source"><strong>${esc(k.replaceAll("_"," "))}</strong><span class="oa-pill">${esc(v.available?"available":v.restricted?"restricted":"unavailable")}</span><span class="mini">HTTP ${esc(v.http_status??"—")}</span></div>`).join("");
}
function setStatus(msg,tone){const n=$("ownerApprovalStatus");if(!n)return;n.hidden=false;n.className=`notice ${tone||"soft"}`;n.textContent=msg;}
document.addEventListener("DOMContentLoaded",()=>{g.AdminShell?.boot?.({pageKey:"admin-maintenance-fleet-owner-approval",onReady:async()=>init()});},{once:true});
})(window);
