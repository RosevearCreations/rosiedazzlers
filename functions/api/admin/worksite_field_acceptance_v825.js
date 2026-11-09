// Build 825 — signed supervisor-only, read-only field-acceptance composition.
// Does not write observations, move canonical HOLDs, publish or change business records.
import {serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {staffAccess811} from './worksite_issue_review_v811.js';
import {onRequestGet as getDeviceAuthority} from './authenticated_device_visual_acceptance.js';
import {EVIDENCE_SOURCES_825,countFromPostgrest825,fieldAcceptance825} from '../../../assets/build825-field-readiness.mjs';

const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private',
  'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow'
}});
const supervisor=actor=>['admin','operations_manager'].includes(String(actor?.role_code||'').toLowerCase())&&
  hasActionAccess(actor,'operations.assignment.manage');
export async function sourceCount825(env,table){
  if(!/^[a-z][a-z0-9_]{2,80}$/.test(table)||!Object.values(EVIDENCE_SOURCES_825).includes(table))return {status:'unavailable',count:null};
  try{
    const result=await fetch(env.SUPABASE_URL+'/rest/v1/'+table+'?select=id&limit=1',{
      headers:{...serviceHeaders(env),Prefer:'count=exact'},redirect:'error'});
    if(!result.ok)return {status:'unavailable',count:null};
    const data=await result.json();
    if(!Array.isArray(data)||data.length>1)return {status:'unavailable',count:null};
    const n=countFromPostgrest825(result.headers.get('Content-Range'),data.length);
    return n===null?{status:'unavailable',count:null}:{status:'available',count:n};
  }catch{return {status:'unavailable',count:null};}
}
async function deviceAuthority825(request,env){
  try{
    // Reuse existing independently permissioned IT diagnostics authority.
    // If the operator lacks it_diagnostics, do NOT bypass or copy its evidence.
    const response=await getDeviceAuthority({request:request.clone(),env});
    if(!response.ok)return {available:false,reason:'it_authority_unavailable'};
    const json=await response.json();
    if(!json?.ok||!json.evidence||json.authority!=='authenticated_device_visual_acceptance')
      return {available:false,reason:'it_authority_unavailable'};
    const evidence=json.evidence;
    return {available:true,evidence:{
      closure_candidate:evidence.closure_candidate===true,
      roles:Array.isArray(evidence.roles)?evidence.roles.map(r=>({
        id:r.id,status:r.status,current_pass:r.current_pass===true,current_regression:r.current_regression===true,
        observed_at:r.observed_at||null,device_classes:r.device_classes||[]
      })):[],
      devices:Array.isArray(evidence.devices)?evidence.devices.map(d=>({
        id:d.id,status:d.status,observed:d.observed===true,observed_at:d.observed_at||null
      })):[]}};
  }catch{return {available:false,reason:'it_authority_unavailable'};}
}
export const onRequestOptions=()=>reply({ok:false,error:'Method not allowed.'},405);
export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);
  if(!access.ok)return access.response;
  if(!supervisor(access.actor))return reply({ok:false,error:'Signed supervisor review permission is required.'},403);
  const started=new Date().toISOString();
  const list=Object.entries(EVIDENCE_SOURCES_825);
  const [items,device]=await Promise.all([
    Promise.all(list.map(async ([key,table])=>[key,await sourceCount825(env,table)])),
    deviceAuthority825(request,env)
  ]);
  const sources=Object.fromEntries(items);
  const acceptance=fieldAcceptance825({sources,deviceEvidence:device.available?device.evidence:null,generatedAt:started});
  return reply({ok:true,build:825,generated_at:started,scope:'signed_supervisor_read_only',
    authority:{signed_staff_session:true,supervisor_action:true,
      device_it_diagnostics_authority:device.available?'verified_read':'unavailable_without_bypass',
      exact_source_counts_only:true,auto_close_hold:false,customer_notified:false,
      billing_changed:false,booking_changed:false,accounting_changed:false},
    acceptance,readiness_notes:{
      percentages_source:'docs/ROSIE_MODULE_COMPLETION_AUDIT_20261108.md',
      percentages_provisional:true,percentages_automatically_revised:false,
      role_device_evidence_authority:'authenticated_device_visual_acceptance',
      device_evidence_not_synthesized:true,
      canonical_hold_source:'STARTUP_GO_LIVE_BLOCKERS.md',
      observation_window:'Manual refresh only; counts are point-in-time, not complete operational proof.'
    }});
}
