// Rosie 915 first-party anonymous engagement ONLY. No cookies, IPs, customer identifiers,
// raw media, sales or financial conversions. Must not run without a verified original provider receipt.
import {serviceHeaders} from '../_lib/staff-auth.js';
import {UUID914} from '../../../assets/build914-supplier-publication-contract.mjs';
const reply=(data,status)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow','X-Content-Type-Options':'nosniff'}});
const blocked=()=>reply({ok:false,accepted:false,state:'HOLD'},409);
async function read(env,name,id){
 const url=env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+name+'?select=*&id=eq.'+id+'&limit=2';
 const r=await fetch(url,{headers:serviceHeaders(env),cache:'no-store',redirect:'error'});
 if(!r.ok)throw Error('PRIVATE_ORIGINAL_READBACK_HOLD');
 const rows=await r.json();if(!Array.isArray(rows)||rows.length!==1)throw Error('NOT_ORIGINAL_VERIFIED');
 return rows[0];
}
export async function onRequestPost({request,env}){
 const url=new URL(request.url);
 if(request.headers.get('origin')!==url.origin||!['same-origin','none'].includes(request.headers.get('sec-fetch-site')||'same-origin'))return reply({ok:false,error:'FIRST_PARTY_ONLY'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return reply({ok:false,error:'JSON_REQUIRED'},415);
 if(!env?.SUPABASE_SERVICE_ROLE_KEY||!/^https:\/\//.test(env?.SUPABASE_URL||'')||env.ROSIE_ATTRIBUTION_ENABLED!=='true')return blocked();
 let data;
 try{const body=await request.text();if(body.length>400)return reply({ok:false,error:'INPUT_LIMIT'},413);data=JSON.parse(body);}catch{return reply({ok:false,error:'INVALID_INPUT'},400);}
 if(!data||Object.keys(data).sort().join(',')!=='event_kind,event_uuid,publication_id'||!UUID914.test(data.publication_id)||!UUID914.test(data.event_uuid)||!['landing','product_interest','quote_started'].includes(data.event_kind))return reply({ok:false,error:'EVENT_CONTRACT_INVALID'},400);
 try{
  const pub=await read(env,'rosie_supplier_publication_v914',data.publication_id);
  if(pub.publication_state!=='provider_verified')return blocked();
  const [receipt,project,review,custody]=await Promise.all([
   read(env,'rosie_supplier_provider_receipts_v915',pub.provider_receipt_reference),
   read(env,'creative_projects',pub.project_id),
   read(env,'rosie_supplier_reviews_v911',pub.supplier_review_id),
   read(env,'rosie_supplier_custody_v914',pub.custody_id)
  ]);
  if(receipt.publication_id!==pub.id||receipt.channel!==pub.channel||review.received_verified!==true||review.daip_project_id!==project.id||custody.supplier_review_id!==review.id||project.consent_status!=='approved_public'||project.consent_reviewed!==true||project.public_publish_allowed!==true||project.archived_at||project.consent_expires_at&&Date.parse(project.consent_expires_at)<=Date.now())return blocked();
  const assets=pub.approved_asset_ids||[];
  if(!assets.length||new Set(assets).size!==assets.length)return blocked();
  // An asset can be withdrawn after publication; invalidate the original source immediately.
  const assetFilter=assets.map(id=>UUID914.test(id)?id:'').filter(Boolean).join(',');
  if(assetFilter.split(',').length!==assets.length)return blocked();
  const ar=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/daip_project_media_assets?select=id,consent_status,story_review_status,upload_status&project_id=eq.'+pub.project_id+'&id=in.('+assetFilter+')',{headers:serviceHeaders(env),cache:'no-store',redirect:'error'});
  if(!ar.ok)return blocked();
  const approved=await ar.json();
  if(!Array.isArray(approved)||approved.length!==assets.length||approved.some(a=>a.consent_status!=='approved_public'||a.story_review_status!=='selected'||a.upload_status!=='uploaded'))return blocked();
  const row={publication_id:pub.id,source:pub.channel,event_kind:data.event_kind,event_uuid:data.event_uuid};
  const rr=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/rosie_supplier_attribution_v914',{method:'POST',headers:{...serviceHeaders(env),Prefer:'return=minimal'},body:JSON.stringify(row),redirect:'error',cache:'no-store'});
  if(rr.status===409)return reply({ok:true,accepted:false,duplicate:true},200);
  if(!rr.ok)return blocked();
  return reply({ok:true,accepted:true,kind:'non_identifying_first_party_event',not_a_customer_or_sale:true},202);
 }catch{return blocked();}
}
export const onRequestGet=()=>reply({ok:false,error:'METHOD_NOT_ALLOWED'},405);
export const onRequestPut=onRequestGet;
export const onRequestPatch=onRequestGet;
export const onRequestDelete=onRequestGet;
export const onRequestOptions=onRequestGet;
