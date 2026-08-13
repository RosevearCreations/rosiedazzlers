// Build 252 — shared approved R2 website-image discovery and filename matching.
// Canonical route: /api/public_website_images. The nested Build 252 route remains a compatibility fallback.
// Build 253 adds explicit DB-backed card/page assignments. Build 254 protects established images: consumers may use explicit assignments as overrides, while automatic filename matches are fallback-only when an established image exists.
// Build 256 adds explicit paired Before & After landing-page slots. A pair is public only when both sides are assigned.
// Build 258 wires explicit assignments into aggregate cards, proof slots, FAQ/gift visuals, and the mixed public Gallery while preserving authored-image precedence.

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
      const endpoints=['/api/public_website_images','/api/public/website_images'];
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { headers:{ 'Accept':'application/json' }, cache:'no-store' });
          const contentType=String(response.headers.get('content-type')||'');
          if (!response.ok || !contentType.includes('application/json')) continue;
          const payload = await response.json().catch(() => ({}));
          if (payload && Array.isArray(payload.images)) return payload;
        } catch {}
      }
      return { ok:false, bucket_ready:false, images:[], assignments:[], prefixes:{ packages:[], landing_pages:[], car_photos:[] } };
    } catch {
      return { ok:false, bucket_ready:false, images:[], prefixes:{ packages:[], landing_pages:[], car_photos:[] } };
    }
  })();
  return manifestPromise;
}


function assignedImages(manifest, targetKeys=[]){
  const keys=(Array.isArray(targetKeys)?targetKeys:[targetKeys]).map(clean).filter(Boolean);
  if(!keys.length) return [];
  const assignments=Array.isArray(manifest?.assignments)?manifest.assignments:[];
  const rank=new Map(keys.map((key,index)=>[key,index]));
  return assignments
    .filter((row)=>rank.has(clean(row?.target_key)) && row?.url)
    .sort((a,b)=>rank.get(clean(a.target_key))-rank.get(clean(b.target_key)))
    .map((row)=>({
      key:row.r2_key||row.filename||row.url, r2_key:row.r2_key||'', filename:row.filename||'',
      prefix:prefixName(row), url:row.url, alt_text:row.alt_text||'', title:row.title||'', caption:row.caption||'',
      focal_point:row.focal_point||'center', explicit_assignment:true, target_key:row.target_key, match_score:10000
    }));
}

export function explicitImageForTarget(manifest, targetKey=''){
  return assignedImages(manifest,targetKey)[0] || null;
}

export function assignmentsForTargetPrefix(manifest, prefix=''){
  const wanted=clean(prefix);
  if(!wanted) return [];
  return (Array.isArray(manifest?.assignments)?manifest.assignments:[])
    .filter((row)=>row?.url && clean(row.target_key).startsWith(wanted));
}

function dedupeImages(rows=[]){
  const seen=new Set();
  return rows.filter((row)=>{const key=clean(row?.r2_key||row?.key||row?.url);if(!key||seen.has(key))return false;seen.add(key);return true;});
}

function imageText(image){
  return normalize(`${image?.key || ''} ${image?.filename || ''}`);
}

function prefixName(image){
  const raw = clean(image?.prefix || image?.key || '');
  if (/^packages\//i.test(raw)) return 'packages';
  if (/^(landing_pages|landing-pages)\//i.test(raw)) return 'landing_pages';
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
  const rawCode=clean(pkg?.code);
  const code = rawCode.replace(/_/g,' ');
  const name = clean(pkg?.name);
  const aliases = [pkg?.display_alias,pkg?.customer_goal,pkg?.subtitle].filter(Boolean);
  const explicit=assignedImages(manifest,[size?`package:${rawCode}:${size}`:'',`package:${rawCode}:default`]);
  const automatic=rankedWebsiteImages(manifest,{phrases:[code,name,...aliases],hints:[code,name,...(pkg?.recommendation_tags || [])],size,preferredPrefixes:['packages','car_photos','landing_pages']},limit);
  return dedupeImages([...explicit,...automatic]).slice(0,limit);
}

export function addonImageMatches(manifest, addon, limit=6){
  const rawCode=clean(addon?.code);
  const code = rawCode.replace(/_/g,' ');
  const name = clean(addon?.name);
  const explicit=assignedImages(manifest,`addon:${rawCode}`);
  const automatic=rankedWebsiteImages(manifest,{phrases:[code,name,addon?.category,addon?.type],hints:[code,name,addon?.category,addon?.type],preferredPrefixes:['packages','landing_pages','car_photos']},limit);
  return dedupeImages([...explicit,...automatic]).slice(0,limit);
}

export function landingImageMatches(manifest, page, slug='', limit=10){
  const rawSlug=clean(slug || page?.slug);
  const pageSlug = rawSlug.replace(/-/g,' ');
  const code = clean(page?.related_code).replace(/_/g,' ');
  const name = clean(page?.name || page?.hero_title);
  const locationAliases = page?.type === 'location' ? pageSlug.replace(/auto detailing/g,'').split(/\s+/).filter(Boolean) : [];
  const hero=assignedImages(manifest,`landing:${rawSlug}:hero`);
  const galleries=assignedImages(manifest,[`landing:${rawSlug}:gallery:1`,`landing:${rawSlug}:gallery:2`,`landing:${rawSlug}:gallery:3`]);
  const automatic=rankedWebsiteImages(manifest,{phrases:[pageSlug,code,name,page?.hero_title],hints:[...locationAliases, ...(page?.highlights || []).slice(0,4)],preferredPrefixes:['landing_pages','car_photos','packages']},limit);
  return dedupeImages([...hero,...galleries,...automatic]).slice(0,limit);
}


export function landingBeforeAfterPairs(manifest, slug='', maxSets=3){
  const rawSlug=clean(slug).replace(/^\/+|\/+$/g,'');
  if(!rawSlug) return [];
  const assignments=Array.isArray(manifest?.assignments)?manifest.assignments:[];
  const byKey=new Map(assignments.filter((row)=>row?.url).map((row)=>[clean(row.target_key),row]));
  const pairs=[];
  for(let setNo=1;setNo<=Math.max(1,Number(maxSets)||3);setNo+=1){
    const beforeKey=`landing:${rawSlug}:before-after:${setNo}:before`;
    const afterKey=`landing:${rawSlug}:before-after:${setNo}:after`;
    const before=byKey.get(beforeKey);
    const after=byKey.get(afterKey);
    if(!before?.url || !after?.url) continue;
    pairs.push({set:setNo,before,after});
  }
  return pairs;
}

function beforeAfterSectionMarkup(pairs=[]){
  if(!pairs.length) return '';
  return `<section class="section panel managed-before-after" data-photo-managed-before-after="true"><p class="eyebrow">Real detailing results</p><h2 style="margin-top:0">Before &amp; after</h2><p class="muted">Paired photos selected in Rosie Dazzlers Photo Management Studio.</p><div class="before-after-pairs">${pairs.map((pair)=>`<article class="before-after-pair"><div class="before-after-side"><span class="before-after-label">Before</span><img src="${clean(pair.before.url).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" alt="${clean(pair.before.alt_text||'Vehicle before detailing').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" loading="lazy" decoding="async" style="object-position:${clean(pair.before.focal_point||'center')}"></div><div class="before-after-side"><span class="before-after-label">After</span><img src="${clean(pair.after.url).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" alt="${clean(pair.after.alt_text||'Vehicle after detailing').replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" loading="lazy" decoding="async" style="object-position:${clean(pair.after.focal_point||'center')}"></div><p class="before-after-set-label">Set ${pair.set}</p></article>`).join('')}</div></section>`;
}

export async function hydrateBeforeAfterSets(root=document, manifest=null){
  if(root.querySelector?.('[data-photo-managed-before-after="true"]')) return;
  const slug=clean(location.pathname).replace(/^\/+|\/+$/g,'').split('/').filter(Boolean).pop()||'';
  if(!slug || slug==='gallery') return;
  const data=manifest || await loadWebsiteImageManifest();
  const pairs=landingBeforeAfterPairs(data,slug,3);
  if(!pairs.length) return;
  const main=root.querySelector?.('main.container') || (root.matches?.('main.container')?root:null) || document.querySelector('main.container');
  if(!main) return;
  const holder=document.createElement('div');
  holder.innerHTML=beforeAfterSectionMarkup(pairs);
  const section=holder.firstElementChild;
  if(!section) return;
  const related=[...main.querySelectorAll(':scope > section.section.panel')].find((node)=>/related/i.test(node.querySelector('h2')?.textContent||''));
  if(related) main.insertBefore(section,related); else main.appendChild(section);
}

export function cardImageMatches(manifest, keywords='', href='', limit=3, targetKey=''){
  const hrefPhrase = clean(href).replace(/^\/+|\/+$/g,'').replace(/[-_/]+/g,' ');
  const explicit=assignedImages(manifest,targetKey);
  const automatic=rankedWebsiteImages(manifest,{phrases:[keywords,hrefPhrase],hints:[keywords,hrefPhrase],preferredPrefixes:['landing_pages','packages','car_photos']},limit);
  return dedupeImages([...explicit,...automatic]).slice(0,limit);
}

export async function hydrateManagedImageSlots(root=document, manifest=null){
  const nodes=[...root.querySelectorAll('[data-photo-image-target]')];
  if(!nodes.length) return;
  const data=manifest || await loadWebsiteImageManifest();
  for(const node of nodes){
    const target=clean(node.dataset.photoImageTarget);
    if(!target) continue;
    const picked=explicitImageForTarget(data,target);
    if(!picked?.url) continue;
    let img=node.tagName?.toLowerCase()==='img' ? node : node.querySelector(':scope > img.managed-slot-photo');
    if(!img){
      img=document.createElement('img');
      img.className='managed-slot-photo proof-media';
      img.loading='lazy';img.decoding='async';
      node.insertBefore(img,node.firstChild);
    }
    img.src=picked.url;
    img.alt=picked.alt_text || node.dataset.photoImageAlt || clean(node.querySelector('h2,h3,strong')?.textContent) || 'Rosie Dazzlers detailing photo';
    if(picked.title) img.title=picked.title;
    img.style.objectPosition=picked.focal_point || 'center';
    img.dataset.photoAssignmentTarget=target;
    node.querySelectorAll('.visual-placeholder-card').forEach((placeholder)=>placeholder.remove());
  }
}

function managedBeforeAfterPairRows(manifest){
  const assignments=Array.isArray(manifest?.assignments)?manifest.assignments:[];
  const sets=new Map();
  for(const row of assignments){
    const key=clean(row?.target_key);
    let match=key.match(/^landing:([^:]+):before-after:(\d+):(before|after)$/);
    let scope='landing';
    let slug='';
    let setNo='';
    let side='';
    if(match){[,slug,setNo,side]=match;}
    else {
      match=key.match(/^gallery:before-after:(\d+):(before|after)$/);
      if(!match) continue;
      scope='gallery';[,setNo,side]=match;slug='gallery';
    }
    const mapKey=`${scope}:${slug}:${setNo}`;
    if(!sets.has(mapKey)) sets.set(mapKey,{scope,slug,set:Number(setNo),before:null,after:null});
    sets.get(mapKey)[side]=row;
  }
  return [...sets.values()].filter((row)=>row.before?.url && row.after?.url).sort((a,b)=>a.slug.localeCompare(b.slug)||a.set-b.set);
}

export function managedGalleryContent(manifest){
  const assignments=Array.isArray(manifest?.assignments)?manifest.assignments:[];
  const singles=[];
  for(const row of assignments){
    const key=clean(row?.target_key);
    const match=key.match(/^gallery:(evidence|technique|efficiency):(\d+)$/);
    if(!match || !row?.url) continue;
    singles.push({...row,gallery_type:match[1],gallery_slot:Number(match[2])});
  }
  singles.sort((a,b)=>String(a.gallery_type).localeCompare(String(b.gallery_type))||a.gallery_slot-b.gallery_slot);
  return {pairs:managedBeforeAfterPairRows(manifest),singles};
}

export async function hydrateR2CardImages(root=document){
  const nodes = [...root.querySelectorAll('[data-r2-image-keywords]')];
  const manifest = await loadWebsiteImageManifest();
  await hydrateManagedImageSlots(root, manifest);
  for (const node of nodes) {
    if (node.dataset.r2ImageHydrated === 'true') continue;
    node.dataset.r2ImageHydrated = 'true';
    const link = node.querySelector('a[href]');
    const matches = cardImageMatches(
      manifest,
      node.dataset.r2ImageKeywords || node.textContent || '',
      node.dataset.r2ImageHref || link?.getAttribute('href') || '',
      3,
      node.dataset.photoTarget || ''
    );
    if (!matches.length) continue;
    node.querySelectorAll('.visual-placeholder-card').forEach((placeholder)=>placeholder.remove());
    node.classList.add('managed-photo-resolved');
    let img = node.querySelector(':scope > img.r2-card-photo');
    if (!img) {
      img = document.createElement('img');
      img.className = 'r2-card-photo';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = matches[0]?.alt_text || `${clean(node.querySelector('h2,h3')?.textContent || 'Rosie Dazzlers')} detailing example`;
      node.insertBefore(img,node.firstChild);
    }
    let index = 0;
    const tryNext = () => {
      const next = matches[index++]?.url;
      if (!next) {
        img.remove();
        return;
      }
      const picked=matches[index-1] || {};
      img.alt=picked.alt_text || img.alt;
      img.style.objectPosition=picked.focal_point || 'center';
      img.src = next;
    };
    img.addEventListener('error',tryNext);
    tryNext();
  }
  await hydrateBeforeAfterSets(root, manifest);
}


// Build 259 — explicit-only global presentation image overrides.
// This deliberately does NOT use automatic filename matching. Existing authored images stay intact until an owner assigns a Photo Studio target.
function normalizedPagePath(value=''){
  const raw=clean(value||'/').split('?')[0].split('#')[0].replace(/\/+$/,'');
  return raw || '/';
}

function explicitAssetTargetForImage(img){
  const original=clean(img?.dataset?.photoOriginalSrc || img?.getAttribute('src'));
  if(!original) return '';
  if(!img.dataset.photoOriginalSrc) img.dataset.photoOriginalSrc=original;
  try{
    const u=new URL(original,location.origin);
    const source=u.origin===location.origin ? u.pathname : u.href.split('?')[0].split('#')[0];
    return `site-asset:${source}`;
  }catch{return `site-asset:${original.split('?')[0].split('#')[0]}`;}
}

function applyExplicitImage(img,picked,target){
  if(!img||!picked?.url)return false;
  img.src=picked.url;
  if(picked.alt_text)img.alt=picked.alt_text;
  if(picked.title)img.title=picked.title;
  img.style.objectPosition=picked.focal_point||'center';
  img.dataset.photoAssignmentTarget=target;
  return true;
}

export async function hydrateGlobalSiteImageOverrides(root=document,manifest=null){
  if(!root || normalizedPagePath(location.pathname).startsWith('/admin'))return;
  const data=manifest||await loadWebsiteImageManifest();
  const brandTargets=[
    ['site:brand:logo','[data-logo]'],
    ['site:brand:banner','[data-banner],img[data-main-banner],#bannerImage,#globalMainBanner img'],
    ['site:brand:reviews','[data-reviews],#reviewsImage,.reviews img,[data-reviews-panel] img']
  ];
  for(const [target,selector] of brandTargets){
    const picked=explicitImageForTarget(data,target);if(!picked?.url)continue;
    root.querySelectorAll(selector).forEach((img)=>applyExplicitImage(img,picked,target));
  }
  const siteBackground=explicitImageForTarget(data,'site:brand:background');
  if(siteBackground?.url){
    document.documentElement.style.setProperty('--hero-bg',`url("${String(siteBackground.url).replaceAll('\"','%22')}")`);
    document.documentElement.dataset.photoBackgroundTarget='site:brand:background';
  }
  for(const img of root.querySelectorAll('img[src]')){
    if(img.dataset.photoAssignmentTarget)continue;
    const target=explicitAssetTargetForImage(img);if(!target)continue;
    const picked=explicitImageForTarget(data,target);if(picked?.url)applyExplicitImage(img,picked,target);
  }
  const pageTarget=`page-background:${normalizedPagePath(location.pathname)}`;
  const bg=explicitImageForTarget(data,pageTarget);
  if(bg?.url){
    document.body.style.backgroundImage=`linear-gradient(rgba(8,13,24,.88),rgba(8,13,24,.94)),url("${String(bg.url).replaceAll('"','%22')}")`;
    document.body.style.backgroundSize='cover';
    document.body.style.backgroundPosition=bg.focal_point||'center';
    document.body.style.backgroundAttachment='fixed';
    document.body.dataset.photoAssignmentTarget=pageTarget;
  }
}
