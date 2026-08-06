// Build 218 — internal-only DAIP privacy review. Cannot clear an asset for public release.
import { requireStaffAccess, serviceHeaders, json, isUuid } from '../_lib/staff-auth.js';
import { readTestControl, safeShortText, SAFE_PRIVACY_STATUSES, appendAuditEvent, daipError, withCors, corsHeaders, DAIP_BUILD, safeJson } from '../_lib/daip-test-mode.js';

export async function onRequestOptions(){return new Response('',{status:204,headers:corsHeaders()});}
export async function onRequestPost({request,env}){
 try{
  const body=await request.json().catch(()=>({})); const access=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:true}); if(!access.ok)return withCors(access.response);
  const control=await readTestControl(env); if(!control.ok)return daipError(control.error,409);
  const assetId=String(body.media_asset_id||'').trim(); const status=String(body.review_status||'').trim(); const note=safeShortText(body.reviewer_note,2000);
  if(!isUuid(assetId))return daipError('Choose a valid registered test asset.',400); if(!SAFE_PRIVACY_STATUSES.has(status))return daipError('Choose a safe internal privacy-review result.',400);
  const assetRes=await fetch(`${env.SUPABASE_URL}/rest/v1/daip_media_assets?select=id,media_job_id,privacy_status,public_export_blocked&id=eq.${encodeURIComponent(assetId)}&limit=1`,{headers:serviceHeaders(env)}); const assetRows=safeJson(await assetRes.text())||[]; const asset=assetRows[0]||null;
  if(!assetRes.ok||!asset)return daipError('DAIP test asset was not found.',404); if(asset.public_export_blocked!==true)return daipError('Unsafe DAIP asset state detected. Public export must remain blocked.',409);
  const now=new Date().toISOString(); const row={media_asset_id:assetId,review_status:status,reviewer_note:note,reviewer_staff_user_id:isUuid(access.actor?.id)?access.actor.id:null,public_export_blocked:true,reviewed_at:status==='not_started'?null:now,updated_at:now};
  const reviewRes=await fetch(`${env.SUPABASE_URL}/rest/v1/daip_privacy_reviews?on_conflict=media_asset_id`,{method:'POST',headers:{...serviceHeaders(env),Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify([row])}); const reviewText=await reviewRes.text(); const review=safeJson(reviewText)?.[0]||null; if(!reviewRes.ok||!review)return daipError('Could not save the internal privacy review.',500);
  const assetPatch=await fetch(`${env.SUPABASE_URL}/rest/v1/daip_media_assets?id=eq.${encodeURIComponent(assetId)}`,{method:'PATCH',headers:serviceHeaders(env),body:JSON.stringify({privacy_status:status,updated_at:now})}); if(!assetPatch.ok)return daipError('Privacy review was saved but asset state could not be synchronized.',500);
  const allRes=await fetch(`${env.SUPABASE_URL}/rest/v1/daip_media_assets?select=id,privacy_status&media_job_id=eq.${encodeURIComponent(asset.media_job_id)}`,{headers:serviceHeaders(env)}); const all=safeJson(await allRes.text())||[]; const reviewed=all.length>0&&all.every((row)=>['internal_only_cleared','blocked_private'].includes(row.privacy_status)); const jobStatus=reviewed?'internal_review_complete':'privacy_review_required';
  await fetch(`${env.SUPABASE_URL}/rest/v1/daip_media_jobs?id=eq.${encodeURIComponent(asset.media_job_id)}`,{method:'PATCH',headers:serviceHeaders(env),body:JSON.stringify({status:jobStatus,updated_at:now})});
  await appendAuditEvent(env,{media_job_id:asset.media_job_id,media_asset_id:assetId,actor_staff_user_id:access.actor?.id,event_type:'privacy_review_saved',reason:'Internal-only privacy review saved. Public export remains blocked.',safe_metadata:{build:DAIP_BUILD,review_status:status,public_export_blocked:true}});
  return withCors(json({ok:true,build:DAIP_BUILD,review:{id:review.id,review_status:review.review_status,reviewed_at:review.reviewed_at,public_export_blocked:true},job_status:jobStatus}));
 }catch(err){return withCors(json({ok:false,error:err?.message||'Could not save DAIP privacy review.'},500));}
}
