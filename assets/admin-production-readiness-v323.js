const notice = document.querySelector("#pageNotice");
const refreshBtn = document.querySelector("#refreshBtn");
const overallState = document.querySelector("#overallState");
const runtimeState = document.querySelector("#runtimeState");
const stripeState = document.querySelector("#stripeState");
const r2State = document.querySelector("#r2State");
const sourcePolicy = document.querySelector("#sourcePolicy");
const runtimeEvidence = document.querySelector("#runtimeEvidence");
const authorityList = document.querySelector("#authorityList");
const issueList = document.querySelector("#issueList");

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function title(value) {
  return String(value || "unknown").replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function badge(value) {
  const state = String(value || "unknown");
  const kind = state === "ready_for_human_review" || state === "present" || state === "test" || state === "source_authority_present" ? "ok" : state === "blocked" || state === "live" || state.startsWith("blocked") ? "bad" : "warn";
  return `<span class="badge ${kind}">${esc(title(state))}</span>`;
}

function kv(label, value, mono = false) {
  const cls = mono ? "mono" : "";
  return `<div class="kv"><strong>${esc(label)}</strong><div class="${cls}">${value}</div></div>`;
}

function verifyContract(data) {
  const c = data?.contract;
  return Boolean(c && c.read_only === true && c.evidence_only === true && c.git_mutation === false && c.cloudflare_mutation === false && c.production_promotion === false && c.database_mutation === false && c.automatic_promotion === false && c.secret_values_exposed === false && data?.release_boundary?.production_closed === true);
}

function render(data) {
  if (!verifyContract(data)) throw new Error("Production readiness returned an unsafe or incomplete read-only contract.");

  overallState.innerHTML = badge(data.overall_state);
  runtimeState.innerHTML = badge(data.runtime?.state);
  stripeState.innerHTML = badge(data.providers?.stripe?.mode);
  r2State.innerHTML = data.dependencies?.r2_media_bound ? badge("present") : badge("unavailable");

  const policy = data.source_policy || {};
  sourcePolicy.innerHTML = [
    kv("Production branch", esc(policy.production_branch || "unknown")),
    kv("Development branch", esc(policy.development_branch || "unknown")),
    kv("Frozen Production SHA", esc(policy.frozen_production_baseline_sha || "unavailable"), true),
    kv("Prior accepted Development SHA", esc(policy.prior_accepted_development_sha || "unavailable"), true),
    kv("Explicit authorization", policy.production_promotion_requires_explicit_user_authorization ? "Required" : "Unknown"),
  ].join("");

  const runtime = data.runtime || {};
  runtimeEvidence.innerHTML = [
    kv("Evidence", badge(runtime.state)),
    kv("Branch", esc(runtime.branch || "unavailable")),
    kv("Commit SHA", esc(runtime.commit_sha || "unavailable"), true),
    kv("Deployment URL", esc(runtime.deployment_url || "unavailable"), true),
    kv("Request host", esc(runtime.request_hostname || "unavailable"), true),
    kv("Development-like", runtime.development_like ? "Yes" : "No / unproven"),
  ].join("");

  const authorities = Array.isArray(data.release_authorities) ? data.release_authorities : [];
  authorityList.innerHTML = authorities.length ? authorities.map((item) => `<article class="list-item"><strong>${esc(item.label)} · ${badge(item.state)}</strong><div class="muted mono">${esc(item.authority)}</div><div class="muted">${esc(item.note)}</div><div class="muted">Live run verified here: ${item.live_run_verified ? "yes" : "no"}</div></article>`).join("") : '<div class="list-item">No release authorities were returned.</div>';

  const blockers = Array.isArray(data.blockers) ? data.blockers : [];
  const warnings = Array.isArray(data.warnings) ? data.warnings : [];
  const issues = [
    ...blockers.map((item) => ({ ...item, severity: "Blocker" })),
    ...warnings.map((item) => ({ ...item, severity: "Warning" })),
  ];
  issueList.innerHTML = issues.length ? issues.map((item) => `<article class="list-item"><strong>${esc(item.severity)} · ${esc(title(item.id))}</strong><div class="muted">${esc(item.message)}</div></article>`).join("") : '<div class="list-item"><strong>No explicit blocker or warning in the evidence returned.</strong><div class="muted">This still does not authorize Production promotion.</div></div>';

  const state = data.overall_state;
  notice.className = `notice ${state === "blocked" ? "bad" : state === "ready_for_human_review" ? "ok" : "warn"}`;
  notice.textContent = `${title(state)}. ${data.release_boundary.statement} Readiness is evidence only and is not authorization.`;
}

async function load() {
  refreshBtn.disabled = true;
  notice.className = "notice";
  notice.textContent = "Loading Production readiness evidence…";
  try {
    const response = await fetch("/api/admin/production_readiness", { method: "GET", credentials: "same-origin", headers: { accept: "application/json" } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok !== true) throw new Error(data?.error || `Production readiness returned HTTP ${response.status}.`);
    render(data);
  } catch (error) {
    notice.className = "notice bad";
    notice.textContent = error?.message || "Production readiness evidence could not be loaded.";
    overallState.innerHTML = badge("blocked");
    runtimeState.textContent = "—";
    stripeState.textContent = "—";
    r2State.textContent = "—";
    sourcePolicy.textContent = "Evidence unavailable.";
    runtimeEvidence.textContent = "Evidence unavailable.";
    authorityList.innerHTML = '<div class="list-item">Release authority evidence unavailable.</div>';
    issueList.innerHTML = '<div class="list-item"><strong>Blocker · Readiness API unavailable</strong><div class="muted">Do not infer Production readiness from a failed or incomplete response.</div></div>';
  } finally {
    refreshBtn.disabled = false;
  }
}

refreshBtn.addEventListener("click", load);
load();
