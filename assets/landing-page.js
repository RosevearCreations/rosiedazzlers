import { renderRecentWorkMounts } from "/assets/recent-work.js";

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${url}`);
  return await res.json().catch(() => ({}));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugFromPath() {
  const explicit = document.body?.dataset?.landingSlug;
  if (explicit) return explicit.trim();
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts[0] === "landing" && parts[1]) return parts[1];
  return parts[parts.length - 1] || "";
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n) : null;
}


function renderOfficialLinks(links) {
  const rows = Array.isArray(links) ? links.filter((item) => item && item.url) : [];
  if (!rows.length) return '';
  return `<ul class="muted-list">${rows.map((item) => `<li><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.label || item.url)}</a></li>`).join("")}</ul>`;
}

function addonPriceSummary(addon) {
  if (!addon) return "";
  const sizeMap = addon.prices_cad && typeof addon.prices_cad === "object" ? addon.prices_cad : {};
  const parts = [];
  if (Number.isFinite(Number(sizeMap.small))) parts.push(`Small ${money(sizeMap.small)}`);
  if (Number.isFinite(Number(sizeMap.mid))) parts.push(`Mid ${money(sizeMap.mid)}`);
  if (Number.isFinite(Number(sizeMap.oversize))) parts.push(`Oversize ${money(sizeMap.oversize)}`);
  if (!parts.length && Number.isFinite(Number(addon.price_cad))) parts.push(`Starting at ${money(addon.price_cad)}`);
  return parts.join(" • ");
}

function pageTemplate(page, pricing, slug) {
  const addon = page.related_code ? (pricing.addons || []).find((row) => row.code === page.related_code) : null;
  const related = Object.values((window.__landingPages || {}).pages || {})
    .filter((row) => row && row.enabled !== false && row.slug !== slug && row.nav_group === page.nav_group)
    .slice(0, 6);
  const faq = Array.isArray(page.faq) ? page.faq : [];
  const reasons = Array.isArray(page.reasons_page_exists) ? page.reasons_page_exists : [];
  const process = Array.isArray(page.process) ? page.process : [];
  const equipment = Array.isArray(page.equipment) ? page.equipment : [];
  const highlights = Array.isArray(page.highlights) ? page.highlights : [];
  const thingsToKnow = Array.isArray(page.things_to_know) ? page.things_to_know : [];
  const officialLinks = Array.isArray(page.official_links) ? page.official_links : [];
  const priceSummary = addonPriceSummary(addon);
  const heroImage = addon?.image_url || addon?.image_fallback_url || '/assets/brand/rosie-reviews-fallback.svg';
  return `
  <main class="container">
    <section class="hero">
      <div>
        <div class="badge">${escapeHtml(page.badge || "Landing page")}</div>
        <h1>${escapeHtml(page.hero_title || page.name || "Landing page")}</h1>
        <p>${escapeHtml(page.hero_intro || "")}</p>
        <div class="badges">
          <span class="badge">Mobile service</span>
          <span class="badge">Oxford & Norfolk Counties</span>
          ${addon ? `<span class="badge">${escapeHtml(addon.quote_required ? "Quote-led when required" : "Bookable add-on")}</span>` : `<span class="badge">Local service page</span>`}
        </div>
        <div class="cta-row" style="margin-top:14px">
          <a class="btn primary" href="/book">Book now</a>
          <a class="btn ghost" href="/pricing#booking-planner">Open live availability</a>
          <a class="btn ghost" href="/services">All services</a>
        </div>
      </div>
      <aside class="panel">
        ${page.type === 'addon' ? `<img src="${escapeHtml(heroImage)}" alt="${escapeHtml(page.name || page.hero_title || 'Service image')}" class="proof-media" style="margin-bottom:12px" />` : ''}
        <h2 style="margin-top:0">What to expect</h2>
        <p class="muted">${escapeHtml(priceSummary || "Review the process, scope, and booking fit before choosing this page’s service path.")}</p>
        <div class="hr"></div>
        <p class="muted">${escapeHtml((highlights[0] || reasons[0] || page.hero_intro || "").slice(0, 280))}</p>
      </aside>
    </section>

    <section class="section proof-grid">
      <article class="proof-card">
        <h2 style="margin-top:0">Why this page exists</h2>
        <ul class="muted-list">${reasons.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
      <article class="proof-card">
        <h2 style="margin-top:0">Best fit for</h2>
        <ul class="muted-list">${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
    </section>

    <section class="section proof-grid">
      <article class="proof-card">
        <h2 style="margin-top:0">How the process usually works</h2>
        <ol class="muted-list">${process.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
      </article>
      <article class="proof-card">
        <h2 style="margin-top:0">Equipment and workflow</h2>
        <ul class="muted-list">${equipment.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </article>
    </section>

    ${(thingsToKnow.length || officialLinks.length) ? `<section class="section proof-grid">
      ${thingsToKnow.length ? `<article class="proof-card"><h2 style="margin-top:0">Things to know before booking</h2><ul class="muted-list">${thingsToKnow.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>` : ''}
      ${officialLinks.length ? `<article class="proof-card"><h2 style="margin-top:0">Official local links</h2>${renderOfficialLinks(officialLinks)}</article>` : ''}
    </section>` : ''}

    <section class="section panel">
      <h2 style="margin-top:0">Recent work and review proof</h2>
      <p class="muted">Keep visible proof close to the booking CTA so visitors can confirm the business is active before they contact you.</p>
      <div data-recent-work-mount style="margin-top:12px"></div>
      <div class="hr"></div>
      <div class="proof-grid">
        <article class="proof-card"><h3>Review proof</h3><img data-reviews src="/assets/brand/rosie-reviews-fallback.svg" alt="Rosie Dazzlers reviews" class="proof-media" /></article>
        <article class="proof-card"><h3>Booking fit</h3><p class="muted">${escapeHtml(addon?.quote_required ? "This service may need a quote-first review depending on condition and scope." : "Use the live booking planner to compare package fit, vehicle size, and add-on eligibility.")}</p><div class="cta-row" style="margin-top:10px"><a class="btn ghost small" href="/contact">Ask a question</a><a class="btn ghost small" href="/gallery">Gallery</a></div></article>
      </div>
    </section>

    ${faq.length ? `<section class="section panel"><h2 style="margin-top:0">Frequently asked questions</h2><div class="faq-list">${faq.map((item) => `<details class="faq-item"><summary>${escapeHtml(item.q)}</summary><p class="muted">${escapeHtml(item.a)}</p></details>`).join("")}</div></section>` : ""}

    ${related.length ? `<section class="section panel"><h2 style="margin-top:0">Related pages</h2><div class="service-link-grid" style="margin-top:12px">${related.map((item) => `<article class="service-link-card"><h3>${escapeHtml(item.name || item.hero_title || item.slug)}</h3><a class="btn ghost small" href="/${escapeHtml(item.slug)}">Open page</a></article>`).join("")}</div></section>` : ""}
  </main>`;
}

async function renderLandingPage() {
  const slug = slugFromPath();
  const [landingPages, pricing] = await Promise.all([
    fetchJson("/api/landing_pages_public"),
    fetchJson("/api/pricing_catalog_public")
  ]);
  window.__landingPages = landingPages || { pages: {} };
  const page = landingPages?.pages?.[slug];
  if (!page || page.enabled === false) {
    document.getElementById("landingMount").innerHTML = `<main class="container"><section class="hero"><div><div class="badge">Landing page</div><h1>Page not found</h1><p>The requested landing page does not exist yet or is not enabled.</p><div class="cta-row" style="margin-top:14px"><a class="btn primary" href="/services">All services</a><a class="btn ghost" href="/contact">Contact</a></div></div></section></main>`;
    document.title = "Landing Page Not Found | Rosie Dazzlers";
    return;
  }
  if (page.meta_title) document.title = page.meta_title;
  let meta = document.querySelector('meta[name="description"]');
  if (meta && page.meta_description) meta.setAttribute("content", page.meta_description);
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && page.meta_title) ogTitle.setAttribute("content", page.meta_title);
  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc && page.meta_description) ogDesc.setAttribute("content", page.meta_description);
  let canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute("href", location.origin + (location.pathname.startsWith('/landing/') ? location.pathname : `/${slug}`));
  document.getElementById("landingMount").innerHTML = pageTemplate(page, pricing || {}, slug);
  renderRecentWorkMounts(3);
}

renderLandingPage().catch((err) => {
  document.getElementById("landingMount").innerHTML = `<main class="container"><section class="hero"><div><div class="badge">Landing page</div><h1>Could not load this page</h1><p>${escapeHtml(err?.message || "Unknown error")}</p><div class="cta-row" style="margin-top:14px"><a class="btn primary" href="/services">All services</a><a class="btn ghost" href="/contact">Contact</a></div></div></section></main>`;
});
