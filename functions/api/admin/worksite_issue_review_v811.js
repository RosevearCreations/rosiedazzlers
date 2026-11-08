// Build 811: authenticated operations-only customer concern queue and manual review.
import { requireStaffAccess, serviceHeaders, json as baseJson } from '../_lib/staff-auth.js';
import { requireActionAccess } from '../_lib/action-permissions.js';
import { sameOrigin811 } from '../client/worksite_issues_v811.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SELECT='id,customer_profile_id,booking_id,category,customer_description,status,submitted_at,updated_at,reviewed_at,reviewed_by_staff_user_id,staff_private_note,customer_visible_resolution,workflow_revision';
const NEXT={pending_review:new Set(['reviewing','resolved','closed_no_action']),reviewing:new Set(['resolved','closed_no_action'])};
const respond=(data,status=200)=>{const response=baseJson(data,status);const h=new Headers(response.headers);h.set('Cache-Control','no-store');h.set('X-Content-Type-Options','nosniff');return new Response(response.body,{status:response.status,headers:h});};

export function validStaffDecision811(body) {
  if (!body || typeof body!=='object' || Array.isArray(body)) return null;
  const id=String(body.issue_id||'').trim();
  const expected=String(body.expected_status||'').trim();
  const next=String(body.status||'').trim();
  const revision=body.expected_revision;
  const resolution=typeof body.resolution==='string'?body.resolution.trim():'';
  const privateNote=typeof body.private_note==='string'?body.private_note.trim():'';
  if(!UUID.test(id)||!NEXT[expected]?.has(next)||!Number.isSafeInteger(revision)||revision<0||revision>2147483645||resolution.length>1000||privateNote.length>800||
    (next!=='reviewing'&&resolution.length<8))return null;
  return {id,expected,next,resolution,privateNote,revision};
}

export async function staffAccess811(request,env) {
  const access=await requireStaffAccess({request,env,capability:'manage_bookings',allowLegacyAdminFallback:false});
  if (!access.ok) return access;
  // The legacy header-based staff bridge is explicitly insufficient for this
  // sensitive customer-report read/write surface: require a real signed session.
  if (access.auth_mode!=='session' || !UUID.test(String(access.actor?.id||'')))
    return {ok:false,response:respond({ok:false,error:'An authenticated staff session is required.'},401)};
  const permission=requireActionAccess(access.actor,'operations.customer.manage');
  return permission.ok ? access : {ok:false,response:permission.response};
}

export const onRequestOptions=()=>respond({ok:false,error:'Method not allowed.'},405);

export async function onRequestGet({request,env}) {
  const access=await staffAccess811(request,env);
  if(!access.ok)return access.response;
  try {
    const rows=await loadRows(env,`customer_worksite_issues_v811?select=${SELECT}&order=submitted_at.desc&limit=100`);
    return respond({ok:true,issues:rows.map(staffIssue811),authority:{session_verified:true,operations_review:true,automatic_booking_change:false,automatic_notification:false}});
  } catch {return respond({ok:false,error:'Worksite review queue is temporarily unavailable.'},503);}
}

export async function onRequestPost({request,env}) {
  if(!sameOrigin811(request))return respond({ok:false,error:'Staff review must come from this application.'},403);
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return respond({ok:false,error:'JSON is required.'},415);
  const access=await staffAccess811(request,env);
  if(!access.ok)return access.response;
  try {
    const raw=await request.text();
    if(raw.length>2500)return respond({ok:false,error:'Review is too large.'},413);
    const decision=validStaffDecision811(JSON.parse(raw));
    if(!decision)return respond({ok:false,error:'Select a permitted next status. A completed review needs a customer-visible explanation of at least eight characters.'},400);
    const now=new Date().toISOString();
    const patch={status:decision.next,updated_at:now,reviewed_at:now,reviewed_by_staff_user_id:access.actor.id,workflow_revision:decision.revision+1,
      staff_private_note:decision.privateNote||null,customer_visible_resolution:decision.resolution||null};
    // Both id and expected status must still match: simultaneous reviewers cannot
    // accidentally overwrite a newer decision.
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/customer_worksite_issues_v811?select=${SELECT}&id=eq.${encodeURIComponent(decision.id)}&status=eq.${encodeURIComponent(decision.expected)}&workflow_revision=eq.${decision.revision}`,{
      method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify(patch)
    });
    if(!response.ok)return respond({ok:false,error:'Review could not be recorded. Refresh the queue.'},503);
    const rows=await response.json().catch(()=>[]);
    if(!Array.isArray(rows)||!rows[0])return respond({ok:false,error:'Another review changed this issue. Refresh before proceeding.'},409);
    return respond({ok:true,issue:staffIssue811(rows[0]),booking_changed:false,notification_sent:false});
  }catch(error){
    if(error instanceof SyntaxError)return respond({ok:false,error:'Invalid review format.'},400);
    return respond({ok:false,error:'Review service is temporarily unavailable.'},503);
  }
}

function staffIssue811(row){return {id:row.id,customer_profile_id:row.customer_profile_id,booking_id:row.booking_id,category:row.category,
  description:row.customer_description,status:row.status,submitted_at:row.submitted_at,updated_at:row.updated_at,
  reviewed_at:row.reviewed_at,reviewed_by_staff_user_id:row.reviewed_by_staff_user_id,
  private_note:row.staff_private_note,resolution:row.customer_visible_resolution,workflow_revision:row.workflow_revision};}
async function loadRows(env,path){const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});if(!r.ok)throw Error('Source unavailable');const rows=await r.json();if(!Array.isArray(rows))throw Error('Unexpected source');return rows;}
