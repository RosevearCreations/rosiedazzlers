// Build 252 — shared approved R2 website-image discovery and filename matching.
// Uses only /api/public/website_images, which exposes public packages/, landing_pages/, and CarPhotos/ assets.

let manifestPromise = null;

function clean(value){
  return String(value || '').trim();
}

function normalize(value){
  return clean(value)
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,5}$/i,'')
    .replace(/&/g,' and ')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function tokens(value){
  return normalize(value).split(' ').filter((token) => token.length > 1);
}

const SIZE_HINTS = {
  small:['small','compact','car','sedan'],
  mid:['mid','midsize','mid size','suv','crossover'],
  oversize:['oversize','over size','large','truck','van','exotic']
};

export async function loadWebsiteImageManifest({ force=false } = {}){
  if (!force && manifestPromise) return manifestPromise;
  manifestPromise = (async () => {
    try {
      const response = await fetch('/api/public/website_images', {
        headers:{ 'Accept':'application/json' }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload || !Array.isArray(payload.images)) {
        return { ok:false, bucket_ready:false, images:[], prefixes:{ packages:[], landing_pages:[], car_photos:[] } };
      }
      return payload;
    } catch {
      return { ok:false, bucket_ready:false, images:[], prefixes:{ packages:[], landing_pages:[], car_photos:[] } };
    }
  })();
  return manifestPromise;
}

function imageText(image){
  return normalize(`${image?.key || ''} ${image?.filename || ''}`);
}

function prefixName(image){
  const raw = clean(image?.prefix || image?.key || '');
  if (/^packages\//i.test(raw)) return 'packages';
  if (/^landing_pages\//i.test(raw)) return 'landing_pages';
  if (/^CarPhotos\//i.test(raw)) return 'car_photos';
  return '';
}

function scoreImage(image, {
  phrases=[],
  hints=[],
  size='',
  preferredPrefixes=[],
  exclude=[]
} = {}){
  const hay = imageText(image);
  if (!hay) return -9999;
  const excluded = (Array.isArray(exclude) ? exclude : [exclude]).map(normalize).filter(Boolean);
  if (excluded.some((term) => hay.includes(term))) return -9999;

  let score = 0;
  const phraseList = (Array.isArray(phrases) ? phrases : [phrases]).map(normalize).filter(Boolean);
  const hintList = (Array.isArray(hints) ? hints : [hints]).map(normalize).filter(Boolean);
  const pref = prefixName(image);
  const prefixIndex = preferredPrefixes.indexOf(pref);
  if (prefixIndex >= 0) score += Math.max(4, 20 - prefixIndex * 6);

  for (const phrase of phraseList) {
    if (hay === phrase) score += 80;
    if (hay.includes(phrase)) score += 36;
    const ts = tokens(phrase);
    const hits = ts.filter((token) => hay.includes(token)).length;
    if (ts.length && hits === ts.length) score += 24;
    else score += hits * 5;
  }

  for (const hint of hintList) {
    if (hay.includes(hint)) score += 6;
  }

  if (size && SIZE_HINTS[size]) {
    const sizeHits = SIZE_HINTS[size].filter((hint) => hay.includes(normalize(hint))).length;
    if (sizeHits) score += 12 + sizeHits * 2;
  }

  if (hay.includes('placeholder') || hay.includes('generic') || hay.includes('fallback')) score -= 30;
  if (hay.includes('before') || hay.includes('after')) score += 2;
  return score;
}

export function rankedWebsiteImages(manifest, options={}, limit=8){
  const images = Array.isArray(manifest?.images) ? manifest.images : [];
  return images
    .map((image,index) => ({ image, index, score:scoreImage(image,options) }))
    .filter((row) => row.score > 0 && row.image?.url)
    .sort((a,b) => b.score - a.score || a.index - b.index)
    .slice(0,Math.max(1,limit))
    .map((row) => ({ ...row.image, match_score:row.score }));
}

export function packageImageMatches(manifest, pkg, size='', limit=8){
  const code = clean(pkg?.code).replace(/_/g,' ');
  const name = clean(pkg?.name);
  const aliases = [
    pkg?.display_alias,
    pkg?.customer_goal,
    pkg?.subtitle
  ].filter(Boolean);
  return rankedWebsiteImages(manifest,{
    phrases:[code,name,...aliases],
    hints:[code,name,...(pkg?.recommendation_tags || [])],
    size,
    preferredPrefixes:['packages','car_photos','landing_pages']
  },limit);
}

export function addonImageMatches(manifest, addon, limit=6){
  const code = clean(addon?.code).replace(/_/g,' ');
  const name = clean(addon?.name);
  return rankedWebsiteImages(manifest,{
    phrases:[code,name,addon?.category,addon?.type],
    hints:[code,name,addon?.category,addon?.type],
    preferredPrefixes:['packages','landing_pages','car_photos']
  },limit);
}

export function landingImageMatches(manifest, page, slug='', limit=10){
  const pageSlug = clean(slug || page?.slug).replace(/-/g,' ');
  const code = clean(page?.related_code).replace(/_/g,' ');
  const name = clean(page?.name || page?.hero_title);
  const locationAliases = page?.type === 'location'
    ? pageSlug.replace(/auto detailing/g,'').split(/\s+/).filter(Boolean)
    : [];
  return rankedWebsiteImages(manifest,{
    phrases:[pageSlug,code,name,page?.hero_title],
    hints:[...locationAliases, ...(page?.highlights || []).slice(0,4)],
    preferredPrefixes:['landing_pages','car_photos','packages']
  },limit);
}

export function cardImageMatches(manifest, keywords='', href='', limit=3){
  const hrefPhrase = clean(href).replace(/^\/+|\/+$/g,'').replace(/[-_/]+/g,' ');
  return rankedWebsiteImages(manifest,{
    phrases:[keywords,hrefPhrase],
    hints:[keywords,hrefPhrase],
    preferredPrefixes:['landing_pages','packages','car_photos']
  },limit);
}

export async function hydrateR2CardImages(root=document){
  const nodes = [...root.querySelectorAll('[data-r2-image-keywords]')];
  if (!nodes.length) return;
  const manifest = await loadWebsiteImageManifest();
  for (const node of nodes) {
    if (node.dataset.r2ImageHydrated === 'true') continue;
    node.dataset.r2ImageHydrated = 'true';
    const link = node.querySelector('a[href]');
    const matches = cardImageMatches(
      manifest,
      node.dataset.r2ImageKeywords || node.textContent || '',
      node.dataset.r2ImageHref || link?.getAttribute('href') || '',
      3
    );
    if (!matches.length) continue;
    let img = node.querySelector(':scope > img.r2-card-photo');
    if (!img) {
      img = document.createElement('img');
      img.className = 'r2-card-photo';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = `${clean(node.querySelector('h2,h3')?.textContent || 'Rosie Dazzlers')} detailing example`;
      node.insertBefore(img,node.firstChild);
    }
    let index = 0;
    const tryNext = () => {
      const next = matches[index++]?.url;
      if (!next) {
        img.remove();
        return;
      }
      img.src = next;
    };
    img.addEventListener('error',tryNext);
    tryNext();
  }
}
