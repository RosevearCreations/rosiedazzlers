// Build 216 — public asset-format compatibility resolver with bounded candidate retries.
// Keeps public media working when Rosie-owned R2 images use JPG/JPEG/PNG/WebP variants
// of the same approved filename. The original URL is always tried first.

const ASSET_HOST_SUFFIXES = [
  'assets.rosiedazzlers.ca',
  'pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev'
];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.webp', '.png', '.JPG', '.JPEG', '.WEBP', '.PNG'];
const DEFAULT_CANDIDATE_TIMEOUT_MS = 12_000;

function clean(value) {
  return String(value || '').trim();
}

function isKnownAssetUrl(value) {
  try {
    const url = new URL(value, window.location.origin);
    return ASSET_HOST_SUFFIXES.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`)) || url.pathname.startsWith('/assets/');
  } catch {
    return false;
  }
}

function replaceExtension(value, extension) {
  try {
    const url = new URL(value, window.location.origin);
    if (!/\.(?:jpg|jpeg|png|webp)$/i.test(url.pathname)) return '';
    url.pathname = url.pathname.replace(/\.(?:jpg|jpeg|png|webp)$/i, extension);
    return url.href;
  } catch {
    return '';
  }
}

export function assetUrlCandidates(value, { extra = [], includeFormatAlternates = true } = {}) {
  const source = clean(value);
  const out = [];
  const add = (item) => {
    const candidate = clean(item);
    if (candidate && !out.includes(candidate)) out.push(candidate);
  };

  add(source);
  if (includeFormatAlternates && source && isKnownAssetUrl(source)) {
    IMAGE_EXTENSIONS.forEach((extension) => add(replaceExtension(source, extension)));
  }
  (Array.isArray(extra) ? extra : [extra]).forEach(add);
  return out;
}

function dispatch(node, name, detail) {
  try {
    node.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
  } catch {
    // Older browser failure here must never block the image fallback chain.
  }
}

export function bindImageWithCandidates(img, source, {
  extra = [],
  fallback = '',
  includeFormatAlternates = true,
  candidateTimeoutMs = DEFAULT_CANDIDATE_TIMEOUT_MS,
  onResolved = null,
  onExhausted = null
} = {}) {
  if (!img) return [];
  const candidates = assetUrlCandidates(source, { extra, includeFormatAlternates });
  if (fallback) candidates.push(fallback);
  const unique = candidates.filter((item, index, list) => item && list.indexOf(item) === index);
  let index = 0;
  let complete = false;
  let timer = null;
  let lastReason = '';

  const clearCandidateTimer = () => {
    if (timer) window.clearTimeout(timer);
    timer = null;
  };

  const exhaust = () => {
    clearCandidateTimer();
    complete = true;
    img.dataset.assetResolveStatus = 'exhausted';
    img.dataset.mediaResolverFailed = 'true';
    const detail = {
      source: clean(source),
      candidates: unique,
      last_tried_source: unique[Math.max(0, index - 1)] || '',
      reason: lastReason || 'all_candidates_failed'
    };
    dispatch(img, 'rosie:media-exhausted', detail);
    if (typeof onExhausted === 'function') onExhausted(img, unique, detail);
    else img.removeAttribute('src');
  };

  const apply = (nextIndex) => {
    clearCandidateTimer();
    const next = unique[nextIndex];
    if (!next) {
      exhaust();
      return;
    }
    img.dataset.assetResolveStatus = nextIndex === 0 ? 'primary' : 'fallback';
    img.dataset.assetResolveAttempt = String(nextIndex + 1);
    img.dataset.assetResolvedSource = next;
    img.removeAttribute('data-media-resolver-failed');
    img.src = next;
    const timeout = Math.max(2_000, Math.min(30_000, Number(candidateTimeoutMs) || DEFAULT_CANDIDATE_TIMEOUT_MS));
    timer = window.setTimeout(() => {
      if (complete || index !== nextIndex) return;
      lastReason = 'candidate_timeout';
      index += 1;
      apply(index);
    }, timeout);
  };

  img.addEventListener('load', () => {
    if (complete) return;
    clearCandidateTimer();
    complete = true;
    img.dataset.assetResolveStatus = index === 0 ? 'primary_loaded' : 'fallback_loaded';
    img.dataset.assetResolvedSource = img.currentSrc || img.src || unique[index] || '';
    const detail = {
      source: clean(source),
      resolved_source: img.dataset.assetResolvedSource,
      candidates: unique,
      used_format_fallback: index > 0 && index < unique.length - (fallback ? 1 : 0),
      attempt: index + 1
    };
    dispatch(img, 'rosie:media-resolved', detail);
    if (typeof onResolved === 'function') onResolved(img, unique[index] || '', detail);
  });

  img.addEventListener('error', () => {
    if (complete) return;
    lastReason = 'candidate_error';
    index += 1;
    apply(index);
  });

  if (!unique.length) {
    lastReason = 'no_candidate_url';
    exhaust();
    return unique;
  }

  // Set after listeners exist so a fast 404 still advances through jpg/jpeg/webp/png.
  apply(0);
  return unique;
}

export function bindMarkedMedia(root = document) {
  root.querySelectorAll('img[data-media-source]').forEach((img) => {
    if (img.dataset.mediaResolverBound === 'true') return;
    img.dataset.mediaResolverBound = 'true';
    const source = img.dataset.mediaSource || '';
    const fallback = img.dataset.mediaFallback || '';
    bindImageWithCandidates(img, source, {
      fallback,
      onExhausted: (node) => {
        node.dataset.mediaResolverFailed = 'true';
      }
    });
  });
}
