// Build 431 — staff-only Local Acquisition & Content Proof client.
// Manual/initial refresh only. Same-origin source inspection is heuristic and never a ranking assertion.
const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function setStatus(message, tone = "") {
  const el = $("[data-local-content-proof-status]");
  if (!el) return;
  el.hidden = !message;
  el.className = tone ? "notice " + tone : "notice";
  el.textContent = message || "";
}

async function loadPayload() {
  const response = await fetch("/api/admin/local_acquisition_content_proof", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: "{}"
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || "Could not load Build 431 content proof.");
  return payload;
}

function chip(value) {
  return '<span class="status-chip">' + esc(String(value || "unavailable").replaceAll("_", " ")) + "</span>";
}

function renderSummary(data) {
  const host = $("#localContentProofSummary");
  if (!host) return;
  const c = data.counts || {};
  host.innerHTML = [
    row("Target local/service pages", c.target_pages),
    row("Pages with observed traffic", c.pages_with_observed_views),
    row("Pages without observed traffic", c.pages_without_observed_views),
    row("Pages with genuine public proof", c.pages_with_genuine_proof),
    row("Pages without genuine public proof", c.pages_without_genuine_proof),
    row("Search Console evidence", chip(data.evidence?.search_console)),
    row("GBP evidence", chip(data.evidence?.google_business_profile))
  ].join("");
}

function row(label, value) {
  return '<div class="summary-item"><strong>' + esc(label) + "</strong><span>" + (value == null ? "—" : String(value).startsWith("<") ? value : esc(value)) + "</span></div>";
}

function renderCandidates(data, sourceAudits = new Map()) {
  const host = $("#localContentProofCandidates");
  if (!host) return;
  const rows = Array.isArray(data.content_candidates) ? data.content_candidates : [];
  host.innerHTML = rows.map((item) => {
    const audit = sourceAudits.get(item.path);
    const source = audit
      ? [
          "H1 " + audit.h1_count,
          audit.canonical_present ? "canonical yes" : "canonical missing",
          audit.description_present ? "description yes" : "description missing",
          audit.word_count + " words",
          audit.thin_copy_review ? "thin-copy review" : "copy depth ok",
          audit.duplicate_copy_review ? "duplicate-copy review" : "no exact duplicate signal",
          audit.service_mismatch_review ? "service-copy review" : "service topic present"
        ].join(" · ")
      : "Deployed source review pending";
    return '<div class="summary-item"><div><strong>' + esc(item.label) + '</strong><div class="muted">' + esc(item.path) +
      " · " + esc(item.kind) +
      " · views " + esc(item.observed_views_30d == null ? "unavailable" : item.observed_views_30d) +
      " · genuine proof " + esc(item.genuine_public_proof_count == null ? "unavailable" : item.genuine_public_proof_count) +
      " · open tasks " + esc(item.related_open_task_count == null ? "unavailable" : item.related_open_task_count) +
      '</div><div class="muted">' + esc(source) + '</div><div class="muted">Reasons: ' +
      esc((item.reasons || []).join(", ")) + '</div></div><span>' + chip("attention " + item.attention_score) + "</span></div>";
  }).join("") || '<div class="summary-item muted">No content candidates are available.</div>';
}

async function auditDeployedSources(candidates) {
  const raw = [];
  for (const item of candidates.slice(0, 20)) {
    try {
      const response = await fetch(item.path, { method: "GET", credentials: "same-origin", cache: "no-store" });
      if (!response.ok) {
        raw.push([item.path, { source_state: "unavailable", h1_count: null, canonical_present: false, description_present: false, word_count: 0, thin_copy_review: false, duplicate_copy_review: false, service_mismatch_review: false, signature: "" }]);
        continue;
      }
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const main = doc.querySelector("main") || doc.body;
      const text = String(main?.innerText || main?.textContent || "").replace(/\s+/g, " ").trim();
      const paragraphs = Array.from(main?.querySelectorAll("p") || []).map((p) => String(p.textContent || "").replace(/\s+/g, " ").trim()).filter((p) => p.length >= 80);
      const normalizedText = normalizeSignature(text);
      const topicTokens = normalizeSignature(item.label).split(" ").filter((token) => token.length >= 3);
      const serviceTopicPresent = item.kind !== "service" || topicTokens.every((token) => normalizedText.includes(token));
      raw.push([item.path, {
        source_state: "observed_same_origin",
        h1_count: doc.querySelectorAll("h1").length,
        canonical_present: Boolean(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")),
        description_present: Boolean(doc.querySelector('meta[name="description"]')?.getAttribute("content")),
        word_count: text ? text.split(/\s+/).length : 0,
        thin_copy_review: text ? text.split(/\s+/).length < 180 : true,
        duplicate_copy_review: false,
        service_mismatch_review: item.kind === "service" && !serviceTopicPresent,
        signature: normalizeSignature(paragraphs.slice(0, 3).join(" "))
      }]);
    } catch {
      raw.push([item.path, { source_state: "unavailable", h1_count: null, canonical_present: false, description_present: false, word_count: 0, thin_copy_review: false, duplicate_copy_review: false, service_mismatch_review: false, signature: "" }]);
    }
  }

  const signatureCounts = new Map();
  for (const [, audit] of raw) {
    if (audit.signature.length >= 160) signatureCounts.set(audit.signature, (signatureCounts.get(audit.signature) || 0) + 1);
  }
  const out = new Map();
  for (const [path, audit] of raw) {
    audit.duplicate_copy_review = audit.signature.length >= 160 && Number(signatureCounts.get(audit.signature) || 0) > 1;
    delete audit.signature;
    out.set(path, audit);
  }
  return out;
}

function normalizeSignature(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

async function refresh() {
  const button = $("#refreshContentProof");
  if (button?.disabled) return;
  if (button) {
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = "Refreshing…";
  }
  setStatus("Refreshing bounded acquisition and content evidence…");
  try {
    const data = await loadPayload();
    renderSummary(data);
    renderCandidates(data);
    const audits = await auditDeployedSources(Array.isArray(data.content_candidates) ? data.content_candidates : []);
    renderCandidates(data, audits);
    setStatus("Build 431 evidence refreshed. Source-copy flags are review heuristics, not ranking signals.", "ok");
  } catch (error) {
    setStatus(error?.message || "Could not refresh Build 431 evidence.", "bad");
  } finally {
    if (button) {
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      button.textContent = "Refresh content proof";
    }
  }
}

export function startLocalAcquisitionContentProof() {
  $("#refreshContentProof")?.addEventListener("click", refresh);
  refresh().catch(() => {});
}
