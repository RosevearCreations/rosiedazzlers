// Historical Build 258 image module: /assets/website-images.js?v=20260813build258
// Historical Build 256 image module: /assets/website-images.js?v=20260812build256
// Historical Build 254 image module: /assets/website-images.js?v=20260812build254
// Historical Build 252 image module marker: /assets/website-images.js?v=20260812build252
// Historical Build 253 guard token: /assets/website-images.js?v=20260812build253
import { renderRecentWorkMounts } from "/assets/recent-work.js?v=20260501build127";
import { bindImageWithCandidates } from "/assets/media-source-resolver.js?v=20260701build216";
import { loadWebsiteImageManifest, landingImageMatches, landingBeforeAfterPairs, explicitImageForTarget } from "/assets/website-images.js?v=20260813build259";

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
  return Number.isFinite(n)
    ? new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        maximumFractionDigits: 0
      }).format(n)
    : null;
}

function hasPositiveMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

async function loadWaterRuleForSlug(slug) {
  if (!slug) return null;

  try {
    const payload = await fetchJson(`/api/water_restrictions_public?slug=${encodeURIComponent(slug)}`);
    if (payload?.match) return payload.match;
  } catch {
    // Fall through to the bundled editable JSON fallback.
  }

  try {
    const payload = await fetchJson("/data/water_restriction_rules.json");
    const direct = payload?.local_page_rules?.[slug];
    if (direct) return direct;

    const rule = (Array.isArray(payload?.rules) ? payload.rules : []).find((item) =>
      (Array.isArray(item?.local_pages) ? item.local_pages : []).includes(slug)
    );
    return rule || null;
  } catch {
    return null;
  }
}

function applyWaterRuleToPage(page, match) {
  if (!page || !match) return page;

  const note = cleanText(match.rule_summary || match.water_rule || match.note);
  const sources = Array.isArray(match.sources)
    ? match.sources
    : Array.isArray(match.verified_sources)
      ? match.verified_sources
      : [];

  if (note) {
    page.water_restriction_note = note;
    const current = Array.isArray(page.things_to_know) ? page.things_to_know : [];
    page.things_to_know = [
      note,
      ...current.filter((item) => {
        const text = cleanText(item).toLowerCase();
        return !(text.includes("water") && (
          text.includes("restriction") ||
          text.includes("watering") ||
          text.includes("hose") ||
          text.includes("outdoor")
        ));
      })
    ].slice(0, 8);
  }

  if (sources.length) {
    page.water_restriction_sources = sources;
    const currentLinks = Array.isArray(page.official_links) ? page.official_links : [];
    const seen = new Set(currentLinks.map((item) => cleanText(item?.url)).filter(Boolean));
    page.official_links = currentLinks.concat(
      sources.filter((item) => {
        const url = cleanText(item?.url);
        if (!url || seen.has(url)) return false;
        seen.add(url);
        return true;
      })
    );
  }

  return page;
}

// Build 187: derived verified water-use note for local pages.
function waterNoteForPage(page, thingsToKnow) {
  if (!page || page.type !== "location") return "";
  const explicit = cleanText(page.water_restriction_note || page.verified_water_rule_summary);
  if (explicit) return explicit;
  return (Array.isArray(thingsToKnow) ? thingsToKnow : []).find((item) => {
    const text = cleanText(item).toLowerCase();
    return text.includes("water") && (
      text.includes("restriction") ||
      text.includes("outdoor") ||
      text.includes("watering") ||
      text.includes("hose")
    );
  }) || "";
}

function waterSourcesForPage(page, officialLinks) {
  const explicit = Array.isArray(page?.water_restriction_sources) ? page.water_restriction_sources : [];
  const links = explicit.length ? explicit : (Array.isArray(officialLinks) ? officialLinks : []).filter((item) => {
    const text = `${cleanText(item?.label)} ${cleanText(item?.url)}`.toLowerCase();
    return text.includes("water") || text.includes("watering") || text.includes("conservation") || text.includes("restriction");
  });
  return links.slice(0, 4);
}

function normalizeProductName(value) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeProductRefs(value) {
  return (Array.isArray(value) ? value : []).map((item) => ({
    name: cleanText(item?.name || item?.title),
    role: cleanText(item?.role),
    note: cleanText(item?.note),
    image_url: cleanText(item?.image_url)
  })).filter((item) => item.name || item.image_url);
}

function findProductByName(products, name) {
  const target = normalizeProductName(name);
  if (!target) return null;

  return products.find((item) => normalizeProductName(item?.name || item?.title) === target) ||
    products.find((item) => normalizeProductName(item?.name || item?.title).includes(target)) ||
    products.find((item) => target.includes(normalizeProductName(item?.name || item?.title))) ||
    null;
}

function resolveRelatedProducts(page, productCatalog) {
  const refs = normalizeProductRefs(page?.related_products);
  const items = Array.isArray(productCatalog) ? productCatalog : [];
  return refs.map((ref) => {
    const product = ref.name ? (findProductByName(items, ref.name) || {}) : {};
    return {
      name: ref.name || product.name || product.title || "Related product",
      role: ref.role,
      note: ref.note,
      image_url: ref.image_url || product.r2_url || product.image_url || "",
      source_kind: product.source_kind || product.type || "product"
    };
  }).filter((item) => item.name || item.image_url);
}

function addonPriceSummary(addon) {
  if (!addon) return "";
  const sizeMap = addon.prices_cad && typeof addon.prices_cad === "object" ? addon.prices_cad : {};
  const parts = [];
  if (hasPositiveMoney(sizeMap.small)) parts.push(`Small ${money(sizeMap.small)}`);
  if (hasPositiveMoney(sizeMap.mid)) parts.push(`Mid ${money(sizeMap.mid)}`);
  if (hasPositiveMoney(sizeMap.oversize)) parts.push(`Oversize ${money(sizeMap.oversize)}`);

  if (addon.quote_required === true) {
    if (parts.length) return `From ${parts.join(" • ")} • Quote required`;
    if (hasPositiveMoney(addon.price_cad)) return `From ${money(addon.price_cad)} • Quote required`;
    return "Quote required after inspection";
  }

  if (parts.length) return parts.join(" • ");
  if (hasPositiveMoney(addon.price_cad)) return `Starting at ${money(addon.price_cad)}`;
  return "";
}

function heroMediaForPage(page, addon, relatedProducts, r2Matches = [], slug = "") {
  // Build 254 safety rule: existing authored imagery remains authoritative.
  // An explicit Photo Studio hero assignment is the only R2 image allowed to replace it deliberately.
  const heroTarget = `landing:${cleanText(slug || page?.slug)}:hero`;
  const explicitHero = (r2Matches || []).find((row) => row?.explicit_assignment === true && row?.target_key === heroTarget);
  if (explicitHero?.url) return explicitHero.url;
  if (page?.local_hero_image_url) return page.local_hero_image_url;
  if (page?.hero_image_url) return page.hero_image_url;
  if (addon?.image_url && !String(addon.image_url).toLowerCase().endsWith(".svg")) return addon.image_url;

  const firstProduct = (relatedProducts || []).find((item) => item.image_url);
  if (firstProduct?.image_url) return firstProduct.image_url;

  // Filename matching is fallback-only when the page has no established usable image.
  const automaticR2 = (r2Matches || []).find((row) => row?.explicit_assignment !== true && row?.url);
  if (automaticR2?.url) return automaticR2.url;
  if (addon?.image_url) return addon.image_url;
  if (addon?.image_fallback_url) return addon.image_fallback_url;
  return "/assets/placeholders/service-photo-needed.svg";
}

function mediaImageMarkup(src, alt, className = "proof-media", extra = "") {
  const source = cleanText(src);
  if (!source) return "";
  return `<img data-media-source="${escapeHtml(source)}" data-media-fallback="/assets/placeholders/service-photo-needed.svg" alt="${escapeHtml(alt)}" class="${escapeHtml(className)}" loading="lazy" decoding="async" ${extra}>`;
}

function bindLandingMedia(root) {
  root.querySelectorAll("img[data-media-source]").forEach((img) => {
    if (img.dataset.mediaResolverBound === "true") return;
    img.dataset.mediaResolverBound = "true";
    bindImageWithCandidates(img, img.dataset.mediaSource || "", {
      fallback: img.dataset.mediaFallback || "/assets/placeholders/service-photo-needed.svg",
      onExhausted: (node) => {
        node.classList.add("visual-placeholder-img");
        node.src = "/assets/placeholders/service-photo-needed.svg";
      }
    });
  });
}

function beforeAfterMarkup(manifest, slug) {
  const pairs = landingBeforeAfterPairs(manifest, slug, 3);
  if (!pairs.length) return "";
  return `
    <section class="section panel managed-before-after" data-photo-managed-before-after="true">
      <p class="eyebrow">Real detailing results</p>
      <h2 style="margin-top:0">Before &amp; after</h2>
      <p class="muted">Paired photos selected in Rosie Dazzlers Photo Management Studio.</p>
      <div class="before-after-pairs">
        ${pairs.map((pair) => `
          <article class="before-after-pair">
            <div class="before-after-side">
              <span class="before-after-label">Before</span>
              ${mediaImageMarkup(pair.before.url, pair.before.alt_text || "Vehicle before detailing", "proof-media", pair.before.focal_point ? `style="object-position:${escapeHtml(pair.before.focal_point)}"` : "")}
            </div>
            <div class="before-after-side">
              <span class="before-after-label">After</span>
              ${mediaImageMarkup(pair.after.url, pair.after.alt_text || "Vehicle after detailing", "proof-media", pair.after.focal_point ? `style="object-position:${escapeHtml(pair.after.focal_point)}"` : "")}
            </div>
            <p class="before-after-set-label">Set ${pair.set}</p>
          </article>`).join("")}
      </div>
    </section>`;
}

function conditionPricingMarkup(addon) {
  if (!addon) return "";
  const rows = Array.isArray(addon.condition_pricing) ? addon.condition_pricing : [];
  const basis = cleanText(addon.pricing_basis);
  const note = cleanText(addon.pricing_note);
  if (!rows.length && !basis && !note) return "";
  return `
    <section class="section panel service-condition-pricing">
      <p class="eyebrow">Transparent starting prices</p>
      <h2 style="margin-top:0">Price by condition, not guesswork</h2>
      <p class="muted">${escapeHtml(basis ? `Pricing is based on ${basis}.` : "The final scope is matched to the vehicle instead of forcing every condition into one flat price.")}</p>
      ${rows.length ? `<div class="condition-price-grid" style="margin-top:14px">${rows.map((row) => `
        <article class="condition-price-card">
          <h3>${escapeHtml(row.label || "Condition tier")}</h3>
          <div class="condition-price-value">${escapeHtml(row.price_label || "Inspection quote")}</div>
          ${row.time_label ? `<div class="badge">${escapeHtml(row.time_label)}</div>` : ""}
          ${row.when ? `<p class="muted">${escapeHtml(row.when)}</p>` : ""}
        </article>`).join("")}</div>` : ""}
      ${note ? `<p class="muted pricing-fine-print">${escapeHtml(note)}</p>` : ""}
    </section>`;
}

function detailListCard(title, rows, className = "") {
  const items = Array.isArray(rows) ? rows.filter(Boolean) : [];
  if (!items.length) return "";
  return `<article class="proof-card ${escapeHtml(className)}"><h2 style="margin-top:0">${escapeHtml(title)}</h2><ul class="muted-list service-detail-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>`;
}

function visualBriefsMarkup(page, websiteImageManifest, slug) {
  const briefs = Array.isArray(page?.visual_briefs) ? page.visual_briefs.filter(Boolean) : [];
  if (!briefs.length) return "";
  const managed = landingImageMatches(websiteImageManifest, page, slug, 20).filter((row) => row?.explicit_assignment === true && row?.url);
  if (managed.length >= briefs.length) return "";
  return `
    <section class="section panel visual-proof-plan" data-visual-placeholder-section="true">
      <p class="eyebrow">Visual proof placeholders</p>
      <h2 style="margin-top:0">Photos that will strengthen this service page</h2>
      <p class="muted">These placeholders keep the layout ready for real Rosie Dazzlers work. Replace them through Photo Management Studio as matching before/after and process photos become available.</p>
      <div class="visual-brief-grid">
        ${briefs.slice(managed.length, managed.length + 6).map((brief) => `<article class="visual-brief-card"><img src="/assets/placeholders/service-photo-needed.svg" alt="Photo placeholder for ${escapeHtml(brief)}" loading="lazy"><h3>Photo needed</h3><p class="muted">${escapeHtml(brief)}</p></article>`).join("")}
      </div>
    </section>`;
}

function galleryMarkup(page, relatedProducts, r2Matches = []) {
  const gallerySource = Array.isArray(page?.gallery_image_urls) ? page.gallery_image_urls : (Array.isArray(page?.gallery_images) ? page.gallery_images : []);
  const gallery = gallerySource.filter(Boolean);
  const productImages = (relatedProducts || []).map((item) => item.image_url).filter(Boolean);
  const explicitR2Rows = (r2Matches || []).filter((item) => item?.url && item?.explicit_assignment === true && String(item?.target_key || '').includes(':gallery:'));
  const automaticR2Rows = (r2Matches || []).filter((item) => item?.url && item?.explicit_assignment !== true);
  const approvedR2Rows = [...explicitR2Rows, ...automaticR2Rows];
  const r2Meta = new Map(approvedR2Rows.map((item) => [item.url, item]));
  // Explicit gallery choices are intentional additions; otherwise authored gallery/product images stay first.
  const all = [...explicitR2Rows.map((item)=>item.url), ...gallery, ...productImages, ...automaticR2Rows.map((item)=>item.url)].filter(Boolean);
  if (!all.length) return "";

  const unique = [];
  const seen = new Set();
  for (const src of all) {
    if (seen.has(src)) continue;
    seen.add(src);
    unique.push(src);
  }

  return `
    <section class="section panel">
      <h2 style="margin-top:0">Service and product visuals</h2>
      <div class="service-link-grid" style="margin-top:12px">
        ${unique.slice(0, 8).map((src) => `
          <article class="service-link-card">
            ${mediaImageMarkup(src, r2Meta.get(src)?.alt_text || "Rosie Dazzlers service visual", "proof-media", r2Meta.get(src)?.focal_point ? `style="object-position:${escapeHtml(r2Meta.get(src).focal_point)}"` : "")}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function pageTemplate(page, pricing, slug, productCatalog, websiteImageManifest) {
  const addon = page.related_code
    ? (pricing.addons || []).find((row) => row.code === page.related_code)
    : null;

  const related = Object.values((window.__landingPages || {}).pages || {})
    .filter((row) => row && row.enabled !== false && row.slug !== slug && row.nav_group === page.nav_group)
    .slice(0, 8);

  const faq = Array.isArray(page.faq) ? page.faq : [];
  const reasons = (Array.isArray(page.reasons_page_exists) ? page.reasons_page_exists : []).length
    ? page.reasons_page_exists
    : [
      page.type === "location"
        ? "This location page exists because local customers often search by town name first and need a page that talks about their service area directly."
        : "This add-on page exists because customers often search for this exact service or problem before they compare full packages.",
      "It keeps process, expectations, pricing/quote guidance, and booking links together instead of burying them inside a long catalog.",
      "It gives search engines clearer page focus while still keeping one honest customer path into booking."
    ];
  const process = (Array.isArray(page.process) ? page.process : []).length
    ? page.process
    : [
      "Confirm fit, scope, service area, and any quote requirements before the job is treated as ready.",
      "Inspect the vehicle or local setup notes so expectations are realistic.",
      "Complete the needed package, add-on, prep, treatment, or proof workflow using the current Rosie Dazzlers process.",
      "Review the result, aftercare notes, and next booking path with the customer."
    ];
  const equipment = Array.isArray(page.equipment) ? page.equipment : [];
  const highlights = Array.isArray(page.highlights) ? page.highlights : [];
  const thingsToKnow = Array.isArray(page.things_to_know) ? page.things_to_know : [];
  const scopeIncludes = Array.isArray(page.scope_includes) ? page.scope_includes : [];
  const scopeExcludes = Array.isArray(page.scope_excludes) ? page.scope_excludes : [];
  const customerPrep = Array.isArray(page.customer_prep) ? page.customer_prep : [];
  const aftercare = Array.isArray(page.aftercare) ? page.aftercare : [];
  const quoteTriggers = Array.isArray(page.quote_triggers) ? page.quote_triggers : [];
  const officialLinks = Array.isArray(page.official_links) ? page.official_links : [];
  const waterNote = waterNoteForPage(page, thingsToKnow);
  const waterSources = waterSourcesForPage(page, officialLinks);
  const relatedProducts = resolveRelatedProducts(page, productCatalog);
  const priceSummary = addonPriceSummary(addon);
  const landingMatches = landingImageMatches(websiteImageManifest, page, slug, 10);
  const heroImage = heroMediaForPage(page, addon, relatedProducts, landingMatches, slug);
  const matchedHeroMeta = landingMatches.find((row)=>row?.url === heroImage) || null;
  const reviewProofImage = explicitImageForTarget(websiteImageManifest, `landing:${slug}:review-proof`);
  const matchedR2Hero = Boolean(matchedHeroMeta);
  const heroAlt = matchedHeroMeta?.alt_text || page.name || page.hero_title || slug;
  const heroExtra = matchedHeroMeta?.focal_point ? `style="object-position:${escapeHtml(matchedHeroMeta.focal_point)}"` : '';
  const photoCaption = matchedR2Hero
    ? "Real Rosie Dazzlers imagery selected from the approved public R2 website library."
    : cleanText(page.region_photo_caption || (page.type === "location" ? "Regional photo included so this local landing page feels tied to the area, not just copied from a generic service page." : ""));
  const photoSource = matchedR2Hero ? '' : cleanText(page.region_photo_source);
  const photoSourceUrl = matchedR2Hero ? '' : cleanText(page.region_photo_source_url);
  const whyHeading = page.type === "location" ? "Why this location has its own page" : "Why this service has its own page";

  return `
  <main class="container">
    <section class="hero hero-split">
      <div>
        <div class="badge">${escapeHtml(page.badge || "Landing page")}</div>
        <h1>${escapeHtml(page.hero_title || page.name || "Landing page")}</h1>
        <p>${escapeHtml(page.hero_intro || "")}</p>
        <div class="badges">
          <span class="badge">Mobile service</span>
          <span class="badge">Oxford & Norfolk Counties</span>
          ${addon ? `<span class="badge">${escapeHtml(addon.quote_required ? "Starting price · condition assessed" : "Bookable add-on")}</span>` : `<span class="badge">Local service page</span>`}
        </div>
        <div class="cta-row" style="margin-top:14px">
          <a class="btn primary" href="/book">Book now</a>
          <a class="btn ghost" href="/pricing#booking-planner">Open live availability</a>
          <a class="btn ghost" href="/services">All services</a>
        </div>
      </div>
      <aside class="panel hero-sidecard">
        <figure class="landing-region-photo">
          ${mediaImageMarkup(heroImage, heroAlt, "proof-media", heroExtra)}
          ${photoCaption || photoSource ? `<figcaption>${escapeHtml(photoCaption || "Regional/service photo")}${photoSourceUrl ? ` <a href="${escapeHtml(photoSourceUrl)}" target="_blank" rel="noopener">${escapeHtml(photoSource || "source")}</a>` : (photoSource ? ` ${escapeHtml(photoSource)}` : "")}</figcaption>` : ""}
        </figure>
        <h2 style="margin-top:0">What to expect</h2>
        <p class="muted">${escapeHtml(priceSummary || "Review the process, scope, and booking fit before choosing this page’s service path.")}</p>
        <div class="hr"></div>
        <p class="muted">${escapeHtml((highlights[0] || reasons[0] || page.hero_intro || "").slice(0, 280))}</p>
      </aside>
    </section>

    ${conditionPricingMarkup(addon)}

    <section class="section proof-grid">
      <article class="proof-card">
        <h2 style="margin-top:0">${escapeHtml(whyHeading)}</h2>
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

    ${(scopeIncludes.length || scopeExcludes.length) ? `<section class="section scope-grid">${detailListCard("What’s included", scopeIncludes, "scope-includes")}${detailListCard("What is not automatically included", scopeExcludes, "scope-excludes")}</section>` : ""}

    ${(customerPrep.length || aftercare.length) ? `<section class="section scope-grid">${detailListCard("Before we arrive", customerPrep)}${detailListCard("Aftercare", aftercare)}</section>` : ""}

    ${quoteTriggers.length ? `<section class="section panel quote-trigger-panel"><h2 style="margin-top:0">When we pause and re-quote</h2><p class="muted">Photos are useful, but hidden damage, contamination or extra disassembly can change the labour. We confirm that before expanding the job.</p><ul class="muted-list">${quoteTriggers.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : ""}

    ${relatedProducts.length ? `
      <section class="section panel">
        <h2 style="margin-top:0">Products we use for this service</h2>
        <p class="muted">These are the real consumables or support products currently linked to this service page.</p>
        <div class="service-link-grid" style="margin-top:12px">
          ${relatedProducts.map((item) => `
            <article class="service-link-card">
              ${item.image_url ? mediaImageMarkup(item.image_url, item.name, "proof-media", 'style="margin-bottom:10px"') : ``}
              <h3>${escapeHtml(item.name)}</h3>
              ${item.role ? `<div class="badge" style="margin-bottom:8px">${escapeHtml(item.role)}</div>` : ``}
              ${item.note ? `<p class="muted">${escapeHtml(item.note)}</p>` : `<p class="muted">Linked from your consumables catalog.</p>`}
            </article>
          `).join("")}
        </div>
      </section>
    ` : ""}

    ${waterNote ? `
      <section class="section panel local-water-note" aria-label="Verified local water-use reminder">
        <p class="eyebrow">Verified local water-use reminder</p>
        <h2 style="margin-top:0">Water-use timing for exterior detailing</h2>
        <p>${escapeHtml(waterNote)}</p>
        <p class="muted">We still confirm current municipal or county notices before dispatch, especially during drought or emergency restrictions.</p>
        ${waterSources.length ? `<div class="source-list">${waterSources.map((item) => `<a href="${escapeHtml(item.url)}" rel="noopener" target="_blank">${escapeHtml(item.label || "Official water-use source")}</a>`).join("")}</div>` : ``}
      </section>
    ` : ""}

    ${beforeAfterMarkup(websiteImageManifest, slug)}

    ${galleryMarkup(page, relatedProducts, landingMatches)}

    ${visualBriefsMarkup(page, websiteImageManifest, slug)}

    ${thingsToKnow.length ? `
      <section class="section panel">
        <h2 style="margin-top:0">Things to know, avoid, and plan for</h2>
        <ul class="muted-list">${thingsToKnow.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
    ` : ""}

    ${officialLinks.length ? `
      <section class="section panel">
        <h2 style="margin-top:0">Helpful official sources and local references</h2>
        <div class="service-link-grid" style="margin-top:12px">
          ${officialLinks.map((item) => `
            <article class="service-link-card">
              <h3>${escapeHtml(item.label || "Official source")}</h3>
              <a class="btn ghost small" href="${escapeHtml(item.url)}" rel="noopener" target="_blank">Open source</a>
            </article>
          `).join("")}
        </div>
      </section>
    ` : ""}

    <section class="section panel">
      <h2 style="margin-top:0">Recent work and review proof</h2>
      <p class="muted">Keep visible proof close to the booking CTA so visitors can confirm the business is active before they contact you.</p>
      <div data-recent-work-mount style="margin-top:12px"></div>
      <div class="hr"></div>
      <div class="proof-grid">
        <article class="proof-card">
          <h3>Review proof</h3>
          ${mediaImageMarkup(reviewProofImage?.url || "/assets/brand/rosie-reviews-fallback.png", reviewProofImage?.alt_text || "Rosie Dazzlers reviews", "proof-media", reviewProofImage?.focal_point ? `style="object-position:${escapeHtml(reviewProofImage.focal_point)}"` : "")}
        </article>
        <article class="proof-card">
          <h3>Booking fit</h3>
          <p class="muted">${escapeHtml(
            addon?.quote_required
              ? "This service is requested online first and finalized after inspection because condition, labour, and prep needs can change the product path."
              : "Use the live booking planner to compare package fit, vehicle size, and add-on eligibility before you lock in a booking."
          )}</p>
          <div class="cta-row" style="margin-top:10px">
            <a class="btn ghost small" href="/contact">Ask a question</a>
            <a class="btn ghost small" href="/gallery">Gallery</a>
          </div>
        </article>
      </div>
    </section>

    ${faq.length ? `
      <section class="section panel">
        <h2 style="margin-top:0">Frequently asked questions</h2>
        <div class="faq-list">
          ${faq.map((item) => `
            <details class="faq-item">
              <summary>${escapeHtml(item.q)}</summary>
              <p class="muted">${escapeHtml(item.a)}</p>
            </details>
          `).join("")}
        </div>
      </section>
    ` : ""}

    ${related.length ? `
      <section class="section panel">
        <h2 style="margin-top:0">Related pages</h2>
        <div class="service-link-grid" style="margin-top:12px">
          ${related.map((item) => `
            <article class="service-link-card">
              <h3>${escapeHtml(item.name || item.hero_title || item.slug)}</h3>
              <a class="btn ghost small" href="/${escapeHtml(item.slug)}">Open page</a>
            </article>
          `).join("")}
        </div>
      </section>
    ` : ""}
  </main>`;
}


function upsertJsonLd(id, data) {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data, null, 2);
}

function landingAreaServed(page, slug) {
  const key = cleanText(slug || page?.slug).toLowerCase();
  const locationMap = {
    'tillsonburg-auto-detailing':['Tillsonburg, Ontario','Oxford County, Ontario'],
    'woodstock-ingersoll-auto-detailing':['Woodstock, Ontario','Ingersoll, Ontario','Oxford County, Ontario'],
    'norwich-otterville-auto-detailing':['Norwich, Ontario','Otterville, Ontario','Oxford County, Ontario'],
    'zorra-thamesford-embro-auto-detailing':['Zorra, Ontario','Thamesford, Ontario','Embro, Ontario','Oxford County, Ontario'],
    'simcoe-delhi-auto-detailing':['Simcoe, Ontario','Delhi, Ontario','Norfolk County, Ontario'],
    'port-dover-auto-detailing':['Port Dover, Ontario','Norfolk County, Ontario'],
    'waterford-vittoria-auto-detailing':['Waterford, Ontario','Vittoria, Ontario','Norfolk County, Ontario'],
    'port-rowan-turkey-point-auto-detailing':['Port Rowan, Ontario','Turkey Point, Ontario','Norfolk County, Ontario']
  };
  return page?.type === 'location' && locationMap[key]
    ? locationMap[key]
    : ['Oxford County, Ontario','Norfolk County, Ontario'];
}

function updateLandingStructuredData(page, addon, slug) {
  document.getElementById("landing-static-jsonld")?.remove();
  const title = page?.meta_title || page?.hero_title || page?.name || "Rosie Dazzlers landing page";
  const description = page?.meta_description || page?.hero_intro || "Rosie Dazzlers mobile auto detailing information page.";
  const url = `${location.origin}/${slug}`;
  const faqs = Array.isArray(page?.faq) ? page.faq.filter((item) => item?.q && item?.a) : [];

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": page?.name || page?.hero_title || title,
    "serviceType": addon ? (addon.name || "Auto detailing add-on") : "Mobile auto detailing",
    "description": description,
    "url": url,
    "provider": {
      "@type": "LocalBusiness",
      "name": "Rosie Dazzlers Mobile Auto Detailing",
      "url": `${location.origin}/`,
      "areaServed": landingAreaServed(page, slug)
    },
    "areaServed": landingAreaServed(page, slug)
  };
  if (addon && addon.quote_required !== true) {
    const sizePrices = Object.values(addon?.prices_cad || {}).map(Number).filter((value) => Number.isFinite(value) && value > 0);
    const basePrice = hasPositiveMoney(addon?.price_cad) ? Number(addon.price_cad) : (sizePrices.length ? Math.min(...sizePrices) : null);
    if (basePrice) serviceJsonLd.offers = { "@type": "Offer", "priceCurrency": "CAD", "price": basePrice, "url": `${location.origin}/book` };
  }
  upsertJsonLd("landing-service-jsonld", serviceJsonLd);

  upsertJsonLd("landing-breadcrumb-jsonld", {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${location.origin}/` },
      { "@type": "ListItem", "position": 2, "name": page?.name || title, "item": url }
    ]
  });

  if (faqs.length) {
    upsertJsonLd("landing-faq-jsonld", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.slice(0, 8).map((item) => ({
        "@type": "Question",
        "name": cleanText(item.q),
        "acceptedAnswer": { "@type": "Answer", "text": cleanText(item.a) }
      }))
    });
  }
}

async function renderLandingPage() {
  const slug = slugFromPath();
  const [landingPages, pricing, productCatalog, waterRule, websiteImageManifest] = await Promise.all([
    fetchJson("/api/landing_pages_public"),
    fetchJson("/api/pricing_catalog_public"),
    fetchJson("/data/rosie_products_catalog.json"),
    loadWaterRuleForSlug(slug),
    loadWebsiteImageManifest()
  ]);

  window.__landingPages = landingPages || { pages: {} };
  const page = applyWaterRuleToPage(landingPages?.pages?.[slug], waterRule);

  if (!page || page.enabled === false) {
    document.getElementById("landingMount").innerHTML = `
      <main class="container">
        <section class="hero">
          <div>
            <div class="badge">Landing page</div>
            <h1>Page not found</h1>
            <p>The requested landing page does not exist yet or is not enabled.</p>
            <div class="cta-row" style="margin-top:14px">
              <a class="btn primary" href="/services">All services</a>
              <a class="btn ghost" href="/contact">Contact</a>
            </div>
          </div>
        </section>
      </main>`;
    document.title = "Landing Page Not Found | Rosie Dazzlers";
    return;
  }

  if (page.meta_title) document.title = page.meta_title;
  const meta = document.querySelector('meta[name="description"]');
  if (meta && page.meta_description) meta.setAttribute("content", page.meta_description);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && page.meta_title) ogTitle.setAttribute("content", page.meta_title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc && page.meta_description) ogDesc.setAttribute("content", page.meta_description);

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute(
      "href",
      location.origin + (location.pathname.startsWith("/landing/") ? location.pathname : `/${slug}`)
    );
  }

  const landingMount = document.getElementById("landingMount");
  landingMount.innerHTML = pageTemplate(page, pricing || {}, slug, productCatalog || [], websiteImageManifest || {});
  bindLandingMedia(landingMount);
  const addon = page.related_code ? ((pricing?.addons || []).find((row) => row.code === page.related_code) || null) : null;
  updateLandingStructuredData(page, addon, slug);
  renderRecentWorkMounts(3);
}

renderLandingPage().catch((err) => {
  document.getElementById("landingMount").innerHTML = `
    <main class="container">
      <section class="hero">
        <div>
          <div class="badge">Landing page</div>
          <h1>Could not load this page</h1>
          <p>${escapeHtml(err?.message || "Unknown error")}</p>
          <div class="cta-row" style="margin-top:14px">
            <a class="btn primary" href="/services">All services</a>
            <a class="btn ghost" href="/contact">Contact</a>
          </div>
        </div>
      </section>
    </main>`;
});
