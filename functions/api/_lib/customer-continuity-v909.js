// Build 909: saved choices are non-sensitive guidance, never a reservation or payment authority.
import {validateStructuredQuoteTerms,hashStructuredQuoteTerms} from './quote-booking-terms.js';
import {revision908,UUID908} from './customer-account-review-v908.js';
export const PLANS909=Object.freeze(['smart','manual']);
const SIZES=new Set(['small','mid','oversize']);
const GOALS=new Set(['exterior','interior','complete','protection']);
const CONDITIONS=new Set(['light','moderate','heavy']);
const CONCERNS=new Set(['pets','salt','odour','paint','coating','headlights']);
const CODE=/^[a-z0-9][a-z0-9_-]{0,79}$/;
const codes=(input,max)=>Array.isArray(input)&&input.length<=max&&input.every(x=>typeof x==='string'&&CODE.test(x))?
 [...new Set(input)].slice(0,max):null;
const exact=(raw,keys)=>Object.keys(raw).sort().join(',')===keys.sort().join(',');
export function normalizePlan909(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||!PLANS909.includes(raw.mode))return null;
 if(raw.mode==='smart'){
  if(!exact(raw,['mode','size','goal','condition','concerns','accepted_addons'])||
   !SIZES.has(raw.size)||!GOALS.has(raw.goal)||!CONDITIONS.has(raw.condition))return null;
  const concerns=codes(raw.concerns,6),accepted_addons=codes(raw.accepted_addons,8);
  if(!concerns||!accepted_addons||concerns.some(x=>!CONCERNS.has(x)))return null;
  return {mode:'smart',size:raw.size,goal:raw.goal,condition:raw.condition,
   concerns,accepted_addons};
 }
 if(!exact(raw,['mode','size','payable_codes','quote_codes'])||!SIZES.has(raw.size))return null;
 const payable_codes=codes(raw.payable_codes,12),quote_codes=codes(raw.quote_codes,12);
 if(!payable_codes||!quote_codes||payable_codes.some(x=>quote_codes.includes(x)))return null;
 return {mode:'manual',size:raw.size,payable_codes,quote_codes};
}
export async function quoteSnapshot909(q,reviewed,now=Date.now()){
 const status=String(q.acceptance_status||'').toLowerCase();
 const base={id:q.id,title:String(q.title||'Detailing quote').slice(0,140),
  sent_at:q.sent_at||null,updated_at:q.updated_at||null,status:status||'pending',
  accepted_at:q.accepted_at||null,expires_at:q.terms_expires_at||q.structured_terms?.expires_at||null,
  revision:await revision908(['quote',q.id,q.sent_at,q.updated_at,q.status,q.acceptance_status]),
  terms_hash:q.structured_terms_hash||null,reviewed:reviewed===true,
  acceptance_ready:false,reason:'Not available for account acceptance',
  terms:null,booking_created:false,payment_attempted:false};
 if(!q?.sent_at||!UUID908.test(String(q.id||'')))return base;
 if(status==='accepted'){
  return {...base,reason:'Already accepted; booking and payment remain separate'};
 }
 if(status==='declined')return {...base,reason:'Declined; staff must issue a new quote'};
 const validated=validateStructuredQuoteTerms(q.structured_terms,now);
 if(!validated.ok)return {...base,reason:validated.error};
 const digest=await hashStructuredQuoteTerms(validated.terms);
 if(!q.structured_terms_hash||q.structured_terms_hash!==digest)
  return {...base,reason:'Terms changed or cannot be independently verified'};
 const t=validated.terms;
 const terms={package_code:t.package_code,vehicle_size:t.vehicle_size,
  addon_codes:t.addon_codes,total_cents:t.total_cents,deposit_cents:t.deposit_cents,
  currency:t.currency,expires_at:t.expires_at};
 return {...base,terms,acceptance_ready:reviewed===true,
  reason:reviewed?'Ready only after you explicitly confirm this exact quoted price and terms':
   'First record a quote review receipt for this exact version'};
}
export function safeMediaTimeline909(media,sourceType,sourceId,sourceName){
 if(!UUID908.test(String(sourceId||'')))return [];
 return (Array.isArray(media)?media:[]).filter(m=>m?.status==='uploaded'&&
  !!m.verified_at&&Number.isFinite(Date.parse(m.verified_at))&&
  /^image\/|^video\//.test(String(m.content_type||''))).map(m=>({
   event:'private_upload_verified',context:sourceType,source_id:sourceId,
   context_label:String(sourceName||'Rosie quote/booking').slice(0,100),
   media_type:String(m.content_type).startsWith('video/')?'video':'photo',
   at:m.verified_at,linked_at:m.linked_at||null,public:false,
   staff_approved:false
 }));
}
