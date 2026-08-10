import { requireStaffAccess, json } from '../_lib/staff-auth.js';
import { serviceReady, rest, jsonBody, clean } from '../_lib/daip-media.js';

const UUID=/^[0-9a-f-]{36}$/i;
const STORY_STATUS=new Set(['not_reviewed','selected','excluded']);
const CAPTURE_STAGE=new Set(['before','process','after','damage','interior','exterior','engine','other']);
const CONSENT_STATUS=new Set(['not_reviewed','internal_only','approved_public','declined','expired']);

export async function onRequest(context){
  if(context.request.method==='OPTIONS')return json({},204);
  if(context.request.method!=='POST')return json({ok:false,error:'Method not allowed.'},405);
  const auth=await requireStaffAccess({request:context.request,env:context.env,capability:'manage_staff',allowLegacyAdminFallback:true});
  if(!auth.ok)return auth.response;
  if(!serviceReady(context.env))return json({ok:false,error:'Supabase service configuration is missing.'},503);
  const body=await jsonBody(context.request),assetId=clean(body.asset_id,80),storyStatus=clean(body.story_review_status,30)||'not_reviewed';
  if(!UUID.test(assetId))return json({ok:false,error:'Valid asset_id is required.'},400);
  if(!STORY_STATUS.has(storyStatus))return json({ok:false,error:'Invalid story review status.'},400);
  try{
    const asset=(await rest(context.env,`daip_project_media_assets?select=id,project_id,upload_status,consent_status,story_review_status&id=eq.${encodeURIComponent(assetId)}&limit=1`))?.[0];
    if(!asset)return json({ok:false,error:'DAIP media asset not found.'},404);
    const nextConsent=clean(body.consent_status,30)||asset.consent_status;
    if(!CONSENT_STATUS.has(nextConsent))return json({ok:false,error:'Invalid consent status.'},400);
    if(storyStatus==='selected'&&asset.upload_status!=='uploaded')return json({ok:false,error:'Only completed private raw media can be selected for story evidence.'},409);
    if(storyStatus==='selected'&&['declined','expired'].includes(nextConsent))return json({ok:false,error:'Declined or expired-consent media cannot be selected for story evidence.'},409);
    const captureStage=clean(body.capture_stage,30);
    if(captureStage&&!CAPTURE_STAGE.has(captureStage))return json({ok:false,error:'Invalid capture stage.'},400);
    const order=body.story_sort_order===''||body.story_sort_order==null?null:Number(body.story_sort_order);
    if(order!=null&&(!Number.isInteger(order)||order<1||order>9999))return json({ok:false,error:'Story order must be a whole number from 1 to 9999.'},400);
    const now=new Date().toISOString(),email=clean(auth.actor?.email,200)||null;
    const patch={
      story_review_status:storyStatus,
      story_sort_order:storyStatus==='selected'?order:null,
      story_note:clean(body.story_note,1200)||null,
      story_reviewed_by_staff_email:email,
      story_reviewed_at:now,
      consent_status:nextConsent,
      updated_at:now
    };
    if(captureStage)patch.capture_stage=captureStage;
    await rest(context.env,`daip_project_media_assets?id=eq.${encodeURIComponent(assetId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(patch)});
    await rest(context.env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({project_id:asset.project_id,event_type:'media_story_reviewed',actor_staff_email:email,safe_note:`Private media ${assetId} marked ${storyStatus} for story evidence review. Public destination remains disabled.`})}).catch(()=>{});
    return json({ok:true,asset_id:assetId,story_review_status:storyStatus,public_destination_enabled:false,message:`Private media marked ${storyStatus}. This does not make the raw file public.`});
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    return json({ok:false,error:message.includes('column')?'Build 248 migration is required before story-evidence review can be saved.':message||'Could not update story evidence review.'},500);
  }
}
