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

export async function listApprovedR2Images(env, {limitPerPrefix=1000, maxTotal=6000}={}){
  const bucket = getPublicAssetsBucket(env);
  if (!bucket || typeof bucket.list !== 'function') {
    return { bucket_ready:false, images:[], warnings:['Public R2 bucket binding is not configured.'] };
  }
  const images = [];
  const warnings = [];
  for (const prefix of APPROVED_IMAGE_PREFIXES) {
    let cursor;
    let pages = 0;
    do {
      pages += 1;
      let result;
      try {
        result = await bucket.list({ prefix, limit:Math.min(1000, limitPerPrefix), cursor, include:['httpMetadata','customMetadata'] });
      } catch (err) {
        warnings.push(`Could not list ${prefix}: ${err?.message || err}`);
        break;
      }
      for (const object of result?.objects || []) {
        const normalized = normalizeR2Object(env, object, prefix);
        if (normalized) images.push(normalized);
        if (images.length >= maxTotal) break;
      }
      if (images.length >= maxTotal) {
        warnings.push(`Photo inventory stopped at ${maxTotal} approved images for this request.`);
        break;
      }
      cursor = result?.truncated ? result.cursor : undefined;
      if (pages > 20) {
        warnings.push(`Photo inventory stopped paging ${prefix} after 20 pages.`);
        break;
      }
    } while (cursor);
    if (images.length >= maxTotal) break;
  }
  images.sort((a,b) => String(a.r2_key).localeCompare(String(b.r2_key)));
  return { bucket_ready:true, images, warnings };
}

export async function loadMediaLibraryRows(env, {includeArchived=false}={}){
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return {ready:false, rows:[], warning:'Supabase service configuration is unavailable.'};
  const statusFilter = includeArchived ? '' : '&source_status=neq.archived';
  const url = `${env.SUPABASE_URL}/rest/v1/app_media_library?select=*&order=updated_at.desc&limit=2000${statusFilter}`;
  const response = await fetch(url, { headers:serviceHeaders(env) });
  if (!response.ok) return {ready:false, rows:[], warning:`app_media_library unavailable: ${await response.text()}`};
  const rows = await response.json().catch(() => []);
  return {ready:true, rows:Array.isArray(rows) ? rows : []};
}

export async function loadAssignmentRows(env, {activeOnly=false}={}){
  if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) return {ready:false, rows:[], warning:'Supabase service configuration is unavailable.'};
  const active = activeOnly ? '&is_active=eq.true' : '';
  const url = `${env.SUPABASE_URL}/rest/v1/app_media_assignments?select=*&order=target_key.asc&limit=3000${active}`;
  const response = await fetch(url, { headers:serviceHeaders(env) });
  if (!response.ok) return {ready:false, rows:[], warning:`app_media_assignments unavailable: ${await response.text()}`};
  const rows = await response.json().catch(() => []);
  return {ready:true, rows:Array.isArray(rows) ? rows : []};
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

export async function syncR2IntoLibrary(env, actorEmail='staff'){
  const live = await listApprovedR2Images(env);
  if (!live.bucket_ready) return {...live, db_ready:false, inserted:0};
  const existing = await loadMediaLibraryRows(env, {includeArchived:true});
  if (!existing.ready) return {...live, db_ready:false, inserted:0, warnings:[...live.warnings, existing.warning]};
  const byKey = new Set(existing.rows.map((row) => cleanKey(row.r2_key)).filter(Boolean));
  const byUrl = new Set(existing.rows.map((row) => String(row.media_url || '')).filter(Boolean));
  const newRows = live.images.filter((row) => !byKey.has(row.r2_key) && !byUrl.has(row.media_url)).map((row) => ({
    media_key:`r2:${row.r2_key}`,
    label:row.label_suggestion || prettifyFilename(row.r2_key) || row.filename,
    media_type:'image',
    media_url:row.media_url,
    alt_text:null,
    caption:null,
    group_key:row.r2_prefix.replace(/\/$/, ''),
    usage_contexts:['website'],
    source_status:'active',
    sort_order:0,
    updated_at:new Date().toISOString(),
    updated_by:actorEmail || 'staff',
    r2_key:row.r2_key,
    filename:row.filename,
    r2_prefix:row.r2_prefix,
    mime_type:row.mime_type || null,
    byte_size:row.byte_size || null,
    r2_etag:row.r2_etag || null,
    uploaded_at:row.uploaded_at || null,
    last_seen_at:new Date().toISOString(),
    source_type:'r2_sync',
    focal_point:'center',
    decorative:false,
    tags:[]
  }));
  if (!newRows.length) return {...live, db_ready:true, inserted:0};
  const headers = {...serviceHeaders(env), Prefer:'return=representation'};
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_library`, {method:'POST', headers, body:JSON.stringify(newRows)});
  if (!response.ok) {
    return {...live, db_ready:false, inserted:0, warnings:[...live.warnings, `Could not sync R2 photos into app_media_library: ${await response.text()}`]};
  }
  const insertedRows = await response.json().catch(() => []);
  return {...live, db_ready:true, inserted:Array.isArray(insertedRows) ? insertedRows.length : newRows.length};
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
