/**
 * Rosie Dazzlers Standard — opt-in, read-only browser-rendered visual audit.
 * It NEVER sends a request, changes a media assignment, or exports private URLs.
 * The operator must click to collect/download the report on the currently loaded page.
 */
const MAX_ELEMENTS = 3000;
const MAX_VISUALS = 850;
const SAFE_STATIC = /^\/assets\/(?!.*(?:private|customer|invoice|payment|token|secret))[\w./%-]+\.(?:png|jpe?g|svg|webp|avif|gif|ico)$/i;
const SAFE_THEME = /^process-[a-z0-9-]+\.webp$/;
const hiddenValue = "[managed-or-external-media: redacted]";
const isPlaceholder = value => /\/(?:placeholders\/|brand\/rosie-reviews-fallback)|visual-placeholder/i.test(String(value || ""));
function safeSource(raw, base) {
  if (!raw) return { kind: "empty", value: "" };
  try {
    const url = new URL(String(raw), base);
    if (!["https:", "http:"].includes(url.protocol)) return { kind: "inline-or-opaque", value: "[redacted]" };
    if (url.origin === new URL(base).origin && SAFE_STATIC.test(url.pathname)) return { kind: "public-static", value: url.pathname };
    return { kind: url.origin === new URL(base).origin ? "dynamic-or-protected" : "external-or-r2", value: hiddenValue };
  } catch {
    return { kind: "dynamic-or-invalid", value: "[redacted]" };
  }
}
function selectorHint(el) {
  const names = [];
  let node = el;
  for (let depth = 0; node && depth < 3 && node.nodeType === 1; depth++, node = node.parentElement) {
    const tag = node.tagName?.toLowerCase() || "unknown";
    const parent = node.parentElement;
    const sameTag = parent ? [...parent.children].filter(x => x.tagName === node.tagName) : [];
    const pos = sameTag.length > 1 ? ":nth-of-type(" + (sameTag.indexOf(node) + 1) + ")" : "";
    names.unshift(tag + pos);
  }
  return names.join(" > ");
}
function geometry(el) {
  const r = el.getBoundingClientRect();
  return { renderedWidth: Math.round(r.width), renderedHeight: Math.round(r.height),
    visible: r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden" };
}
function issueStatus(img) {
  if (!img.getAttribute("src") && !img.currentSrc) return "no-source";
  if (!img.complete) return "pending-or-lazy";
  return img.naturalWidth > 0 ? "loaded" : "broken";
}
export function inspectRenderedVisuals(doc = document, options = {}) {
  const base = doc.location?.origin || location.origin;
  const pathname = doc.location?.pathname || "/";
  const images = [...doc.images].slice(0, MAX_VISUALS).map(img => {
    const source = safeSource(img.currentSrc || img.getAttribute("src"), base);
    const alt = img.getAttribute("alt");
    const filename = img.dataset.standardFilename || "";
    return { kind: "image", locator: selectorHint(img), source, status: issueStatus(img),
      ...geometry(img), naturalWidth: img.naturalWidth || 0, naturalHeight: img.naturalHeight || 0,
      hasAlt: alt !== null, decorativeAlt: alt === "", hasSrcset: !!img.getAttribute("srcset"),
      managedTarget: /^[a-z0-9:_.\/-]{1,180}$/i.test(img.dataset.photoImageTarget || "") ? img.dataset.photoImageTarget : null,
      standardFilename: SAFE_THEME.test(filename) ? filename : null,
      placeholder: isPlaceholder(img.getAttribute("src")) };
  });
  const svgs = [...doc.querySelectorAll("svg")].slice(0, MAX_VISUALS).map(svg => ({
    kind: "inline-svg", locator: selectorHint(svg), ...geometry(svg),
    viewBox: svg.getAttribute("viewBox") || null,
    intrinsicWidth: svg.getAttribute("width") || null,
    intrinsicHeight: svg.getAttribute("height") || null,
    accessibleNameProvided: !!(svg.getAttribute("aria-label") || svg.querySelector("title") || svg.getAttribute("aria-labelledby")),
    decorative: svg.getAttribute("aria-hidden") === "true" }));
  const posters = [...doc.querySelectorAll("video[poster]")].slice(0, MAX_VISUALS).map(video => ({
    kind: "video-poster", locator: selectorHint(video), ...geometry(video),
    source: safeSource(video.getAttribute("poster"), base) }));
  const backgrounds = [];
  const elements = [...doc.querySelectorAll("*")].slice(0, MAX_ELEMENTS);
  for (const el of elements) {
    if (backgrounds.length >= MAX_VISUALS) break;
    const css = getComputedStyle(el).backgroundImage;
    if (!css || css === "none" || !css.includes("url(")) continue;
    const captures = [...css.matchAll(/url\(\s*["']?([^)"']+)["']?\s*\)/gi)].slice(0, 4);
    for (const match of captures) backgrounds.push({
      kind: "css-background", locator: selectorHint(el), ...geometry(el),
      source: safeSource(match[1], base), placeholder: isPlaceholder(match[1]) });
  }
  const visuals = [...images, ...svgs, ...posters, ...backgrounds];
  const flags = {
    brokenImages: images.filter(x => x.status === "broken").length,
    pendingImages: images.filter(x => x.status === "pending-or-lazy").length,
    placeholders: visuals.filter(x => x.placeholder).length,
    imagesWithoutAlt: images.filter(x => !x.hasAlt).length,
    labelledSvgNeeded: svgs.filter(x => !x.decorative && !x.accessibleNameProvided).length
  };
  return { schema: "rosie.rendered-visual-audit.v1", generatedAt: new Date().toISOString(),
    page: pathname, theme: doc.documentElement?.dataset.rosieTheme || "unknown",
    access: pathname.startsWith("/admin") ? "protected-admin-screen" : "public-or-other",
    browserViewport: { width: innerWidth, height: innerHeight, devicePixelRatio: devicePixelRatio || 1 },
    scannedElementCount: elements.length, truncated: elements.length === MAX_ELEMENTS ||
      images.length === MAX_VISUALS || backgrounds.length >= MAX_VISUALS,
    counts: { images: images.length, inlineSvg: svgs.length, videoPosters: posters.length,
      cssBackgrounds: backgrounds.length }, flags, visuals,
    warnings: ["No network/media library checks were performed.",
      "External and managed media URLs are deliberately redacted; protected access remains protected.",
      "A pending lazy image is not proof of a broken image.",
      "Natural dimensions reflect downloaded content, not the required authored asset specification.",
      "This report contains no image pixels, customer names, alt-text contents, cookies or authentication tokens."] };
}
export function downloadVisualAudit(doc = document) {
  const report = inspectRenderedVisuals(doc);
  const file = new Blob([JSON.stringify(report, null, 2) + "\n"], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const a = doc.createElement("a");
  a.href = url;
  a.download = "rosie-visual-" + report.page.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60) + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return report;
}
export function installOptInVisualAudit(doc = document) {
  if (doc.getElementById("rosie-visual-audit-action")) return;
  const button = doc.createElement("button");
  button.id = "rosie-visual-audit-action";
  button.type = "button";
  button.textContent = "Download this page’s visual audit";
  button.setAttribute("aria-label", "Download local visual audit with URLs redacted");
  button.style.cssText = "position:fixed;bottom:12px;right:12px;z-index:99999;background:#14223a;color:#fff;padding:12px 16px;border:2px solid #8eb5ff;border-radius:12px;max-width:min(85vw,340px);cursor:pointer;font:600 14px system-ui;";
  button.addEventListener("click", () => downloadVisualAudit(doc));
  doc.body?.append(button);
}
