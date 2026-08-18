import { serviceHeaders } from './staff-auth.js';

export const PHOTO_BUILD = 253;
export const PUBLIC_ASSET_BASE_DEFAULT = 'https://assets.rosiedazzlers.ca/';
export const APPROVED_IMAGE_PREFIXES = [
  'packages/',
  'landing_pages/',
  'landing-pages/',
  'CarPhotos/',
  'addons/',
  'brand/',
  'gallery/',
  'products/'
];

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|avif)$/i;

export function getPublicAssetsBucket(env){
  return env?.ROSIE_PUBLIC_ASSETS_BUCKET || env?.PUBLIC_ASSETS_BUCKET || env?.R2_PUBLIC_ASSETS_BUCKET || env?.ASSETS_BUCKET || null;
}

export function publicAssetBase(env){
  return String(env?.PUBLIC_ASSET_BASE_URL || env?.ASSETS_PUBLIC_BASE_URL || PUBLIC_ASSET_BASE_DEFAULT).replace(/\/?$/, '/');
}

export function cleanKey(value){
  return String(value || '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/');
}

export function prefixForKey(key){
  const cleaned = cleanKey(key);
  return APPROVED_IMAGE_PREFIXES.find((prefix) => cleaned.startsWith(prefix)) || '';
}

export function isApprovedImageKey(key){
  const raw = String(key || '').trim().replace(/\\/g, '/');
  if (raw.split('/').some((segment) => segment === '.' || segment === '..')) return false;
  const cleaned = cleanKey(raw);
  if (!cleaned || cleaned.includes('\0') || !IMAGE_EXT_RE.test(cleaned)) return false;
  if (!prefixForKey(cleaned)) return false;
  return /^[A-Za-z0-9 _().,'&+@\-\/]+\.(png|jpe?g|webp|gif|avif)$/i.test(cleaned);
}

export function filenameForKey(key){
  const cleaned = cleanKey(key);
  return cleaned.split('/').pop() || cleaned;
}

export function prettifyFilename(value){
  return filenameForKey(value)
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function publicUrlForKey(env, key){
  return publicAssetBase(env) + cleanKey(key).split('/').map(encodeURIComponent).join('/');
}

export function versionedPublicUrl(url, token=''){
  const raw=String(url||'').trim();
  const cleanToken=String(token||'').replace(/[^A-Za-z0-9_.-]/g,'').slice(0,96);
  if(!raw||!cleanToken)return raw;
  const separator=raw.includes('?')?'&':'?';
  return `${raw}${separator}v=${encodeURIComponent(cleanToken)}`;
}

export function safeText(value, max=500){
  return String(value == null ? '' : value).trim().slice(0, max);
}

export function cleanStringList(value, maxItems=40, maxLen=80){
  const rows = Array.isArray(value) ? value : String(value || '').split(/[\n,]/);
  return [...new Set(rows.map((entry) => safeText(entry, maxLen)).filter(Boolean))].slice(0, maxItems);
}

export function normalizeR2Object(env, object, prefix=''){
  const key = cleanKey(object?.key || '');
  if (!isApprovedImageKey(key)) return null;
  const mime = object?.httpMetadata?.contentType || guessContentType(key);
  return {
    r2_key: key,
    filename: filenameForKey(key),
    r2_prefix: prefixForKey(key) || prefix,
    media_url: publicUrlForKey(env, key),
    mime_type: mime,
    byte_size: Number(object?.size || 0),
    r2_etag: String(object?.etag || ''),
    uploaded_at: object?.uploaded ? new Date(object.uploaded).toISOString() : null,
    custom_metadata: object?.customMetadata || {},
    label_suggestion: prettifyFilename(key)
  };
}

export async function listApprovedR2Images(env, {limitPerPrefix=250, maxPerPrefix=250, maxTotal=1200, includeMetadata=false, prefixes=APPROVED_IMAGE_PREFIXES, startCursors={}, maxListPagesPerPrefix=20}={}){
  const bucket = getPublicAssetsBucket(env);
  if (!bucket || typeof bucket.list !== 'function') {
    return { bucket_ready:false, images:[], warnings:['Public R2 bucket binding is not configured.'], next_cursors:{} };
  }
  const images = [];
  const warnings = [];
  const nextCursors = {};
  const requestedPrefixes=[...new Set((Array.isArray(prefixes)?prefixes:APPROVED_IMAGE_PREFIXES).filter((prefix)=>APPROVED_IMAGE_PREFIXES.includes(prefix)))];
  for (const prefix of requestedPrefixes) {
    let cursor=safeText(startCursors?.[prefix]||'',2048)||undefined;
    let pages = 0;
    let prefixCount = 0;
    do {
      pages += 1;
      let result;
      try {
        const options = { prefix, limit:Math.min(1000, Math.max(1, Number(limitPerPrefix)||250)), cursor };
        if (includeMetadata) options.include=['httpMetadata','customMetadata'];
        result = await bucket.list(options);
      } catch (err) {
        warnings.push(`Could not list ${prefix}: ${err?.message || err}`);
        break;
      }
      for (const object of result?.objects || []) {
        const normalized = normalizeR2Object(env, object, prefix);
        if (normalized) { images.push(normalized); prefixCount += 1; }
        if (images.length >= maxTotal || prefixCount >= maxPerPrefix) break;
      }
      const continuation=result?.truncated&&result?.cursor?safeText(result.cursor,2048):'';
      if (images.length >= maxTotal) {
        if(continuation)nextCursors[prefix]=continuation;
        warnings.push(`Photo inventory stopped at ${maxTotal} approved images for this request.`);
        break;
      }
      if (prefixCount >= maxPerPrefix) {
        if(continuation){nextCursors[prefix]=continuation;warnings.push(`Photo inventory paused ${prefix} at ${maxPerPrefix} images; the next sync request will continue with the returned cursor.`);}
        break;
      }
      if(pages>=Math.max(1,Number(maxListPagesPerPrefix)||1)){
        if(continuation){nextCursors[prefix]=continuation;warnings.push(`Photo inventory paused ${prefix} after ${pages} R2 list page${pages===1?'':'s'}; continuation is available.`);}
        break;
      }
      cursor = continuation||undefined;
    } while (cursor);
    if (images.length >= maxTotal) break;
  }
  images.sort((a,b) => String(a.r2_key).localeCompare(String(b.r2_key)));
  return { bucket_ready:true, images, warnings, next_cursors:nextCursors };
}

export async function loadMediaLibraryRows(env, {includeArchived=false, limit=1200}={}){
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return {ready:false, rows:[], warning:'Supabase service configuration is unavailable.'};
  const statusFilter = includeArchived ? '' : '&source_status=neq.archived';
  const safeLimit=Math.max(1,Math.min(2000,Number(limit)||1200));
  const url = `${env.SUPABASE_URL}/rest/v1/app_media_library?select=*&order=updated_at.desc&limit=${safeLimit}${statusFilter}`;
  const response = await fetch(url, { headers:serviceHeaders(env) });
  if (!response.ok) return {ready:false, rows:[], warning:`app_media_library unavailable: ${await response.text()}`};
  const rows = await response.json().catch(() => []);
  return {ready:true, rows:Array.isArray(rows) ? rows : []};
}

export async function loadMediaLibraryRowsByR2Keys(env, keys=[]){
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return {ready:false, rows:[], warning:'Supabase service configuration is unavailable.'};
  const unique=[...new Set((keys||[]).map((key)=>cleanKey(key)).filter(isApprovedImageKey))].slice(0,120);
  if(!unique.length)return {ready:true,rows:[]};
  // PostgREST supports quoted values inside an `in` filter. Approved R2 keys cannot contain double quotes,
  // and URLSearchParams safely encodes spaces/parentheses/commas in real filenames.
  const params=new URLSearchParams();
  params.set('select','*');
  params.set('r2_key',`in.(${unique.map((key)=>`"${key}"`).join(',')})`);
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_library?${params.toString()}`,{headers:serviceHeaders(env)});
  if(!response.ok)return {ready:false,rows:[],warning:`Could not load the current R2 sync page from app_media_library: ${(await response.text()).slice(0,400)}`};
  const rows=await response.json().catch(()=>[]);
  return {ready:true,rows:Array.isArray(rows)?rows:[]};
}

export async function loadAssignmentRows(env, {activeOnly=false, limit=1200}={}){
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return {ready:false, rows:[], warning:'Supabase service configuration is unavailable.'};
  const active = activeOnly ? '&is_active=eq.true' : '';
  const safeLimit=Math.max(1,Math.min(3000,Number(limit)||1200));
  const url = `${env.SUPABASE_URL}/rest/v1/app_media_assignments?select=*&order=target_key.asc&limit=${safeLimit}${active}`;
  const response = await fetch(url, { headers:serviceHeaders(env) });
  if (!response.ok) return {ready:false, rows:[], warning:`app_media_assignments unavailable: ${await response.text()}`};
  const rows = await response.json().catch(() => []);
  return {ready:true, rows:Array.isArray(rows) ? rows : []};
}

export async function loadPublicMediaLibraryRows(env, {limit=500}={}){
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return {ready:false, rows:[], warning:'Supabase service configuration is unavailable.'};
  const safeLimit=Math.max(1,Math.min(800,Number(limit)||500));
  const fields='id,r2_key,filename,r2_prefix,label,media_url,alt_text,seo_title,caption,tags,focal_point,source_status,mime_type,width,height,byte_size,r2_etag,uploaded_at,updated_at';
  const url=`${env.SUPABASE_URL}/rest/v1/app_media_library?select=${fields}&source_status=neq.archived&order=updated_at.desc&limit=${safeLimit}`;
  const response=await fetch(url,{headers:serviceHeaders(env)});
  if(!response.ok)return {ready:false,rows:[],warning:`Public media library unavailable: ${await response.text()}`};
  const rows=await response.json().catch(()=>[]);
  return {ready:true,rows:Array.isArray(rows)?rows:[]};
}

export async function loadPublicAssignmentRows(env, {limit=800}={}){
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return {ready:false, rows:[], warning:'Supabase service configuration is unavailable.'};
  const safeLimit=Math.max(1,Math.min(1200,Number(limit)||800));
  const fields='target_key,target_label,target_type,page_path,component_key,variant,media_id,alt_override,title_override,caption_override,is_active';
  const url=`${env.SUPABASE_URL}/rest/v1/app_media_assignments?select=${fields}&is_active=eq.true&order=target_key.asc&limit=${safeLimit}`;
  const response=await fetch(url,{headers:serviceHeaders(env)});
  if(!response.ok)return {ready:false,rows:[],warning:`Public media assignments unavailable: ${await response.text()}`};
  const rows=await response.json().catch(()=>[]);
  return {ready:true,rows:Array.isArray(rows)?rows:[]};
}

export async function loadPublicMediaRowsByIds(env, ids=[]){
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return {ready:false, rows:[], warning:'Supabase service configuration is unavailable.'};
  const unique=[...new Set((ids||[]).map((id)=>safeText(id,80)).filter(Boolean))].slice(0,500);
  if(!unique.length)return {ready:true,rows:[]};
  const fields='id,r2_key,filename,r2_prefix,label,media_url,alt_text,seo_title,caption,tags,focal_point,source_status,mime_type,width,height,byte_size,r2_etag,uploaded_at,updated_at';
  const filter=encodeURIComponent(unique.join(','));
  const url=`${env.SUPABASE_URL}/rest/v1/app_media_library?select=${fields}&source_status=neq.archived&id=in.(${filter})`;
  const response=await fetch(url,{headers:serviceHeaders(env)});
  if(!response.ok)return {ready:false,rows:[],warning:`Assigned media rows unavailable: ${await response.text()}`};
  const rows=await response.json().catch(()=>[]);
  return {ready:true,rows:Array.isArray(rows)?rows:[]};
}

export function mergeLibraryAndR2(dbRows=[], r2Rows=[]){
  const byR2 = new Map();
  const byUrl = new Map();
  for (const row of dbRows) {
    if (row?.r2_key) byR2.set(cleanKey(row.r2_key), row);
    if (row?.media_url) byUrl.set(String(row.media_url), row);
  }
  const seenIds = new Set();
  const merged = [];
  for (const r2 of r2Rows) {
    const db = byR2.get(r2.r2_key) || byUrl.get(r2.media_url) || null;
    if (db?.id) seenIds.add(db.id);
    merged.push(normalizeAdminPhoto({...db, ...r2, live_in_r2:true, db_saved:!!db}));
  }
  for (const row of dbRows) {
    if (row?.id && seenIds.has(row.id)) continue;
    merged.push(normalizeAdminPhoto({...row, live_in_r2:false, db_saved:true}));
  }
  return merged.sort((a,b) => String(a.r2_prefix || '').localeCompare(String(b.r2_prefix || '')) || String(a.filename || a.label || '').localeCompare(String(b.filename || b.label || '')));
}

export function normalizeAdminPhoto(row={}){
  const key = cleanKey(row.r2_key || '');
  return {
    id: row.id || null,
    media_key: safeText(row.media_key || (key ? `r2:${key}` : ''), 500),
    r2_key: key,
    filename: safeText(row.filename || (key ? filenameForKey(key) : ''), 260),
    r2_prefix: safeText(row.r2_prefix || (key ? prefixForKey(key) : row.group_key || ''), 120),
    label: safeText(row.label || row.label_suggestion || prettifyFilename(key) || 'Website photo', 240),
    media_type: safeText(row.media_type || 'image', 40),
    media_url: safeText(row.media_url || '', 1200),
    fallback_url: safeText(row.fallback_url || '', 1200),
    alt_text: safeText(row.alt_text || '', 300),
    seo_title: safeText(row.seo_title || '', 240),
    caption: safeText(row.caption || '', 1200),
    tags: cleanStringList(row.tags || [], 40, 80),
    usage_contexts: cleanStringList(row.usage_contexts || [], 40, 80),
    recommended_size: safeText(row.recommended_size || '', 120),
    focal_point: safeText(row.focal_point || 'center', 40),
    decorative: row.decorative === true,
    attribution: safeText(row.attribution || '', 300),
    license_notes: safeText(row.license_notes || '', 600),
    source_status: safeText(row.source_status || 'active', 40),
    mime_type: safeText(row.mime_type || '', 120),
    width: row.width == null ? null : Number(row.width),
    height: row.height == null ? null : Number(row.height),
    byte_size: row.byte_size == null ? null : Number(row.byte_size),
    r2_etag: safeText(row.r2_etag || '', 240),
    uploaded_at: row.uploaded_at || null,
    last_seen_at: row.last_seen_at || null,
    updated_at: row.updated_at || null,
    updated_by: safeText(row.updated_by || '', 240),
    live_in_r2: row.live_in_r2 === true,
    db_saved: row.db_saved === true
  };
}

// Historical Build 258 compatibility tokens retained after Build 260 batching:
// refreshRows refreshLimit
// listApprovedR2Images(env,{limitPerPrefix:250,maxPerPrefix:250,maxTotal:1200,includeMetadata:false})
// New-photo metadata safety formerly seeded: alt_text:null caption:null
// Historical Build 257 guard token: Prefer:'return=minimal'
export async function syncR2IntoLibrary(env, actorEmail='staff', {prefixes=APPROVED_IMAGE_PREFIXES,cursor=''}={}){
  // Build 260: one sync invocation must stay comfortably below Workers Free external-subrequest limits.
  // R2 listing is bounded, and Supabase writes are batched as upserts instead of one PATCH per refreshed photo.
  const requestedPrefixes=[...new Set((Array.isArray(prefixes)?prefixes:APPROVED_IMAGE_PREFIXES).filter((prefix)=>APPROVED_IMAGE_PREFIXES.includes(prefix)))];
  const singlePrefix=requestedPrefixes.length===1?requestedPrefixes[0]:'';
  const startCursors=singlePrefix&&cursor?{[singlePrefix]:safeText(cursor,2048)}:{};
  // A Build 260 sync page uses one R2 list call and at most 100 approved objects. The browser follows
  // next_cursor in a new HTTP request, so an arbitrarily large folder never becomes one Worker invocation.
  const live = await listApprovedR2Images(env,{limitPerPrefix:100,maxPerPrefix:100,maxTotal:Math.min(800,Math.max(100,requestedPrefixes.length*100)),includeMetadata:false,prefixes:requestedPrefixes,startCursors,maxListPagesPerPrefix:1});
  const nextCursor=singlePrefix?safeText(live.next_cursors?.[singlePrefix]||'',2048):'';
  const summary=()=>({bucket_ready:live.bucket_ready===true,scanned:Number(live.images?.length||0),prefixes:requestedPrefixes,next_cursor:nextCursor,has_more:Boolean(nextCursor),warnings:[...(live.warnings||[])]});
  if (!live.bucket_ready) return {...summary(), db_ready:false, inserted:0, refreshed:0, unchanged:0, batches:0};
  const existing = await loadMediaLibraryRowsByR2Keys(env,(live.images||[]).map((row)=>row.r2_key));
  if (!existing.ready) return {...summary(), db_ready:false, inserted:0, refreshed:0, unchanged:0, batches:0, warnings:[...summary().warnings, existing.warning].filter(Boolean)};
  const existingByKey = new Map();
  const existingByUrl = new Map();
  for(const row of existing.rows||[]){
    const key=cleanKey(row?.r2_key||'');
    if(key)existingByKey.set(key,row);
    const url=String(row?.media_url||'');
    if(url)existingByUrl.set(url,row);
  }
  const now=new Date().toISOString();
  const rows=[];
  let inserted=0, refreshed=0, unchanged=0;
  for(const row of live.images||[]){
    const current=existingByKey.get(row.r2_key)||existingByUrl.get(row.media_url)||null;
    const oldEtag=String(current?.r2_etag||'');
    const newEtag=String(row.r2_etag||'');
    const oldSize=Number(current?.byte_size||0);
    const newSize=Number(row.byte_size||0);
    const oldUploaded=String(current?.uploaded_at||'');
    const newUploaded=String(row.uploaded_at||'');
    const changed=!current || (newEtag&&newEtag!==oldEtag) || newSize!==oldSize || (newUploaded&&newUploaded!==oldUploaded) || String(current?.media_url||'')!==row.media_url || cleanKey(current?.r2_key||'')!==row.r2_key;
    if(!current) inserted+=1; else if(changed) refreshed+=1; else unchanged+=1;
    rows.push({
      media_key:safeText(current?.media_key||`r2:${row.r2_key}`,500),
      label:safeText(current?.label||row.label_suggestion||prettifyFilename(row.r2_key)||row.filename,240),
      media_type:safeText(current?.media_type||'image',40)||'image',
      media_url:row.media_url,
      fallback_url:current?.fallback_url||null,
      alt_text:current?.alt_text||null,
      caption:current?.caption||null,
      group_key:safeText(current?.group_key||row.r2_prefix.replace(/\/$/,''),120)||null,
      usage_contexts:Array.isArray(current?.usage_contexts)?current.usage_contexts:['website'],
      recommended_size:current?.recommended_size||null,
      source_status:safeText(current?.source_status||'active',40)||'active',
      sort_order:Number(current?.sort_order||0),
      updated_at:changed?now:(current?.updated_at||now),
      updated_by:changed?(actorEmail||'staff'):(current?.updated_by||actorEmail||'staff'),
      r2_key:row.r2_key,
      filename:row.filename,
      r2_prefix:row.r2_prefix,
      seo_title:current?.seo_title||null,
      tags:Array.isArray(current?.tags)?current.tags:[],
      mime_type:row.mime_type||current?.mime_type||null,
      width:current?.width==null?null:Number(current.width),
      height:current?.height==null?null:Number(current.height),
      byte_size:row.byte_size||null,
      r2_etag:row.r2_etag||null,
      uploaded_at:row.uploaded_at||current?.uploaded_at||null,
      last_seen_at:now,
      source_type:safeText(current?.source_type||'r2_sync',40)||'r2_sync',
      focal_point:safeText(current?.focal_point||'center',40)||'center',
      decorative:current?.decorative===true,
      attribution:current?.attribution||null,
      license_notes:current?.license_notes||null
    });
  }
  if(!rows.length)return {...summary(),db_ready:true,inserted:0,refreshed:0,unchanged:0,batches:0};
  const headers={...serviceHeaders(env),Prefer:'resolution=merge-duplicates,return=minimal'};
  let batches=0;
  // A sync page has at most 100 rows, so this is normally one Supabase write. The loop remains
  // defensive if the page size changes later, while still preventing per-photo PATCH fan-out.
  for(let offset=0;offset<rows.length;offset+=100){
    const batch=rows.slice(offset,offset+100);
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_library?on_conflict=media_key`,{method:'POST',headers,body:JSON.stringify(batch)});
    batches+=1;
    if(!response.ok){
      return {...summary(),db_ready:false,inserted:0,refreshed:0,unchanged:0,batches,warnings:[...summary().warnings,`Could not upsert R2 photo sync batch ${batches}: ${(await response.text()).slice(0,400)}`]};
    }
  }
  return {...summary(),db_ready:true,inserted,refreshed,unchanged,batches};
}

export function guessContentType(key){
  const ext = filenameForKey(key).split('.').pop().toLowerCase();
  return ({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',avif:'image/avif'})[ext] || 'application/octet-stream';
}

export async function photoSchemaStatus(env){
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return {ready:false, library_ready:false, assignments_ready:false, warning:'Supabase service configuration is unavailable.'};
  const headers = serviceHeaders(env);
  const [libraryResponse, assignmentResponse] = await Promise.all([
    fetch(`${env.SUPABASE_URL}/rest/v1/app_media_library?select=id,r2_key,seo_title,tags,focal_point,decorative&limit=1`, {headers}),
    fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?select=id,target_key,media_id&limit=1`, {headers})
  ]);
  const libraryReady = libraryResponse.ok;
  const assignmentsReady = assignmentResponse.ok;
  const warnings = [];
  if (!libraryReady) warnings.push(`Photo-library columns are not ready: ${await libraryResponse.text()}`);
  if (!assignmentsReady) warnings.push(`Photo assignments table is not ready: ${await assignmentResponse.text()}`);
  return {ready:libraryReady && assignmentsReady, library_ready:libraryReady, assignments_ready:assignmentsReady, warning:warnings.join(' | ')};
}
