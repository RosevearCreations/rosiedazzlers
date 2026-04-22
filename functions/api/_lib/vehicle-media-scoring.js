export function scoreVehicleMedia({
  mediaUrl,
  mediaKind = "photo",
  altText = "",
  imageTitle = "",
  caption = "",
  widthPx = null,
  heightPx = null,
  orientation = null,
  cropHistory = null,
  isFirstImage = false
}) {
  const kind = String(mediaKind || "photo").trim().toLowerCase();
  if (!mediaUrl) {
    return { score: null, label: null, status: "missing_media_url", reject_save: true, failures: ["Image URL is required."] };
  }

  if (kind === "video") {
    return {
      score: null,
      label: "Video uploaded",
      status: "video_manual_review",
      reject_save: false,
      failures: [],
      checks: { kind: "video" }
    };
  }

  const width = toPositiveInt(widthPx);
  const height = toPositiveInt(heightPx);
  const normalizedOrientation = normalizeOrientation(orientation, width, height);
  const alt = String(altText || "").trim();
  const title = String(imageTitle || "").trim();
  const note = String(caption || "").trim();
  const hasCropHistory = hasNonEmptyCropHistory(cropHistory);

  let score = 0;
  if (mediaUrl) score += 20;
  if (alt.length >= 5) score += 15;
  if (width >= 1200 && height >= 1200) score += 20;
  else if (width >= 800 && height >= 800) score += 12;
  if (isFirstImage) {
    if (normalizedOrientation === "square" || normalizedOrientation === "landscape") score += 20;
  } else if (normalizedOrientation) {
    score += 10;
  }
  if (hasCropHistory) score += 15;
  if (note) score += 5;
  if (title) score += 5;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const failures = [];
  if (width == null || height == null) failures.push("Image dimensions are required before save.");
  if (width != null && width < 800) failures.push("Images must be at least 800 pixels wide.");
  if (height != null && height < 800) failures.push("Images must be at least 800 pixels tall.");
  if (!["square", "landscape"].includes(normalizedOrientation || "")) failures.push("Images must be square or landscape.");

  if (isFirstImage) {
    if (width != null && width < 1200) failures.push("The first image must be at least 1200 pixels wide.");
    if (height != null && height < 1200) failures.push("The first image must be at least 1200 pixels tall.");
    if (alt.length < 12) failures.push("The first image needs alt text of at least 12 characters.");
    if (score < 70) failures.push("The first image score must be at least 70 before save.");
  }

  let label = "Needs work";
  if (score >= 85) label = "Strong merchandising";
  else if (score >= 70) label = "Ready";
  else if (score >= 50) label = "Usable with improvements";

  return {
    score,
    label,
    status: failures.length ? (isFirstImage ? "rejected_first_image_validation" : "rejected_image_validation") : "scored",
    reject_save: failures.length > 0,
    failures,
    checks: {
      width_px: width,
      height_px: height,
      orientation: normalizedOrientation,
      is_first_image: isFirstImage,
      alt_text_length: alt.length,
      has_crop_history: hasCropHistory,
      has_caption: Boolean(note),
      has_image_title: Boolean(title)
    }
  };
}

export function normalizeOrientation(orientation, widthPx = null, heightPx = null) {
  const raw = String(orientation || "").trim().toLowerCase();
  if (["square", "landscape", "portrait"].includes(raw)) return raw;
  const width = toPositiveInt(widthPx);
  const height = toPositiveInt(heightPx);
  if (width == null || height == null) return null;
  const ratio = width / height;
  if (ratio >= 0.95 && ratio <= 1.05) return "square";
  return ratio > 1.05 ? "landscape" : "portrait";
}

function hasNonEmptyCropHistory(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return false;
}

function toPositiveInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}
