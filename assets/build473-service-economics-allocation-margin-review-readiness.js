// Build 507 — retained manual service economics UI with winter booking/quote controlled activation decisions.
(function (globalScope) {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const money = (value) => value == null ? "—" : new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(value || 0));

  async function refresh() {
    const button = $("refreshReview");
    if (button) button.disabled = true;
    setStatus("Refreshing bounded allocation and margin-readiness evidence…", "soft");
    try {
      const response = await fetch(
        "/api/admin/service_economics_commercial_capacity_review?month=" + encodeURIComponent($("reviewMonth").value) +
        "&year=" + encodeURIComponent($("reviewYear").value) + "&days=90",
        { method: "GET", credentials: "include", cache: "no-store", headers: { Accept: "application/json" } }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error(data?.error || "Service-economics allocation evidence could not be loaded.");
      renderSummary(data);
      renderCompleteness(data.economics?.evidence_completeness || {});
      renderAllocation(data.economics?.allocation_margin_readiness || {});
      renderClosure(data.economics?.allocation_evidence_closure || {}, data.economics?.seasonal_operability || {});
      renderColdWeatherCapabilityMatrix(data.economics?.cold_weather_capability_matrix || {});
      renderWinterBookingEligibility(data.economics?.winter_booking_eligibility || {});
      renderWeatherSafeRouting(data.economics?.weather_safe_routing || {});
      renderSeasonalOwnerReview(data.economics?.seasonal_owner_review_public_claim || {});
      renderSeasonalPublicClaimActivationDecision(data.economics?.seasonal_public_claim_activation_decision || {});
      renderSeasonalPublicClaimOutcomeContinuity(data.economics?.seasonal_public_claim_outcome_continuity || {});
      renderSeasonalPublicClaimOutcomeFreshnessReview(data.economics?.seasonal_public_claim_outcome_freshness_review || {});
      renderWinterRuleActivationReadiness(data.economics?.winter_booking_quote_activation_readiness || {});
      renderWinterRuleControlledActivationDecision(data.economics?.winter_booking_quote_controlled_activation_decision || {});
      renderWinterRuleControlledActivationOutcomeContinuity(data.economics?.winter_booking_quote_controlled_activation_outcome_continuity || {});
      renderWinterBookingQuoteRuleOutcomeFreshnessReview(data.economics?.winter_booking_quote_rule_outcome_freshness_review || {});
      renderControlledEnvironmentSiteQualification(data.economics?.controlled_environment_site_qualification || {});
      renderControlledEnvironmentOperationalReadiness(data.economics?.controlled_environment_operational_readiness || {});
      renderControlledEnvironmentRoutingOutcomeContinuity(data.economics?.controlled_environment_routing_outcome_continuity || {});
      renderControlledEnvironmentRoutingOutcomeFreshnessCapacityReview(data.economics?.controlled_environment_routing_outcome_freshness_capacity_review || {});
      renderCandidates(data.review_candidates || []);
      renderSources(data.source_status || {});
      const allocation = data.economics?.allocation_margin_readiness || {};
      setStatus(
        "Snapshot refreshed. Service/package allocation: " + String(allocation.service_package?.status || "unavailable").toUpperCase() +
        ". Add-on allocation: " + String(allocation.add_on?.status || "unavailable").toUpperCase() +
        ". No price, discount, booking, accounting, inventory, provider or schema action was performed.",
        allocation.service_package?.service_package_margin_review_ready ? "ok" : "warn"
      );
    } catch (error) {
      $("summaryGrid").innerHTML = '<div class="review-empty">No bounded economics snapshot is available.</div>';
      $("completenessGrid").innerHTML = '<div class="review-empty">Completeness evidence is unavailable.</div>';
      $("allocationGrid").innerHTML = '<div class="review-empty">Allocation linkage evidence is unavailable.</div>';
      if($("closureGrid")) $("closureGrid").innerHTML = '<div class="review-empty">Allocation evidence closure is unavailable.</div>';
      if($("seasonalGrid")) $("seasonalGrid").innerHTML = '<div class="review-empty">Seasonal operability evidence is unavailable.</div>';
      if($("capabilityMatrixGrid")) $("capabilityMatrixGrid").innerHTML = '<div class="review-empty">Cold-weather capability evidence is unavailable.</div>';
      if($("winterEligibilityGrid")) $("winterEligibilityGrid").innerHTML = '<div class="review-empty">Winter booking eligibility evidence is unavailable.</div>';
      if($("weatherSafeRoutingGrid")) $("weatherSafeRoutingGrid").innerHTML = '<div class="review-empty">Weather-safe routing evidence is unavailable.</div>';
      if($("seasonalOwnerReviewGrid")) $("seasonalOwnerReviewGrid").innerHTML = '<div class="review-empty">Seasonal owner/public-claim review is unavailable.</div>';
      if($("seasonalPublicClaimActivationDecisionGrid")) $("seasonalPublicClaimActivationDecisionGrid").innerHTML = '<div class="review-empty">Seasonal public-claim activation decision evidence is unavailable.</div>';
      if($("seasonalPublicClaimOutcomeContinuityGrid")) $("seasonalPublicClaimOutcomeContinuityGrid").innerHTML = '<div class="review-empty">Seasonal public-claim outcome continuity evidence is unavailable.</div>';
      if($("seasonalPublicClaimOutcomeFreshnessReviewGrid")) $("seasonalPublicClaimOutcomeFreshnessReviewGrid").innerHTML = '<div class="review-empty">Seasonal public-claim freshness evidence is unavailable.</div>';
      if($("winterRuleActivationReadinessGrid")) $("winterRuleActivationReadinessGrid").innerHTML = '<div class="review-empty">Winter booking/quote activation-readiness evidence is unavailable.</div>';
      if($("winterRuleControlledActivationDecisionGrid")) $("winterRuleControlledActivationDecisionGrid").innerHTML = '<div class="review-empty">Winter booking/quote controlled activation decision evidence is unavailable.</div>';
      if($("winterRuleOutcomeFreshnessReviewGrid")) $("winterRuleOutcomeFreshnessReviewGrid").innerHTML = '<div class="review-empty">Winter booking/quote rule freshness evidence is unavailable.</div>';
      if($("controlledEnvironmentSiteQualificationGrid")) $("controlledEnvironmentSiteQualificationGrid").innerHTML = '<div class="review-empty">Controlled-environment site qualification evidence is unavailable.</div>';
      if($("controlledEnvironmentOperationalReadinessGrid")) $("controlledEnvironmentOperationalReadinessGrid").innerHTML = '<div class="review-empty">Controlled-environment operational readiness evidence is unavailable.</div>';
      if($("controlledEnvironmentRoutingFreshnessCapacityGrid")) $("controlledEnvironmentRoutingFreshnessCapacityGrid").innerHTML = '<div class="review-empty">Controlled-environment routing freshness/capacity evidence is unavailable.</div>';
      $("candidateList").innerHTML = '<div class="review-empty">No margin conclusion can be supported from unavailable evidence.</div>';
      $("sourceList").innerHTML = '<div class="review-empty">Evidence source status unavailable.</div>';
      setStatus(error?.message || "Service-economics allocation evidence could not be loaded.", "bad");
    } finally {
      if (button) button.disabled = false;
    }
  }

  function renderSummary(data) {
    const e = data.economics || {};
    const c = e.evidence_completeness || {};
    const allocation = e.allocation_margin_readiness || {};
    const service = allocation.service_package || {};
    const addOn = allocation.add_on || {};
    const rows = [
      ["Observed economics jobs", String(c.booking_count ?? e.booking_count ?? 0), c.all_required_layers_ready ? "All required layers ready" : "At least one required layer incomplete"],
      ["Service/package cohorts", String(service.cohort_count ?? 0), String(service.review_ready_cohort_count ?? 0) + " review-ready"],
      ["Service/package margin", service.service_package_margin_review_ready ? "READY" : "BOUNDED", "Recorded booking-to-package linkage only"],
      ["Add-on allocation rows", String(addOn.explicit_allocation_row_count ?? 0), String(addOn.review_ready_add_on_count ?? 0) + " add-on cohort(s) review-ready"],
      ["Add-on margin", addOn.add_on_margin_review_ready ? "READY" : "UNAVAILABLE", "Explicit per-add-on linkage required"],
      ["Recognized revenue", money(e.recognized_revenue_cad), "Recorded revenue only"],
      ["Automatic decision", "NONE", "No price/discount or posting mutation"]
    ];
    $("summaryGrid").innerHTML = rows.map((row) =>
      '<article class="review-stat"><span class="mini">' + esc(row[0]) + '</span><strong>' + esc(row[1]) + '</strong><span class="mini">' + esc(row[2]) + '</span></article>'
    ).join("");
  }

  function renderCompleteness(completeness) {
    const rows = Object.values(completeness.layers || {});
    if (!rows.length) {
      $("completenessGrid").innerHTML = '<div class="review-empty">No retained economics layer evidence is available.</div>';
      return;
    }
    $("completenessGrid").innerHTML = rows.map((row) =>
      '<article class="review-stat"><span class="mini">' + esc(row.label || row.key || "Evidence layer") + '</span>' +
      '<strong>' + esc(String(row.ready_booking_count ?? 0) + " / " + String(row.booking_count ?? 0)) + '</strong>' +
      '<span class="mini">Ready · ' + esc(row.completeness_pct == null ? "—" : String(row.completeness_pct) + "%") +
      ' · review ' + esc(row.review_booking_count ?? 0) + ' · unavailable ' + esc(row.unavailable_booking_count ?? 0) + '</span></article>'
    ).join("");
  }

  function renderAllocation(allocation) {
    const service = allocation.service_package || {};
    const addOn = allocation.add_on || {};
    const serviceRows = Array.isArray(service.cohorts) ? service.cohorts : [];
    const addOnRows = Array.isArray(addOn.cohorts) ? addOn.cohorts : [];
    const cards = [];
    for (const row of serviceRows) {
      cards.push('<article class="review-candidate state-' + esc(row.margin_review_ready ? "observed" : "review") + '">' +
        '<div class="review-head"><strong>Service/package · ' + esc(row.package_code) + '</strong><span class="pill">' + esc(row.margin_review_ready ? "review-ready" : "blocked") + '</span></div>' +
        '<p class="mini">' + esc(String(row.allocation_ready_booking_count ?? 0) + " / " + String(row.booking_count ?? 0)) + ' booking row(s) have complete recorded component linkage.</p>' +
        '<p class="mini">Contribution shown only when every row is linked: ' + esc(money(row.contribution_cad)) + ' · inferred split: NO · overhead used for readiness: NO</p></article>');
    }
    for (const row of addOnRows) {
      cards.push('<article class="review-candidate state-' + esc(row.margin_review_ready ? "observed" : "review") + '">' +
        '<div class="review-head"><strong>Add-on · ' + esc(row.add_on_code) + '</strong><span class="pill">' + esc(row.margin_review_ready ? "review-ready" : "blocked") + '</span></div>' +
        '<p class="mini">' + esc(String(row.allocation_ready_row_count ?? 0) + " / " + String(row.evidence_row_count ?? 0)) + ' explicit allocation row(s) have complete recorded component linkage.</p>' +
        '<p class="mini">Booking-total split, equal split, price-weighted split and unrecorded percentage allocation: NOT ALLOWED.</p></article>');
    }
    if (!cards.length) cards.push('<div class="review-empty">No defensible service/add-on allocation cohort is available. Missing linkage stays unavailable rather than inferred from booking totals.</div>');
    $("allocationGrid").innerHTML = cards.join("");
  }

  function renderClosure(closure, seasonal) {
    const closureMount=$("closureGrid"), seasonalMount=$("seasonalGrid");
    if(closureMount){
      const rows=[
        ["Allocation evidence closure", String(closure.status||"unavailable").toUpperCase(), "Explicit recorded linkage only"],
        ["Service/package gaps", String(closure.service_package_gap_count??0), closure.service_package_closed?"closed":"remain bounded"],
        ["Add-on gaps", String(closure.add_on_gap_count??0), closure.add_on_closed?"closed":"remain bounded"]
      ];
      closureMount.innerHTML=rows.map((row)=>'<article class="review-stat"><span class="mini">'+esc(row[0])+'</span><strong>'+esc(row[1])+'</strong><span class="mini">'+esc(row[2])+'</span></article>').join("");
    }
    if(seasonalMount){
      const counts=seasonal.counts||{};
      const rows=[
        ["Cold-snap capable",counts.cold_snap_capable??0],
        ["Temperature-limited outdoor",counts.temperature_limited_outdoor??0],
        ["Controlled environment",counts.controlled_environment_required??0],
        ["Explicit seasonal rows",seasonal.valid_explicit_row_count??0]
      ];
      seasonalMount.innerHTML=rows.map((row)=>'<article class="review-stat"><span class="mini">'+esc(row[0])+'</span><strong>'+esc(row[1])+'</strong><span class="mini">Seasonal operability is separate from margin evidence.</span></article>').join("");
    }
  }

  function renderColdWeatherCapabilityMatrix(matrix) {
    const mount=$("capabilityMatrixGrid"); if(!mount) return;
    const rows=Array.isArray(matrix.rows)?matrix.rows:[];
    const gaps=Array.isArray(matrix.gaps)?matrix.gaps:[];
    const cards=[];
    for(const row of rows){
      const min=row.minimum_working_temperature_c;
      const max=row.maximum_working_temperature_c;
      let limit="No exact source-owned temperature limit recorded";
      if(row.exact_temperature_claim_supported){
        const parts=[];
        if(min!==null&&min!==undefined) parts.push("min "+String(min)+"°C");
        if(max!==null&&max!==undefined) parts.push("max "+String(max)+"°C");
        limit="Source-owned limit: "+parts.join(" · ");
      }
      cards.push('<article class="review-candidate state-observed"><div class="review-head"><strong>'+
        esc(String(row.entity_type||"service").replaceAll("_"," ")+" · "+String(row.code||"unknown"))+
        '</strong><span class="pill">'+esc(String(row.classification||"unavailable").replaceAll("_"," "))+'</span></div>'+
        '<p class="mini">Evidence: '+esc(row.evidence_source_type||"unavailable")+' · '+esc(row.evidence_reference||"unavailable")+'</p>'+
        '<p class="mini">'+esc(limit)+' · Automatic booking change: NO · Broad winter claim: HOLD</p></article>');
    }
    for(const gap of gaps){
      cards.push('<article class="review-candidate state-review"><div class="review-head"><strong>Evidence gap · '+esc(gap.code||"unidentified row")+
        '</strong><span class="pill">review</span></div><p class="mini">Missing: '+esc((gap.missing||[]).join(", ")||"required attributable evidence")+
        '. No classification or temperature threshold is inferred.</p></article>');
    }
    if(!cards.length) cards.push('<div class="review-empty">No attributable cold-weather capability rows are available. Broad winter claim: HOLD.</div>');
    mount.innerHTML=cards.join("");
    const detail=$("capabilityMatrixDetail");
    if(detail) detail.textContent="Valid rows: "+String(matrix.valid_row_count??0)+" · gaps: "+String(matrix.gap_count??0)+" · exact source-owned temperature limits: "+String(matrix.counts?.exact_temperature_limit??0)+". Broad winter claim: HOLD.";
  }

  function renderWinterBookingEligibility(eligibility) {
    const mount=$("winterEligibilityGrid"); if(!mount) return;
    const rows=Array.isArray(eligibility.rows)?eligibility.rows:[];
    const cards=rows.map((row)=>'<article class="review-candidate state-observed"><div class="review-head"><strong>'+
      esc(String(row.entity_type||"service").replaceAll("_"," ")+" · "+String(row.code||"unknown"))+
      '</strong><span class="pill">'+esc(String(row.eligibility_state||"owner_review_required").replaceAll("_"," "))+'</span></div>'+
      '<p><strong>Booking/quote guidance:</strong> '+esc(row.booking_quote_guidance||"Owner review required.")+'</p>'+
      '<p class="mini"><strong>Draft customer wording:</strong> '+esc(row.customer_limitation_text||"Winter eligibility is not established.")+'</p>'+
      '<p class="mini">'+esc(row.temperature_limit_text||"No exact source-owned working-temperature limit recorded.")+
      ' · Prepared wording is not published automatically. · Automatic eligibility change: NO</p></article>');
    const weather=eligibility.weather_ineligible_conversion_interpretation||{};
    cards.push('<article class="review-candidate state-'+esc(weather.status==="observed"?"observed":"review")+'"><div class="review-head"><strong>Conversion interpretation</strong><span class="pill">'+esc(weather.status||"unavailable")+'</span></div>'+
      '<p class="mini">Weather-ineligible sessions are excluded from ordinary conversion interpretation: YES · observed weather-ineligible sessions: '+esc(weather.weather_ineligible_session_count??"unavailable")+'</p>'+
      '<p class="mini">Adjusted conversion metric available: '+esc(weather.adjusted_conversion_metric_available===true?"YES":"NO")+' · Missing session evidence is never inferred.</p></article>');
    mount.innerHTML=cards.join("")||'<div class="review-empty">No winter booking eligibility row is prepared.</div>';
    const detail=$("winterEligibilityDetail");
    if(detail) detail.textContent="Prepared rows: "+String(eligibility.row_count??0)+" · customer copy: "+String(eligibility.customer_copy_status||"unavailable")+". Broad winter claim remains on HOLD.";
  }

  function renderWeatherSafeRouting(routing) {
    const mount=$("weatherSafeRoutingGrid"); if(!mount) return;
    const rows=Array.isArray(routing.rows)?routing.rows:[];
    const gaps=Array.isArray(routing.gaps)?routing.gaps:[];
    const cards=[];
    for(const row of rows){
      const alt=row.controlled_environment_alternative_supported===true
        ? "Controlled-environment alternative: "+String(row.controlled_environment_source_type||"source")+" · "+String(row.controlled_environment_reference||"reference unavailable")
        : row.indoor_capable_workflow_supported===true
          ? "Controlled-environment alternative: indoor workflow · "+String(row.indoor_workflow_reference||"reference unavailable")
          : "Controlled-environment alternative: not evidenced. Do not assume an indoor move.";
      cards.push('<article class="review-candidate state-observed"><div class="review-head"><strong>'+
        esc(String(row.entity_type||"service").replaceAll("_"," ")+" · "+String(row.code||"unknown"))+
        '</strong><span class="pill">'+esc(String(row.routing_state||"owner_review_required").replaceAll("_"," "))+'</span></div>'+
        '<p><strong>Weather-safe route:</strong> '+esc(row.routing_guidance||"Owner/site review required.")+'</p>'+
        '<p class="mini">'+esc(alt)+'</p>'+
        '<p class="mini"><strong>Draft customer guidance:</strong> '+esc(row.customer_guidance_draft||"No weather-safe route established.")+'</p>'+
        '<p class="mini">'+esc(row.source_owned_temperature_limit_text||"No exact source-owned working-temperature limit recorded.")+
        ' · Automatic routing/reschedule: NO · Publication: NO</p></article>');
    }
    for(const gap of gaps){
      cards.push('<article class="review-candidate state-review"><div class="review-head"><strong>Controlled-environment evidence gap · '+
        esc(gap.code||"unknown")+'</strong><span class="pill">review</span></div><p class="mini">Missing: '+
        esc((gap.missing||[]).join(", ")||"explicit site/workflow evidence")+' · Safe default: '+esc(gap.safe_default||"owner_review_required")+'</p></article>');
    }
    mount.innerHTML=cards.join("")||'<div class="review-empty">No weather-safe routing row is prepared.</div>';
    const detail=$("weatherSafeRoutingDetail");
    if(detail) detail.textContent="Prepared routes: "+String(routing.row_count??0)+" · gaps: "+String(routing.gap_count??0)+". Not every service can move indoors; automatic routing and rescheduling remain disabled.";
  }

  function renderSeasonalOwnerReview(review) {
    const mount=$("seasonalOwnerReviewGrid"); if(!mount) return;
    const rows=Array.isArray(review.rows)?review.rows:[];
    const cards=[];
    for(const row of rows){
      const ready=row.publication_review_ready===true;
      const state=ready?"observed":"review";
      const decisionLabel=ready
        ? "Publication review ready"
        : row.decision_state==="owner_hold"
          ? "Owner HOLD"
          : "Owner review required";
      cards.push('<article class="review-candidate state-'+esc(state)+'"><div class="review-head"><strong>'+
        esc(String(row.entity_type||"service").replaceAll("_"," ")+" · "+String(row.code||"unknown"))+
        '</strong><span class="pill">'+esc(decisionLabel)+'</span></div>'+
        '<p><strong>Proposed service-specific wording:</strong> '+esc(row.proposed_service_specific_public_wording||"No supported public wording is prepared.")+'</p>'+
        '<p class="mini">Capability evidence current: '+esc(row.capability_evidence_current===true?"YES":"NO")+
        ' · Owner decision: '+esc(row.owner_review_decision||"not recorded")+
        ' · Reviewed: '+esc(row.owner_reviewed_at||"not recorded")+
        ' · Reference: '+esc(row.owner_review_reference||"not recorded")+'</p>'+
        '<p class="mini">'+esc(row.source_owned_temperature_limit_text||"No exact source-owned working-temperature limit recorded.")+
        ' · Automatic publication: NO · Automatic booking change: NO · Broad winter availability remains HOLD.</p></article>');
    }
    const gaps=Array.isArray(review.gaps)?review.gaps:[];
    for(const gap of gaps){
      cards.push('<article class="review-candidate state-review"><div class="review-head"><strong>Owner/public-claim evidence gap · '+
        esc(gap.code||"unknown")+'</strong><span class="pill">HOLD</span></div><p class="mini">Missing: '+
        esc((gap.missing||[]).join(", ")||"current attributable owner/capability evidence")+
        ' · Safe default: '+esc(gap.safe_default||"retain_public_claim_hold")+'</p></article>');
    }
    mount.innerHTML=cards.join("")||'<div class="review-empty">No service-specific public claim is review-ready. Broad winter availability remains HOLD.</div>';
    const detail=$("seasonalOwnerReviewDetail");
    if(detail) detail.textContent="Service-specific decisions: "+String(review.row_count??0)+
      " · publication review ready: "+String(review.counts?.publication_review_ready??0)+
      " · owner HOLD: "+String(review.counts?.owner_hold??0)+
      " · owner review required: "+String(review.counts?.owner_review_required??0)+
      ". Broad winter availability remains HOLD; publication remains manual.";
  }

  function renderSeasonalPublicClaimActivationDecision(decision) {
    const mount=$("seasonalPublicClaimActivationDecisionGrid"); if(!mount) return;
    const rows=Array.isArray(decision.rows)?decision.rows:[];
    const cards=[];
    for(const row of rows){
      const ready=row.public_claim_activation_decision_ready===true;
      const state=ready?"observed":"review";
      const label=ready
        ? "Activation decision ready"
        : row.activation_decision_state==="owner_hold"
          ? "Owner HOLD"
          : "Owner activation review required";
      cards.push('<article class="review-candidate state-'+esc(state)+'"><div class="review-head"><strong>'+
        esc(String(row.entity_type||"service").replaceAll("_"," ")+" · "+String(row.code||"unknown"))+
        '</strong><span class="pill">'+esc(label)+'</span></div>'+
        '<p><strong>Reviewed service-specific wording:</strong> '+esc(row.proposed_service_specific_public_wording||"No supported wording is prepared.")+'</p>'+
        '<p class="mini">Owner activation decision: '+esc(row.public_claim_activation_decision||"not recorded")+
        ' · reviewed: '+esc(row.public_claim_activation_reviewed_at||"not recorded")+
        ' · reference: '+esc(row.public_claim_activation_reference||"not recorded")+
        ' · final wording confirmed: '+esc(row.public_claim_activation_wording_confirmed===true?"YES":"NO")+'</p>'+
        '<p class="mini">'+esc(row.source_owned_temperature_limit_text||"No exact source-owned working-temperature limit recorded.")+
        ' · Actual publication remains manual · Broad winter availability: HOLD · Automatic booking/quote/publication mutation: NONE.</p></article>');
    }
    const gaps=Array.isArray(decision.gaps)?decision.gaps:[];
    for(const gap of gaps){
      cards.push('<article class="review-candidate state-review"><div class="review-head"><strong>Activation HOLD · '+
        esc(gap.code||"unknown")+'</strong><span class="pill">HOLD</span></div><p class="mini">Missing: '+
        esc((gap.missing||[]).join(", ")||"current attributable owner activation evidence")+
        ' · Safe default: '+esc(gap.safe_default||"retain_public_claim_activation_hold")+'</p></article>');
    }
    mount.innerHTML=cards.join("")||'<div class="review-empty">No service-specific public claim has a final owner activation decision. Actual publication remains manual.</div>';
    const detail=$("seasonalPublicClaimActivationDecisionDetail");
    if(detail) detail.textContent="Service-specific activation decisions: "+String(decision.row_count??0)+
      " · activation decision ready: "+String(decision.counts?.public_claim_activation_decision_ready??0)+
      " · owner HOLD: "+String(decision.counts?.owner_hold??0)+
      " · owner activation review required: "+String(decision.counts?.activation_owner_review_required??0)+
      ". Actual publication remains manual; broad winter availability remains HOLD.";
  }

  function renderSeasonalPublicClaimOutcomeContinuity(continuity) {
    const mount=$("seasonalPublicClaimOutcomeContinuityGrid"); if(!mount) return;
    const rows=Array.isArray(continuity.rows)?continuity.rows:[];
    const cards=[];
    for(const row of rows){
      const state=row.outcome_state==="publication_observed"?"observed":"review";
      const label=row.outcome_state==="publication_observed"?"Publication observed":
        row.outcome_state==="retain_hold_observed"?"Retain HOLD observed":
        row.outcome_state==="no_action_observed"?"No action observed":
        row.outcome_state==="publication_evidence_conflict"?"Publication evidence conflict":"Owner action required";
      cards.push('<article class="review-candidate state-'+esc(state)+'"><div class="review-head"><strong>'+
        esc(String(row.entity_type||"service").replaceAll("_"," ")+" · "+String(row.code||"unknown"))+
        '</strong><span class="pill">'+esc(label)+'</span></div>'+
        '<p><strong>Reviewed service-specific wording:</strong> '+esc(row.reviewed_service_specific_public_wording||"No supported wording is retained.")+'</p>'+
        '<p class="mini">Outcome: '+esc(row.public_claim_outcome||"not recorded")+
        ' · observed: '+esc(row.public_claim_outcome_observed_at||"not recorded")+
        ' · reference: '+esc(row.public_claim_outcome_reference||"not recorded")+'</p>'+
        '<p class="mini">Published wording: '+esc(row.published_public_claim_wording||"not observed")+
        ' · published: '+esc(row.public_claim_published_at||"not observed")+
        ' · publication reference: '+esc(row.public_claim_publication_reference||"not observed")+
        ' · reviewed wording match: '+esc(row.published_wording_matches_reviewed_wording===true?"YES":"NO")+'</p>'+
        '<p class="mini">'+esc(row.source_owned_temperature_limit_text||"No exact source-owned working-temperature limit recorded.")+
        ' · Publication state is observed, never inferred · Broad winter availability remains HOLD. · Automatic booking/quote/publication/HOLD mutation: NONE.</p></article>');
    }
    const gaps=Array.isArray(continuity.gaps)?continuity.gaps:[];
    for(const gap of gaps){
      cards.push('<article class="review-candidate state-review"><div class="review-head"><strong>Outcome continuity HOLD · '+
        esc(gap.code||"unknown")+'</strong><span class="pill">HOLD</span></div><p class="mini">State: '+
        esc(gap.state||"outcome_owner_action_required")+' · Missing: '+
        esc((gap.missing||[]).join(", ")||"dated attributable service-specific outcome evidence")+
        ' · Safe default: '+esc(gap.safe_default||"retain_public_claim_hold")+'</p></article>');
    }
    mount.innerHTML=cards.join("")||'<div class="review-empty">No service-specific public-claim outcome has been observed. Missing publication evidence never means no action.</div>';
    const detail=$("seasonalPublicClaimOutcomeContinuityDetail");
    if(detail) detail.textContent="Outcome rows: "+String(continuity.row_count??0)+
      " · publication observed: "+String(continuity.counts?.publication_observed??0)+
      " · retain HOLD observed: "+String(continuity.counts?.retain_hold_observed??0)+
      " · no action observed: "+String(continuity.counts?.no_action_observed??0)+
      " · publication conflicts: "+String(continuity.counts?.publication_evidence_conflict??0)+
      ". Publication state is observed, never inferred; broad winter availability remains HOLD.";
  }


  function renderSeasonalPublicClaimOutcomeFreshnessReview(review) {
    const mount=$("seasonalPublicClaimOutcomeFreshnessReviewGrid"); if(!mount) return;
    const rows=Array.isArray(review.rows)?review.rows:[];
    const labels={publication_current:"Publication current",retain_hold_current:"Retain HOLD current",no_action_current:"No action current",stale_outcome_review_required:"Stale outcome review required",source_owned_threshold_change_review_required:"Source-owned threshold changed",public_wording_drift_review_required:"Published wording drift",capability_evidence_drift_review_required:"Capability evidence drift",outcome_evidence_drift_review_required:"Outcome evidence drift",predecessor_outcome_review_required:"Predecessor outcome review required",freshness_source_unavailable:"Freshness source unavailable"};
    const cards=[];
    for(const row of rows){
      const current=row.freshness_review_current===true;
      cards.push('<article class="review-candidate state-'+esc(current?"observed":"review")+'"><div class="review-head"><strong>'+esc(String(row.entity_type||"service").replaceAll("_"," ")+" · "+String(row.code||"unknown"))+'</strong><span class="pill">'+esc(labels[row.freshness_state]||"Manual review required")+'</span></div><p class="mini">Outcome: '+esc(row.current_public_claim_outcome||"not recorded")+' · observed: '+esc(row.outcome_observed_at||"not recorded")+' · age: '+esc(row.outcome_age_days==null?"unknown":String(row.outcome_age_days)+" day(s)")+' · freshness window: '+esc(String(row.freshness_window_days||review.freshness_window_days||30))+' day(s)</p><p class="mini">Classification: '+esc(row.current_classification||"not recorded")+' · threshold changed: '+esc(row.source_owned_temperature_threshold_changed===true?"YES":"NO")+' · published wording drift: '+esc(row.published_wording_drift_detected===true?"YES":"NO")+' · capability evidence current: '+esc(row.capability_evidence_current===true?"YES":"NO")+'</p><p class="mini">Stale evidence never extends a public claim. Source-owned temperature limits cannot be widened. Broad winter availability remains HOLD. Automatic publication/booking/quote/HOLD mutation: NONE.</p></article>');
    }
    const gaps=Array.isArray(review.gaps)?review.gaps:[];
    for(const gap of gaps) cards.push('<article class="review-candidate state-review"><div class="review-head"><strong>Freshness HOLD · '+esc(gap.code||"unknown")+'</strong><span class="pill">MANUAL REVIEW</span></div><p class="mini">State: '+esc(gap.state||"freshness_review_required")+' · Missing/re-review: '+esc((gap.missing||[]).join(", ")||"current attributable service-specific freshness evidence")+' · Safe default: '+esc(gap.safe_default||"retain_public_claim_hold")+'</p></article>');
    mount.innerHTML=cards.join("")||'<div class="review-empty">No seasonal public-claim outcome freshness rows are available. Missing evidence remains HOLD.</div>';
    const detail=$("seasonalPublicClaimOutcomeFreshnessReviewDetail");
    if(detail) detail.textContent="Freshness rows: "+String(review.row_count??0)+" · current: "+String(review.counts?.current??0)+" · stale: "+String(review.counts?.stale??0)+" · drift: "+String(review.counts?.drift??0)+" · manual review: "+String(review.counts?.review_required??0)+". Stale evidence never extends a public claim; broad winter availability remains HOLD.";
  }

  function renderWinterRuleActivationReadiness(readiness) {
    const mount=$("winterRuleActivationReadinessGrid"); if(!mount) return;
    const rows=Array.isArray(readiness.rows)?readiness.rows:[];
    const cards=[];
    for(const row of rows){
      const ready=row.activation_readiness_review_ready===true;
      const state=ready?"observed":"review";
      const label=ready?"Activation readiness review ready":row.activation_state==="owner_hold"?"Owner HOLD":"Owner review required";
      cards.push('<article class="review-candidate state-'+esc(state)+'"><div class="review-head"><strong>'+
        esc(String(row.entity_type||"service").replaceAll("_"," ")+" · "+String(row.code||"unknown"))+
        '</strong><span class="pill">'+esc(label)+'</span></div>'+
        '<p><strong>Booking rule candidate:</strong> '+esc(row.booking_rule_candidate||"not prepared")+
        ' · <strong>Quote rule candidate:</strong> '+esc(row.quote_rule_candidate||"not prepared")+'</p>'+
        '<p class="mini">Owner decision: '+esc(row.activation_readiness_owner_decision||"not recorded")+
        ' · reviewed: '+esc(row.activation_reviewed_at||"not recorded")+
        ' · reference: '+esc(row.activation_review_reference||"not recorded")+'</p>'+
        '<p class="mini">'+esc(row.source_owned_temperature_limit_text||"No exact source-owned working-temperature limit recorded.")+
        ' · /api/availability remains authoritative · Checkout collision revalidation remains authoritative · No automatic winter rule activation.</p></article>');
    }
    const gaps=Array.isArray(readiness.gaps)?readiness.gaps:[];
    for(const gap of gaps){
      cards.push('<article class="review-candidate state-review"><div class="review-head"><strong>Activation-readiness gap · '+
        esc(gap.code||"unknown")+'</strong><span class="pill">HOLD</span></div><p class="mini">Missing: '+
        esc((gap.missing||[]).join(", ")||"current attributable activation-readiness evidence")+
        ' · Safe default: '+esc(gap.safe_default||"retain_winter_booking_quote_hold")+'</p></article>');
    }
    mount.innerHTML=cards.join("")||'<div class="review-empty">No service-specific winter booking/quote rule is activation-readiness-review-ready. No automatic winter rule activation.</div>';
    const detail=$("winterRuleActivationReadinessDetail");
    if(detail) detail.textContent="Service-specific readiness rows: "+String(readiness.row_count??0)+
      " · activation readiness review ready: "+String(readiness.counts?.activation_readiness_review_ready??0)+
      " · owner HOLD: "+String(readiness.counts?.owner_hold??0)+
      " · owner review required: "+String(readiness.counts?.owner_review_required??0)+
      ". Availability and checkout collision revalidation remain authoritative; broad winter availability remains HOLD.";
  }

  function renderWinterRuleControlledActivationDecision(decision) {
    const mount=$("winterRuleControlledActivationDecisionGrid"); if(!mount) return;
    const rows=Array.isArray(decision.rows)?decision.rows:[];
    const cards=[];
    for(const row of rows){
      const ready=row.controlled_activation_decision_ready===true;
      const state=row.controlled_activation_decision_state||"controlled_activation_owner_review_required";
      cards.push('<article class="review-candidate state-'+esc(state)+'"><div class="review-head"><strong>'+
        esc((row.entity_type||"item")+": "+(row.code||"unknown"))+
        '</strong><span class="pill">'+esc(ready?"Controlled activation decision ready":state.replaceAll("_"," "))+
        '</span></div><p class="mini">Classification: '+esc(row.classification||"unavailable")+
        ' · Booking rule: '+esc(row.booking_rule_candidate||"HOLD")+
        ' · Quote rule: '+esc(row.quote_rule_candidate||"HOLD")+
        '</p><p class="mini">Customer limitation: '+esc(row.customer_limitation_text||"not established")+
        ' · Transparency confirmed: '+esc(row.winter_rule_customer_transparency_confirmed===true?"yes":"no")+
        '</p><p class="mini">Owner decision: '+esc(row.controlled_activation_owner_decision||"not recorded")+
        ' · Reviewed: '+esc(row.controlled_activation_reviewed_at||"not recorded")+
        ' · Reference: '+esc(row.controlled_activation_reference||"not recorded")+
        '</p><p class="mini">Actual rule activation remains manual. /api/availability and checkout collision revalidation remain authoritative.</p></article>');
    }
    for(const gap of (Array.isArray(decision.gaps)?decision.gaps:[])){
      cards.push('<article class="review-candidate state-review"><div class="review-head"><strong>'+
        esc((gap.entity_type||"item")+": "+(gap.code||"unknown"))+
        '</strong><span class="pill">Owner action</span></div><p class="mini">Missing: '+
        esc((gap.missing||[]).join(", ")||"current attributable controlled activation evidence")+
        ' · Safe default: '+esc(gap.safe_default||"retain_winter_booking_quote_hold")+'</p></article>');
    }
    mount.innerHTML=cards.join("")||'<div class="review-empty">No service-specific winter booking/quote rule has a controlled activation decision. No automatic winter rule activation.</div>';
    const detail=$("winterRuleControlledActivationDecisionDetail");
    if(detail) detail.textContent="Service-specific decision rows: "+String(decision.row_count??0)+
      " · controlled activation decision ready: "+String(decision.counts?.controlled_activation_decision_ready??0)+
      " · owner HOLD: "+String(decision.counts?.owner_hold??0)+
      " · owner review required: "+String(decision.counts?.owner_review_required??0)+
      ". Actual rule activation remains manual; broad winter availability remains HOLD.";
  }

  function renderControlledEnvironmentOperationalReadiness(readiness) {
    const mount=$("controlledEnvironmentOperationalReadinessGrid"); if(!mount) return;
    const rows=Array.isArray(readiness.rows)?readiness.rows:[];
    const cards=[];
    for(const row of rows){
      const ready=row.controlled_environment_operational_review_ready===true;
      const state=row.operational_readiness_state||"not_applicable";
      const displayLabel=ready?"Operational review ready":state.replaceAll("_"," ");
      const practice=(name,item)=>name+": "+(item?.reference||"missing")+" · current "+(item?.current===true?"YES":"NO");
      cards.push('<article class="review-candidate state-'+esc(ready?"observed":row.controlled_environment_candidate_present?"review":"soft")+'"><div class="review-head"><strong>'+
        esc(String(row.entity_type||"service").replaceAll("_"," ")+" · "+String(row.code||"unknown"))+
        '</strong><span class="pill">'+esc(displayLabel)+'</span></div>'+
        '<p><strong>Retained route:</strong> '+esc(String(row.retained_service_routing_state||"owner_review_required").replaceAll("_"," "))+'.</p>'+
        '<p class="mini">'+esc(practice("Routing continuity",row.routing_continuity_evidence))+'</p>'+
        '<p class="mini">'+esc(practice("Manual site confirmation",row.manual_site_confirmation_practice))+'</p>'+
        '<p class="mini">'+esc(practice("Safe reschedule",row.manual_safe_reschedule_practice))+'</p>'+
        '<p class="mini">Manual site confirmation remains required. Automatic appointment move/routing: NO · Universal indoor capability: HOLD.</p></article>');
    }
    for(const gap of (Array.isArray(readiness.gaps)?readiness.gaps:[])){
      cards.push('<article class="review-candidate state-review"><div class="review-head"><strong>Operational continuity gap · '+
        esc(gap.code||"unknown")+'</strong><span class="pill">HOLD</span></div><p class="mini">Missing: '+
        esc((gap.missing||[]).join(", ")||"current controlled-environment operational evidence")+
        ' · Safe default: '+esc(gap.safe_default||"retain_manual_site_confirmation_and_safe_reschedule")+'</p></article>');
    }
    mount.innerHTML=cards.join("")||'<div class="review-empty">No controlled-environment operational readiness evidence is available.</div>';
    const detail=$("controlledEnvironmentOperationalReadinessDetail");
    if(detail) detail.textContent="Controlled-environment candidates: "+String(readiness.counts?.controlled_environment_candidate??0)+
      " · retained qualified: "+String(readiness.counts?.retained_site_qualified??0)+
      " · operational review ready: "+String(readiness.counts?.operational_review_ready??0)+
      " · routing continuity evidence required: "+String(readiness.counts?.routing_continuity_evidence_required??0)+
      ". Manual site confirmation remains required; appointments are never moved automatically.";
  }

  function renderWinterRuleControlledActivationOutcomeContinuity(continuity) {
    const mount=$("winterRuleControlledActivationOutcomeContinuityGrid"); if(!mount) return;
    const rows=Array.isArray(continuity.rows)?continuity.rows:[];
    const cards=[];
    for(const row of rows){
      const observed=row.controlled_activation_observed===true||row.retain_hold_observed===true;
      const state=observed?"observed":"review";
      const label=row.outcome_state==="controlled_activation_observed"?"Activation observed":
        row.outcome_state==="retain_hold_observed"?"Retain HOLD observed":
        row.outcome_state==="controlled_activation_evidence_conflict"?"Activation evidence conflict":
        row.outcome_state==="retain_hold_evidence_conflict"?"Retain HOLD evidence conflict":"Owner action required";
      cards.push('<article class="review-candidate state-'+esc(state)+'"><div class="review-head"><strong>'+
        esc((row.entity_type||"item")+": "+(row.code||"unknown"))+
        '</strong><span class="pill">'+esc(label)+'</span></div>'+
        '<p class="mini">Classification: '+esc(row.classification||"unavailable")+
        ' · current match: '+esc(row.current_service_classification_matches_build507===true?"YES":"NO")+
        ' · source limit: '+esc(row.source_owned_temperature_limit_text||"no exact recorded limit")+'</p>'+
        '<p class="mini">Outcome: '+esc(row.controlled_activation_outcome||"not recorded")+
        ' · observed: '+esc(row.controlled_activation_outcome_observed_at||"not recorded")+
        ' · reference: '+esc(row.controlled_activation_outcome_reference||"not recorded")+'</p>'+
        '<p class="mini">Booking rule match: '+esc(row.applied_booking_rule_matches_build507===true?"YES":"NO")+
        ' · quote rule match: '+esc(row.applied_quote_rule_matches_build507===true?"YES":"NO")+
        ' · customer wording match: '+esc(row.customer_transparency_wording_matches_build507===true?"YES":"NO")+'</p>'+
        '<p class="mini">/api/availability revalidated: '+esc(row.availability_revalidated===true?"YES":"NO")+
        ' · checkout collision revalidated: '+esc(row.checkout_collision_revalidated===true?"YES":"NO")+
        ' · runtime proof: '+esc(row.runtime_revalidation_reference||"not recorded")+'</p>'+
        '<p class="mini">Activation state is observed, never inferred. Weather-ineligible sessions remain outside ordinary conversion interpretation. Broad winter availability remains HOLD. Automatic booking/quote/rule/HOLD mutation: NONE.</p></article>');
    }
    for(const gap of (Array.isArray(continuity.gaps)?continuity.gaps:[])){
      cards.push('<article class="review-candidate state-review"><div class="review-head"><strong>'+
        esc((gap.entity_type||"item")+": "+(gap.code||"unknown"))+
        '</strong><span class="pill">HOLD</span></div><p class="mini">State: '+
        esc(gap.state||"outcome_owner_action_required")+' · Missing: '+
        esc((gap.missing||[]).join(", ")||"dated attributable activation outcome and runtime revalidation evidence")+
        ' · Safe default: '+esc(gap.safe_default||"retain_winter_booking_quote_hold")+'</p></article>');
    }
    mount.innerHTML=cards.join("")||'<div class="review-empty">No winter booking/quote controlled-activation outcome has been observed. Decision readiness never means live activation.</div>';
    const detail=$("winterRuleControlledActivationOutcomeContinuityDetail");
    if(detail) detail.textContent="Outcome rows: "+String(continuity.row_count??0)+
      " · activation observed: "+String(continuity.counts?.controlled_activation_observed??0)+
      " · retain HOLD observed: "+String(continuity.counts?.retain_hold_observed??0)+
      " · activation conflicts: "+String(continuity.counts?.activation_evidence_conflict??0)+
      " · HOLD conflicts: "+String(continuity.counts?.retain_hold_evidence_conflict??0)+
      ". /api/availability and checkout collision revalidation remain authoritative.";
  }


  function renderWinterBookingQuoteRuleOutcomeFreshnessReview(review) {
    const mount=$("winterRuleOutcomeFreshnessReviewGrid"); if(!mount) return;
    const labels={controlled_activation_current:"Activation current",retain_hold_current:"Retain HOLD current",stale_outcome_review_required:"Stale outcome review required",service_classification_or_capability_drift_review_required:"Service classification/capability drift",customer_transparency_drift_review_required:"Customer wording drift",applied_rule_drift_review_required:"Applied rule drift",runtime_safety_revalidation_required:"Runtime safety revalidation required",outcome_evidence_conflict_review_required:"Outcome evidence conflict",predecessor_outcome_review_required:"Predecessor outcome review required",freshness_source_unavailable:"Freshness source unavailable"};
    const rows=Array.isArray(review.rows)?review.rows:[],cards=[];
    for(const row of rows){
      const current=row.freshness_review_current===true;
      cards.push('<article class="review-candidate state-'+esc(current?"observed":"review")+'"><div class="review-head"><strong>'+
        esc(String(row.entity_type||"service").replaceAll("_"," ")+" · "+String(row.code||"unknown"))+
        '</strong><span class="pill">'+esc(labels[row.freshness_state]||"Manual review required")+'</span></div>'+
        '<p class="mini">Outcome: '+esc(row.current_controlled_activation_outcome||"not recorded")+
        ' · observed age: '+esc(row.outcome_age_days==null?"unknown":String(row.outcome_age_days)+" day(s)")+
        ' · runtime age: '+esc(row.runtime_age_days==null?"unknown":String(row.runtime_age_days)+" day(s)")+
        ' · freshness window: '+esc(String(row.freshness_window_days||review.freshness_window_days||30))+' day(s)</p>'+
        '<p class="mini">Classification match: '+esc(row.current_service_classification_matches_retained_decision_trace===true?"YES":"NO")+
        ' · customer wording match: '+esc(row.customer_transparency_wording_matches_retained_decision_trace===true?"YES":"NO")+
        ' · booking rule match: '+esc(row.applied_booking_rule_matches_retained_decision_trace===true?"YES":"NO")+
        ' · quote rule match: '+esc(row.applied_quote_rule_matches_retained_decision_trace===true?"YES":"NO")+'</p>'+
        '<p class="mini">/api/availability revalidated: '+esc(row.availability_revalidated===true?"YES":"NO")+
        ' · checkout collision revalidated: '+esc(row.checkout_collision_revalidated===true?"YES":"NO")+
        ' · runtime proof: '+esc(row.runtime_revalidation_reference||"not recorded")+'</p>'+
        '<p class="mini">Weather-ineligible sessions remain outside ordinary conversion interpretation. Broad winter availability remains HOLD. No booking, quote or checkout rule is changed automatically.</p></article>');
    }
    for(const gap of (Array.isArray(review.gaps)?review.gaps:[])){
      cards.push('<article class="review-candidate state-review"><div class="review-head"><strong>Winter rule freshness HOLD · '+
        esc(gap.code||"unknown")+'</strong><span class="pill">MANUAL REVIEW</span></div><p class="mini">State: '+
        esc(gap.state||"freshness_review_required")+' · Missing/re-review: '+
        esc((gap.missing||[]).join(", ")||"current attributable winter rule outcome evidence")+
        ' · Safe default: '+esc(gap.safe_default||"retain_winter_booking_quote_hold")+'</p></article>');
    }
    mount.innerHTML=cards.join("")||'<div class="review-empty">No winter booking/quote rule outcome freshness rows are available. Missing evidence remains HOLD.</div>';
    const detail=$("winterRuleOutcomeFreshnessReviewDetail");
    if(detail) detail.textContent="Freshness rows: "+String(review.row_count??0)+" · current: "+String(review.counts?.current??0)+" · stale: "+String(review.counts?.stale??0)+" · rule/wording/classification drift: "+String(review.counts?.rule_or_wording_drift??0)+" · runtime safety review: "+String(review.counts?.runtime_safety_review??0)+". /api/availability and checkout collision revalidation remain authoritative.";
  }

  function renderControlledEnvironmentSiteQualification(qualification) {
    const mount=$("controlledEnvironmentSiteQualificationGrid"); if(!mount) return;
    const rows=Array.isArray(qualification.rows)?qualification.rows:[];
    const cards=[];
    for(const row of rows){
      const ready=row.controlled_environment_site_qualified===true;
      const state=ready?"observed":row.controlled_environment_candidate_present?"review":"soft";
      const label=ready?"Site qualified":row.controlled_environment_candidate_present?"Evidence required":"No controlled option";
      const ev=(name,item)=>name+": "+(item?.reference||"missing")+" · current "+(item?.current===true?"YES":"NO")+" · supported "+(item?.supported===true?"YES":"NO");
      cards.push('<article class="review-candidate state-'+esc(state)+'"><div class="review-head"><strong>'+
        esc(String(row.entity_type||"service").replaceAll("_"," ")+" · "+String(row.code||"unknown"))+
        '</strong><span class="pill">'+esc(label)+'</span></div>'+
        '<p><strong>Service route:</strong> '+esc(String(row.service_routing_state||"owner_review_required").replaceAll("_"," "))+'</p>'+
        '<p class="mini">'+esc(ev("Site",row.site_evidence))+'</p>'+
        '<p class="mini">'+esc(ev("Workflow",row.workflow_evidence))+'</p>'+
        '<p class="mini">'+esc(ev("Equipment",row.equipment_evidence))+'</p>'+
        '<p class="mini">'+esc(ev("Product",row.product_evidence))+'</p>'+
        '<p class="mini">Service-specific only: YES · Current site confirmation before execution: YES · Automatic appointment move/routing: NO · Universal indoor capability: HOLD.</p></article>');
    }
    const gaps=Array.isArray(qualification.gaps)?qualification.gaps:[];
    for(const gap of gaps){
      cards.push('<article class="review-candidate state-review"><div class="review-head"><strong>Controlled-environment qualification gap · '+
        esc(gap.code||"unknown")+'</strong><span class="pill">HOLD</span></div><p class="mini">Missing: '+
        esc((gap.missing||[]).join(", ")||"site/workflow/equipment/product evidence")+
        ' · Safe default: '+esc(gap.safe_default||"controlled_environment_site_confirmation_required")+'</p></article>');
    }
    mount.innerHTML=cards.join("")||'<div class="review-empty">No service-specific controlled-environment qualification evidence is available.</div>';
    const detail=$("controlledEnvironmentSiteQualificationDetail");
    if(detail) detail.textContent="Controlled-environment candidates: "+String(qualification.counts?.controlled_environment_candidate??0)+
      " · site qualified: "+String(qualification.counts?.controlled_environment_site_qualified??0)+
      " · evidence required: "+String(qualification.counts?.qualification_evidence_required??0)+
      ". Missing evidence keeps manual safe-reschedule or site confirmation; appointments are never moved automatically.";
  }

  function renderControlledEnvironmentRoutingOutcomeContinuity(continuity) {
    const mount=$("controlledEnvironmentRoutingOutcomeContinuityGrid"); if(!mount) return;
    const rows=Array.isArray(continuity.rows)?continuity.rows:[];
    const cards=[];
    for(const row of rows){
      const observed=row.route_outcome_observed===true||row.safe_reschedule_outcome_observed===true;
      const label=row.outcome_state==="route_outcome_observed"?"Route observed":
        row.outcome_state==="safe_reschedule_outcome_observed"?"Safe reschedule observed":
        row.outcome_state==="routing_outcome_evidence_conflict"?"Outcome evidence conflict":
        row.outcome_state==="outcome_owner_action_required"?"Owner action required":"Not applicable";
      cards.push('<article class="review-candidate state-'+esc(observed?"observed":row.controlled_environment_candidate_present?"review":"soft")+'"><div class="review-head"><strong>'+
        esc((row.entity_type||"item")+": "+(row.code||"unknown"))+
        '</strong><span class="pill">'+esc(label)+'</span></div>'+
        '<p class="mini">Retained Build 508 readiness: '+esc(row.retained_controlled_environment_operational_review_ready===true?"READY":"NOT READY")+
        ' · qualification evidence current: '+esc(row.current_site_workflow_equipment_product_evidence===true?"YES":"NO")+'</p>'+
        '<p class="mini">Outcome: '+esc(row.controlled_environment_routing_outcome||"not recorded")+
        ' · observed: '+esc(row.controlled_environment_routing_outcome_observed_at||"not recorded")+
        ' · reference: '+esc(row.controlled_environment_routing_outcome_reference||"not recorded")+'</p>'+
        '<p class="mini">Qualified site: '+esc(row.expected_site_reference||"not recorded")+
        ' · observed route site: '+esc(row.controlled_environment_routing_outcome_site_reference||"not recorded")+
        ' · site match: '+esc(row.qualified_site_reference_matches_observed_route===true?"YES":row.qualified_site_reference_matches_observed_route===false?"NO":"N/A")+'</p>'+
        '<p class="mini">Current site confirmation: '+esc(row.current_site_confirmation_observation_reference||"not recorded")+
        ' · safe-reschedule evidence: '+esc(row.safe_reschedule_reference||"not recorded")+'</p>'+
        '<p class="mini">Route outcome is observed, never inferred. One successful route does not establish universal indoor capability or future capacity. Automatic route/reschedule/HOLD mutation: NONE.</p></article>');
    }
    for(const gap of (Array.isArray(continuity.gaps)?continuity.gaps:[])){
      cards.push('<article class="review-candidate state-review"><div class="review-head"><strong>'+
        esc((gap.entity_type||"item")+": "+(gap.code||"unknown"))+
        '</strong><span class="pill">HOLD</span></div><p class="mini">State: '+
        esc(gap.state||"outcome_owner_action_required")+' · Missing: '+
        esc((gap.missing||[]).join(", ")||"current attributable route/site-confirmation or safe-reschedule outcome evidence")+
        ' · Safe default: '+esc(gap.safe_default||"retain_manual_site_confirmation_or_safe_reschedule_review")+'</p></article>');
    }
    mount.innerHTML=cards.join("")||'<div class="review-empty">No controlled-environment routing outcome has been observed. Operational readiness never proves a route occurred.</div>';
    const detail=$("controlledEnvironmentRoutingOutcomeContinuityDetail");
    if(detail) detail.textContent="Outcome rows: "+String(continuity.row_count??0)+
      " · routes observed: "+String(continuity.counts?.route_outcome_observed??0)+
      " · safe reschedules observed: "+String(continuity.counts?.safe_reschedule_outcome_observed??0)+
      " · evidence conflicts: "+String(continuity.counts?.routing_outcome_evidence_conflict??0)+
      " · owner action required: "+String(continuity.counts?.outcome_owner_action_required??0)+
      ". Current service/site qualification remains authoritative; universal indoor capability and future capacity remain HOLD.";
  }


  function renderControlledEnvironmentRoutingOutcomeFreshnessCapacityReview(review) {
    const mount=$("controlledEnvironmentRoutingFreshnessCapacityGrid"); if(!mount) return;
    const routeLabels={route_outcome_current:"Route outcome current",safe_reschedule_outcome_current:"Safe reschedule current",stale_routing_outcome_review_required:"Stale routing outcome",site_confirmation_freshness_review_required:"Site confirmation refresh required",safe_reschedule_freshness_review_required:"Safe reschedule refresh required",service_site_workflow_drift_review_required:"Service/site/workflow drift",routing_outcome_drift_review_required:"Routing outcome drift",predecessor_outcome_review_required:"Predecessor outcome review required",freshness_source_unavailable:"Freshness source unavailable",not_applicable:"Not applicable"};
    const capacityLabels={bounded_observed_capacity_current:"Bounded observed capacity current",capacity_not_observed:"Capacity not observed",stale_observed_capacity_review_required:"Stale capacity observation",capacity_site_mismatch_review_required:"Capacity site mismatch",capacity_evidence_invalid_review_required:"Capacity evidence invalid"};
    const rows=Array.isArray(review.rows)?review.rows:[],cards=[];
    for(const row of rows){
      const state=row.manual_review_required===true?"review":row.controlled_environment_candidate_present?"observed":"soft";
      cards.push('<article class="review-candidate state-'+esc(state)+'"><div class="review-head"><strong>'+
        esc(String(row.entity_type||"service").replaceAll("_"," ")+" · "+String(row.code||"unknown"))+
        '</strong><span class="pill">'+esc(routeLabels[row.routing_freshness_state]||"Manual review")+'</span></div>'+
        '<p class="mini">Classification: '+esc(row.classification||"unavailable")+
        ' · route age: '+esc(row.routing_outcome_age_days==null?"unknown":String(row.routing_outcome_age_days)+" day(s)")+
        ' · site confirmation age: '+esc(row.current_site_confirmation_age_days==null?"n/a":String(row.current_site_confirmation_age_days)+" day(s)")+'</p>'+
        '<p class="mini">Qualification current: '+esc(row.current_site_workflow_equipment_product_evidence===true?"YES":"NO")+
        ' · route practice current: '+esc(row.current_routing_continuity_practice===true?"YES":"NO")+
        ' · site confirmation practice current: '+esc(row.current_site_confirmation_practice===true?"YES":"NO")+
        ' · safe-reschedule practice current: '+esc(row.current_safe_reschedule_practice===true?"YES":"NO")+'</p>'+
        '<p class="mini">Capacity: '+esc(capacityLabels[row.capacity_state]||"Review")+
        ' · observed jobs: '+esc(row.observed_capacity_jobs==null?"not recorded":String(row.observed_capacity_jobs))+
        ' · window: '+esc(row.capacity_observation_window_days==null?"not recorded":String(row.capacity_observation_window_days)+" day(s)")+
        ' · capacity age: '+esc(row.capacity_age_days==null?"unknown":String(row.capacity_age_days)+" day(s)")+'</p>'+
        '<p class="mini">One successful route never establishes universal indoor capability or future capacity. A bounded capacity observation is historical/site-specific only. Automatic appointment/routing/reschedule/capacity mutation: NONE.</p></article>');
    }
    for(const gap of (Array.isArray(review.gaps)?review.gaps:[])){
      cards.push('<article class="review-candidate state-review"><div class="review-head"><strong>Routing/capacity review · '+
        esc(gap.code||"unknown")+'</strong><span class="pill">MANUAL REVIEW</span></div><p class="mini">Routing: '+
        esc(gap.routing_state||"review_required")+' · capacity: '+esc(gap.capacity_state||"capacity_not_observed")+
        ' · Missing/re-review: '+esc((gap.missing||[]).join(", ")||"current attributable service/site/workflow evidence")+
        ' · Safe default: '+esc(gap.safe_default||"retain_manual_site_confirmation_or_safe_reschedule_review")+'</p></article>');
    }
    mount.innerHTML=cards.join("")||'<div class="review-empty">No controlled-environment routing freshness/capacity rows are available.</div>';
    const detail=$("controlledEnvironmentRoutingFreshnessCapacityDetail");
    if(detail) detail.textContent="Candidates: "+String(review.counts?.controlled_environment_candidate??0)+
      " · route current: "+String(review.counts?.route_outcome_current??0)+
      " · safe reschedule current: "+String(review.counts?.safe_reschedule_outcome_current??0)+
      " · capacity current: "+String(review.counts?.bounded_observed_capacity_current??0)+
      " · capacity not observed: "+String(review.counts?.capacity_not_observed??0)+
      " · manual review: "+String(review.counts?.manual_review_required??0)+
      ". Historical observed capacity never establishes future capacity.";
  }

  function renderCandidates(rows) {
    const mount = $("candidateList");
    if (!rows.length) { mount.innerHTML = '<div class="review-empty">No bounded review candidate is supported.</div>'; return; }
    mount.innerHTML = rows.map((row) =>
      '<article class="review-candidate state-' + esc(row.state || "review") + '">' +
      '<div class="review-head"><strong>' + esc(label(row.area)) + '</strong><span class="pill">' + esc(row.state || "review") + '</span></div>' +
      '<p>' + esc(row.finding || "") + '</p>' +
      '<p class="mini"><strong>Bounded operator review:</strong> ' + esc(row.bounded_operator_review || "") + '</p>' +
      '<p class="mini">Dependency: ' + esc(row.dependency || "observed_evidence") + ' · Automatic action authorized: NO</p></article>'
    ).join("");
  }
  function renderSources(sources) {
    $("sourceList").innerHTML = Object.entries(sources).map(([name, row]) =>
      '<div class="review-source"><strong>' + esc(label(name)) + '</strong><span class="pill">' +
      esc(row?.restricted ? "restricted" : row?.available ? "available" : "unavailable") +
      '</span><span class="mini">HTTP ' + esc(row?.http_status ?? "—") + '</span></div>'
    ).join("") || '<div class="review-empty">No source status available.</div>';
  }
  function setStatus(message, tone) {
    const node = $("reviewStatus"); node.hidden = false; node.className = "notice " + (tone || "soft"); node.textContent = message;
  }
  function label(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()); }
  function bootPeriod() { const now = new Date(); $("reviewMonth").value = String(now.getMonth() + 1); $("reviewYear").value = String(now.getFullYear()); }

  document.addEventListener("DOMContentLoaded", () => {
    globalScope.AdminShell?.boot?.({
      pageKey: "admin-service-economics-commercial-capacity-review",
      onReady: async () => {
        bootPeriod();
        $("refreshReview")?.addEventListener("click", refresh);
        setStatus("Select Refresh review to load current bounded allocation evidence. No background monitoring is running.", "soft");
      }
    });
  }, { once: true });
})(window);
