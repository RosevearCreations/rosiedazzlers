// Build 701 / QL-256 — owner-only runtime binding PRESENCE inspection.
// No key, token, origin URL, identity, pin value or gateway request is returned.
import {requireStaffAccess,json} from '../_lib/staff-auth.js';

const SHA40=/^[a-f0-9]{40}$/;
const SHA64=/^[a-f0-9]{64}$/;
const CI=/^https:\/\/github\.com\/RosevearCreations\/rosiedazzlers\/actions\/runs\/[0-9]+$/;
const CHALLENGE=/^np-[A-Za-z0-9_-]+$/;
const KEY_ID=/^[A-Za-z0-9_-]{8,80}$/;
const B64URL=/^[A-Za-z0-9_-]{43}$/;
const DEFINITIONS=[
  ['SUPABASE_URL','server_binding','URL_PRESENT_ONLY'],
  ['SUPABASE_SERVICE_ROLE_KEY','server_secret','NONEMPTY'],
  ['ROSEVEAR_INTEGRATION_V1_MODE','nonproduction_gate','NONPRODUCTION'],
  ['ROSEVEAR_INTEGRATION_V1_NONPROD_ORIGIN','nonproduction_gate','HTTPS_URL_PRESENT_ONLY'],
  ['ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_ID','nonproduction_auth','KEY_ID'],
  ['ROSEVEAR_INTEGRATION_V1_CURRENT_KEY_B64','nonproduction_secret','B64_SECRET'],
  ['ROSEVEAR_INTEGRATION_V1_REVOKED_KEY_IDS','nonproduction_auth','NONEMPTY'],
  ['ROSEVEAR_QL246_TRUSTED_SPKI_SHA256','source_proof_pin','SHA64'],
  ['ROSEVEAR_QL246_EXPECTED_SOURCE_SHA','source_proof_pin','SHA40'],
  ['ROSEVEAR_QL246_EXPECTED_CI_RUN_URL','source_proof_pin','CI'],
  ['ROSEVEAR_QL246_EXPECTED_CHALLENGE_ID','source_proof_pin','CHALLENGE'],
  ['ROSEVEAR_QL246_EXPECTED_CHALLENGE_SHA256','source_proof_pin','SHA64'],
  ['ROSEVEAR_QL248_EXPECTED_PROOF_COMMIT_SHA','source_proof_pin','SHA40'],
  ['ROSEVEAR_QL248_EXPECTED_PROOF_SHA256','source_proof_pin','SHA64'],
];
function valid(value,kind){
  const str=String(value||'');
  if(!str)return false;
  switch(kind){
    case 'SHA40':return SHA40.test(str);
    case 'SHA64':return SHA64.test(str);
    case 'CI':return CI.test(str);
    case 'CHALLENGE':return CHALLENGE.test(str);
    case 'KEY_ID':return KEY_ID.test(str);
    case 'NONPRODUCTION':return str==='nonproduction';
    case 'HTTPS_URL_PRESENT_ONLY':try{const u=new URL(str);return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash;}catch{return false;}
    case 'URL_PRESENT_ONLY':try{const u=new URL(str);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}
    case 'B64_SECRET':return B64URL.test(str.replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,''));
    default:return str.trim().length>0;
  }
}
export function ql256RuntimeInventory(env={}){
  const rows=DEFINITIONS.map(([name,category,kind])=>({name,category,
    configured:valid(env[name],kind),value:'REDACTED_OR_NOT_INSPECTED'}));
  const configured=Object.fromEntries(rows.map(r=>[r.name,r.configured]));
  return {build:701,ql:'QL-256',read_only:true,scope:'SIGNED_IN_OWNER_SERVER_ENV_PRESENCE_ONLY',
    application_name:'Rosie Dazzlers',repository:'RosevearCreations/rosiedazzlers',
    bindings:rows,production_branch:env.CF_PAGES_BRANCH==='main',
    production_integration_gate_enabled:false,
    runtime_ql246_pin_fields_complete:[
      'ROSEVEAR_QL246_TRUSTED_SPKI_SHA256','ROSEVEAR_QL246_EXPECTED_SOURCE_SHA',
      'ROSEVEAR_QL246_EXPECTED_CI_RUN_URL','ROSEVEAR_QL246_EXPECTED_CHALLENGE_ID',
      'ROSEVEAR_QL246_EXPECTED_CHALLENGE_SHA256'].every(name=>configured[name]),
    signer_provisioning_decision:'SIGNER_STATUS_UNKNOWN',
    // A Pages variable is not proof of a separately provisioned, privately held signer.
    signer_custodian_privately_authenticated:false,
    independent_witness_privately_authenticated:false,
    reviewer_privately_authenticated:false,
    source_proof_independently_verified:false,
    owner_test_authorization:'NOT_GIVEN',genuine_gateway_receipts:'NOT_RUN',
    original_gift_hold_unaffected:true,resend_permitted:false,
    connection_state:'DISCONNECTED',
    next_concrete_blocker:'Owner must nominate an independent real-world signer custodian and distinct witness/reviewer in a private authenticated channel; a durable custodian-controlled Ed25519 key and SPKI pin must then be verified out of band.'};
}
function reply(data,status=200){const r=json(data,status),h=new Headers(r.headers);
  h.set('Cache-Control','private, no-store');h.set('Referrer-Policy','no-referrer');
  h.set('X-Content-Type-Options','nosniff');return new Response(r.body,{status:r.status,headers:h});}
export async function onRequestGet({request,env}){
  const a=await requireStaffAccess({request,env,allowLegacyAdminFallback:false});
  if(!a.ok)return a.response;
  if(a.auth_mode!=='session'||a.actor?.role_code!=='admin'||a.actor?.is_admin!==true)
    return reply({ok:false,error:'Signed-in owner required.'},403);
  return reply({ok:true,...ql256RuntimeInventory(env)});
}
