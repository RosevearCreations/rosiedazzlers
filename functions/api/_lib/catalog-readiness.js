export function normalizeGalleryImages(value) {
  let list = [];
  if (Array.isArray(value)) list = value;
  else if (typeof value === "string" && value.trim()) {
    try { const parsed = JSON.parse(value); list = Array.isArray(parsed) ? parsed : value.split(/[\n,]/); }
    catch { list = value.split(/[\n,]/); }
  }
  const seen = new Set();
  return list.map((v) => String(v || "").trim()).filter((v) => {
    const key = v.toLowerCase();
    if (!v || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 7);
}

export function isSuspiciousCatalogName(value) {
  const name = String(value || "").trim();
  if (!name) return true;
  if (/^(unknown product|untitled|item\s*\d*|product\s*\d*|amazon item)$/i.test(name)) return true;
  if (/^(?:B0[A-Z0-9]{8}|[A-Z0-9_-]{8,})$/i.test(name) && !/[aeiou]{2}/i.test(name)) return true;
  return false;
}

export function evaluateCatalogReadiness(item = {}) {
  const blockers = [];
  const warnings = [];
  const name = String(item.name || "").trim();
  const type = String(item.item_type || "").trim().toLowerCase();
  const image = String(item.image_url || "").trim();
  const gallery = normalizeGalleryImages(item.gallery_image_urls || item.gallery_images);
  const qty = Number(item.qty_on_hand || 0);
  const cost = Number(item.cost_cents || 0);

  if (!String(item.item_key || "").trim()) blockers.push("Item key is missing.");
  if (!name) blockers.push("Name is missing.");
  else if (isSuspiciousCatalogName(name)) blockers.push("Name looks like an identifier or placeholder and needs review.");
  if (!['tool','consumable'].includes(type)) blockers.push("Item type must be tool or consumable.");
  if (!String(item.category || "").trim()) blockers.push("Category is missing.");
  if (!String(item.unit_label || "").trim()) blockers.push("Unit label is missing.");
  if (!image) blockers.push("Featured image is missing.");
  else if (/\.svg(?:[?#]|$)/i.test(image)) blockers.push("Featured image is still an SVG placeholder.");
  if (item.is_active === false) blockers.push("Item is inactive.");
  if (type === 'consumable' && !(qty > 0)) blockers.push("Consumable stock must be above zero before public publishing.");

  if (!(cost > 0)) warnings.push("Unit cost is missing or zero.");
  if (!String(item.description || "").trim()) warnings.push("Description is missing.");
  if (!String(item.preferred_vendor || "").trim()) warnings.push("Preferred vendor is missing.");
  if (!gallery.length) warnings.push("Gallery has no additional images.");
  if (!String(item.subcategory || "").trim()) warnings.push("Subcategory is missing.");
  if (!Array.isArray(item.service_tags) || !item.service_tags.length) warnings.push("Service tags are missing.");

  const score = Math.max(0, Math.min(100, 100 - blockers.length * 20 - warnings.length * 6));
  return { ready: blockers.length === 0, score, blockers, warnings, gallery_count: gallery.length };
}

export function attachCatalogReadiness(items) {
  const rows = Array.isArray(items) ? items : [];
  return rows.map((item) => ({ ...item, publish_readiness: evaluateCatalogReadiness(item) }));
}
