// Historical Build 253 compatibility token: build:253
// Build 260 compatibility: reset_to_default + multi_placement_supported
// Build 261: assignment writes use one direct database mutation after auth; no per-save schema probe.
// Build 314: fail closed when the same managed photo is selected for both sides of a Before/After pair.
import { requireStaffAccess, serviceHeaders, json } from '../_lib/staff-auth.js';
import { safeText } from '../_lib/photo-library.js';

const BUILD=314;

function migrationResponse(detail=''){
  return json({
    ok:false,
    migration_required:true,
    migration:'sql/2026-08-12_build253_photo_management_studio.sql',
    error:'Photo assignments are not ready. Apply the Build 253 photo-management migration, then retry.',
    detail:String(detail||'').slice(0,500)
  },409);
}
function looksLikeSchemaError(text=''){
  const value=String(text||'').toLowerCase();
  return value.includes('42p01')||value.includes('42703')||value.includes('app_media_assignments')&&/does not exist|schema cache|column/.test(value);
}
function counterpartTargetKey(targetKey='',targetType=''){
  if(String(targetType||'')!=='before_after_pair')return'';
  const key=String(targetKey||'');
  if(/:before$/i.test(key))return key.replace(/:before$/i,':after');
  if(/:after$/i.test(key))return key.replace(/:after$/i,':before');
  return'';
}
async function verifyDistinctPairPhoto(env,{targetKey,targetType,mediaId,headers}){
  const counterpartKey=counterpartTargetKey(targetKey,targetType);
  if(!counterpartKey)return {ok:true,counterpart_key:''};
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?select=media_id,target_key,target_label,is_active&target_key=eq.${encodeURIComponent(counterpartKey)}&is_active=eq.true&limit=1`,{headers});
  if(!response.ok){
    const detail=await response.text();
    if(looksLikeSchemaError(detail))return {ok:false,migration:true,detail};
    return {ok:false,error:`Could not verify the paired photo slot: ${detail.slice(0,500)}`};
  }
  const rows=await response.json().catch(()=>[]);
  const counterpart=Array.isArray(rows)?rows[0]||null:null;
  if(counterpart&&String(counterpart.media_id||'')===String(mediaId||'')){
    return {
      ok:false,
      conflict:true,
      counterpart_key:counterpartKey,
      counterpart_label:counterpart.target_label||counterpartKey,
      error:'Before and After must use two different photos. Select a different image for the paired slot.'
    };
  }
  return {ok:true,counterpart_key:counterpartKey,counterpart};
}

export async function onRequestPost({request,env}){
  let body={};try{body=await request.json();}catch{}
  const access=await requireStaffAccess({request,env,body,capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  try{
    const targetKey=safeText(body.target_key,240);
    if(!targetKey)return json({ok:false,error:'Target key is required.'},400);
    const now=new Date().toISOString();
    if(body.action==='remove'){
      const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?target_key=eq.${encodeURIComponent(targetKey)}`,{
        method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=minimal'},
        body:JSON.stringify({is_active:false,updated_at:now,updated_by:access.actor?.email||'staff'})
      });
      if(!response.ok){const detail=await response.text();if(looksLikeSchemaError(detail))return migrationResponse(detail);return json({ok:false,error:`Could not remove assignment: ${detail.slice(0,500)}`},500);}
      return json({ok:true,build:BUILD,removed:true,reset_to_default:true,target_key:targetKey,multi_placement_supported:true});
    }
    const mediaId=safeText(body.media_id,80);
    if(!mediaId)return json({ok:false,error:'Select a saved photo before assigning it.'},400);
    const targetType=safeText(body.target_type,80)||'component';
    const headers=serviceHeaders(env);
    const pairCheck=await verifyDistinctPairPhoto(env,{targetKey,targetType,mediaId,headers});
    if(!pairCheck.ok){
      if(pairCheck.migration)return migrationResponse(pairCheck.detail);
      return json({ok:false,build:BUILD,pair_conflict:pairCheck.conflict===true,counterpart_key:pairCheck.counterpart_key||'',counterpart_label:pairCheck.counterpart_label||'',error:pairCheck.error||'Could not verify the paired photo slot.'},pairCheck.conflict?409:500);
    }
    const payload={
      target_key:targetKey,media_id:mediaId,
      target_label:safeText(body.target_label,240)||targetKey,
      target_type:targetType,
      page_path:safeText(body.page_path,300)||null,
      component_key:safeText(body.component_key,160)||null,
      variant:safeText(body.variant,80)||null,
      alt_override:safeText(body.alt_override,300)||null,
      title_override:safeText(body.title_override,240)||null,
      caption_override:safeText(body.caption_override,1000)||null,
      is_active:true,updated_at:now,updated_by:access.actor?.email||'staff'
    };
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?on_conflict=target_key`,{
      method:'POST',headers:{...headers,Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(payload)
    });
    if(!response.ok){const detail=await response.text();if(looksLikeSchemaError(detail))return migrationResponse(detail);return json({ok:false,error:`Could not save photo assignment: ${detail.slice(0,500)}`},500);}
    const rows=await response.json().catch(()=>[]);
    return json({ok:true,build:BUILD,assignment:Array.isArray(rows)?rows[0]||null:null,multi_placement_supported:true,pair_counterpart_key:pairCheck.counterpart_key||'',pair_counterpart:pairCheck.counterpart||null});
  }catch(err){return json({ok:false,error:err?.message||'Could not save photo assignment.'},500);}
}