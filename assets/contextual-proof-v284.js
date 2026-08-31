// Build 284 — contextual real-proof placement over the Build 283 Gallery publication authority.
// This presentation layer never owns consent, privacy review, publication, pricing, reviews, or booking authority.
(function initBuild284ContextualProof(globalScope) {
  "use strict";

  if (globalScope.__ROSIE_BUILD284_CONTEXTUAL_PROOF__) return;
  globalScope.__ROSIE_BUILD284_CONTEXTUAL_PROOF__ = true;

  const PUBLIC_GALLERY_API = "/api/before_after_gallery_public";
  const PUBLIC_APPROVALS = new Set(["approved_public", "customer_approved_public", "public", "approved"]);
  const MAX_PROOF_CARDS = 3;

  const USE_CASES = Object.freeze({
    "/pre-sale-lease-return-detailing": {
      key: "presale",
      label: "Pre-Sale / Lease-Return Detail",
      services: ["complete-detail", "complete-detailing", "basic-detail", "basic-detailing"],
      terms: ["sale", "lease", "return", "presentation"],
      bookHref: "/book?need=presale"
    },
    "/spring-salt-recovery-detailing": {
      key: "spring_salt",
      label: "Spring Salt Recovery",
      services: ["interior-detail", "interior-detailing", "salt-stain-treatment", "carpet-shampoo"],
      terms: ["salt", "winter", "footwell", "carpet", "mat"],
      bookHref: "/book?need=spring_salt"
    },
    "/fall-winter-protection-detailing": {
      key: "winter_prep",
      label: "Fall / Winter Protection Prep",
      services: ["exterior-detail", "exterior-detailing", "ceramic-coating", "graphene-finish", "exterior-wax", "ceramic-spray-wax", "high-grade-paint-sealant", "windshield-ceramic-coating"],
      terms: ["winter", "protection", "paint", "road film", "decontamination", "wax", "ceramic", "graphene", "sealant"],
      bookHref: "/book?need=winter_prep"
    }
  });

  const LOCATION_TOWNS = Object.freeze({
    "/tillsonburg-auto-detailing": ["tillsonburg"],
    "/woodstock-ingersoll-auto-detailing": ["woodstock", "ingersoll"],
    "/norwich-otterville-auto-detailing": ["norwich", "otterville"],
    "/zorra-thamesford-embro-auto-detailing": ["zorra", "thamesford", "embro"],
    "/simcoe-delhi-auto-detailing": ["simcoe", "delhi"],
    "/port-dover-auto-detailing": ["port-dover"],
    "/waterford-vittoria-auto-detailing": ["waterford", "vittoria"],
    "/port-rowan-turkey-point-auto-detailing": ["port-rowan", "turkey-point"]
  });

  function clean(value) {
    return String(value ?? "").trim();
  }

  function slugify(value) {
    return clean(value).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function normalizeApproval(value) {
    const raw = clean(value).toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
    const aliases = {
      customer_public: "customer_approved_public",
      customer_approved: "customer_approved_public",
      approved_customer: "customer_approved_public",
      public_approved: "approved_public",
      approved_for_public: "approved_public",
      public_ok: "approved_public",
      ok_public: "approved_public"
    };
    return aliases[raw] || raw;
  }

  function normalizePublication(value) {
    const raw = clean(value).toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
    if (["public", "publish", "live"].includes(raw)) return "published";
    return raw;
  }

  function isRealProof(item) {
    if (!item || typeof item !== "object") return false;
    if (normalizePublication(item.publication_status) !== "published") return false;
    if (!PUBLIC_APPROVALS.has(normalizeApproval(item.consent_status))) return false;
    if (!PUBLIC_APPROVALS.has(normalizeApproval(item.media_privacy_status))) return false;
    if (normalizeApproval(item.consent_status) === "sample" || clean(item.proof_kind).toLowerCase() === "sample") return false;
    return Boolean(
      clean(item.title) &&
      clean(item.service) &&
      clean(item.town || item.location) &&
      clean(item.before_url) &&
      clean(item.after_url) &&
      clean(item.vehicle_label) &&
      clean(item.condition_summary) &&
      clean(item.problem) &&
      clean(item.process) &&
      clean(item.result)
    );
  }

  function normalizedPath() {
    const path = clean(location.pathname || "/").replace(/\.html$/i, "").replace(/\/+$/, "");
    return path || "/";
  }

  function resolveContext() {
    const path = normalizedPath();
    if (USE_CASES[path]) {
      const preset = USE_CASES[path];
      return {
        kind: "usecase",
        key: preset.key,
        label: preset.label,
        serviceSlugs: preset.services,
        terms: preset.terms,
        bookHref: preset.bookHref
      };
    }

    if (LOCATION_TOWNS[path]) {
      return {
        kind: "location",
        key: path.slice(1),
        label: "this service area",
        townSlugs: LOCATION_TOWNS[path],
        bookHref: "/book"
      };
    }

    const landing = document.querySelector("#rd-landing");
    const explicitSlug = clean(document.body?.dataset?.landingSlug || landing?.dataset?.slug || landing?.dataset?.town || "");
    const slug = slugify(explicitSlug || path.slice(1));
    if (!slug) return null;

    const explicitType = clean(landing?.dataset?.type).toLowerCase();
    if (explicitType === "location") {
      const town = slugify(landing?.dataset?.town || landing?.dataset?.city || explicitSlug);
      return town ? { kind: "location", key: slug, label: "this service area", townSlugs: [town], bookHref: "/book" } : null;
    }

    if (document.body?.dataset?.landingSlug || landing) {
      return { kind: "service", key: slug, label: explicitSlug || slug, serviceSlugs: [slug], bookHref: "/book" };
    }
    return null;
  }

  function proofScore(item, context) {
    const serviceSlug = slugify(item.service_slug || item.service);
    const townSlug = slugify(item.town_slug || item.town || item.location);
    const text = [item.title, item.service, item.condition_summary, item.problem, item.process, item.result, item.note].map(clean).join(" ").toLowerCase();

    if (context.kind === "location") {
      return context.townSlugs.includes(townSlug) ? 100 : -1;
    }

    const serviceMatch = context.serviceSlugs.some((candidate) => candidate === serviceSlug);
    if (!serviceMatch) return -1;
    if (context.kind === "service") return 100;

    const termHits = context.terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
    return 70 + Math.min(20, termHits * 4);
  }

  function escapeHtml(value) {
    return clean(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }

  function mediaKind(item, side) {
    const declared = clean(item?.[`${side}_kind`]).toLowerCase();
    const url = clean(item?.[`${side}_url`]);
    return declared === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(url) ? "video" : "image";
  }

  function mediaMarkup(item, side) {
    const url = escapeHtml(item[`${side}_url`]);
    const title = escapeHtml(item.title || "Rosie Dazzlers detailing result");
    const label = side === "before" ? "Before" : "After";
    if (mediaKind(item, side) === "video") {
      return `<video controls preload="metadata" aria-label="${label}: ${title}"><source src="${url}"></video>`;
    }
    return `<img src="${url}" alt="${label}: ${title}" loading="lazy" decoding="async">`;
  }

  function ensureStyles() {
    if (document.querySelector("style[data-build284-contextual-proof-style]")) return;
    const style = document.createElement("style");
    style.dataset.build284ContextualProofStyle = "true";
    style.textContent = `
      .rd-proof284{margin-top:28px}.rd-proof284[hidden]{display:none!important}.rd-proof284-head{display:flex;gap:12px;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;margin-bottom:14px}.rd-proof284-head h2{margin:.2rem 0 .35rem}.rd-proof284-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.rd-proof284-card{min-width:0;padding:14px;border:1px solid rgba(255,255,255,.11);border-radius:16px;background:rgba(255,255,255,.035)}.rd-proof284-media{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}.rd-proof284-media figure{margin:0;min-width:0}.rd-proof284-media img,.rd-proof284-media video{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;background:rgba(255,255,255,.04)}.rd-proof284-media figcaption{font-size:.78rem;font-weight:800;margin-top:5px}.rd-proof284-meta{display:flex;gap:6px;flex-wrap:wrap;margin:.45rem 0}.rd-proof284-meta span{font-size:.76rem;padding:4px 7px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05)}.rd-proof284-card h3{margin:.4rem 0}.rd-proof284-facts{display:grid;gap:7px;margin-top:10px}.rd-proof284-facts p{margin:0}.rd-proof284-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}@media(max-width:980px){.rd-proof284-grid{grid-template-columns:1fr 1fr}}@media(max-width:680px){.rd-proof284-grid{grid-template-columns:1fr}.rd-proof284-media{grid-template-columns:1fr 1fr}}`;
    document.head.appendChild(style);
  }

  function findFaqSection(root) {
    const sections = Array.from(root.querySelectorAll("section"));
    return sections.find((section) => /frequently asked|faq/i.test(clean(section.querySelector("h2")?.textContent))) || null;
  }

  function findOrCreateHost() {
    const existing = document.querySelector(".visual-proof-plan, [data-build284-contextual-proof]");
    if (existing) {
      existing.classList.add("rd-proof284");
      existing.dataset.build284ContextualProof = "true";
      existing.hidden = true;
      return existing;
    }

    const root = document.querySelector("#rd-landing") || document.querySelector("#landingMount main") || document.querySelector("main.container") || document.querySelector("main");
    if (!root) return null;
    const host = document.createElement("section");
    host.className = "section panel rd-proof284";
    host.dataset.build284ContextualProof = "true";
    host.hidden = true;
    const faq = findFaqSection(root);
    if (faq && faq.parentNode) faq.parentNode.insertBefore(host, faq);
    else root.appendChild(host);
    return host;
  }

  async function waitForHost() {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const host = findOrCreateHost();
      if (host) return host;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return null;
  }

  function contextHeading(context) {
    if (context.kind === "location") return "Real Rosie work from this local service area";
    if (context.kind === "usecase") return "Real Rosie work relevant to this decision";
    return "Real Rosie work for this service";
  }

  function contextExplanation(context) {
    if (context.kind === "location") return "Shown only when the published Gallery town matches this local page. Your vehicle, condition and required scope can still differ.";
    if (context.kind === "usecase") return "Shown because the published Gallery service matches this use-case starting path. It is relevant evidence, not a claim that every vehicle has the same condition or result.";
    return "Shown only when the published Gallery service matches this page. The exact process and result still depend on the condition of your vehicle.";
  }

  function cardMarkup(item) {
    const title = escapeHtml(item.title || "Detailing result");
    const service = escapeHtml(item.service);
    const town = escapeHtml(item.town || item.location);
    const vehicle = escapeHtml(item.vehicle_label);
    const condition = escapeHtml(item.condition_summary);
    const problem = escapeHtml(item.problem);
    const process = escapeHtml(item.process);
    const result = escapeHtml(item.result);
    return `<article class="rd-proof284-card">
      <div class="rd-proof284-media">
        <figure>${mediaMarkup(item, "before")}<figcaption>Before</figcaption></figure>
        <figure>${mediaMarkup(item, "after")}<figcaption>After</figcaption></figure>
      </div>
      <h3>${title}</h3>
      <div class="rd-proof284-meta"><span>${vehicle}</span><span>${service}</span><span>${town}</span></div>
      <div class="rd-proof284-facts muted">
        <p><strong>Condition:</strong> ${condition}</p>
        <p><strong>Problem:</strong> ${problem}</p>
        <p><strong>Process:</strong> ${process}</p>
        <p><strong>Result:</strong> ${result}</p>
      </div>
    </article>`;
  }

  async function loadProofItems() {
    const response = await fetch(PUBLIC_GALLERY_API, { cache: "no-store", credentials: "same-origin" });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || payload.ok !== true || !Array.isArray(payload.items)) return [];
    return payload.items.filter(isRealProof);
  }

  async function render() {
    const context = resolveContext();
    if (!context) return;

    const hostPromise = waitForHost();
    let items = [];
    try {
      items = await loadProofItems();
    } catch {
      items = [];
    }

    const host = await hostPromise;
    if (!host) return;

    const ranked = items
      .map((item) => ({ item, score: proofScore(item, context) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PROOF_CARDS)
      .map((entry) => entry.item);

    // Build 284 is deliberately fail-closed. Existing public placeholder plans are hidden
    // rather than being presented as customer proof when no real matching row exists.
    if (!ranked.length) {
      host.hidden = true;
      host.dataset.build284ProofState = "no-real-matching-proof";
      return;
    }

    ensureStyles();
    host.className = "section panel rd-proof284";
    host.dataset.build284ProofState = "real-proof";
    host.innerHTML = `<div class="rd-proof284-head">
        <div><p class="eyebrow">Published customer-approved proof</p><h2>${escapeHtml(contextHeading(context))}</h2><p class="muted">${escapeHtml(contextExplanation(context))}</p></div>
      </div>
      <div class="rd-proof284-grid">${ranked.map(cardMarkup).join("")}</div>
      <div class="rd-proof284-actions"><a class="btn ghost" href="/gallery">See published Gallery</a><a class="btn primary" href="${escapeHtml(context.bookHref || "/book")}">Start Quick Book</a></div>`;
    host.hidden = false;
  }

  globalScope.RDContextualProof284 = Object.freeze({ render, isRealProof, resolveContext });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, { once: true });
  else render();
})(window);
