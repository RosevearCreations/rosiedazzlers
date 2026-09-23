// Build 484 — retained manual read-only reassessment view with evidence continuity.
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
    renderGuardrails(payload.operational_guardrails||{});
    renderEvidenceAge(payload.evidence_age_review||{});
    renderTrendReview(payload.trend_review||{});
    renderContinuityReview(payload.continuity_review||{});
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

  function renderGuardrails(guardrails){
    const mount=$("reassessmentGuardrails"); if(!mount)return;
    const rows=Object.entries(guardrails);
    mount.innerHTML=rows.map(function(entry){
      const key=entry[0], row=entry[1]||{};
      return '<article class="rr-item"><div class="rr-item-head"><strong>'+esc(key.replaceAll("_"," "))+':</strong><span class="rr-pill">'+esc(row.status||"guarded")+'</span></div><p>'+esc(row.conclusion||"Read-only operational guardrail retained.")+'</p></article>';
    }).join("")||'<div class="rr-empty">No operational guardrails loaded.</div>';
  }

  function renderEvidenceAge(age){
    const mount=$("reassessmentEvidenceAge"); if(!mount)return;
    const rows=[
      ["Status",value(age.status)],
      ["Current",value(age.current_count)],
      ["Aging",value(age.aging_count)],
      ["Stale",value(age.stale_count)],
      ["Undated",value(age.undated_count)],
      ["Oldest evidence",age.oldest_evidence_age_days===null||age.oldest_evidence_age_days===undefined?"unavailable":age.oldest_evidence_age_days+" days"]
    ];
    mount.innerHTML=rows.map(function(row){return '<div class="rr-metric"><span class="mini">'+esc(row[0])+'</span><strong>'+esc(row[1])+'</strong></div>';}).join("");
    const detail=$("reassessmentEvidenceAgeDetail"); if(detail) detail.textContent=age.detail||"No evidence-age detail loaded.";
  }
  function renderTrendReview(review){
    const mount=$("reassessmentTrends"); if(!mount)return;
    const rows=Array.isArray(review?.signals)?review.signals:[];
    if(!rows.length){mount.innerHTML='<div class="rr-empty">No bounded trend evidence loaded.</div>';return;}
    mount.innerHTML=rows.map(function(row){
      const direction=row.direction||row.status||"unavailable";
      const comparison=row.comparable_window_evidence===true
        ? "Comparable first-party windows: YES"
        : "Comparable history: NO";
      return '<article class="rr-item"><div class="rr-item-head"><strong>'+esc(String(row.id||"trend signal").replaceAll("_"," "))+':</strong><span class="rr-pill">'+esc(direction)+'</span></div><p>'+esc(row.conclusion||"No defensible trend conclusion.")+'</p><p class="mini">'+esc(comparison)+' · automatic action authorized: NO</p></article>';
    }).join("");
    const detail=$("reassessmentTrendDetail");
    if(detail) detail.textContent="Comparable signals: "+String(review?.comparable_signal_count??0)+" / "+String(review?.signal_count??rows.length)+". A bounded window comparison is descriptive only; it is not a provider-cost, scaling, recovery or capacity forecast.";
  }


  function renderContinuityReview(review){
    const mount=$("reassessmentContinuity"), fieldMount=$("reassessmentFieldOperability");
    if(mount){
      const provider=review.provider_cost_quota||{}, recovery=review.recovery||{}, technical=review.technical_availability||{};
      const rows=[
        ["Overall continuity",value(review.status)],
        ["Technical availability",value(technical.status)],
        ["Provider cost/quota",value(provider.status)],
        ["Recovery continuity",value(recovery.status)],
        ["Provider comparable rows",value(provider.valid_provider_owned_row_count)],
        ["Recovery comparable",recovery.comparable_window_evidence===true?"YES":"NO"]
      ];
      mount.innerHTML=rows.map(function(row){return '<div class="rr-metric"><span class="mini">'+esc(row[0])+'</span><strong>'+esc(row[1])+'</strong></div>';}).join("");
      const detail=$("reassessmentContinuityDetail");
      if(detail) detail.textContent="Technical availability is separate from field operability. First-party traffic is not a provider billing/quota proxy, and source/runtime GREEN is not a recovery outcome.";
    }
    if(fieldMount){
      const field=review.field_operability||{}, counts=field.counts||{};
      const rows=[
        ["Cold-snap capable",value(counts.cold_snap_capable)],
        ["Temperature-limited outdoor",value(counts.temperature_limited_outdoor)],
        ["Controlled environment",value(counts.controlled_environment_required)],
        ["Explicit field rows",value(field.valid_explicit_row_count)]
      ];
      fieldMount.innerHTML=rows.map(function(row){return '<div class="rr-metric"><span class="mini">'+esc(row[0])+'</span><strong>'+esc(row[1])+'</strong></div>';}).join("");
      const detail=$("reassessmentFieldOperabilityDetail");
      if(detail) detail.textContent="A cold-weather field limitation is not an application reliability failure. Exact temperature thresholds require explicit service/product/equipment/site evidence.";
    }
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
    if($("reassessmentGuardrails")) $("reassessmentGuardrails").innerHTML='<div class="rr-empty">No operational guardrails loaded.</div>';
    if($("reassessmentEvidenceAge")) $("reassessmentEvidenceAge").innerHTML='<div class="rr-empty">No evidence-age review loaded.</div>';
    if($("reassessmentEvidenceAgeDetail")) $("reassessmentEvidenceAgeDetail").textContent="No evidence-age detail loaded.";
    if($("reassessmentTrends")) $("reassessmentTrends").innerHTML='<div class="rr-empty">No bounded trend evidence loaded.</div>';
    if($("reassessmentTrendDetail")) $("reassessmentTrendDetail").textContent="No bounded trend detail loaded.";
    if($("reassessmentContinuity")) $("reassessmentContinuity").innerHTML='<div class="rr-empty">No continuity evidence loaded.</div>';
    if($("reassessmentContinuityDetail")) $("reassessmentContinuityDetail").textContent="No continuity detail loaded.";
    if($("reassessmentFieldOperability")) $("reassessmentFieldOperability").innerHTML='<div class="rr-empty">No field-operability evidence loaded.</div>';
    if($("reassessmentFieldOperabilityDetail")) $("reassessmentFieldOperabilityDetail").textContent="No field-operability detail loaded.";
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
