// Build 439 — manual read-only owner-decision convergence UI.
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
  renderSummary(data);renderGroup("maintenanceDecisions",data.maintenance?.decisions||[]);renderGroup("fleetDecisions",data.fleet?.decisions||[]);renderCapacity(data.capacity||{});renderSources(data.source_status||{});
  setStatus(`Snapshot refreshed ${new Date(data.generated_at).toLocaleString("en-CA")}. ${data.summary?.owner_action_count||0} decision(s) remain owner_action. No term was approved or changed.`,"warn");
 }catch(error){setStatus(error?.message||"Could not load owner-decision evidence.","bad");}
 finally{if(button)button.disabled=false;}
}
function renderSummary(data){
 const s=data.summary||{},mount=$("ownerApprovalSummary"); if(!mount)return;
 const rows=[["Owner actions",s.owner_action_count||0],["Source-approved",s.source_approved_count||0],["Maintenance interest",s.maintenance_interest_total||0],["Interested",s.maintenance_interested||0],["Fleet inquiries",s.fleet_inquiry_total||0],["Vehicles requested",s.fleet_vehicles_requested||0]];
 mount.innerHTML=rows.map(([l,v])=>`<div class="oa-stat"><span class="mini">${esc(l)}</span><strong>${esc(v)}</strong></div>`).join("");
}
function renderGroup(id,items){
 const mount=$(id); if(!mount)return;
 if(!items.length){mount.innerHTML='<div class="oa-empty">No decision evidence available.</div>';return;}
 mount.innerHTML=items.map(item=>`<article class="oa-card">
   <div class="oa-head"><h3>${esc(item.label)}</h3><span class="oa-pill">${esc(item.status)}</span></div>
   <p><strong>Owner decision:</strong> ${esc(item.question)}</p>
   <p class="mini">Canonical source: <code>${esc(item.source_authority)}</code> · source state: ${esc(item.source_status)}</p>
   <div class="oa-evidence">${Object.entries(item.evidence||{}).map(([k,v])=>`<div><span class="mini">${esc(k.replaceAll("_"," "))}</span><strong>${esc(typeof v==="object"?JSON.stringify(v):v)}</strong></div>`).join("")}</div>
   <p class="oa-boundary">This screen cannot approve or write this term.</p>
 </article>`).join("");
}
function renderCapacity(c){
 const mount=$("capacityDecision"); if(!mount)return;
 mount.innerHTML=`<div class="oa-card"><div class="oa-head"><h3>Commercial capacity commitment</h3><span class="oa-pill">${esc(c.status||"unavailable")}</span></div><p><strong>Owner decision:</strong> ${esc(c.question||"Capacity commitments require explicit review.")}</p><p class="mini">${esc(c.explanation||"Live capacity is not inferred.")}</p><p class="mini">Availability: <code>${esc(c.availability_authority||"/api/availability")}</code> · collision revalidation: <code>${esc(c.collision_revalidation_authority||"/api/checkout")}</code></p><p class="oa-boundary">No guaranteed slot or capacity reservation is created here.</p></div>`;
}
function renderSources(s){
 const mount=$("ownerApprovalSources"); if(!mount)return;
 mount.innerHTML=Object.entries(s).map(([k,v])=>`<div class="oa-source"><strong>${esc(k.replaceAll("_"," "))}</strong><span class="oa-pill">${esc(v.available?"available":v.restricted?"restricted":"unavailable")}</span><span class="mini">HTTP ${esc(v.http_status??"—")}</span></div>`).join("");
}
function setStatus(msg,tone){const n=$("ownerApprovalStatus");if(!n)return;n.hidden=false;n.className=`notice ${tone||"soft"}`;n.textContent=msg;}
document.addEventListener("DOMContentLoaded",()=>{g.AdminShell?.boot?.({pageKey:"admin-maintenance-fleet-owner-approval",onReady:async()=>init()});},{once:true});
})(window);
