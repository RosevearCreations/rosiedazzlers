import {
  APPROVED_IMAGE_PREFIXES,
  PHOTO_BUILD,
  getPublicAssetsBucket,
  isApprovedImageKey,
  loadPublicAssignmentRows,
  loadPublicMediaLibraryRows,
  loadPublicMediaRowsByIds,
  normalizeAdminPhoto,
  prefixForKey,
  publicAssetBase,
  versionedPublicUrl
} from './photo-library.js';

export async function buildPublicWebsiteImageManifest(env){
  const warnings=[];
  // Build 257: public page requests use the managed library only. Never scan the R2 bucket per page view.
  const [mediaResult,assignmentResult]=await Promise.all([
    loadPublicMediaLibraryRows(env,{limit:400}),
    loadPublicAssignmentRows(env,{limit:800})
  ]);
  if(!mediaResult.ready&&mediaResult.warning)warnings.push(mediaResult.warning);
  if(!assignmentResult.ready&&assignmentResult.warning)warnings.push(assignmentResult.warning);
  const initialRows=Array.isArray(mediaResult.rows)?mediaResult.rows:[];
  const initialIds=new Set(initialRows.map((row)=>String(row?.id||'')).filter(Boolean));
  const assignedIds=[...new Set((assignmentResult.rows||[]).map((row)=>String(row?.media_id||'')).filter(Boolean))];
  const missingAssignedIds=assignedIds.filter((id)=>!initialIds.has(id));
  const assignedMediaResult=missingAssignedIds.length?await loadPublicMediaRowsByIds(env,missingAssignedIds):{ready:true,rows:[]};
  if(!assignedMediaResult.ready&&assignedMediaResult.warning)warnings.push(assignedMediaResult.warning);
  const mediaRows=[...initialRows,...(assignedMediaResult.rows||[])];

  const assetBase=publicAssetBase(env).toLowerCase();
  const dbById=new Map();
  const images=[];
  const seen=new Set();
  const counts={packages:0,landing_pages:0,car_photos:0,addons:0,brand:0,gallery:0,products:0};

  for(const raw of mediaRows){
    const photo=normalizeAdminPhoto(raw);
    if(photo.id)dbById.set(String(photo.id),photo);
    if(!photo.r2_key||seen.has(photo.r2_key)||!isApprovedImageKey(photo.r2_key)||photo.source_status==='archived')continue;
    if(!String(photo.media_url||'').toLowerCase().startsWith(assetBase))continue;
    const image=publicImage(photo);
    images.push(image);seen.add(photo.r2_key);
    const prefix=prefixForKey(photo.r2_key);
    if(prefix==='packages/')counts.packages+=1;
    else if(prefix==='landing_pages/'||prefix==='landing-pages/')counts.landing_pages+=1;
    else if(prefix==='CarPhotos/')counts.car_photos+=1;
    else if(prefix==='addons/')counts.addons+=1;
    else if(prefix==='brand/')counts.brand+=1;
    else if(prefix==='gallery/')counts.gallery+=1;
    else if(prefix==='products/')counts.products+=1;
  }

  const assignments=[];
  for(const row of assignmentResult.rows||[]){
    if(row?.is_active!==true)continue;
    const media=dbById.get(String(row.media_id||''));
    if(!media||!media.r2_key||!isApprovedImageKey(media.r2_key)||media.source_status==='archived')continue;
    const rawUrl=String(media.media_url||'');
    if(!rawUrl.toLowerCase().startsWith(assetBase))continue;
    const url=versionedPublicUrl(rawUrl,media.r2_etag||media.updated_at||media.uploaded_at||'');
    assignments.push({
      target_key:String(row.target_key||''),target_label:String(row.target_label||''),target_type:String(row.target_type||''),
      page_path:String(row.page_path||''),component_key:String(row.component_key||''),variant:String(row.variant||''),
      media_id:String(media.id||''),r2_key:media.r2_key,filename:media.filename||'',url,
      alt_text:String(row.alt_override||media.alt_text||''),title:String(row.title_override||media.seo_title||media.label||''),
      caption:String(row.caption_override||media.caption||''),focal_point:String(media.focal_point||'center')
    });
  }

  return {
    ok:true,build:258,bucket_ready:!!getPublicAssetsBucket(env),allowed_prefixes:APPROVED_IMAGE_PREFIXES,
    source:'managed_library',r2_scan_per_request:false,counts,images,assignments,assignment_count:assignments.length,warnings,
    // Compatibility shell only. Build 257 no longer duplicates the full image list under prefixes.
    prefixes:{packages:[],landing_pages:[],car_photos:[],addons:[],brand:[],gallery:[],products:[]}
  };
}

function publicImage(row){
  const key=String(row.r2_key||row.key||'');
  return {key,r2_key:key,filename:String(row.filename||key.split('/').pop()||''),prefix:prefixForKey(key),url:versionedPublicUrl(String(row.media_url||row.url||''),row.r2_etag||row.updated_at||row.uploaded_at||''),
    alt_text:String(row.alt_text||''),title:String(row.seo_title||row.label||''),caption:String(row.caption||''),focal_point:String(row.focal_point||'center'),
    width:row.width==null?null:Number(row.width),height:row.height==null?null:Number(row.height),byte_size:row.byte_size==null?null:Number(row.byte_size),
    mime_type:String(row.mime_type||''),tags:Array.isArray(row.tags)?row.tags:[]};
}
