export async function renderReviewProofMounts(limit = 5) {
  const mounts = Array.from(document.querySelectorAll("[data-review-proof-mount]"));
  if (!mounts.length) return;
  const reviews = await loadReviews(limit);
  mounts.forEach((mount) => {
    mount.innerHTML = renderReviewGrid(reviews);
  });
}

async function loadReviews(limit) {
  try {
    const res = await fetch("/api/reviews_public", { credentials: "include", cache: "no-store" });
    const out = await res.json().catch(() => null);
    if (!res.ok || !out || !Array.isArray(out.items)) throw new Error(out?.error || "Review proof unavailable.");
    return out.items.slice(0, limit).map(normalizeReview).filter((item) => item.quote);
  } catch (err) {
    console.warn("Verified review source unavailable; displaying a neutral state:", err);
    return [];
  }
}

function normalizeReview(item) {
  const rating = Math.max(1, Math.min(5, Number(item.rating || 5)));
  return {
    rating,
    name: cleanText(item.name || "Local customer"),
    location: cleanText(item.location || "Oxford / Norfolk Counties"),
    service: cleanText(item.service || "Mobile auto detailing"),
    quote: cleanText(item.quote || item.text || "")
  };
}

function renderReviewGrid(items) {
  if (!items.length) return '<p class="muted">Verified customer reviews are not currently available from the connected source. Visit our gallery for recent work.</p>';
  return `<div class="sample-review-grid" aria-label="Rosie Dazzlers customer review proof">${items.map(renderReviewCard).join("")}</div>`;
}

function renderReviewCard(item) {
  const stars = "★★★★★".slice(0, Math.max(1, Math.min(5, Math.round(item.rating))));
  return `<article class="sample-review-card">
    <div class="stars">${escapeHtml(stars)}</div>
    <blockquote>“${escapeHtml(item.quote)}”</blockquote>
    <footer>— ${escapeHtml(item.name)}, ${escapeHtml(item.location)} · ${escapeHtml(item.service)}</footer>
  </article>`;
}

function cleanText(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
