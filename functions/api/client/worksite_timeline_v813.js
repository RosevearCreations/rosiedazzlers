// Build 813: customer-scoped, privacy-safe historical event readback.
// No customer input controls issue identifiers: ownership is resolved server-side.
import { customerIdentity811, loadRows } from './worksite_issues_v811.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SELECT='issue_id,event_kind,recorded_at,current_status,current_escalation,customer_resolution_snapshot';
const KIND=new Set(['assignment_changed','staff_acknowledged','arrival_escalation_changed','review_status_changed','resolution_updated']);
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

export function safeCustomerTimelineEvent813(row) {
  return {issue_id:row.issue_id,kind:KIND.has(row.event_kind)?row.event_kind:'unknown',
    recorded_at:row.recorded_at,status:row.current_status||null,
    escalation:row.current_escalation||null,
    resolution:typeof row.customer_resolution_snapshot==='string'?row.customer_resolution_snapshot:null};
}
export const onRequestOptions=()=>json({ok:false,error:'Method not allowed.'},405);

export async function onRequestGet({request,env}) {
  try {
    const identity=await customerIdentity811(request,env);
    if(!identity)return json({ok:false,error:'Sign in to view your worksite timeline.'},401);
    const issues=await loadRows(env,`customer_worksite_issues_v811?select=id&customer_profile_id=eq.${encodeURIComponent(identity.profileId)}&order=submitted_at.desc&limit=50`);
    const ids=issues.map(row=>row.id).filter(id=>UUID.test(String(id)));
    if(!ids.length)return json({ok:true,events:[],authority:{customer_scoped:true,prior_history_backfilled:false,notification_sent:false}});
    const history=await loadRows(env,`customer_worksite_issue_events_v813?select=${SELECT}&issue_id=in.(${ids.join(',')})&order=recorded_at.desc&limit=300`);
    const owned=new Set(ids);
    return json({ok:true,events:history.filter(row=>owned.has(row.issue_id)).map(safeCustomerTimelineEvent813),
      authority:{customer_scoped:true,prior_history_backfilled:false,notification_sent:false}});
  }catch{return json({ok:false,error:'The worksite timeline could not be verified. Please refresh later.'},503);}
}
