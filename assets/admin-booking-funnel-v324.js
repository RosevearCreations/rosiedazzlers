const notice = document.querySelector("#pageNotice");
const daysSelect = document.querySelector("#daysSelect");
const refreshBtn = document.querySelector("#refreshBtn");
const rowsScanned = document.querySelector("#rowsScanned");
const mobileCompletion = document.querySelector("#mobileCompletion");
const desktopCompletion = document.querySelector("#desktopCompletion");
const deviceGap = document.querySelector("#deviceGap");
const deviceGrid = document.querySelector("#deviceGrid");
const comparison = document.querySelector("#comparison");

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function title(value) {
  return String(value || "unknown").replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function pct(value) {
  return value == null ? "—" : `${Number(value).toFixed(1)}%`;
}

function badge(value) {
  const state = String(value || "unknown");
  const kind = state === "within_five_points" || state === "mobile_outperforming" ? "ok" : state === "mobile_underperforming" ? "bad" : "warn";
  return `<span class="badge ${kind}">${esc(title(state))}</span>`;
}

function verifyContract(data) {
  const c = data?.contract;
  return Boolean(c && c.read_only === true && c.unique_session_aggregation === true && c.background_polling === false && c.customer_identity_exposed === false && c.analytics_mutation === false && c.booking_mutation === false);
}

function renderDevice(device) {
  const start = Number(device.funnel_start_sessions || 0);
  const stages = Array.isArray(device.stages) ? device.stages : [];
  return `<article class="device-card"><h3>${esc(title(device.device))}</h3><div class="muted">${Number(device.sessions_observed || 0)} sessions observed · ${start} funnel starts · ${pct(device.start_to_completion_pct)} start-to-completion</div>${stages.map((stage) => {
    const width = start > 0 ? Math.max(0, Math.min(100, (Number(stage.sessions || 0) / start) * 100)) : 0;
    const drop = stage.drop_from_previous == null ? "Start" : `${Number(stage.drop_from_previous)} drop (${pct(stage.drop_from_previous_pct)})`;
    return `<div class="stage"><div class="stage-head"><strong>${esc(stage.label)}</strong><span>${Number(stage.sessions || 0)} sessions · ${pct(stage.conversion_from_start_pct)}</span></div><div class="bar" aria-hidden="true"><span style="width:${width}%"></span></div><div class="muted">${esc(drop)}</div></div>`;
  }).join("")}<div class="stage"><strong>Checkout abandonment</strong><div class="muted">${Number(device.abandoned_after_checkout_start || 0)} session(s) started checkout without a recorded completion.</div></div></article>`;
}

function render(data) {
  if (!verifyContract(data)) throw new Error("Booking funnel analytics returned an unsafe or incomplete read-only contract.");
  const devices = Array.isArray(data.devices) ? data.devices : [];
  const mobile = devices.find((item) => item.device === "mobile");
  const desktop = devices.find((item) => item.device === "desktop");
  const gap = data.comparison?.mobile_vs_desktop_completion_gap_points;

  rowsScanned.textContent = `${Number(data.rows_scanned || 0)}${data.truncated ? "+" : ""}`;
  mobileCompletion.textContent = pct(mobile?.start_to_completion_pct);
  desktopCompletion.textContent = pct(desktop?.start_to_completion_pct);
  deviceGap.textContent = gap == null ? "Insufficient evidence" : `${gap > 0 ? "+" : ""}${Number(gap).toFixed(1)} pts`;

  deviceGrid.innerHTML = devices.length ? devices.map(renderDevice).join("") : '<article class="device-card"><strong>No booking funnel sessions in this window.</strong><div class="muted">Try a longer window or verify booking analytics ingestion.</div></article>';

  const interpretation = data.comparison?.interpretation || "insufficient_evidence";
  const message = interpretation === "mobile_underperforming"
    ? "Mobile start-to-completion is more than five points below desktop. Prioritize the mobile booking path for UX review."
    : interpretation === "mobile_outperforming"
      ? "Mobile start-to-completion is more than five points above desktop. Review desktop friction before changing the shared booking rules."
      : interpretation === "within_five_points"
        ? "Mobile and desktop completion are within five percentage points in this evidence window."
        : "There is not enough mobile and desktop funnel evidence to compare completion rates yet.";
  comparison.innerHTML = `<article class="comparison-card"><strong>${badge(interpretation)}</strong><div class="muted">${esc(message)}</div></article><article class="comparison-card"><strong>Evidence boundary</strong><div class="muted">Window: ${Number(data.window?.days || 0)} day(s). Rows scanned: ${Number(data.rows_scanned || 0)} of a ${Number(data.row_limit || 0)}-row safety cap.${data.truncated ? " The cap was reached; treat rates as bounded evidence." : ""}</div></article>`;

  notice.className = `notice ${data.truncated ? "warn" : "ok"}`;
  notice.textContent = data.truncated ? "Funnel loaded, but the raw-event safety cap was reached. Evidence is bounded and should not be treated as exhaustive." : "Booking funnel evidence loaded. No background polling is active.";
}

async function load() {
  refreshBtn.disabled = true;
  notice.className = "notice";
  notice.textContent = "Loading booking funnel evidence…";
  try {
    const days = Number(daysSelect.value || 14);
    const response = await fetch(`/api/admin/booking_funnel_device?days=${encodeURIComponent(days)}`, { method: "GET", credentials: "same-origin", headers: { accept: "application/json" } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok !== true) throw new Error(data?.error || `Booking funnel analytics returned HTTP ${response.status}.`);
    render(data);
  } catch (error) {
    notice.className = "notice bad";
    notice.textContent = error?.message || "Booking funnel evidence could not be loaded.";
    rowsScanned.textContent = "—";
    mobileCompletion.textContent = "—";
    desktopCompletion.textContent = "—";
    deviceGap.textContent = "—";
    deviceGrid.innerHTML = '<article class="device-card"><strong>Funnel evidence unavailable.</strong><div class="muted">Do not infer conversion performance from a failed response.</div></article>';
    comparison.innerHTML = '<article class="comparison-card"><strong>Evidence unavailable</strong><div class="muted">The shared booking flow remains unchanged.</div></article>';
  } finally {
    refreshBtn.disabled = false;
  }
}

refreshBtn.addEventListener("click", load);
daysSelect.addEventListener("change", load);
load();
