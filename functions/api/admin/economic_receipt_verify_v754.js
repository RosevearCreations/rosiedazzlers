import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {onRequestGet as sourceRead753} from './economic_retest_v753.js';
import {verifyOwnerEconomicProof754} from '../_lib/owner-receipt-verification-v754.js';

const hold=(error,status=400)=>json({ok:false,build:754,error,closure_gate:'HOLD',closure_recorded:false,automatic_business_write:false},status);
const forbidden=()=>hold('This evidence endpoint cannot change economic or customer records.',405);
async function authorize(request,env){
  const access=await requireStaffAccess({request,env,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!access.ok)return access.response;
  return access.auth_mode==='session'?null:hold('A signed-in, capability-bound staff session is required.',403);
}

export async function onRequestGet({request,env}){
  const denied=await authorize(request,env);
  if(denied)return denied;
  return json({ok:true,build:754,read_only:true,closure_gate:'HOLD_PENDING_INDEPENDENT_PROOF',
    configuration:{owner_public_key_configured:!!env.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64,
      owner_key_id_configured:!!env.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID,
      source_public_key_configured:!!env.ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64,
      source_key_id_configured:!!env.ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID},
    owner_receipt_authenticated:false,source_attestation_authenticated:false,source_correction_record_verified:false,
    closure_recorded:false,closure_allowed:false,automatic_business_write:false});
}

export async function onRequestPost({request,env,context}){
  const denied=await authorize(request,env);
  if(denied)return denied;
  const origin=request.headers.get('origin');
  if(!origin||origin!==new URL(request.url).origin)return hold('A same-origin browser request is required.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return hold('Send JSON evidence only.',415);
  if(Number(request.headers.get('content-length')||0)>16000)return hold('Signed evidence exceeds maximum request size.',413);
  let body;
  try{
    const raw=await request.text();
    if(raw.length>16000)throw Error('oversized');
    body=JSON.parse(raw);
  }catch{return hold('A valid signed-evidence JSON payload under 16 KB is required.');}
  const period=body?.period,bookingId=body?.booking_id;
  if(typeof period!=='string'||!/^20\d{2}-(0[1-9]|1[012])$/.test(period)||
    typeof bookingId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookingId)||
    body?.owner_receipt?.payload?.booking_id!==bookingId||body?.owner_receipt?.payload?.period!==period||
    body?.source_attestation?.payload?.booking_id!==bookingId||body?.source_attestation?.payload?.period!==period)
    return hold('Period, booking ID and signed scope must match.');
  const [year,month]=period.split('-');
  const sourceUrl=new URL('/api/admin/economic_retest_v753',request.url);
  sourceUrl.searchParams.set('month',String(Number(month)));
  sourceUrl.searchParams.set('year',year);
  // This is a fresh privileged source read. It enforces the staff session again.
  const sourceRequest=new Request(sourceUrl,{headers:{cookie:request.headers.get('cookie')||''}});
  const result=await sourceRead753({request:sourceRequest,env,context});
  if(!result.ok)return hold('The current authoritative economic source could not be read.',503);
  let live;
  try{live=await result.json();}catch{return hold('Current economic source returned invalid evidence.',503);}
  if(!live?.ok)return hold('Current economic source is unavailable or ambiguous.',503);
  try{return json(await verifyOwnerEconomicProof754({owner_receipt:body.owner_receipt,source_attestation:body.source_attestation,live,env}));}
  catch{return hold('Independent signature verification could not be completed.',503);}
}

export async function onRequestPut(){return forbidden();}
export async function onRequestPatch(){return forbidden();}
export async function onRequestDelete(){return forbidden();}
export async function onRequestOptions(){return new Response('',{status:204,headers:{'Allow':'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
