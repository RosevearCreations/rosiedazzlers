// Build 496 — retained manual service economics UI with seasonal capability owner/public-claim review.
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
