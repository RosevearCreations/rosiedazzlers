const $=(s)=>document.querySelector(s);
const esc=(v)=>String(v??"").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

export function startLaunchReadinessConsolidation(){
  const button=$("#refreshLaunchReadiness");
  button?.addEventListener("click",()=>load({manual:true}));
  load({manual:false});
}

async function load({manual=false}={}){
  const button=$("#refreshLaunchReadiness");
  setBusy(button,true,"Refreshing…","Refresh readiness");
  status(manual?"Refreshing current launch evidence…":"Loading current launch evidence…");
  try{
    const res=await fetch("/api/admin/launch_readiness_consolidated",{credentials:"include",cache:"no-store"});
    const data=await res.json().catch(()=>null);
    if(!res.ok||!data) throw new Error(data?.error||`Readiness request failed (${res.status}).`);
    render(data);
    status(data.source_runtime_status==="green"
      ? "Current source/runtime evidence loaded. External and owner-action HOLDs remain separate."
      : "Runtime blockers remain. Production reliance is held until they are resolved.",
      data.source_runtime_status==="green"?"ok":"bad");
  }catch(error){
    status(error?.message||"Could not load launch readiness.","bad");
    for(const id of ["releaseOut","launchOut","recoveryOut","externalOut","actionsOut"]){
      const host=document.getElementById(id);
      if(host) host.innerHTML='<div class="notice bad">Evidence unavailable. Refresh manually after the authoritative source is restored.</div>';
    }
  }finally{
    setBusy(button,false,"Refreshing…","Refresh readiness");
  }
}

function render(data){
  renderRelease(data);
  renderLaunch(data);
  renderRecovery(data);
  renderExternal(data);
  renderActions(data);
  const generated=$("#generatedAt");
  if(generated) generated.textContent=data.generated_at?new Date(data.generated_at).toLocaleString("en-CA",{dateStyle:"medium",timeStyle:"short"}):"Unknown";
}

function renderRelease(data){
  const r=data.runtime||{}, id=r.release_identity||{};
  $("#releaseOut").innerHTML=`
    <h2>Exact release & runtime</h2>
    <div class="metric-grid">
      ${metric("Source/runtime",data.source_runtime_status||"unknown")}
      ${metric("Critical alerts",r.support_critical??0)}
      ${metric("Warnings",r.support_warning??0)}
      ${metric("Required unavailable",Array.isArray(r.unavailable_required_items)?r.unavailable_required_items.length:0)}
    </div>
    <p class="mini"><strong>Branch:</strong> ${esc(id.branch||"unavailable")} · <strong>Host:</strong> ${esc(id.host||"unavailable")}</p>
    <p class="mini"><strong>Commit:</strong> <code>${esc(id.commit_sha||"unavailable")}</code></p>
    <p class="muted">Exact GitHub/Cloudflare workflow acceptance remains the promotion authority. This screen does not self-certify Production GREEN.</p>`;
}

function renderLaunch(data){
  const e=data.launch_evidence||{};
  const outstanding=Array.isArray(e.required_outstanding)?e.required_outstanding:[];
  $("#launchOut").innerHTML=`
    <h2>Controlled launch evidence</h2>
    <div class="metric-grid">
      ${metric("Controlled launch",data.controlled_launch_status||"unknown")}
      ${metric("Verified",e.verified??0)}
      ${metric("Pending",e.pending??0)}
      ${metric("Failed",e.failed??0)}
    </div>
    <p><strong>Unrestricted launch:</strong> ${chip(data.unrestricted_launch_status||"hold")}</p>
    ${outstanding.length
      ? `<ul class="compact-list">${outstanding.map(x=>`<li>${esc(x.key.replaceAll("_"," "))}: ${chip(x.status||"pending")}</li>`).join("")}</ul>`
      : '<div class="notice ok">Required owner-observed launch evidence is recorded.</div>'}
    <p><a class="btn ghost" href="/admin-startup-guide.html#evidence">Record / review launch evidence</a></p>`;
}

function renderRecovery(data){
  const recovery=data.recovery||{}, exports=Array.isArray(data.exports)?data.exports:[];
  $("#recoveryOut").innerHTML=`
    <h2>Backup, export & recovery proof</h2>
    <p><strong>Backup evidence observed:</strong> ${chip(recovery.backup_evidence_observed?"verified":"owner action")}</p>
    <p><strong>Rollback drill observed:</strong> ${chip(recovery.rollback_drill_observed?"verified":"owner action")}</p>
    <ul class="compact-list">${(recovery.items||[]).map(x=>`<li>${esc(x.key.replaceAll("_"," "))}: ${chip(x.status||"pending")}</li>`).join("")}</ul>
    <h3>Source-ready export capabilities</h3>
    <ul class="compact-list">${exports.map(x=>`<li><strong>${esc(x.label)}</strong> — ${esc(x.classification)}<br><span class="muted">${esc(x.detail)}</span></li>`).join("")}</ul>
    <p class="muted">${esc(recovery.rule||"")}</p>`;
}

function renderExternal(data){
  const rows=Array.isArray(data.external_holds)?data.external_holds:[];
  $("#externalOut").innerHTML=`
    <h2>Provider / owner-action HOLDs</h2>
    ${rows.length
      ? `<div class="stack">${rows.map(x=>`<article class="evidence-row"><div><strong>${esc(x.title)}</strong><p class="mini">${esc(x.detail||"")}</p></div>${chip(x.classification)}</article>`).join("")}</div>`
      : '<div class="notice ok">No provider/owner-action HOLDs are currently reported by the readiness authority.</div>'}
    <p class="muted">Source/runtime GREEN never converts missing provider evidence into success.</p>`;
}

function renderActions(data){
  const rows=Array.isArray(data.next_actions)?data.next_actions:[];
  $("#actionsOut").innerHTML=`
    <h2>Next actions</h2>
    <div class="stack">${rows.map(x=>`<article class="evidence-row"><div><strong>${esc(String(x.priority||"action").replaceAll("_"," "))}</strong><p class="mini">${esc(x.action||"")}</p></div></article>`).join("")}</div>
    <div class="actions"><a class="btn ghost" href="/admin/it.html">Open I.T. diagnostics</a><a class="btn ghost" href="/admin-seo-tasks.html">Open local-search evidence</a><a class="btn ghost" href="/admin-startup-guide.html">Open startup evidence</a></div>`;
}

function metric(label,value){return `<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;}
function chip(value){const v=String(value||"unknown");const cls=/green|ready|verified|runtime_proven|source_ready/.test(v)?"ok":/blocked|failed|unavailable/.test(v)?"bad":"warn";return `<span class="chip ${cls}">${esc(v.replaceAll("_"," "))}</span>`;}
function status(message,tone=""){
  const el=$("[data-launch-status]");if(!el)return;
  el.hidden=!message;el.className=`notice ${tone}`.trim();el.setAttribute("role",tone==="bad"?"alert":"status");el.setAttribute("aria-live",tone==="bad"?"assertive":"polite");el.textContent=message||"";
  if(tone==="bad"&&message)el.focus({preventScroll:true});
}
function setBusy(button,busy,busyLabel,idleLabel){if(!button)return;button.disabled=busy;button.setAttribute("aria-busy",busy?"true":"false");button.textContent=busy?busyLabel:idleLabel;}
