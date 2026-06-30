// Build 215 — asset-format compatibility resolver.
// Keeps public media working when Rosie-owned R2 images use JPG/JPEG/PNG/WebP
// variants of the same approved filename. The original URL is always tried first.

const ASSET_HOST_SUFFIXES = [
  'assets.rosiedazzlers.ca',
  'pub-3293bca3c49a49a7bd30ea4469874d80.r2.dev'
];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.webp', '.png', '.JPG', '.JPEG', '.WEBP', '.PNG'];

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

export function bindImageWithCandidates(img, source, {
  extra = [],
  fallback = '',
  includeFormatAlternates = true,
  onResolved = null,
  onExhausted = null
} = {}) {
  if (!img) return [];
  const candidates = assetUrlCandidates(source, { extra, includeFormatAlternates });
  if (fallback) candidates.push(fallback);
  const unique = candidates.filter((item, index, list) => item && list.indexOf(item) === index);
  let index = 0;
  let complete = false;

  const apply = (nextIndex) => {
    const next = unique[nextIndex];
    if (!next) {
      complete = true;
      img.dataset.assetResolveStatus = 'exhausted';
      if (typeof onExhausted === 'function') onExhausted(img, unique);
      else img.removeAttribute('src');
      return;
    }
    img.dataset.assetResolveStatus = nextIndex === 0 ? 'primary' : 'fallback';
    img.dataset.assetResolvedSource = next;
    img.src = next;
  };

  img.addEventListener('load', () => {
    if (complete) return;
    img.dataset.assetResolveStatus = index === 0 ? 'primary_loaded' : 'fallback_loaded';
    img.dataset.assetResolvedSource = img.currentSrc || img.src || unique[index] || '';
    if (typeof onResolved === 'function') onResolved(img, unique[index] || '');
  });

  img.addEventListener('error', () => {
    if (complete) return;
    index += 1;
    apply(index);
  });

  if (!unique.length) {
    complete = true;
    if (typeof onExhausted === 'function') onExhausted(img, unique);
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
        node.dispatchEvent(new CustomEvent('rosie:media-exhausted', { bubbles: true, detail: { source } }));
      }
    });
  });
}
