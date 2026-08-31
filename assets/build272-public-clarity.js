// Build 272 - customer-facing package scope and mobile-service clarity.
(() => {
  const scopeByPackage = {
    premium_wash: {
      label: "Maintenance exterior refresh",
      text: "Best for a maintained vehicle needing wash, glass, wheels, wheel wells and a light dash reset. This is not the full exterior-detail/decontamination package."
    },
    basic_detail: {
      label: "Quick interior refresh",
      text: "Best for light daily-use interior dust, crumbs, glass, seats and mats when shampoo or deeper recovery is not the main goal."
    },
    interior_detail: {
      label: "Deep interior detail",
      text: "Interior-focused cleaning with vacuuming and package shampoo work. Heavy stains, pet hair, odour sources or extraction-intensive recovery can require added work or quote review."
    },
    exterior_detail: {
      label: "Full exterior detail",
      text: "Exterior-focused detailing and protection prep for paint, trim, wheels, glass, road film, surface prep and gloss. Clay, correction, coating work or unusually heavy contamination is confirmed separately from condition/photos."
    },
    complete_detail: {
      label: "Best value · Interior + exterior",
      text: "The broadest base package: an inside-and-out reset with the listed Complete services, including carpet/mat shampoo and cloth-seat shampoo where equipped. Condition-heavy recovery can still require a quote."
    }
  };

  function packageCode(card) {
    const raw = String(card?.dataset?.package || card?.dataset?.packageCode || "").trim().toLowerCase();
    if (scopeByPackage[raw]) return raw;
    const title = String(card?.querySelector("h3")?.textContent || "").toLowerCase();
    if (title.includes("complete")) return "complete_detail";
    if (title.includes("exterior detail")) return "exterior_detail";
    if (title.includes("interior detail")) return "interior_detail";
    if (title.includes("basic") || title.includes("interior refresh")) return "basic_detail";
    if (title.includes("premium wash") || title.includes("exterior wash")) return "premium_wash";
    return "";
  }

  function decoratePackageCards() {
    const mount = document.querySelector("#packageCards");
    if (!mount) return;
    mount.querySelectorAll(".package-card").forEach((card) => {
      if (card.dataset.build272Scope === "1") return;
      const code = packageCode(card);
      const copy = scopeByPackage[code];
      if (!copy) return;
      card.dataset.build272Scope = "1";

      const sub = card.querySelector(".sub");
      if (code === "complete_detail" && sub && /#1|popular|choice/i.test(sub.textContent || "")) {
        sub.textContent = "Best value";
      }

      const price = card.querySelector(".price");
      const scope = document.createElement("div");
      scope.className = "photo-estimate-guide build272-package-scope";
      scope.innerHTML = `<strong>${copy.label}</strong><p class="mini muted" style="margin:6px 0 0">${copy.text}</p><p class="mini muted" style="margin:6px 0 0"><strong>Price context:</strong> the base price shown follows the vehicle size selected in Step 1. Condition, contamination, risk or extra labour can add an approved surcharge/add-on or move the booking to quote review before the final service price is confirmed.</p>`;
      if (price) card.insertBefore(scope, price);
      else card.appendChild(scope);
    });
  }

  function fixMobileSetupControls() {
    const ack = document.querySelector("#ack_power_water");
    if (ack) {
      ack.checked = true;
      ack.disabled = true;
      const label = ack.closest("label");
      if (label && !/Rosie brings its own water and power/i.test(label.textContent || "")) {
        const strong = label.querySelector("strong");
        if (strong) strong.textContent = "Rosie brings its own water and power";
        const spans = label.querySelectorAll("span");
        const detail = spans.length > 1 ? spans[spans.length - 1] : null;
        if (detail) {
          detail.removeAttribute("data-policy-copy");
          detail.textContent = "We arrive fully mobile for standard detailing. We still need a safe driveway/work area and reasonable vehicle access.";
        }
      }
    }
    const mobile = document.querySelector("#need_mobile_water_power");
    if (mobile) {
      mobile.checked = false;
      const label = mobile.closest("label");
      if (label) label.hidden = true;
    }
  }

  function fixSummaryCopy() {
    const summary = document.querySelector("#finalSummary");
    if (!summary) return;
    const original = summary.innerHTML;
    const revised = original
      .replaceAll("Customer provides water and power", "Rosie brings its own water and power")
      .replaceAll("Quote staff-supplied water/power setup", "Rosie brings its own water and power");
    if (revised !== original) summary.innerHTML = revised;
  }

  function fixVisibleLegacyCopy() {
    document.querySelectorAll(".badge, .muted, .notice, p, li, span, strong").forEach((node) => {
      if (node.children.length) return;
      const text = String(node.textContent || "");
      const next = text
        .replaceAll("Customer provides power + water", "We bring our own water + power")
        .replaceAll("Our #1 choice", "Best value");
      if (next !== text) node.textContent = next;
    });
  }

  function boot() {
    fixVisibleLegacyCopy();
    fixMobileSetupControls();
    decoratePackageCards();
    fixSummaryCopy();

    const packages = document.querySelector("#packageCards");
    if (packages) new MutationObserver(() => decoratePackageCards()).observe(packages, { childList: true, subtree: true });
    const summary = document.querySelector("#finalSummary");
    if (summary) new MutationObserver(() => fixSummaryCopy()).observe(summary, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
