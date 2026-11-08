// Build 815: customer sees only safe progress for follow-ups owned by their
// authenticated customer profile; staff reasons, actors and audit remain private.
import { customerIdentity811,loadRows } from './worksite_issues_v811.js';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function safeCustomerEscalation815(row){return {followup_id:row.followup_id,status:row.status,
  flagged_at:row.flagged_at,acknowledged_at:row.acknowledged_at||null,cleared_at:row.cleared_at||null};}
export const onRequestOptions=()=>json({ok:false,error:'Method not allowed.'},405);
export async function onRequestGet({request,env}){
  try{
    const identity=await customerIdentity811(request,env);if(!identity)return json({ok:false,error:'Sign in to view supervisor review progress.'},401);
    const owned=await loadRows(env,`customer_worksite_followups_v814?select=id&customer_profile_id=eq.${encodeURIComponent(identity.profileId)}&order=requested_at.desc&limit=100`);
    const ids=owned.map(row=>row.id).filter(id=>UUID.test(String(id)));
    const rows=ids.length?await loadRows(env,`customer_worksite_followup_escalations_v815?select=followup_id,status,flagged_at,acknowledged_at,cleared_at&followup_id=in.(${ids.join(',')})&limit=100`):[];
    return json({ok:true,escalations:rows.map(safeCustomerEscalation815),authority:{customer_scoped:true,internal_notes_excluded:true,notification_sent:false}});
  }catch{return json({ok:false,error:'Supervisor review progress is temporarily unavailable. Please try again.'},503);}
}
