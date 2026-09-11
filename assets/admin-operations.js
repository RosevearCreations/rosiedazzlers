(function attachOperationsDailyCommandCentre() {
  "use strict";

  const BUILD = 381;
  const LIST_ENDPOINT = "/api/admin/bookings";
  const FINANCE_ENDPOINT = "/api/admin/booking_finance";
  const $ = (id) => document.getElementById(id);
  let loading = false;

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
    return Array.isArray(data.bookings) ? data.bookings : [];
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
    const name = booking.assigned_staff_name || booking.assigned_to || booking.assigned_staff_email || "";
    return name ? { state: "good", text: name } : { state: "warn", text: "Unassigned" };
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

  function bookingCard(booking, finance) {
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

  function renderKpis(bookings, finances) {
    const completed = bookings.filter((booking) => completionState(booking).text === "Completed").length;
    const unassigned = bookings.filter((booking) => assignmentState(booking).state !== "good").length;
    const knownBalances = bookings.map((booking, index) => financeState(booking, finances[index])).filter((row) => row.balance !== "Unknown");
    const owing = knownBalances.filter((row) => row.state !== "good").length;
    $("opsKpis").innerHTML = [
      ["Appointments", bookings.length], ["Completed", completed], ["Unassigned", unassigned], ["Known balances owing", owing]
    ].map(([label, value]) => `<div class="ops-kpi"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
  }

  async function refresh() {
    if (loading) return;
    loading = true;
    const status = $("opsStatus");
    const list = $("opsList");
    $("opsRefresh").disabled = true;
    list.classList.add("ops-refreshing");
    status.className = "notice";
    status.textContent = "Refreshing today’s canonical booking evidence…";
    try {
      const today = localIsoDate();
      $("opsDateLabel").textContent = new Intl.DateTimeFormat("en-CA", { dateStyle: "full" }).format(new Date());
      const all = await loadBookings();
      const bookings = all.filter((booking) => String(booking.service_date || "") === today)
        .sort((a, b) => String(a.start_slot || "").localeCompare(String(b.start_slot || "")));
      const finances = await Promise.all(bookings.map((booking) => loadFinance(booking.id)));
      renderKpis(bookings, finances);
      list.innerHTML = bookings.length
        ? bookings.map((booking, index) => bookingCard(booking, finances[index])).join("")
        : '<div class="panel ops-empty"><strong>No appointments are recorded for today.</strong><div class="ops-note">This is a read-only result from the canonical bookings authority.</div></div>';
      const financeFailures = finances.filter((row) => !row.ok).length;
      status.className = `notice ${financeFailures ? "warn" : "ok"}`;
      status.textContent = financeFailures
        ? `Loaded ${bookings.length} appointment(s); ${financeFailures} finance summary(s) are unavailable and are shown as Unknown.`
        : `Loaded ${bookings.length} appointment(s) from the current booking authority.`;
    } catch (error) {
      status.className = "notice bad";
      status.textContent = error?.message || "Operations evidence could not load.";
      list.innerHTML = '<div class="notice bad">The command centre could not load. Use the canonical Bookings, Needs Attention, Payments and Inventory screens; no operational state was inferred.</div>';
      $("opsKpis").innerHTML = '<div class="ops-kpi"><span>State</span><strong>Unavailable</strong></div>';
    } finally {
      loading = false;
      $("opsRefresh").disabled = false;
      list.classList.remove("ops-refreshing");
    }
  }

  $("opsRefresh")?.addEventListener("click", refresh);
  window.AdminShell.boot({
    pageKey: "app-operations",
    onReady: refresh
  });

  window.RosieOperationsDailyCommandCentre = Object.freeze({ build: BUILD, refresh });
})();
