// Build 366: advisory service chooser for /book.
// This module never mutates the booking package selection. It only highlights an existing catalogue option.
import { loadPricingCatalogClient } from "/assets/pricing-catalog-client-legacy.js?v=20260904build336";
import { recommendService, recommendationOptions } from "/assets/service-recommendation.js?v=20260909build366";

const FALLBACK_URL = "/data/rosie_services_pricing_and_packages.json?v=20260412pass12";
const STYLE_ID = "build366-service-recommendation-style";
const PANEL_ID = "serviceRecommendationPanel";

function isBookPage() {
  return String(window.location.pathname || "").replace(/\/+$/, "") === "/book";
}

function addStyles(root) {
  if (root.getElementById?.(STYLE_ID)) return;
  const style = root.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .service-recommendation{margin-top:14px;padding:14px;border:1px solid rgba(77,119,255,.35);border-radius:16px;background:rgba(77,119,255,.07)}
    .service-recommendation h3{margin:0 0 5px}.service-recommendation p{margin:0}
    .service-recommendation-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr)) auto;gap:10px;align-items:end;margin-top:12px}
    .service-recommendation-fields label{display:grid;gap:5px}.service-recommendation-fields select{width:100%}
    .service-recommendation-result{margin-top:12px;padding:11px;border-radius:13px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04)}
    .service-recommendation-result[hidden]{display:none}
    .service-recommendation-name{display:block;font-size:1.02rem;margin-bottom:4px}
    .package-card.service-recommended{box-shadow:0 0 0 2px rgba(92,214,160,.72) inset}
    .service-recommendation-badge{display:inline-flex;align-items:center;width:max-content;padding:4px 8px;border-radius:999px;border:1px solid rgba(92,214,160,.42);background:rgba(92,214,160,.12);font-size:.78rem;font-weight:800}
    @media(max-width:720px){.service-recommendation-fields{grid-template-columns:1fr}}
  `;
  root.head?.appendChild(style);
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label.charAt(0).toUpperCase() + label.slice(1);
  return option;
}

function buildPanel(root) {
  const panel = root.createElement("div");
  panel.id = PANEL_ID;
  panel.className = "service-recommendation";
  panel.setAttribute("aria-labelledby", "serviceRecommendationHeading");

  const heading = root.createElement("h3");
  heading.id = "serviceRecommendationHeading";
  heading.textContent = "Help me choose the right service";
  panel.appendChild(heading);

  const intro = root.createElement("p");
  intro.className = "mini muted";
  intro.textContent = "Tell us the main result you want and the vehicle condition. We will highlight a best-fit option from the same live catalogue shown below. You remain in control of the final selection.";
  panel.appendChild(intro);

  const fields = root.createElement("div");
  fields.className = "service-recommendation-fields";

  const goalLabel = root.createElement("label");
  const goalText = root.createElement("span");
  goalText.textContent = "Main goal";
  const goalSelect = root.createElement("select");
  goalSelect.id = "serviceRecommendationGoal";
  for (const row of recommendationOptions.goals) goalSelect.appendChild(createOption(row.value, row.label));
  goalSelect.value = "unsure";
  goalLabel.append(goalText, goalSelect);

  const conditionLabel = root.createElement("label");
  const conditionText = root.createElement("span");
  conditionText.textContent = "Vehicle condition";
  const conditionSelect = root.createElement("select");
  conditionSelect.id = "serviceRecommendationCondition";
  for (const row of recommendationOptions.conditions) conditionSelect.appendChild(createOption(row.value, row.label));
  conditionSelect.value = "moderate";
  conditionLabel.append(conditionText, conditionSelect);

  const button = root.createElement("button");
  button.className = "btn primary";
  button.type = "button";
  button.id = "serviceRecommendationBtn";
  button.textContent = "Recommend a service";

  fields.append(goalLabel, conditionLabel, button);
  panel.appendChild(fields);

  const result = root.createElement("div");
  result.id = "serviceRecommendationResult";
  result.className = "service-recommendation-result";
  result.setAttribute("role", "status");
  result.setAttribute("aria-live", "polite");
  result.hidden = true;
  panel.appendChild(result);

  return { panel, goalSelect, conditionSelect, button, result };
}

function findPackageCard(root, packageCode) {
  return [...root.querySelectorAll("[data-package-card]")]
    .find((node) => String(node.dataset.packageCard || "") === String(packageCode || "")) || null;
}

function clearRecommendationMarkers(root) {
  root.querySelectorAll("[data-package-card]").forEach((card) => {
    card.classList.remove("service-recommended");
    card.querySelector("[data-service-recommendation-badge]")?.remove();
  });
}

function markRecommendedCard(root, recommendation) {
  clearRecommendationMarkers(root);
  if (!recommendation?.packageCode) return;
  const card = findPackageCard(root, recommendation.packageCode);
  if (!card) return;
  card.classList.add("service-recommended");
  if (!card.querySelector("[data-service-recommendation-badge]")) {
    const badge = root.createElement("span");
    badge.className = "service-recommendation-badge";
    badge.setAttribute("data-service-recommendation-badge", "true");
    badge.textContent = "Recommended for you";
    const heading = card.querySelector("h3");
    if (heading) heading.insertAdjacentElement("beforebegin", badge); else card.prepend(badge);
  }
}

function renderResult(root, resultNode, recommendation) {
  resultNode.replaceChildren();
  if (!recommendation) {
    resultNode.hidden = false;
    resultNode.textContent = "We could not make a reliable recommendation from the current catalogue. You can still compare every service below.";
    return;
  }

  const name = root.createElement("strong");
  name.className = "service-recommendation-name";
  name.textContent = `Recommended: ${recommendation.packageName}`;
  const reason = root.createElement("span");
  reason.className = "mini muted";
  reason.textContent = recommendation.reason;
  const actions = root.createElement("div");
  actions.className = "row";
  actions.style.marginTop = "9px";
  const showButton = root.createElement("button");
  showButton.type = "button";
  showButton.className = "btn ghost small";
  showButton.textContent = "Show recommended service";
  showButton.addEventListener("click", () => {
    const card = findPackageCard(root, recommendation.packageCode);
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  const note = root.createElement("span");
  note.className = "mini muted";
  note.textContent = "Recommendation only — choose the service yourself below.";
  actions.append(showButton, note);
  resultNode.append(name, reason, actions);
  resultNode.hidden = false;
}

function emitAnalytics(detail) {
  try {
    window.dispatchEvent(new CustomEvent("rd:analytics", {
      detail: { event: "service_recommendation_shown", ...detail }
    }));
  } catch {}
}

export async function wireBookingServiceRecommendation(root = document) {
  if (!isBookPage() || root.getElementById?.(PANEL_ID)) return;
  const services = root.querySelector("#services");
  const packageGrid = root.querySelector("#packageGrid");
  const vehicleSize = root.querySelector("#vehicleSize");
  const toolbar = services?.querySelector(".choice-toolbar");
  if (!services || !packageGrid || !vehicleSize || !toolbar) return;

  addStyles(root);
  const ui = buildPanel(root);
  toolbar.insertAdjacentElement("afterend", ui.panel);

  let catalogue = null;
  let currentRecommendation = null;
  let loadingPromise = null;

  const loadCatalogue = async () => {
    if (catalogue) return catalogue;
    if (!loadingPromise) {
      loadingPromise = loadPricingCatalogClient({ fallbackUrl: FALLBACK_URL, credentials: "include" })
        .then((loaded) => { catalogue = loaded; return loaded; })
        .finally(() => { loadingPromise = null; });
    }
    return loadingPromise;
  };

  const runRecommendation = async () => {
    ui.button.disabled = true;
    ui.button.textContent = "Checking best fit…";
    try {
      const loaded = await loadCatalogue();
      currentRecommendation = recommendService({
        packages: loaded?.packages,
        goal: ui.goalSelect.value,
        condition: ui.conditionSelect.value,
        vehicleSize: vehicleSize.value
      });
      renderResult(root, ui.result, currentRecommendation);
      markRecommendedCard(root, currentRecommendation);
      if (currentRecommendation) {
        emitAnalytics({
          package_code: currentRecommendation.packageCode,
          recommendation_goal: currentRecommendation.goal,
          recommendation_condition: currentRecommendation.condition,
          vehicle_size: currentRecommendation.vehicleSize || null,
          confidence: currentRecommendation.confidence
        });
      }
    } catch (error) {
      console.warn("Service recommendation unavailable; normal package selection remains usable.", error);
      currentRecommendation = null;
      clearRecommendationMarkers(root);
      ui.result.hidden = false;
      ui.result.textContent = "The recommendation helper is temporarily unavailable. All normal service cards and booking controls remain available below.";
    } finally {
      ui.button.disabled = false;
      ui.button.textContent = "Recommend a service";
    }
  };

  ui.button.addEventListener("click", runRecommendation);
  vehicleSize.addEventListener("change", () => {
    if (currentRecommendation) runRecommendation();
  });
  [ui.goalSelect, ui.conditionSelect].forEach((field) => field.addEventListener("change", () => {
    currentRecommendation = null;
    clearRecommendationMarkers(root);
    ui.result.hidden = true;
  }));

  const observer = new MutationObserver(() => {
    if (currentRecommendation) markRecommendedCard(root, currentRecommendation);
  });
  observer.observe(packageGrid, { childList: true });
}
