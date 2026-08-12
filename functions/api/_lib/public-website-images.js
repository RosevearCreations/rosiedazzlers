import {
  APPROVED_IMAGE_PREFIXES,
  PHOTO_BUILD,
  isApprovedImageKey,
  listApprovedR2Images,
  loadAssignmentRows,
  loadMediaLibraryRows,
  normalizeAdminPhoto,
  prefixForKey,
  publicAssetBase
} from './photo-library.js';

export async function buildPublicWebsiteImageManifest(env){
  const warnings = [];
  const live = await listApprovedR2Images(env, {maxTotal:6000});
  warnings.push(...(live.warnings || []));

  const mediaResult = await loadMediaLibraryRows(env, {includeArchived:true});
  const assignmentResult = await loadAssignmentRows(env, {activeOnly:true});
  if (!mediaResult.ready && mediaResult.warning) warnings.push(mediaResult.warning);
  if (!assignmentResult.ready && assignmentResult.warning) warnings.push(assignmentResult.warning);

  const liveByKey = new Map((live.images || []).map((row) => [row.r2_key,row]));
  const dbById = new Map();
  const dbByKey = new Map();
  for (const raw of mediaResult.rows || []) {
    const photo = normalizeAdminPhoto(raw);
    if (photo.id) dbById.set(String(photo.id), photo);
    if (photo.r2_key) dbByKey.set(photo.r2_key, photo);
  }

  const images = [];
  const seen = new Set();
  const assetBase = publicAssetBase(env).toLowerCase();
  for (const raw of live.images || []) {
    const db = dbByKey.get(raw.r2_key) || {};
    if (db.source_status === 'archived') continue;
    images.push(publicImage({...db,...raw}));
    seen.add(raw.r2_key);
  }
  for (const raw of mediaResult.rows || []) {
    const photo = normalizeAdminPhoto(raw);
    if (!photo.r2_key || seen.has(photo.r2_key) || !isApprovedImageKey(photo.r2_key) || photo.source_status === 'archived') continue;
    if (!String(photo.media_url || '').toLowerCase().startsWith(assetBase)) continue;
    images.push(publicImage(photo));
    seen.add(photo.r2_key);
  }

  const assignments = [];
  for (const row of assignmentResult.rows || []) {
    if (row?.is_active !== true) continue;
    const media = dbById.get(String(row.media_id || ''));
    if (!media || !media.r2_key || !isApprovedImageKey(media.r2_key) || media.source_status === 'archived') continue;
    const liveRow = liveByKey.get(media.r2_key);
    const combined = {...media,...liveRow};
    const url = String(combined.media_url || '');
    if (!url.toLowerCase().startsWith(assetBase)) continue;
    assignments.push({
      target_key:String(row.target_key || ''),
      target_label:String(row.target_label || ''),
      target_type:String(row.target_type || ''),
      page_path:String(row.page_path || ''),
      component_key:String(row.component_key || ''),
      variant:String(row.variant || ''),
      media_id:String(media.id || ''),
      r2_key:media.r2_key,
      filename:combined.filename || media.filename || '',
      url,
      alt_text:String(row.alt_override || media.alt_text || ''),
      title:String(row.title_override || media.seo_title || media.label || ''),
      caption:String(row.caption_override || media.caption || ''),
      focal_point:String(media.focal_point || 'center')
    });
  }

  const prefixes = {packages:[],landing_pages:[],car_photos:[],addons:[],brand:[],gallery:[],products:[]};
  for (const image of images) {
    const prefix = prefixForKey(image.key || image.r2_key || '');
    if (prefix === 'packages/') prefixes.packages.push(image);
    else if (prefix === 'landing_pages/' || prefix === 'landing-pages/') prefixes.landing_pages.push(image);
    else if (prefix === 'CarPhotos/') prefixes.car_photos.push(image);
    else if (prefix === 'addons/') prefixes.addons.push(image);
    else if (prefix === 'brand/') prefixes.brand.push(image);
    else if (prefix === 'gallery/') prefixes.gallery.push(image);
    else if (prefix === 'products/') prefixes.products.push(image);
  }

  return {
    ok:true,
    build:PHOTO_BUILD,
    bucket_ready:live.bucket_ready === true,
    allowed_prefixes:APPROVED_IMAGE_PREFIXES,
    counts:Object.fromEntries(Object.entries(prefixes).map(([key,rows]) => [key,rows.length])),
    images,
    prefixes,
    assignments,
    assignment_count:assignments.length,
    warnings
  };
}

function publicImage(row){
  const key = String(row.r2_key || row.key || '');
  return {
    key,
    r2_key:key,
    filename:String(row.filename || key.split('/').pop() || ''),
    prefix:prefixForKey(key),
    url:String(row.media_url || row.url || ''),
    alt_text:String(row.alt_text || ''),
    title:String(row.seo_title || row.label || ''),
    caption:String(row.caption || ''),
    focal_point:String(row.focal_point || 'center'),
    width:row.width == null ? null : Number(row.width),
    height:row.height == null ? null : Number(row.height),
    byte_size:row.byte_size == null ? null : Number(row.byte_size),
    mime_type:String(row.mime_type || ''),
    tags:Array.isArray(row.tags) ? row.tags : []
  };
}
