// Build 389 — local/service landing convergence.
// The retained Build 388 renderer remains authoritative for page content/pricing.
// This layer removes stale redirect paths and replaces fallback/sample proof with
// the fail-closed public proof feed.

const STYLE_ID = "build389-local-seo-proof-style";
const PROOF_SECTION_ID = "build389-approved-local-proof";
const OBSERVER_KEY = "build389ProofObserverBound";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clean(value) { return String(value ?? "").trim(); }
function slugFromPage() {
  const explicit = clean(document.body?.dataset?.landingSlug);
  if (explicit) return explicit;
  return location.pathname.split("/").filter(Boolean).pop() || "";
}

function installFailClosedStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [data-photo-managed-before-after="true"],
    [data-visual-placeholder-section="true"],
    section:has([data-recent-work-mount]) { display:none !important; }
    #${PROOF_SECTION_ID} { display:block !important; }
    #${PROOF_SECTION_ID} .build389-proof-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:14px; }
    #${PROOF_SECTION_ID} .build389-proof-pair { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px; }
    #${PROOF_SECTION_ID} figure { margin:0; }
    #${PROOF_SECTION_ID} img { width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:14px; }
    #${PROOF_SECTION_ID} figcaption { margin-top:5px;font-size:.82rem;opacity:.72; }
    @media(max-width:760px){#${PROOF_SECTION_ID} .build389-proof-grid,#${PROOF_SECTION_ID} .build389-proof-pair{grid-template-columns:1fr;}}
  `;
  document.head.appendChild(style);
}

function rewriteRetiredLinks(root = document) {
  root.querySelectorAll?.("a[href]").forEach((anchor) => {
    const raw = clean(anchor.getAttribute("href"));
    if (raw === "/pricing#booking-planner" || raw === "/pricing" || raw.startsWith("/pricing#")) {
      anchor.setAttribute("href", "/book#booking");
    } else if (raw === "/services" || raw.startsWith("/services#")) {
      anchor.setAttribute("href", "/book#services");
    }
  });
}

function removeLegacyLandingProof(root = document) {
  root.querySelectorAll?.('[data-photo-managed-before-after="true"],[data-visual-placeholder-section="true"]').forEach((node) => node.remove());
  root.querySelectorAll?.("section").forEach((section) => {
    if (section.querySelector?.("[data-recent-work-mount]")) section.remove();
  });
  root.querySelectorAll?.('img[data-media-source="/assets/brand/rosie-reviews-fallback.png"]').forEach((img) => img.closest(".proof-card")?.remove());
}

function mediaMarkup(kind, url, alt) {
  const safeUrl = esc(url);
  if (String(kind || "").toLowerCase() === "video") {
    return `<video class="proof-media" src="${safeUrl}" muted playsinline controls preload="metadata" aria-label="${esc(alt)}"></video>`;
  }
  return `<img class="proof-media" src="${safeUrl}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
}

function proofCard(item) {
  const context = [item.vehicle_label, item.condition_summary].filter(Boolean).join(" · ");
  const label = [item.service, item.town].filter(Boolean).join(" — ");
  return `<article class="proof-card build389-proof-card">
    <h3>${esc(item.title || "Verified detailing result")}</h3>
    ${label ? `<p class="section-kicker">${esc(label)}</p>` : ""}
    <div class="build389-proof-pair">
      <figure>${mediaMarkup(item.before_kind, item.before_url, `${item.vehicle_label || item.service || "Vehicle"} before detailing`)}<figcaption>Before</figcaption></figure>
      <figure>${mediaMarkup(item.after_kind, item.after_url, `${item.vehicle_label || item.service || "Vehicle"} after detailing`)}<figcaption>After</figcaption></figure>
    </div>
    ${context ? `<p class="muted">${esc(context)}</p>` : ""}
    <p class="muted"><strong>Problem:</strong> ${esc(item.problem)}</p>
    <p class="muted"><strong>Process:</strong> ${esc(item.process)}</p>
    <p class="muted"><strong>Result:</strong> ${esc(item.result)}</p>
  </article>`;
}

async function loadApprovedProof(slug) {
  const response = await fetch(`/api/local_proof_public?slug=${encodeURIComponent(slug)}`, { cache: "no-store", headers: { Accept: "application/json" } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok !== true || !Array.isArray(payload?.items)) return [];
  return payload.items;
}

function insertApprovedProof(root, items) {
  document.getElementById(PROOF_SECTION_ID)?.remove();
  if (!Array.isArray(items) || !items.length) return;
  const section = document.createElement("section");
  section.id = PROOF_SECTION_ID;
  section.className = "section panel build389-approved-proof";
  section.dataset.build389Proof = "approved";
  section.innerHTML = `<p class="eyebrow">Verified local proof</p>
    <h2 style="margin-top:0">Published Rosie Dazzlers results</h2>
    <p class="muted">Only customer/public-use approved, privacy-reviewed, non-sample before/after work is shown here.</p>
    <div class="build389-proof-grid">${items.slice(0, 4).map(proofCard).join("")}</div>`;

  const related = [...(root.querySelectorAll?.("section") || [])].find((node) => /related pages/i.test(node.querySelector("h2")?.textContent || ""));
  if (related) root.insertBefore(section, related);
  else root.appendChild(section);
}

function convergeStaticAndRenderedContent(root = document) {
  rewriteRetiredLinks(root);
  removeLegacyLandingProof(root);
}

export function startBuild389LandingConvergence() {
  installFailClosedStyle();
  document.documentElement.dataset.build389LocalSeo = "true";
  const mount = document.getElementById("landingMount");
  if (!mount) return;

  convergeStaticAndRenderedContent(document);
  if (mount.dataset[OBSERVER_KEY] !== "true") {
    mount.dataset[OBSERVER_KEY] = "true";
    const observer = new MutationObserver(() => convergeStaticAndRenderedContent(mount));
    observer.observe(mount, { childList: true, subtree: true });
  }

  const slug = slugFromPage();
  if (!slug) return;
  loadApprovedProof(slug)
    .then((items) => {
      convergeStaticAndRenderedContent(mount);
      insertApprovedProof(mount, items);
      rewriteRetiredLinks(mount);
    })
    .catch(() => {
      // Fail closed: no proof section is better than sample, private, stale, or fallback evidence.
      document.getElementById(PROOF_SECTION_ID)?.remove();
    });
}
