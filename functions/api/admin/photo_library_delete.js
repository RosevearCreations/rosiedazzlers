// Build 314: managed-photo deletion protects active assignments and Gallery before/after references.
// Build 408: deletion is dry-run by default; destructive R2 mutation requires explicit admin authority.
import { requireStaffAccess, serviceHeaders, json } from '../_lib/staff-auth.js';
import { loadEditableSetting } from '../_lib/editable-settings.js';
import { getPublicAssetsBucket, isApprovedImageKey, photoSchemaStatus, publicUrlForKey, safeText } from '../_lib/photo-library.js';
import galleryFallback from '../../../data/before_after_gallery.json';

const BUILD=408;
const DELETE_CONFIRM='DELETE_UNASSIGNED_R2_ASSET';
const EXPECTED_BINDINGS=['ROSIE_PUBLIC_ASSETS_BUCKET','PUBLIC_ASSETS_BUCKET','R2_PUBLIC_ASSETS_BUCKET','ASSETS_BUCKET'];

function bucketIdentity(env){
  const bindingName=EXPECTED_BINDINGS.find((name)=>env?.[name])||null;
  return {
    binding_name:bindingName,
    bucket_name:String(env?.PUBLIC_ASSETS_BUCKET_NAME||env?.R2_PUBLIC_ASSETS_BUCKET_NAME||'').trim()||null,
    environment:String(env?.APP_ENVIRONMENT||env?.CF_PAGES_BRANCH||env?.CF_PAGES_ENVIRONMENT||'unknown').trim()||'unknown',
    public_base_url:String(env?.PUBLIC_ASSET_BASE_URL||env?.ASSETS_PUBLIC_BASE_URL||'https://assets.rosiedazzlers.ca/').replace(/\/?$/,'/')
  };
}
function canonicalMediaRef(value=''){
  const raw=safeText(value,1500);
  if(!raw)return'';
  try{
    const parsed=new URL(raw,'https://rosiedazzlers.ca');
    return decodeURIComponent(parsed.pathname).replace(/^\/+/, '').replace(/\/{2,}/g,'/').toLowerCase();
  }catch{
    try{return decodeURIComponent(raw).replace(/^\/+/, '').replace(/\/{2,}/g,'/').split(/[?#]/)[0].toLowerCase();}
    catch{return raw.replace(/^\/+/, '').replace(/\/{2,}/g,'/').split(/[?#]/)[0].toLowerCase();}
  }
}
function galleryReferences(gallery,photo,env){
  const r2Key=safeText(photo?.r2_key,600);
  const candidates=new Set([
    canonicalMediaRef(photo?.media_url),
    canonicalMediaRef(r2Key),
    canonicalMediaRef(r2Key?publicUrlForKey(env,r2Key):''),
    canonicalMediaRef(r2Key?`/assets/${r2Key}`:'')
  ].filter(Boolean));
  const rows=Array.isArray(gallery?.items)?gallery.items:[];
  const refs=[];
  rows.forEach((item,index)=>{
    for(const field of ['before_url','after_url']){
      const value=safeText(item?.[field]||item?.[field.replace('_url','Url')],1500);
      if(!value)continue;
      const canonical=canonicalMediaRef(value);
      if(canonical&&candidates.has(canonical))refs.push({index,field,title:safeText(item?.title||item?.name||`Gallery row ${index+1}`,240),publication_status:safeText(item?.publication_status||'draft',40),url:value});
    }
  });
  return refs;
}

export async function onRequestPost({ request, env }) {
  let body = {};
  try { body = await request.json(); } catch {}
  const access = await requireStaffAccess({ request, env, body, capability:'manage_bookings', allowLegacyAdminFallback:true });
  if (!access.ok) return access.response;
  const identity=bucketIdentity(env);
  try {
    const schema = await photoSchemaStatus(env);
    if (!schema.ready) return json({ ok:false, build:BUILD, result_status:'unavailable', migration_required:true, migration:'sql/2026-08-12_build253_photo_management_studio.sql', error:'Apply the Build 253 photo-management migration before deleting managed photos.', schema, bucket_identity:identity },409);
    const id = safeText(body.id,80);
    if (!id) return json({ ok:false, build:BUILD, error:'Photo id is required.', bucket_identity:identity },400);
    const headers = serviceHeaders(env);

    // Current explicit Photo Studio usage is authoritative for assignment delete safety.
    const activeResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?select=id,target_key,target_label,is_active&media_id=eq.${encodeURIComponent(id)}&is_active=eq.true&limit=25`, { headers });
    if (!activeResponse.ok) return json({ ok:false, build:BUILD, error:`Could not verify active image assignments: ${await activeResponse.text()}`, bucket_identity:identity },500);
    const activeRows = await activeResponse.json().catch(()=>[]);
    if (Array.isArray(activeRows) && activeRows.length) {
      return json({ ok:false, build:BUILD, assigned:true, mutation_performed:false, asset_deleted:false, error:'This image is currently assigned and cannot be deleted. Remove its active placement(s) first.', assignments:activeRows.map((row)=>({target_key:row.target_key,target_label:row.target_label,is_active:true})), bucket_identity:identity },409);
    }

    const [photoResponse, historyResponse] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/app_media_library?select=*&id=eq.${encodeURIComponent(id)}&limit=1`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?select=*&media_id=eq.${encodeURIComponent(id)}&is_active=eq.false&limit=200`, { headers })
    ]);
    if (!photoResponse.ok) return json({ ok:false, build:BUILD, error:`Could not load the managed photo: ${await photoResponse.text()}`, bucket_identity:identity },500);
    if (!historyResponse.ok) return json({ ok:false, build:BUILD, error:`Could not verify inactive assignment history: ${await historyResponse.text()}`, bucket_identity:identity },500);
    const photos = await photoResponse.json().catch(()=>[]);
    const photo = Array.isArray(photos) ? photos[0] : null;
    if (!photo) return json({ ok:false, build:BUILD, error:'The managed photo was not found.', bucket_identity:identity },404);
    const inactiveHistory = await historyResponse.json().catch(()=>[]);
    const r2Key = safeText(photo.r2_key,500);
    if (!isApprovedImageKey(r2Key)) return json({ ok:false, build:BUILD, error:'Only approved public R2 image keys can be deleted from Photo Studio.', mutation_performed:false, asset_deleted:false, bucket_identity:identity },400);

    // Gallery proof is stored outside app_media_assignments. Protect both draft and published before/after rows.
    const loadedGallery=await loadEditableSetting(env,'before_after_gallery',{headers,fallback:galleryFallback});
    const galleryRefs=galleryReferences(loadedGallery?.value,photo,env);
    if(galleryRefs.length){
      return json({
        ok:false,build:BUILD,gallery_referenced:true,mutation_performed:false,asset_deleted:false,
        error:'This image is used by a Gallery Before/After row and cannot be deleted. Replace or remove that Gallery reference first.',
        gallery_references:galleryRefs,gallery_source_status:loadedGallery?.source_status||'unknown',bucket_identity:identity
      },409);
    }

    const bucket = getPublicAssetsBucket(env);
    if (!bucket || typeof bucket.delete !== 'function') return json({ ok:false, build:BUILD, result_status:'unavailable', error:'Public R2 bucket binding is not configured for deletion.', mutation_performed:false, asset_deleted:false, bucket_identity:identity },501);

    const executeRequested=body.execute===true||String(body.action||'').trim().toLowerCase()==='delete';
    if(!executeRequested){
      return json({
        ok:true,build:BUILD,result_status:'complete',dry_run:true,eligible:true,unassigned:true,
        mutation_performed:false,asset_deleted:false,explicit_authority_required:true,
        required:{admin:true,allow_r2_delete:true,confirm:DELETE_CONFIRM},
        id,r2_key:r2Key,label:photo.label||photo.filename||r2Key,inactive_history_rows:Array.isArray(inactiveHistory)?inactiveHistory.length:0,
        bucket_identity:identity
      });
    }

    const adminAuthorized=access.actor?.is_admin===true||access.actor?.is_legacy_admin===true||String(access.actor?.role_code||'').toLowerCase()==='admin';
    if(!adminAuthorized)return json({ok:false,build:BUILD,error:'Destructive R2 deletion requires an administrator.',mutation_performed:false,asset_deleted:false,explicit_authority_required:true,bucket_identity:identity},403);
    if(body.allow_r2_delete!==true||safeText(body.confirm,80)!==DELETE_CONFIRM){
      return json({ok:false,build:BUILD,error:'Explicit R2 deletion confirmation is required.',mutation_performed:false,asset_deleted:false,explicit_authority_required:true,required:{allow_r2_delete:true,confirm:DELETE_CONFIRM},bucket_identity:identity},409);
    }

    const restoreHistory = async()=>{
      if(!Array.isArray(inactiveHistory)||!inactiveHistory.length)return;
      await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?on_conflict=id`, {method:'POST',headers:{...headers,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(inactiveHistory)});
    };
    if(Array.isArray(inactiveHistory)&&inactiveHistory.length){
      const historyDelete=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?media_id=eq.${encodeURIComponent(id)}&is_active=eq.false`,{method:'DELETE',headers:{...headers,Prefer:'return=minimal'}});
      if(!historyDelete.ok)return json({ok:false,build:BUILD,error:`Could not clear inactive placement history before deletion: ${await historyDelete.text()}`,mutation_performed:false,asset_deleted:false,bucket_identity:identity},500);
    }

    // Delete the DB record before R2. The FK restrict remains the final race-condition guard against a new active assignment.
    const deleteResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_library?id=eq.${encodeURIComponent(id)}`, { method:'DELETE', headers:{...headers, Prefer:'return=representation'} });
    if (!deleteResponse.ok) {
      try { await restoreHistory(); } catch {}
      return json({ ok:false, build:BUILD, error:`The photo became referenced or could not be removed from the managed library: ${await deleteResponse.text()}`, mutation_performed:false, asset_deleted:false, bucket_identity:identity },409);
    }

    try {
      await bucket.delete(r2Key);
    } catch (r2Error) {
      // Compensate both the media row and its inactive placement history if storage deletion fails.
      try {
        await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_library`, { method:'POST', headers:{...headers, Prefer:'resolution=merge-duplicates,return=minimal'}, body:JSON.stringify(photo) });
        await restoreHistory();
      } catch {}
      return json({ ok:false, build:BUILD, result_status:'partial', error:`R2 deletion failed, so the managed record was restored. ${r2Error?.message || r2Error}`, restored:true, mutation_performed:false, asset_deleted:false, r2_key:r2Key, bucket_identity:identity },502);
    }
    return json({ ok:true, build:BUILD, result_status:'complete', deleted:true, mutation_performed:true, asset_deleted:true, explicit_authority_used:true, id, r2_key:r2Key, inactive_history_removed:Array.isArray(inactiveHistory)?inactiveHistory.length:0, label:photo.label || photo.filename || r2Key, bucket_identity:identity });
  } catch (err) {
    return json({ ok:false, build:BUILD, result_status:'unavailable', mutation_performed:false, asset_deleted:false, error:err?.message||'Could not delete the photo.', bucket_identity:identity },500);
  }
}