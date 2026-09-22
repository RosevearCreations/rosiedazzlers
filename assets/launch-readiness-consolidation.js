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
    for(const id of ["releaseOut","launchOut","workflowOut","providerOut","recoveryOut","externalOut","actionsOut"]){
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
  renderWorkflowEvidence(data);
  renderProviderClosure(data);
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
  const pilot=data.controlled_soft_launch||{};
  const stages=Array.isArray(pilot.stages)?pilot.stages:[];
  const outstanding=Array.isArray(e.required_outstanding)?e.required_outstanding:[];
  $("#launchOut").innerHTML=`
    <h2>Controlled soft launch & real-world acceptance</h2>
    <div class="metric-grid">
      ${metric("Pilot",pilot.status||"hold")}
      ${metric("Observed jobs",pilot.observed_real_jobs??0)}
      ${metric("Evidence-ready jobs",pilot.evidence_ready_jobs??0)}
      ${metric("Open completion",pilot.completion_evidence_open??0)}
    </div>
    <p><strong>Retained controlled-launch gate:</strong> ${chip(data.controlled_launch_status||"hold")} · <strong>Unrestricted launch:</strong> ${chip(data.unrestricted_launch_status||"hold")}</p>
    <div class="stack">${stages.map(x=>`<article class="evidence-row"><div><strong>${esc(x.title||x.id)}</strong><p class="mini">${esc(x.detail||"")}</p></div>${chip(x.status||"owner_action")}</article>`).join("")}</div>
    ${pilot.status==="ready"
      ? '<div class="notice ok">The bounded controlled-pilot evidence set is complete.</div>'
      : `<div class="notice warn">Pilot remains invite-only and on HOLD until ${esc(pilot.outstanding?.length??0)} observed evidence item(s) are complete. Source checks never create a real customer journey.</div>`}
    ${outstanding.length
      ? `<p class="mini">Retained launch evidence also has ${esc(outstanding.length)} owner-observed item(s) outstanding.</p>`
      : '<p class="mini">Retained owner-observed launch evidence is recorded.</p>'}
    <p class="muted">Participant authorization is never inferred, customer identity is not returned by this view, and no booking, message or provider action is performed automatically.</p>
    <p><a class="btn ghost" href="/admin-startup-guide.html#evidence">Record / review launch evidence</a></p>`;
}



function renderWorkflowEvidence(data){
  const evidence=data.production_workflow_evidence||{};
  const acceptance=data.authenticated_device_visual_acceptance||{};
  const deviceClosure=acceptance.acceptance_closure||{};
  const regressionClosure=acceptance.regression_closure||{};
  const observationTriage=acceptance.observation_refresh_regression_triage||{};
  const roles=Array.isArray(evidence.roles)?evidence.roles:[];
  const acceptedRoles=Array.isArray(acceptance.roles)?acceptance.roles:[];
  const devices=Array.isArray(acceptance.devices)?acceptance.devices:[];
  const outstanding=Array.isArray(evidence.outstanding)?evidence.outstanding:[];
  const host=$("#workflowOut");
  if(!host)return;
  if(!data.production_workflow_evidence){
    host.innerHTML='<h2>Customer & staff Production workflow evidence</h2><div class="notice bad">Workflow evidence source is unavailable. Missing real-device evidence remains a HOLD.</div>';
    return;
  }
  host.innerHTML=`
    <h2>Customer & staff Production workflow evidence</h2>
    <div class="metric-grid">
      ${metric("Workflow evidence",evidence.status||"hold")}
      ${metric("Authenticated visual acceptance",acceptance.status||"hold")}
      ${metric("Current refresh",acceptance.closure_candidate?"current":"hold")}
      ${metric("Closure review",deviceClosure.status||"owner_action")}
      ${metric("Regression review",regressionClosure.status||"refresh_required")}
      ${metric("Observation triage",observationTriage.status||"observation_refresh_required")}
      ${metric("Triage regressions",observationTriage.regression_triage_count??0)}
      ${metric("Refresh roles",(observationTriage.refresh_required_role_ids||[]).length)}
      ${metric("Refresh devices",(observationTriage.refresh_required_device_ids||[]).length)}
      ${metric("Current regressions",(regressionClosure.current_regression_role_ids||[]).length)}
      ${metric("Historical-only",(regressionClosure.historical_only_role_ids||[]).length)}
      ${metric("Regression devices",esc((regressionClosure.current_regression_device_ids||[]).join(", ")||"none"))}
      ${metric("Regression browsers",esc((regressionClosure.current_regression_browser_ids||[]).join(", ")||"none"))}
      ${metric("Observation freshness",`${acceptance.freshness_days??30} days`)}
      ${metric("Stale coverage",`${(deviceClosure.stale_role_ids||[]).length} role / ${(deviceClosure.stale_device_ids||[]).length} device`)}
      ${metric("Missing coverage",`${(deviceClosure.missing_role_ids||[]).length} role / ${(deviceClosure.missing_device_ids||[]).length} device`)}
      ${metric("Stale roles",acceptance.stale_role_count??0)}
      ${metric("Dated roles",`${acceptance.dated_role_count??0}/${acceptance.required_role_count??4}`)}
      ${metric("Representative devices",`${acceptance.dated_device_count??0}/${acceptance.required_device_count??3}`)}
      ${metric("Observed real jobs",evidence.observed_real_jobs??0)}
      ${metric("Outstanding",outstanding.length)}
    </div>
    <div class="stack">${roles.map(x=>{
      const visual=acceptedRoles.find(row=>row.id===x.id)||{};
      return `<article class="evidence-row"><div><strong>${esc(x.title||x.id)}</strong><p class="mini">${esc(x.detail||"")}</p><p class="mini">Role language: ${x.role_language_present?"yes":"no"} · real-device / representative-viewport language: ${x.device_or_viewport_language_present?"yes":"no"}</p><p class="mini">Authenticated visual fields: auth ${visual.authentication_evidence_present?"yes":"no"} · browser ${visual.browser_evidence_present?"yes":"no"} · route ${visual.route_evidence_present?"yes":"no"} · viewport ${visual.viewport_evidence_present?"yes":"no"} · outcome ${visual.outcome_evidence_present?"yes":"no"}</p><p class="mini">Device: ${esc((visual.device_classes||[]).join(", ")||"not recorded")} · browser: ${esc((visual.browser_classes||[]).join(", ")||"not recorded")} · safe route: ${esc((visual.routes||[]).join(", ")||"not recorded")}</p><p class="mini">Current refresh: ${visual.current?"yes":"no"} · current observation: ${visual.current_observation?"yes":"no"} · age: ${visual.age_days==null?"not dated":`${visual.age_days} d`} · stale: ${visual.stale?"yes":"no"}</p><p class="mini">Current regression: ${visual.current_regression?"yes":"no"} · historical acceptance: ${visual.historical_acceptance?"yes":"no"} · retained workflow acceptance: ${visual.retained_workflow_verified?"yes":"no"}</p></div>${chip(visual.status||x.status||x.classification||"owner_action")}</article>`;
    }).join("")}</div>
    <div class="stack">${devices.map(x=>`<article class="evidence-row"><div><strong>${esc(x.title||x.id)}</strong><p class="mini">Observed roles: ${esc((x.roles||[]).join(", ")||"none")} · latest dated observation: ${esc(x.observed_at?new Date(x.observed_at).toLocaleString("en-CA",{dateStyle:"medium",timeStyle:"short"}):"not observed")}</p></div>${chip(x.status||x.classification||"owner_action")}</article>`).join("")}</div>
    <p class="mini"><strong>Acceptance closure:</strong> ${esc(deviceClosure.detail||"Authenticated role/device coverage remains subject to explicit operator review.")}</p>
    <p class="mini"><strong>Regression closure:</strong> ${esc(regressionClosure.detail||"Current regression review requires dated authenticated role/device/browser evidence.")}</p>
    <p class="mini"><strong>Observation refresh & regression triage:</strong> ${esc(observationTriage.detail||"Current authenticated observations remain subject to explicit operator review.")}</p>
    <p class="mini"><strong>Triage roles:</strong> ${esc((observationTriage.newly_observed_regression_role_ids||[]).join(", ")||"none")} · <strong>Refresh roles:</strong> ${esc((observationTriage.refresh_required_role_ids||[]).join(", ")||"none")} · <strong>Refresh devices:</strong> ${esc((observationTriage.refresh_required_device_ids||[]).join(", ")||"none")}</p>
    <p class="mini"><strong>Current regression roles:</strong> ${esc((regressionClosure.current_regression_role_ids||[]).join(", ")||"none")} · <strong>Historical-only roles:</strong> ${esc((regressionClosure.historical_only_role_ids||[]).join(", ")||"none")}</p>
    <p class="mini"><strong>Current browsers:</strong> ${esc((regressionClosure.current_browser_ids||[]).join(", ")||"none")} · <strong>Regression browsers:</strong> ${esc((regressionClosure.current_regression_browser_ids||[]).join(", ")||"none")}</p>
    <p class="mini"><strong>Current devices:</strong> ${esc((regressionClosure.current_device_ids||[]).join(", ")||"none")} · <strong>Regression devices:</strong> ${esc((regressionClosure.current_regression_device_ids||[]).join(", ")||"none")}</p>
    <p class="mini"><strong>Truth boundary:</strong> Historical acceptance does not override a current regression. No browser farm or source-check inference can prove the absence of a real-device regression.</p>
    <p class="mini"><strong>Current surfaces:</strong> ${esc((deviceClosure.current_role_ids||[]).join(", ")||"none")} · <strong>Current devices:</strong> ${esc((deviceClosure.current_device_ids||[]).join(", ")||"none")}</p>
    <p class="mini"><strong>Canonical HOLD:</strong> ${esc(acceptance.canonical_hold?.detail||"Representative authenticated phone/tablet/desktop evidence remains owner-observed.")}</p>
    <p class="muted">Verified states come only from dated role-specific observations. Source responsive checks do not invent real-device proof; customer identity and evidence-note contents are not returned; protected content is not returned either. No automated screenshot polling is used.</p>`;
}

function renderProviderClosure(data){
  const closure=data.provider_evidence_closure||{};
  const refresh=data.provider_outcome_delivery_evidence||{};
  const reconciliation=data.provider_evidence_reconciliation_refresh||{};
  const availabilityReview=data.provider_evidence_closure_availability_review||{};
  const decisionReadiness=data.provider_outcome_review_hold_decision_readiness||{};
  const traceability=data.provider_hold_decision_traceability_closure_review||{};
  const payments=closure.payments||{}, refunds=closure.refunds||{}, delivery=closure.delivery||{};
  const rows=Array.isArray(closure.required)?closure.required:[];
  const host=$("#providerOut");
  if(!host)return;
  if(!data.provider_evidence_closure){
    host.innerHTML='<h2>Payment, refund & delivery provider evidence</h2><div class="notice bad">Provider evidence source is unavailable. Missing evidence remains a HOLD.</div>';
    return;
  }
  host.innerHTML=`
    <h2>Payment, refund & delivery provider evidence</h2>
    <div class="metric-grid">
      ${metric("HOLD decision",refresh.status||closure.status||"hold")}
      ${metric("Dated evidence",`${refresh.dated_evidence_count??0}/${refresh.required_evidence_count??4}`)}
      ${metric("Definitive refunds",refunds.definitive_refunds??0)}
      ${metric("Definitive delivery",delivery.definitive_deliveries??0)}
      ${metric("Provider accepted",delivery.provider_accepted??0)}
      ${metric("Evidence age",reconciliation.oldest_evidence_age_days==null?"not dated":`${reconciliation.oldest_evidence_age_days} d oldest`)}
      ${metric("Source gaps",reconciliation.source_gap_count??0)}
      ${metric("Sources available",(availabilityReview.source_availability?.available_count??0)+"/"+(availabilityReview.source_availability?.required_count??4))}
      ${metric("Closure review",availabilityReview.closure_candidate_review?.status||"not_candidate_missing_evidence")}
      ${metric("Decision readiness",decisionReadiness.status||"retain_hold_missing_evidence")}
      ${metric("Narrowing review",decisionReadiness.decision_package?.narrowing_review_eligible?"eligible":"not eligible")}
      ${metric("Date continuity",traceability.evidence_date_continuity?.status||"incomplete_missing_or_invalid_date")}
      ${metric("Operator review trace",traceability.operator_review_traceability?.status||"operator_review_not_recorded")}
      ${metric("Closure review",traceability.closure_review?.status||"retain_hold_provider_package_not_ready")}
    </div>
    <p><strong>Stripe:</strong> ${chip(payments.stripe?.observed?"verified":payments.stripe?.classification||"provider_dependent")} · <strong>PayPal:</strong> ${chip(payments.paypal?.observed?"verified":payments.paypal?.classification||"provider_dependent")}</p>
    <div class="stack">${rows.map(x=>{const age=(reconciliation.rows||[]).find(r=>r.id===x.id)||{};return `<article class="evidence-row"><div><strong>${esc(x.title||x.id)}</strong><p class="mini">${esc(x.detail||"")}</p><p class="mini">Source: ${esc(age.source||"retained provider evidence")} · Evidence age: ${esc(age.age_days==null?"not dated":`${age.age_days} days`)} · Freshness: ${esc(age.freshness||"unknown")}</p></div>${chip(x.status||x.classification||"provider_dependent")}</article>`;}).join("")}</div>
    <p class="mini"><strong>Notification evidence:</strong> ${esc(delivery.failed??0)} failed · ${esc(delivery.cancelled_or_suppressed??0)} cancelled/suppressed · ${esc(delivery.queued_or_pending??0)} queued/pending.</p>
    <p class="mini"><strong>Latest dated evidence:</strong> ${esc(refresh.latest_observed_at?new Date(refresh.latest_observed_at).toLocaleString("en-CA",{dateStyle:"medium",timeStyle:"short"}):"not observed")}</p>
    <p class="mini"><strong>Canonical HOLD:</strong> ${esc(refresh.canonical_hold?.detail||"Provider outcomes & communications remains open until dated attributable evidence exists.")}</p>
    <p class="mini"><strong>Closure candidate:</strong> ${esc(availabilityReview.closure_candidate_review?.retained_closure_candidate?"yes — operator review still required":"no")} · ${esc(availabilityReview.closure_candidate_review?.detail||"Required provider evidence is not yet review-ready.")}</p>
    <p class="mini"><strong>Operator HOLD decision:</strong> ${esc(decisionReadiness.decision_package?.detail||"Retain the HOLD until the decision package has complete current provider evidence.")}</p>
    <p class="mini"><strong>Default without operator action:</strong> retain HOLD · <strong>Eligible decisions:</strong> ${esc((decisionReadiness.decision_package?.permitted_operator_actions||["retain_hold"]).join(", "))}</p>
    <p class="mini"><strong>Evidence trace key:</strong> <code>${esc(traceability.evidence_date_continuity?.evidence_trace_key||"unavailable")}</code></p>
    <p class="mini"><strong>Evidence dates:</strong> ${esc(traceability.evidence_date_continuity?.oldest_evidence_at||"not dated")} → ${esc(traceability.evidence_date_continuity?.latest_evidence_at||"not dated")} · <strong>Valid dated:</strong> ${esc(traceability.evidence_date_continuity?.valid_dated_count??0)}/${esc(traceability.evidence_date_continuity?.required_count??4)}</p>
    <p class="mini"><strong>Build 476 closure review:</strong> ${chip(traceability.closure_review?.status||"retain_hold_provider_package_not_ready")} · ${esc(traceability.closure_review?.detail||"Provider HOLD remains retained until evidence continuity and explicit operator review are traceable.")}</p>
    <p class="mini"><strong>Operator review record:</strong> ${traceability.operator_review_traceability?.review_valid?"valid matching record":"not recorded / not valid"} · <strong>Manual HOLD update candidate:</strong> ${traceability.closure_review?.manual_hold_update_candidate?"yes":"no"}</p>
    <p class="muted">A closure candidate never edits the HOLD backlog automatically. Provider accepted is not final delivery. This view summarizes persisted evidence only; it does not create a charge, initiate a refund, send a notification or replay a webhook.</p>`;
}

function renderRecovery(data){
  const recovery=data.recovery||{}, exports=Array.isArray(data.exports)?data.exports:[];
  const proof=data.recovery_export_operational_proof||{}, closure=data.backup_recovery_evidence_closure||{}, review=data.recovery_artifact_drill_evidence_review||{}, readiness=data.recovery_evidence_closure_drill_readiness||{}, decision=data.recovery_evidence_validation_drill_decision_readiness||{}, refresh=data.recovery_drill_evidence_refresh_closure_review||{};
  const backup=proof.backup||{}, drill=proof.recovery_drill||{}, accountant=proof.accountant_export||{}, artifact=proof.export_artifact||{};
  const required=Array.isArray(proof.required)?proof.required:[], closureRequired=Array.isArray(closure.required)?closure.required:[];
  $("#recoveryOut").innerHTML=`
    <h2>Backup, restore & accountant export operational proof</h2>
    <div class="metric-grid">
      ${metric("HOLD decision",closure.status||proof.status||"hold")}
      ${metric("Dated recovery evidence",`${closure.dated_evidence_count??0}/${closure.required_evidence_count??3}`)}
      ${metric("Backup artifact",backup.artifact_observed?"observed":"owner action")}
      ${metric("Restore drill",drill.observed?"observed":"owner action")}
      ${metric("Accountant export",accountant.usable?"usable":accountant.status||"hold")}
      ${metric("Stale recovery evidence",review.stale_count??0)}
      ${metric("Missing recovery evidence",review.missing_count??0)}
      ${metric("Recovery sources",(readiness.source_availability?.available_count??0)+"/"+(readiness.source_availability?.required_count??3))}
      ${metric("Closure readiness",readiness.closure_readiness?.status||"not_ready_owner_action")}
      ${metric("Drill readiness",readiness.drill_readiness?.status||"owner_action")}
      ${metric("Decision readiness",decision.status||"retain_hold_missing_evidence")}
      ${metric("Drill decision",decision.drill_decision?.status||"retain_hold_missing_drill_evidence")}
      ${metric("Default without operator action",decision.decision_package?.default_if_no_operator_action||"retain_hold")}
      ${metric("Build 477 refresh / closure review",refresh.status||"retain_hold_recovery_package_not_ready")}
      ${metric("Plan kind",refresh.refresh_or_drill_plan?.kind||"none")}
      ${metric("Owner review trace",refresh.owner_review_traceability?.status||"owner_review_not_recorded")}
    </div>
    <p><strong>Backup evidence observed:</strong> ${chip(recovery.backup_evidence_observed?"verified":"owner action")} · <strong>Rollback drill observed:</strong> ${chip(recovery.rollback_drill_observed?"verified":"owner action")}</p>
    <p class="mini"><strong>Build 447 recovery review:</strong> ${chip(review.status||"owner_action")} · backup ${esc(review.backup_artifact?.age_days==null?"not dated":`${review.backup_artifact.age_days} d`)} · retention ${esc(review.retention_location?.age_days==null?"not dated":`${review.retention_location.age_days} d`)} · drill ${esc(review.recovery_drill?.age_days==null?"not dated":`${review.recovery_drill.age_days} d`)}</p>
    <p class="mini"><strong>Latest dated recovery evidence:</strong> ${esc(closure.latest_observed_at?new Date(closure.latest_observed_at).toLocaleString("en-CA",{dateStyle:"medium",timeStyle:"short"}):"not observed")}</p>
    <p class="mini"><strong>Canonical HOLD:</strong> ${esc(closure.canonical_hold?.detail||"Backup artifact, retention location and recovery-drill evidence remain owner-observed requirements.")}</p>
    <p class="mini"><strong>Build 457 closure/readiness:</strong> ${chip(readiness.status||"not_ready_owner_action")} · ${esc(readiness.closure_readiness?.detail||"Required recovery evidence is not yet operator-review ready.")}</p>
    <p class="mini"><strong>Build 467 validation & drill decision:</strong> ${chip(decision.status||"retain_hold_missing_evidence")} · ${esc(decision.decision_package?.detail||"Retain the HOLD until current attributable recovery evidence supports an operator decision.")}</p>
    <p class="mini"><strong>Bounded drill decision:</strong> ${chip(decision.drill_decision?.status||"retain_hold_missing_drill_evidence")} · <strong>Production restore authorized:</strong> ${decision.drill_decision?.production_restore_authorized?"yes":"no"}</p>
    <p class="mini"><strong>Build 477 refresh / closure review:</strong> ${chip(refresh.status||"retain_hold_recovery_package_not_ready")} · ${esc(refresh.closure_review?.detail||"Retain the HOLD until an explicit owner-reviewed recovery evidence plan or closure review is traceable to the current evidence snapshot.")}</p>
    <p class="mini"><strong>Plan prerequisites:</strong> ${esc((refresh.refresh_or_drill_plan?.prerequisites||[]).join(" · ")||"none")}</p>
    <p class="mini"><strong>Post-observation evidence:</strong> ${esc((refresh.refresh_or_drill_plan?.post_observation_evidence_requirements||[]).join(" · ")||"none")} · <strong>Production restore authorized:</strong> ${refresh.refresh_or_drill_plan?.production_restore_authorized?"yes":"no"}</p>
    <div class="stack">${closureRequired.map(x=>`<article class="evidence-row"><div><strong>${esc(x.title||x.id)}</strong><p class="mini">${esc(x.detail||"")}</p><p class="mini">Observed: ${esc(x.observed_at?new Date(x.observed_at).toLocaleString("en-CA",{dateStyle:"medium",timeStyle:"short"}):"not dated")}</p></div>${chip(x.status||x.classification||"owner_action")}</article>`).join("")}</div>
    <p class="mini"><strong>Retention location:</strong> ${chip(backup.retention_location_observed?"verified":"owner action")} · <strong>Retained accountant-export artifact:</strong> ${chip(artifact.observed?"verified":artifact.classification||"owner_action")}</p>
    <p class="mini"><strong>Source route presence is not artifact proof.</strong> This read-only view does not generate an export or perform a Production restore; it also does not execute a drill.</p>
    <p class="mini"><strong>Retained export artifact:</strong> ${chip(artifact.observed?"verified":artifact.classification||"owner_action")} · <strong>Operational proof rows:</strong> ${esc(required.length)}</p>
    <p class="muted">A ready decision package never edits the HOLD backlog automatically. Build 477 may make a refresh or bounded non-Production drill plan ready for separate execution only after explicit owner review; it never performs the refresh or drill and never authorizes a Production restore.</p>`;
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
