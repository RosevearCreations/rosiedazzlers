import {json} from '../_lib/staff-auth.js';
import {onRequestGet as ownerEvidenceGet} from './economic_acceptance_v752.js';

const reject=()=>json({ok:false,build:753,error:'Build 753 has no receipt or source mutation endpoint. Independent owner approval and correction belong to separately authorized workflows.'},405);
export async function onRequestGet({request,env,context}){
  // Build 752 delegates to signed-in capability-bound Build 751 before any private source read.
  const source=await ownerEvidenceGet({request,env,context});
  if(!source.ok)return source;
  try{
    const data=await source.json();
    if(!data?.ok||data.build!==752||!data.snapshot_sha256)throw Error('Current Build 752 source is unverified.');
    if(!globalThis.crypto?.randomUUID)throw Error('Source read identity generator unavailable.');
    return json({...data,build:753,source_build:752,read_id:crypto.randomUUID(),read_at:new Date().toISOString(),
      owner_approval_verified:false,source_correction_verified:false,receipt_authentication:'not_performed',read_only:true});
  }catch(error){return json({ok:false,build:753,error:String(error?.message||'Source recheck unavailable.').slice(0,350)},503);}
}
export async function onRequestPost(){return reject();}
export async function onRequestPut(){return reject();}
export async function onRequestPatch(){return reject();}
export async function onRequestDelete(){return reject();}
export async function onRequestOptions(){return new Response('',{status:204,headers:{'Access-Control-Allow-Methods':'GET,OPTIONS','Cache-Control':'no-store'}});}
