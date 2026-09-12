import {
  APPROVED_IMAGE_PREFIXES,
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
import { PHOTO_STUDIO_BUILD, beforeAfterPlacement, isPhotoStudioPublicRow } from './photo-studio-safety.js';

export async function buildPublicWebsiteImageManifest(env){
  const warnings=[];
  // Public page requests use the managed library only. Never scan or mutate R2 per page view.
  const [mediaResult,assignmentResult]=await Promise.all([
    loadPublicMediaLibraryRows(env,{limit:400}),
    loadPublicAssignmentRows(env,{limit:800})
  ]);
  if(!mediaResult.ready&&mediaResult.warning)warnings.push(mediaResult.warning);
  if(!assignmentResult.ready&&assignmentResult.warning)warnings.push(assignmentResult.warning);
  const initialRows=(Array.isArray(mediaResult.rows)?mediaResult.rows:[]).filter(isPhotoStudioPublicRow);
  const initialIds=new Set(initialRows.map((row)=>String(row?.id||'')).filter(Boolean));
  const assignedIds=[...new Set((assignmentResult.rows||[]).map((row)=>String(row?.media_id||'')).filter(Boolean))];
  const missingAssignedIds=assignedIds.filter((id)=>!initialIds.has(id));
  const assignedMediaResult=missingAssignedIds.length?await loadPublicMediaRowsByIds(env,missingAssignedIds):{ready:true,rows:[]};
  if(!assignedMediaResult.ready&&assignedMediaResult.warning)warnings.push(assignedMediaResult.warning);
  const mediaRows=[...initialRows,...(assignedMediaResult.rows||[]).filter(isPhotoStudioPublicRow)];

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
    if(!media||!isPhotoStudioPublicRow(media))continue;
    const rawUrl=String(media.media_url||'');
    if(!rawUrl.toLowerCase().startsWith(assetBase))continue;
    const url=versionedPublicUrl(rawUrl,media.r2_etag||media.updated_at||media.uploaded_at||'');
    const pair=beforeAfterPlacement(row.target_key||'',row.target_type||'');
    assignments.push({
      target_key:String(row.target_key||''),target_label:String(row.target_label||''),target_type:String(row.target_type||''),
      page_path:String(row.page_path||''),component_key:String(row.component_key||''),variant:String(row.variant||''),
      media_id:String(media.id||''),r2_key:media.r2_key,filename:media.filename||'',url,
      alt_text:String(row.alt_override||media.alt_text||''),title:String(row.title_override||media.seo_title||media.label||''),
      caption:String(row.caption_override||media.caption||''),focal_point:String(media.focal_point||'center'),...pair
    });
  }

  return {
    ok:true,build:PHOTO_STUDIO_BUILD,bucket_ready:!!getPublicAssetsBucket(env),allowed_prefixes:APPROVED_IMAGE_PREFIXES,
    source:'managed_library',r2_scan_per_request:false,r2_mutation_per_request:false,private_media_isolated:true,
    counts,images,assignments,assignment_count:assignments.length,warnings,
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
