// Rosie 881 — bounded, server-side, service-role-only reads, no writes.
import {serviceHeaders} from './staff-auth.js';
import {pinnedIssuerRoster878,pinnedKeyId878} from './roadside-provenance-pin-v878.js';
const baseUrl=env=>{
 if(!/^https:\/\/[^/]+$/.test((env?.SUPABASE_URL||'').replace(/\/+$/,''))||
  !env.SUPABASE_SERVICE_ROLE_KEY)throw Error('Original private Supabase authority missing');
 return env.SUPABASE_URL.replace(/\/+$/,'');
};
export async function readOriginalRows881(env,table,limit=61){
 if(!['rosie_roadside_native_watch_v880','rosie_roadside_rotation_receipts_v880'].includes(table)||
  ![26,61].includes(limit))throw Error('Unapproved bounded source query');
 const cols=table.endsWith('native_watch_v880')?
  'draft_id,observed_at,source_chain_sha256,entry_sha256,previous_entry_sha256,latest_signed_event_at':
  'draft_id,observed_at,receipt_sha256,previous_receipt_sha256,grace_verify_until,previous_issuer_key_id,active_issuer_key_id';
 const url=baseUrl(env)+'/rest/v1/'+table+'?select='+cols+
  '&order=observed_at.desc,id.desc&limit='+limit;
 const r=await fetch(url,{headers:serviceHeaders(env),redirect:'error',cache:'no-store'});
 const rows=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(rows))throw Error('Original private history readback failed');
 return rows;
}
export async function readOperatorRoster881(env){
 const roster=pinnedIssuerRoster878(env.ROSIE_CLOSURE_TRUSTED_ED25519_KEYS_JSON);
 if(!roster.ok)return {ok:false,rows:[]};
 return {...roster,rows:await Promise.all(roster.rows.map(async k=>({
  status:k.status,issuer_id:await pinnedKeyId878(k.public_jwk),
  verify_until:k.verify_until||null,public_jwk:k.public_jwk})))};
}
export async function signedJob881(env,header,secretName){
 const secret=env?.[secretName],got=header?.startsWith('Bearer ')?header.slice(7):'';
 if(typeof secret!=='string'||secret.length<32||got.length!==secret.length)return false;
 const enc=new TextEncoder();
 const [a,b]=await Promise.all([crypto.subtle.digest('SHA-256',enc.encode(secret)),
  crypto.subtle.digest('SHA-256',enc.encode(got))]);
 let bad=0;const x=new Uint8Array(a),y=new Uint8Array(b);
 for(let i=0;i<x.length;i++)bad|=x[i]^y[i];
 return bad===0;
}
