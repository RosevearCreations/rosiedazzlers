// Build 434 — manual read-only reassessment view.
(function attachReliabilitySecurityCostReassessment(globalScope){
  "use strict";
  const BUCKETS = [
    ["green_retained_controls", "GREEN retained controls"],
    ["operational_pressure", "Emerging operational pressure"],
    ["stale_evidence", "Stale evidence"],
    ["owner_action", "Owner action"],
    ["provider_dependency", "Provider dependency"],
    ["unavailable_evidence", "Unavailable evidence"]
  ];
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[char]);

  async function refresh(){
    const button=$("refreshReassessment");
    if(button) button.disabled=true;
    setStatus("Refreshing bounded current evidence…","soft");
    try{
      const response=await fetch("/api/admin/reliability_security_cost_reassessment",{
        method:"GET",credentials:"include",cache:"no-store",headers:{Accept:"application/json"}
      });
      const payload=await response.json().catch(()=>null);
      if(!payload) throw new Error(`Reassessment returned HTTP ${response.status} without JSON.`);
      render(payload);
      const stamp=payload.generated_at?new Date(payload.generated_at).toLocaleString("en-CA"):"unknown time";
      setStatus(`Reassessment refreshed ${stamp}. Overall: ${String(payload.overall||"unknown").toUpperCase()}. No automatic refresh is running.`,
        payload.overall==="attention"?"bad":payload.overall==="green"?"ok":"warn");
    }catch(error){
      clearView();
      setStatus(error?.message||"Reassessment could not be refreshed.","bad");
    }finally{
      if(button) button.disabled=false;
    }
  }

  function render(payload){
    renderSummary(payload);
    renderMetrics(payload.metrics||{});
    renderSources(payload.source_status||{});
    for(const [key,label] of BUCKETS) renderBucket(key,label,payload.buckets?.[key]||[]);
  }

  function renderSummary(payload){
    const mount=$("reassessmentSummary");
    const counts=payload.counts||{};
    if(!mount)return;
    mount.innerHTML=BUCKETS.map(([key,label])=>`<div class="rr-stat"><span class="mini">${esc(label)}</span><strong>${esc(counts[key]??0)}</strong></div>`).join("");
  }

  function renderMetrics(metrics){
    const mount=$("reassessmentMetrics");
    if(!mount)return;
    const rows=[
      ["Diagnostics duration",unit(metrics.diagnostics_duration_ms," ms")],
      ["Failed diagnostics",value(metrics.diagnostics_failed_checks)],
      ["Degraded diagnostics",value(metrics.diagnostics_degraded_checks)],
      ["First-party events · 24h",value(metrics.traffic_events_24h)],
      ["First-party events · 7d",value(metrics.traffic_events_7d)],
      ["Recent/prior traffic ratio",value(metrics.traffic_recent_to_prior_ratio)],
      ["Security risk rows",value(metrics.security_risk_rows)],
      ["RLS disabled",value(metrics.security_rls_disabled)],
      ["Browser grants",value(metrics.security_browser_grants)]
    ];
    mount.innerHTML=rows.map(([label,val])=>`<div class="rr-metric"><span class="mini">${esc(label)}</span><strong>${esc(val)}</strong></div>`).join("");
  }

  function renderSources(sources){
    const mount=$("reassessmentSources"); if(!mount)return;
    mount.innerHTML=Object.entries(sources).map(([name,row])=>{
      const state=row?.available?"available":row?.restricted?"restricted":"unavailable";
      const stamp=row?.generated_at?new Date(row.generated_at).toLocaleString("en-CA"):"not reported";
      return `<div class="rr-source"><strong>${esc(name.replaceAll("_"," "))}</strong><span class="rr-pill">${esc(state)}</span><span class="mini">HTTP ${esc(row?.http_status??"—")} · ${esc(stamp)}</span></div>`;
    }).join("")||'<div class="rr-empty">No source state loaded.</div>';
  }

  function renderBucket(key,label,rows){
    const mount=$(bucketId(key)); if(!mount)return;
    const count=$(bucketCountId(key)); if(count) count.textContent=String(rows.length);
    if(!rows.length){mount.innerHTML=`<div class="rr-empty">No ${esc(label.toLowerCase())} in the current bounded snapshot.</div>`;return;}
    mount.innerHTML=rows.map(row=>`<article class="rr-item">
      <div class="rr-item-head"><strong>${esc(row.label||"Evidence")}</strong><span class="rr-pill">${esc(row.state||"unknown")}</span></div>
      <p class="mini">Source: ${esc(row.source||"unknown")} · Observed: ${esc(formatTime(row.observed_at))}</p>
      <p>${esc(row.detail||"")}</p>
      <p><strong>Safe next action:</strong> ${esc(row.safe_next_action||"Review the owning evidence source.")}</p>
    </article>`).join("");
  }

  function clearView(){
    $("reassessmentSummary").innerHTML='<div class="rr-empty">No current snapshot loaded.</div>';
    $("reassessmentMetrics").innerHTML='<div class="rr-empty">No current metrics loaded.</div>';
    $("reassessmentSources").innerHTML='<div class="rr-empty">No current source state loaded.</div>';
    for(const [key] of BUCKETS){
      const mount=$(bucketId(key)); if(mount) mount.innerHTML='<div class="rr-empty">No current snapshot loaded.</div>';
      const count=$(bucketCountId(key)); if(count) count.textContent="0";
    }
  }

  function bucketId(key){return "bucket-"+key.replaceAll("_","-");}
  function bucketCountId(key){return "count-"+key.replaceAll("_","-");}
  function value(v){return v===null||v===undefined||v===""?"unavailable":String(v);}
  function unit(v,suffix){return v===null||v===undefined||v===""?"unavailable":String(v)+suffix;}
  function formatTime(v){const t=Date.parse(String(v||""));return Number.isFinite(t)?new Date(t).toLocaleString("en-CA"):"unavailable";}
  function setStatus(message,tone){const node=$("reassessmentStatus");if(!node)return;node.hidden=false;node.className=`notice ${tone||"soft"}`;node.textContent=message;}

  document.addEventListener("DOMContentLoaded",()=>{
    globalScope.AdminShell?.boot?.({
      pageKey:"admin-reliability-reassessment",
      onReady:async()=>{
        $("refreshReassessment")?.addEventListener("click",refresh);
        setStatus("No reassessment has run. Select Refresh current reassessment for a bounded read-only snapshot.","soft");
      }
    });
  },{once:true});
})(window);
