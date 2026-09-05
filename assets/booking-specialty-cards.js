// Build 338: rich specialty-service cards for the unified /book funnel.
// Enhances the proven Build 337 selection buttons without replacing their event handlers.

import {
  loadPricingCatalogClient,
  addonPrimaryImage,
  addonFallbackImage,
  escapeHtml
} from "/assets/pricing-catalog-client-legacy.js?v=20260904build336";

const GUIDE_ROUTES = Object.freeze({
  full_clay_treatment: "/full-clay-treatment",
  two_stage_polish: "/two-stage-polish",
  high_grade_paint_sealant: "/high-grade-paint-sealant",
  uv_protectant_applied_on_interior_panels: "/uv-protectant",
  de_ionizing_treatment: "/de-ionizing-treatment",
  de_badging: "/de-badging",
  engine_cleaning: "/engine-cleaning",
  external_ceramic_coating: "/ceramic-coating",
  external_graphene_fine_finish: "/graphene-finish",
  external_wax: "/exterior-wax",
  vinyl_wrapping: "/vinyl-wrapping",
  window_tinting: "/window-tinting",
  pet_hair_removal: "/pet-hair-removal",
  odor_treatment: "/odor-removal",
  seat_shampoo: "/seat-shampoo",
  carpet_shampoo: "/carpet-shampoo",
  salt_stain_treatment: "/salt-stain-treatment",
  headlight_restoration_addon: "/headlight-restoration",
  windshield_ceramic_coating: "/windshield-ceramic-coating",
  ceramic_spray_wax: "/ceramic-spray-wax",
  trim_restoration: "/trim-restoration",
  bug_tar_removal: "/bug-tar-removal",
  truck_box_wash: "/truck-box-wash",
  fleet_vehicle_add_on: "/fleet-vehicle-add-on"
});

const GENERIC_IMAGE = "/assets/addons/generic_addon.png";
let catalogByCode = new Map();
let observer = null;
let scheduled = false;

function injectStyles() {
  if (document.querySelector("#booking-specialty-rich-card-styles")) return;
  const style = document.createElement("style");
  style.id = "booking-specialty-rich-card-styles";
  style.textContent = `
    #addonGrid.addon-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch}
    .addon-rich-card{display:flex;flex-direction:column;min-width:0;overflow:hidden;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.035);box-shadow:0 12px 28px rgba(0,0,0,.12)}
    .addon-rich-card:hover{border-color:rgba(77,119,255,.45);transform:translateY(-1px)}
    .addon-rich-card.is-selected{outline:2px solid #4d77ff;border-color:rgba(77,119,255,.75);background:rgba(77,119,255,.08)}
    .addon-rich-media{display:block;position:relative;overflow:hidden;background:rgba(255,255,255,.04)}
    .addon-rich-media img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;transition:transform .18s ease}
    .addon-rich-media:hover img,.addon-rich-media:focus-visible img{transform:scale(1.025)}
    .addon-rich-media:focus-visible,.addon-rich-title:focus-visible,.addon-rich-guide:focus-visible{outline:3px solid rgba(124,155,255,.9);outline-offset:2px}
    .addon-rich-body{display:flex;flex:1;flex-direction:column;gap:10px;padding:13px 14px 14px}
    .addon-rich-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
    .addon-rich-title{color:inherit;text-decoration:none;font-weight:800;font-size:1.05rem;line-height:1.25}
    .addon-rich-title:hover{text-decoration:underline;text-underline-offset:3px}
    .addon-rich-price{flex:0 0 auto;font-weight:850;white-space:nowrap;color:#fff}
    .addon-rich-summary{margin:0;color:rgba(234,242,255,.78);font-size:.91rem;line-height:1.42}
    .addon-rich-facts{display:flex;gap:6px;flex-wrap:wrap;margin-top:auto}
    .addon-rich-chip{display:inline-flex;align-items:center;min-height:28px;padding:4px 8px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.04);color:rgba(234,242,255,.78);font-size:.78rem;line-height:1.2}
    .addon-rich-chip.quote{border-color:rgba(251,191,36,.35);background:rgba(251,191,36,.08)}
    .addon-rich-compat{margin:0;color:rgba(251,191,36,.95);font-size:.82rem;line-height:1.35}
    .addon-rich-actions{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;margin-top:2px}
    .addon-rich-card .addon-card.addon-rich-select{width:100%;display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:42px;margin:0;padding:9px 11px;border-radius:11px;text-align:center;background:rgba(77,119,255,.12);border-color:rgba(77,119,255,.4)}
    .addon-rich-card .addon-card.addon-rich-select:hover{background:rgba(77,119,255,.2);border-color:rgba(77,119,255,.65)}
    .addon-rich-card .addon-card.addon-rich-select.active{outline:none;background:rgba(77,119,255,.28);border-color:rgba(77,119,255,.75)}
    .addon-rich-card .addon-card.addon-rich-select:disabled{opacity:.62;background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.1)}
    .addon-rich-card .addon-rich-select .addon-indicator{width:22px;height:22px;flex-basis:22px;margin:0}
    .addon-rich-guide{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:8px 10px;border-radius:11px;border:1px solid rgba(255,255,255,.12);color:inherit;text-decoration:none;font-size:.82rem;font-weight:750;white-space:nowrap}
    .addon-rich-guide:hover{border-color:rgba(77,119,255,.5);background:rgba(77,119,255,.08)}
    @media(max-width:1100px){#addonGrid.addon-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:720px){#addonGrid.addon-grid{grid-template-columns:1fr}.addon-rich-actions{grid-template-columns:1fr}.addon-rich-guide{width:100%}}
  `;
  document.head.appendChild(style);
}

function currentButtonMeta(button) {
  const text = String(button.querySelector(".addon-meta")?.textContent || "").trim();
  const parts = text.split(" · ").map((part) => part.trim()).filter(Boolean);
  return {
    price: parts[0] || "Condition quote",
    note: parts.slice(1).join(" · ")
  };
}

function summaryFor(addon) {
  const goal = String(addon?.customer_goal || "").trim();
  if (goal) return goal.endsWith(".") ? goal : `${goal}.`;
  const condition = Array.isArray(addon?.condition_pricing)
    ? String(addon.condition_pricing.find((row) => row?.when)?.when || "").trim()
    : "";
  if (condition) return condition;
  const note = Array.isArray(addon?.notes) ? String(addon.notes.find(Boolean) || "").trim() : "";
  if (note) return note;
  const basis = String(addon?.pricing_basis || addon?.type || addon?.category || "Specialty detailing service").trim();
  return basis ? `${basis.charAt(0).toUpperCase()}${basis.slice(1)}.` : "Specialty detailing service.";
}

function safeImage(addon) {
  return addonPrimaryImage(addon) || addonFallbackImage(addon) || GENERIC_IMAGE;
}

function attachImageFallback(img, addon) {
  const candidates = [addonFallbackImage(addon), GENERIC_IMAGE].filter(Boolean);
  let index = 0;
  img.addEventListener("error", () => {
    if (index >= candidates.length) return;
    const next = candidates[index++];
    if (next && img.src !== new URL(next, location.href).href) img.src = next;
  });
}

function enhanceButton(button) {
  if (!(button instanceof HTMLButtonElement)) return;
  if (button.closest("[data-rich-addon-card='true']")) return;
  const code = String(button.dataset.addonCard || "").trim();
  const addon = catalogByCode.get(code);
  if (!code || !addon) return;

  const route = GUIDE_ROUTES[code] || "/book#addons";
  const checked = button.getAttribute("aria-pressed") === "true" || button.classList.contains("active");
  const disabled = button.disabled;
  const meta = currentButtonMeta(button);
  const note = disabled && meta.note && meta.note.toLowerCase() !== String(addon.category || "").toLowerCase()
    ? meta.note
    : "";

  const article = document.createElement("article");
  article.className = `addon-rich-card${checked ? " is-selected" : ""}`;
  article.dataset.richAddonCard = "true";
  article.dataset.addonCode = code;

  const media = document.createElement("a");
  media.className = "addon-rich-media";
  media.href = route;
  media.setAttribute("aria-label", `View ${addon.name} service details`);
  media.innerHTML = `<img src="${escapeHtml(safeImage(addon))}" alt="${escapeHtml(addon.name)} detailing service" loading="lazy" decoding="async">`;
  const img = media.querySelector("img");
  if (img) attachImageFallback(img, addon);

  const body = document.createElement("div");
  body.className = "addon-rich-body";
  const quoteChip = addon.quote_required ? `<span class="addon-rich-chip quote">Photo / condition quote</span>` : "";
  const duration = String(addon.duration_label || "Time varies by condition").trim();
  const category = String(addon.category || addon.type || "Specialty service").trim();
  body.innerHTML = `
    <div class="addon-rich-heading">
      <a class="addon-rich-title" href="${escapeHtml(route)}">${escapeHtml(addon.name)}</a>
      <span class="addon-rich-price">${escapeHtml(meta.price)}</span>
    </div>
    <p class="addon-rich-summary">${escapeHtml(summaryFor(addon))}</p>
    <div class="addon-rich-facts">
      <span class="addon-rich-chip">${escapeHtml(category)}</span>
      <span class="addon-rich-chip">${escapeHtml(duration)}</span>
      ${quoteChip}
    </div>
    ${note ? `<p class="addon-rich-compat">${escapeHtml(note)}</p>` : ""}
    <div class="addon-rich-actions"></div>
  `;

  const actions = body.querySelector(".addon-rich-actions");
  button.classList.add("addon-rich-select");
  button.innerHTML = `<span class="addon-indicator" aria-hidden="true">${checked ? "✓" : "+"}</span><span>${disabled ? "Choose compatible package" : checked ? "Added to booking" : "Add to booking"}</span>`;
  button.setAttribute("aria-label", `${checked ? "Remove" : "Add"} ${addon.name}${disabled ? " — choose a compatible package first" : ""}`);

  const guide = document.createElement("a");
  guide.className = "addon-rich-guide";
  guide.href = route;
  guide.textContent = "Service details";
  guide.setAttribute("aria-label", `View ${addon.name} service details`);

  actions.append(button, guide);
  article.append(media, body);

  article.addEventListener("click", (event) => {
    if (event.target.closest("a,button")) return;
    if (!button.disabled) button.click();
  });

  const parent = button.parentElement;
  if (parent && parent.classList.contains("addon-rich-actions")) {
    const grid = document.querySelector("#addonGrid");
    if (grid) grid.appendChild(article);
  }
}

function enhanceGrid() {
  const grid = document.querySelector("#addonGrid");
  if (!grid || !catalogByCode.size) return;
  const buttons = Array.from(grid.querySelectorAll(":scope > button[data-addon-card]"));
  buttons.forEach((button) => {
    const placeholder = document.createComment("rich-addon-card");
    button.before(placeholder);
    enhanceButton(button);
    const article = grid.lastElementChild;
    if (article?.matches?.("[data-rich-addon-card='true']")) placeholder.replaceWith(article);
    else placeholder.remove();
  });
}

function scheduleEnhance() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    enhanceGrid();
  });
}

export async function wireBookingSpecialtyCards(root = document) {
  const grid = root.querySelector?.("#addonGrid") || document.querySelector("#addonGrid");
  if (!grid) return;
  injectStyles();

  try {
    const catalog = await loadPricingCatalogClient();
    catalogByCode = new Map((catalog?.addons || []).map((addon) => [String(addon.code || "").trim(), addon]));
  } catch (error) {
    console.warn("Rich specialty cards could not load catalogue metadata; basic booking controls remain available.", error);
    return;
  }

  scheduleEnhance();
  if (observer) observer.disconnect();
  observer = new MutationObserver(scheduleEnhance);
  observer.observe(grid, { childList: true });
}
