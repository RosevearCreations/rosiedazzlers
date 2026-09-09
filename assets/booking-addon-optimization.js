// Build 367: advisory add-on eligibility, recommendation, and attach-rate instrumentation.
// Never selects an add-on for the customer. Canonical catalogue and existing booking controls remain authoritative.
import { loadPricingCatalogClient } from "/assets/pricing-catalog-client-legacy.js?v=20260904build336";
import { recommendAddons } from "/assets/addon-eligibility.js?v=20260909build367";

const FALLBACK_URL = "/data/rosie_services_pricing_and_packages.json?v=20260412pass12";
const PANEL_ID = "addonOptimizationPanel";
const STYLE_ID = "build367-addon-optimization-style";

function pathName() {
  return String(window.location.pathname || "").replace(/\/+$/, "") || "/";
}

function supportedPage() {
  return ["/book", "/booking-planner"].includes(pathName());
}

function analytics(eventType, payload = {}) {
  try {
    if (window.RosieAnalytics?.track) {
      window.RosieAnalytics.track(eventType, payload);
      return;
    }
    window.dispatchEvent(new CustomEvent("rd:analytics", { detail: { event: eventType, ...payload } }));
  } catch {}
}

function clean(value) {
  return String(value ?? "").trim();
}

function addStyles(root) {
  if (root.getElementById(STYLE_ID)) return;
  const style = root.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .addon-optimization{margin:12px 0;padding:13px;border:1px solid rgba(92,214,160,.34);border-radius:16px;background:rgba(92,214,160,.07)}
    .addon-optimization h3{margin:0 0 5px}.addon-optimization p{margin:0}
    .addon-optimization-list{display:grid;gap:8px;margin-top:10px}
    .addon-optimization-item{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:9px 10px;border:1px solid rgba(255,255,255,.10);border-radius:12px;background:rgba(255,255,255,.035)}
    .addon-optimization-item strong,.addon-optimization-item span{display:block}.addon-optimization-item .mini{margin-top:2px}
    .addon-card.addon-recommended{box-shadow:0 0 0 2px rgba(92,214,160,.72) inset}
    .addon-recommendation-badge{display:inline-flex!important;align-items:center;width:max-content;padding:4px 8px;border-radius:999px;border:1px solid rgba(92,214,160,.42);background:rgba(92,214,160,.12);font-size:.78rem!important;font-weight:800}
    @media(max-width:720px){.addon-optimization-item{align-items:flex-start;flex-direction:column}}
  `;
  root.head?.appendChild(style);
}

function addonGrid(root) {
  return root.querySelector(pathName() === "/booking-planner" ? "#addonsBox" : "#addonGrid");
}

function addonCardSelector() {
  return pathName() === "/booking-planner" ? "[data-addon]" : "[data-addon-card]";
}

function cardCode(card) {
  return clean(card?.getAttribute(pathName() === "/booking-planner" ? "data-addon" : "data-addon-card"));
}

function activePackageCode(root) {
  if (pathName() === "/booking-planner") return clean(root.querySelector("[data-package].active")?.getAttribute("data-package"));
  return clean(root.querySelector("[data-package-card].active")?.getAttribute("data-package-card"));
}

function selectedAddonCodes(root) {
  return [...root.querySelectorAll(`${addonCardSelector()}.active`)].map(cardCode).filter(Boolean);
}

function vehicleSize(root) {
  return clean(root.querySelector(pathName() === "/booking-planner" ? "#vehicle_size" : "#vehicleSize")?.value).toLowerCase();
}

function recommendationContext(root) {
  if (pathName() === "/booking-planner") {
    return {
      conditionFlags: [...root.querySelectorAll("[data-condition-flag]:checked")]
        .map((node) => clean(node.getAttribute("data-condition-flag"))).filter(Boolean),
      goal: "unsure"
    };
  }
  const goal = clean(root.querySelector("#serviceRecommendationGoal")?.value) || "unsure";
  const condition = clean(root.querySelector("#serviceRecommendationCondition")?.value).toLowerCase();
  const flags = [];
  if (condition === "heavy") {
    if (["quick_interior", "deep_interior", "full_reset"].includes(goal)) flags.push("stains_shampoo");
    if (["quick_exterior", "exterior_finish", "full_reset"].includes(goal)) flags.push("paint_swirls");
  }
  return { conditionFlags: flags, goal };
}

function buildPanel(root, grid) {
  const panel = root.createElement("div");
  panel.id = PANEL_ID;
  panel.className = "addon-optimization";
  panel.innerHTML = `<h3>Recommended extras to review</h3><p class="mini muted">We only highlight compatible add-ons that match the needs you already described. Nothing is added automatically; choose an add-on yourself only if you want it.</p><div class="addon-optimization-list" data-addon-optimization-list role="status" aria-live="polite"></div>`;
  grid.insertAdjacentElement("beforebegin", panel);
  return panel;
}

function clearMarkers(root) {
  root.querySelectorAll(`${addonCardSelector()}.addon-recommended`).forEach((card) => {
    card.classList.remove("addon-recommended");
    card.removeAttribute("data-addon-recommended");
    card.querySelector("[data-addon-recommendation-badge]")?.remove();
  });
}

function markCard(root, code) {
  const card = [...root.querySelectorAll(addonCardSelector())].find((node) => cardCode(node) === code);
  if (!card || card.hasAttribute("disabled") || card.hasAttribute("data-disabled")) return;
  card.classList.add("addon-recommended");
  card.setAttribute("data-addon-recommended", "true");
  if (!card.querySelector("[data-addon-recommendation-badge]")) {
    const badge = root.createElement("span");
    badge.className = "addon-recommendation-badge";
    badge.setAttribute("data-addon-recommendation-badge", "true");
    badge.textContent = "Recommended to review";
    const strong = card.querySelector("strong");
    if (strong) strong.insertAdjacentElement("beforebegin", badge); else card.prepend(badge);
  }
}

function findCard(root, code) {
  return [...root.querySelectorAll(addonCardSelector())].find((node) => cardCode(node) === code) || null;
}

export async function wireBookingAddonOptimization(root = document) {
  if (!supportedPage() || root.getElementById(PANEL_ID)) return;
  const grid = addonGrid(root);
  if (!grid) return;

  addStyles(root);
  const panel = buildPanel(root, grid);
  const list = panel.querySelector("[data-addon-optimization-list]");
  let catalogue = null;
  let recommendations = [];
  let exposureSignature = "";
  let refreshQueued = false;
  let conditionSelectionBefore = null;

  const loadCatalogue = async () => {
    if (catalogue) return catalogue;
    catalogue = await loadPricingCatalogClient({ fallbackUrl: FALLBACK_URL, credentials: "include" });
    return catalogue;
  };

  const render = async () => {
    refreshQueued = false;
    try {
      const loaded = await loadCatalogue();
      const packageCode = activePackageCode(root);
      const pkg = (loaded?.packages || []).find((row) => clean(row.code) === packageCode) || null;
      clearMarkers(root);
      if (!packageCode || !pkg) {
        recommendations = [];
        list.innerHTML = `<span class="mini muted">Choose a main service first. Compatible extras will be reviewed after that.</span>`;
        return;
      }

      const context = recommendationContext(root);
      recommendations = recommendAddons({
        addons: loaded?.addons,
        pkg,
        packageCode,
        vehicleSize: vehicleSize(root),
        conditionFlags: context.conditionFlags,
        goal: context.goal,
        selectedCodes: selectedAddonCodes(root),
        maxRecommendations: 3
      });

      if (!recommendations.length) {
        list.innerHTML = `<span class="mini muted">No specialty add-on is strongly indicated by your current choices. You can continue without adding anything.</span>`;
        return;
      }

      list.replaceChildren();
      for (const recommendation of recommendations) {
        markCard(root, recommendation.addonCode);
        const row = root.createElement("div");
        row.className = "addon-optimization-item";
        const copy = root.createElement("div");
        const name = root.createElement("strong");
        name.textContent = recommendation.addonName;
        const reason = root.createElement("span");
        reason.className = "mini muted";
        reason.textContent = recommendation.reason;
        copy.append(name, reason);
        const review = root.createElement("button");
        review.type = "button";
        review.className = "btn ghost small";
        review.textContent = "Review add-on";
        review.addEventListener("click", () => findCard(root, recommendation.addonCode)?.scrollIntoView({ behavior: "smooth", block: "center" }));
        row.append(copy, review);
        list.appendChild(row);
      }

      const signature = [pathName(), packageCode, vehicleSize(root), context.goal, context.conditionFlags.join("+"), recommendations.map((row) => row.addonCode).join(",")].join("|");
      if (signature !== exposureSignature) {
        exposureSignature = signature;
        analytics("booking_addon_recommendation_exposure", {
          package_code: packageCode,
          vehicle_size: vehicleSize(root) || null,
          recommendation_count: recommendations.length,
          recommended_addon_codes: recommendations.map((row) => row.addonCode).join(","),
          recommendation_context: context.conditionFlags.join(",") || context.goal || "unsure"
        });
      }
    } catch (error) {
      console.warn("Add-on recommendation enhancement unavailable; normal booking controls remain usable.", error);
      recommendations = [];
      clearMarkers(root);
      list.innerHTML = `<span class="mini muted">Add-on guidance is temporarily unavailable. All normal add-on controls remain usable.</span>`;
    }
  };

  const scheduleRender = () => {
    if (refreshQueued) return;
    refreshQueued = true;
    window.requestAnimationFrame(() => render());
  };

  // Preserve explicit customer choice when the legacy condition helper tries to add suggested extras.
  // Snapshot before its existing handler, then remove only add-ons that appeared solely because of that helper.
  const conditionButton = root.querySelector("#conditionRecommendBtn");
  if (conditionButton) {
    conditionButton.addEventListener("click", () => {
      conditionSelectionBefore = new Set(selectedAddonCodes(root));
    }, true);
    conditionButton.addEventListener("click", () => {
      const before = conditionSelectionBefore || new Set();
      conditionSelectionBefore = null;
      window.setTimeout(() => {
        const newlySelected = selectedAddonCodes(root).filter((code) => !before.has(code));
        for (const code of newlySelected) {
          const card = findCard(root, code);
          if (card?.classList.contains("active")) card.click();
        }
        const status = root.querySelector("#bookingStatus");
        if (newlySelected.length && status) {
          status.className = "notice ok";
          status.style.display = "block";
          status.textContent = "Condition helper applied. Suggested add-ons are highlighted for review but were not selected for you.";
        }
        scheduleRender();
      }, 0);
    });
  }

  // Count a recommendation attach only after an explicit click changes a recommended card from unselected to selected.
  root.addEventListener("click", (event) => {
    const card = event.target?.closest?.(addonCardSelector());
    if (!card || card.getAttribute("data-addon-recommended") !== "true") return;
    const code = cardCode(card);
    const wasActive = card.classList.contains("active");
    window.setTimeout(() => {
      const current = findCard(root, code);
      if (!wasActive && current?.classList.contains("active")) {
        analytics("booking_addon_recommendation_accept", {
          addon_code: code,
          package_code: activePackageCode(root) || null,
          vehicle_size: vehicleSize(root) || null,
          source: pathName() === "/booking-planner" ? "booking_planner" : "unified_book"
        });
      }
      scheduleRender();
    }, 0);
  }, true);

  ["change", "input"].forEach((eventName) => root.addEventListener(eventName, (event) => {
    if (event.target?.matches?.("#vehicleSize,#vehicle_size,#serviceRecommendationGoal,#serviceRecommendationCondition,[data-condition-flag]")) scheduleRender();
  }));

  const observer = new MutationObserver(() => scheduleRender());
  observer.observe(grid, { childList: true, subtree: false });
  const packageGrid = root.querySelector(pathName() === "/booking-planner" ? "#packageCards" : "#packageGrid");
  if (packageGrid) observer.observe(packageGrid, { childList: true, subtree: false });

  await render();
}
