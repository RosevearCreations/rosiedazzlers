(function attachOperationsDailyCommandCentre() {
  "use strict";

  const BUILD = 381;
  const DISPATCH_BUILD = 806;
  const LIST_ENDPOINT = "/api/admin/bookings";
  const SCHEDULE_ENDPOINT = "/api/day_schedule";
  const FINANCE_ENDPOINT = "/api/admin/booking_finance";
  const $ = (id) => document.getElementById(id);
  let loading = false;
  let dispatch806 = null;
  let current806 = null;
  let selectedDate806 = null;
  let pendingRefresh806 = false;
  let filters806 = {query:"",slot:"all",status:"all",staffId:"all",onlyExceptions:false,exceptionKind:"all"};

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function localIsoDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function moneyFromCents(cents) {
    const value = Number(cents);
    if (!Number.isFinite(value)) return "Unknown";
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value / 100);
  }

  function moneyCad(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "Unknown";
    return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(number);
  }

  function startLabel(value) {
    if (!value) return "Time unknown";
    const raw = String(value);
    const match = raw.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return raw;
    const hour = Number(match[1]);
    const minute = match[2];
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${suffix}`;
  }

  async function requestJson(url, options = {}) {
    const response = await window.AdminAuth.fetchWithAuth(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.error || `Request failed (${response.status}).`);
    return data;
  }

  async function loadBookings() {
    // This legacy list authority uses POST with an empty body for reads. Supplying a booking_id is the mutation path; this surface never does so.
    const data = await requestJson(LIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    if(!Array.isArray(data.bookings))throw Error('Authorized booking details were not returned.');
    return {bookings:data.bookings,crewWarning:data.crew_warning||null};
  }

  async function loadDaySchedule806(date) {
    return requestJson(SCHEDULE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({service_date:date})
    });
  }

  async function loadFinance(bookingId) {
    try {
      const data = await requestJson(`${FINANCE_ENDPOINT}?booking_id=${encodeURIComponent(bookingId)}`, { method: "GET" });
      return { ok: true, summary: data.summary || {} };
    } catch (error) {
      return { ok: false, error: error?.message || "Finance evidence unavailable." };
    }
  }

  function assignmentState(booking) {
    const people = dispatch806?.verifiedStaff806(booking).people||[];
    return people.length ? {state:"good",text:people.map(person=>person.name).join(" · ")}
      : {state:"warn",text:"No verified staff ID"};
  }

  function completionState(booking) {
    const status = String(booking.job_status || booking.status || "").toLowerCase();
    if (status === "completed") return { state: "good", text: "Completed" };
    if (status) return { state: "warn", text: status.replaceAll("_", " ") };
    return { state: "unknown", text: "Unknown" };
  }

  function siteContext(booking) {
    const area = [booking.service_area_municipality, booking.service_area_county, booking.service_area_zone, booking.service_area]
      .map((value) => String(value || "").trim()).filter(Boolean);
    const uniqueArea = [...new Set(area)];
    const coordinate = String(booking.trusted_service_coordinate_status || "").trim();
    const arrival = String(booking.arrival_geofence_status || "").trim();
    return {
      area: uniqueArea.length ? uniqueArea.join(" · ") : "Service location evidence unavailable",
      coordinate: coordinate || "Unknown",
      arrival: arrival || "Not checked",
      travel: "Unknown — no canonical live travel/traffic evidence is stored on the booking"
    };
  }

  function readinessState(booking) {
    const assigned = assignmentState(booking).state === "good";
    const packageKnown = Boolean(String(booking.package_code || "").trim());
    if (!assigned) return { state: "warn", text: "Needs staff assignment" };
    if (!packageKnown) return { state: "warn", text: "Needs service/package evidence" };
    return { state: "unknown", text: "Core booking ready; equipment/product proof still requires canonical inventory/job review" };
  }

  function financeState(booking, finance) {
    const totalCents = Number(booking.price_total_cents);
    if (!finance.ok) return { state: "unknown", total: moneyFromCents(totalCents), collected: "Unknown", balance: "Unknown", detail: finance.error };
    const collectedCad = Number(finance.summary?.collected_total || 0);
    const totalCad = Number.isFinite(totalCents) ? totalCents / 100 : NaN;
    const balanceCad = Number.isFinite(totalCad) ? Math.max(0, totalCad - collectedCad) : NaN;
    return {
      state: Number.isFinite(balanceCad) && balanceCad <= 0.005 ? "good" : "warn",
      total: Number.isFinite(totalCad) ? moneyCad(totalCad) : "Unknown",
      collected: moneyCad(collectedCad),
      balance: Number.isFinite(balanceCad) ? moneyCad(balanceCad) : "Unknown",
      detail: "Derived from canonical booking total and booking-finance entries."
    };
  }

  function stateSpan(state, text) {
    return `<span class="ops-state" data-state="${escapeHtml(state)}">${escapeHtml(text)}</span>`;
  }

  function bookingCard(booking, finance, exceptions = []) {
    const assignment = assignmentState(booking);
    const completion = completionState(booking);
    const readiness = readinessState(booking);
    const site = siteContext(booking);
    const money = financeState(booking, finance);
    const id = String(booking.id || "");
    const customer = booking.customer_name || booking.customer_email || "Customer unknown";
    const vehicle = [booking.vehicle_year, booking.vehicle_make, booking.vehicle_model, booking.vehicle_size].filter(Boolean).join(" ") || "Vehicle evidence unavailable";
    const packageCode = String(booking.package_code || "").trim() || "Unknown";
    const finished = completion.text === "Completed";
    const followupText = finished ? "Review follow-up / owner attention" : "Completion not yet recorded";

    return `<article class="ops-card" data-booking-id="${escapeHtml(id)}">
      <div class="ops-toolbar"><div><div class="badge">${escapeHtml(startLabel(booking.start_slot))}</div><h2>${escapeHtml(customer)}</h2><div class="muted">${escapeHtml(vehicle)}</div></div><div>${stateSpan(completion.state, completion.text)}</div></div>
      ${exceptions.length?`<div class="dispatch806-badges" aria-label="Dispatch exceptions">${exceptions.map(item=>`<span class="badge">${escapeHtml(item.label)}</span>`).join("")}</div>`:'<div class="ops-note">No dispatch signals detected from the current booking and day-schedule sources. QC and customer approvals are reviewed separately.</div>'}
      <div class="ops-grid">
        <div class="ops-cell"><span class="ops-label">Readiness</span>${stateSpan(readiness.state, readiness.text)}</div>
        <div class="ops-cell"><span class="ops-label">Staff assignment</span>${stateSpan(assignment.state, assignment.text)}</div>
        <div class="ops-cell"><span class="ops-label">Customer / vehicle context</span><strong>${escapeHtml(customer)}</strong><div class="ops-note">${escapeHtml(vehicle)}</div></div>
        <div class="ops-cell"><span class="ops-label">Site / travel conditions</span><strong>${escapeHtml(site.area)}</strong><div class="ops-note">Coordinate: ${escapeHtml(site.coordinate)} · Arrival: ${escapeHtml(site.arrival)}<br>${escapeHtml(site.travel)}</div></div>
        <div class="ops-cell"><span class="ops-label">Outstanding balance</span>${stateSpan(money.state, money.balance)}<div class="ops-note">Total ${escapeHtml(money.total)} · Collected ${escapeHtml(money.collected)}<br>${escapeHtml(money.detail)}</div></div>
        <div class="ops-cell"><span class="ops-label">Required equipment / products</span><strong>Package: ${escapeHtml(packageCode)}</strong><div class="ops-note">Exact product/equipment proof is not fabricated here. Review the existing booking, inventory and job authorities before dispatch.</div></div>
        <div class="ops-cell"><span class="ops-label">Completion</span>${stateSpan(completion.state, completion.text)}<div class="ops-note">Canonical progress/job status remains authoritative.</div></div>
        <div class="ops-cell"><span class="ops-label">Follow-up</span>${stateSpan(finished ? "warn" : "unknown", followupText)}<div class="ops-note">Owner attention and customer follow-up remain in their existing authorities.</div></div>
      </div>
      <div class="ops-actions">
        <a class="btn primary small" href="/admin-booking.html?booking_id=${encodeURIComponent(id)}">Open booking</a>
        <a class="btn ghost small" href="/admin-assign?booking_id=${encodeURIComponent(id)}">Assignment</a>
        <a class="btn ghost small" href="/admin-jobsite?booking_id=${encodeURIComponent(id)}">Job site</a>
        <a class="btn ghost small" href="/admin-progress?booking_id=${encodeURIComponent(id)}">Progress</a>
        <a class="btn ghost small" href="/admin-payment.html?booking_id=${encodeURIComponent(id)}">Payments</a>
        <a class="btn ghost small" href="/admin-today.html">Follow-up</a>
        <a class="btn ghost small" href="/admin-inventory.html">Inventory</a>
      </div>
    </article>`;
  }

  function renderKpis(bookings, finances, projection) {
    const completed = bookings.filter((booking) => completionState(booking).text === "Completed").length;
    const knownBalances = bookings.map((booking, index) => financeState(booking, finances[index])).filter((row) => row.balance !== "Unknown");
    const owing = knownBalances.filter((row) => row.state !== "good").length;
    $("opsKpis").innerHTML = [
      ["Appointments", bookings.length], ["Completed", completed], ["Unassigned IDs", projection.summary.unassigned],
      ["Jobs needing attention", projection.summary.attentionJobs], ["Verified staff", projection.summary.staffAssigned],
      ["Known balances owing", owing]
    ].map(([label, value]) => `<div class="ops-kpi"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
  }

  function renderWorkload806(projection) {
    const host=$("opsWorkload806"),warning=$("opsWorkloadWarning806");
    host.innerHTML=projection.staff.length?projection.staff.map(person=>{
      const count=person.slotCounts;
      const selected=filters806.staffId===person.id;
      return `<div class="dispatch806-card" data-overlap="${person.overloaded}">
        <strong>${escapeHtml(person.name)}</strong><span class="muted">${person.jobIds.length} job(s) · ${person.completed} completed / handoff</span>
        <div class="dispatch806-badges"><span class="badge">AM ${count.AM}</span><span class="badge">PM ${count.PM}</span><span class="badge">Full day ${count.FULL}</span>${count.unknown?`<span class="badge">Unknown ${count.unknown}</span>`:""}</div>
        ${person.overloaded?'<div class="dispatch806-warning">Possible overlapping assignments — review the canonical schedule.</div>':person.needsSlotReview?'<div class="ops-note">Unknown slot. Capacity cannot be certified.</div>':'<div class="ops-note">Recorded assignments only; not a route or payroll plan.</div>'}
        <button class="btn ghost dispatch806-filter" type="button" data-ops-staff="${escapeHtml(person.id)}" aria-pressed="${selected}">${selected?'Showing this staff · clear':'Show assigned jobs'}</button>
      </div>`;
    }).join(""):'<div class="notice warn">No verified staff IDs on this date. Check assignments; a name alone does not prove an assignment.</div>';
    const warnings=[...projection.warnings];
    if(projection.summary.unassigned)warnings.push(`${projection.summary.unassigned} active job(s) lack a verified staff ID.`);
    warning.hidden=!warnings.length;
    warning.textContent=warnings.join(' ');
    host.querySelectorAll('[data-ops-staff]').forEach(button=>button.addEventListener('click',()=>{
      filters806.staffId=filters806.staffId===button.dataset.opsStaff?'all':button.dataset.opsStaff;
      renderDispatch806();
    }));
  }

  function renderExceptionQueue806(projection) {
    const host=$("opsExceptions806");
    const kind=filters806.exceptionKind;
    const filtered=projection.exceptions.filter(item=>kind==='all'||item.kind===kind);
    const groups=new Map();
    for(const item of filtered){const group=groups.get(item.bookingId)||{customer:item.customer,bookingId:item.bookingId,items:[]};group.items.push(item);groups.set(item.bookingId,group);}
    host.innerHTML=groups.size?[...groups.values()].map(group=>{
      const kinds=new Set(group.items.map(item=>item.kind));
      const resolution=kinds.has('assignment')?'/admin-assign?booking_id=':kinds.has('schedule')?'/admin-blocks.html?service_date=':'/admin-booking.html?booking_id=';
      const resolveArg=kinds.has('schedule')?projection.date:group.bookingId;
      return `<article class="dispatch806-exception"><div><strong>${escapeHtml(group.customer)}</strong><div class="dispatch806-badges">${group.items.map(item=>`<span class="badge">${escapeHtml(item.label)}</span>`).join('')}</div></div><div class="ops-actions"><a class="btn ghost small" href="/admin-booking.html?booking_id=${encodeURIComponent(group.bookingId)}">Review booking</a><a class="btn primary small" href="${resolution}${encodeURIComponent(resolveArg)}">Open authority</a></div></article>`;
    }).join(''):'<div class="notice">No exceptions in this category from the currently verified dispatch sources. This does not certify photo, QC, payments or customer decisions.</div>';
    document.querySelectorAll('[data-exception-kind]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.exceptionKind===kind)));
  }

  function renderDispatch806() {
    if(!current806||!dispatch806)return;
    const {projection,finances}=current806;
    const rows=dispatch806.filterDispatch806(projection.rows,projection.exceptionsById,filters806);
    $("opsList").innerHTML=rows.length?rows.map(row=>bookingCard(row,finances.get(String(row.id))||{ok:false,error:'Finance not loaded.'},projection.exceptionsById.get(String(row.id))||[])).join(""):
      '<div class="panel ops-empty">No jobs match these filters. Clear filters to see the full verified day.</div>';
    $("opsVisible806").textContent=`${rows.length} of ${projection.rows.length} shown · ${projection.summary.attentionJobs} job(s) need dispatch review`;
    $("opsOnlyExceptions806").setAttribute('aria-pressed',String(filters806.onlyExceptions));
    $("opsAllStaff806").setAttribute('aria-pressed',String(filters806.staffId==='all'));
    renderWorkload806(projection);
    renderExceptionQueue806(projection);
  }

  function updateFilters806() {
    filters806.query=$("opsSearch806").value;
    filters806.slot=$("opsSlot806").value;
    filters806.status=$("opsStatus806").value;
    renderDispatch806();
  }

  async function refresh() {
    if (loading) return;
    loading = true;
    const status = $("opsStatus");
    const list = $("opsList");
    $("opsRefresh").disabled = true;
    list.classList.add("ops-refreshing");
    status.className = "notice";
    status.textContent = "Verifying the selected service date, slot blocks and authorized bookings…";
    try {
      const date=selectedDate806||localIsoDate();
      $("opsDateLabel").textContent=`Service date: ${new Intl.DateTimeFormat("en-CA",{dateStyle:"full"}).format(new Date(`${date}T12:00:00`))}`;
      if(!dispatch806)dispatch806=await import('/assets/admin-dispatch-v806.mjs?v=20261108build806');
      const [schedule,detailResult]=await Promise.all([loadDaySchedule806(date),loadBookings()]);
      const projection=dispatch806.buildDispatch806(schedule,detailResult.bookings,{crewWarning:detailResult.crewWarning});
      const financeList=await Promise.all(projection.rows.map(row=>loadFinance(row.id)));
      const finances=new Map(projection.rows.map((row,index)=>[String(row.id),financeList[index]]));
      current806={projection,finances};
      renderKpis(projection.rows,financeList,projection);
      renderDispatch806();
      const financeFailures=financeList.filter(row=>!row.ok).length;
      const warnings=projection.warnings.length+financeFailures;
      status.className=`notice ${warnings?'warn':'ok'}`;
      status.textContent=`Verified ${projection.rows.length} booking(s) against the day schedule. ${projection.summary.attentionJobs} job(s) need dispatch review.`+
        (financeFailures?` ${financeFailures} finance summary(s) unavailable; balances remain Unknown.`:'')+
        (projection.warnings.length?' Some crew or blocked-day information needs review.':'');
    } catch (error) {
      current806=null;
      status.className = "notice bad";
      status.textContent = error?.message || "Operations evidence could not load.";
      list.innerHTML = '<div class="notice bad">Dispatch sources could not be reconciled. No schedule, staff capacity or exception clearance is inferred. Use the existing authorized Booking, Blocks and Needs Attention screens.</div>';
      $("opsKpis").innerHTML = '<div class="ops-kpi"><span>State</span><strong>Unavailable</strong></div>';
      $("opsWorkload806").innerHTML='<div class="notice bad">Workload unavailable until assignments are verified.</div>';
      $("opsExceptions806").innerHTML='<div class="notice bad">Exception queue unavailable; review canonical booking and attention screens.</div>';
      $("opsWorkloadWarning806").hidden=true;
      $("opsVisible806").textContent='Unverified dispatch state';
    } finally {
      loading = false;
      $("opsRefresh").disabled = false;
      list.classList.remove("ops-refreshing");
      if(pendingRefresh806){pendingRefresh806=false;void refresh();}
    }
  }

  function refreshDate806(){
    if(loading){pendingRefresh806=true;return;}
    void refresh();
  }

  function shiftDate806(days){
    const date=new Date(`${selectedDate806}T12:00:00`);
    if(!Number.isFinite(date.getTime()))return;
    date.setDate(date.getDate()+days);
    selectedDate806=localIsoDate(date);
    $("opsSelectedDate").value=selectedDate806;
    refreshDate806();
  }
  selectedDate806=localIsoDate();
  $("opsSelectedDate").value=selectedDate806;
  $("opsSelectedDate").addEventListener('change',()=>{const value=$("opsSelectedDate").value;if(/^\d{4}-\d{2}-\d{2}$/.test(value)){selectedDate806=value;refreshDate806();}});
  $("opsPrevDate").addEventListener('click',()=>shiftDate806(-1));
  $("opsNextDate").addEventListener('click',()=>shiftDate806(1));
  $("opsToday").addEventListener('click',()=>{selectedDate806=localIsoDate();$("opsSelectedDate").value=selectedDate806;refreshDate806();});
  for(const id of ['opsSearch806','opsSlot806','opsStatus806'])$(id).addEventListener(id==='opsSearch806'?'input':'change',updateFilters806);
  $("opsClear806").addEventListener('click',()=>{
    filters806={query:'',slot:'all',status:'all',staffId:'all',onlyExceptions:false,exceptionKind:'all'};
    $("opsSearch806").value='';$("opsSlot806").value='all';$("opsStatus806").value='all';renderDispatch806();
  });
  $("opsOnlyExceptions806").addEventListener('click',()=>{filters806.onlyExceptions=!filters806.onlyExceptions;renderDispatch806();});
  $("opsAllStaff806").addEventListener('click',()=>{filters806.staffId='all';renderDispatch806();});
  document.querySelectorAll('[data-exception-kind]').forEach(button=>button.addEventListener('click',()=>{filters806.exceptionKind=button.dataset.exceptionKind;renderDispatch806();}));
  $("opsRefresh")?.addEventListener("click", refresh);
  window.AdminShell.boot({
    pageKey: "app-operations",
    onReady: refresh
  });

  window.RosieOperationsDailyCommandCentre = Object.freeze({ build: BUILD, dispatchBuild:DISPATCH_BUILD, refresh });
})();
