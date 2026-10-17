import { buildServiceGuide571 } from "./service-guide-model-v571.js";
// Preview ONLY. Reads the existing public endpoint; no credentials or mutations.
const root = document.getElementById("service-preview-root");
if (root) {
  const status = document.getElementById("service-feed-status");
  const packageList = document.getElementById("service-package-list");
  const addonList = document.getElementById("service-addon-list");
  function node(tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function card(parent, title, overview, note) {
    const article = document.createElement("article");
    article.className = "service-preview-card";
    article.append(node("h3", title), node("p", overview), node("p", note, "service-preview-note"));
    parent.append(article);
  }
  function render(payload) {
    const model = buildServiceGuide571(payload);
    if (model.status !== "catalog_view_only") {
      status.textContent = "Catalog preview unavailable. Use the existing booking page for currently offered services.";
      return;
    }
    status.textContent = model.catalog_origin === "bundled_fallback"
      ? "Preview uses bundled fallback catalog information. Verify current details directly before booking."
      : "Preview uses the public catalog feed, which may contain database or fallback information. Details are not a confirmed quote.";
    model.package_cards.forEach(item => card(packageList, item.title, item.overview, item.status));
    model.addon_cards.forEach(item => card(addonList, item.title, item.guidance, "No fixed amount or booking has been offered."));
    if (!model.addon_cards.length) addonList.append(node("p", "Add-on guidance is currently unavailable."));
  }
  fetch("/api/pricing_catalog_public", {method:"GET", cache:"no-store", credentials:"omit"})
    .then(response => { if (!response.ok) throw new Error("catalog unavailable"); return response.json(); })
    .then(render)
    .catch(() => render(null));
}
