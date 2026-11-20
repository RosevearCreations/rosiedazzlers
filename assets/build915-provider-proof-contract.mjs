// Rosie 915: independent external-publication proof and privacy-preserving summaries.
// Source-only contract: cannot create proof from a manually entered URL or draft state.
import {UUID914,CHANNELS914} from './build914-supplier-publication-contract.mjs';
const SAFE_ID=/^[A-Za-z0-9_-]{6,100}$/;
export function assessProviderReceipt915({publication,identity,provider,consentStillValid=false,now=Date.now()}={}){
 const blockers=[];
 if(!publication||!UUID914.test(publication.id)||publication.publication_state!=='approved_pending_provider')blockers.push('ORIGINAL_APPROVED_QUEUE_REQUIRED');
 if(!publication?.approved_asset_ids?.length||!UUID914.test(publication?.consent_record_id))blockers.push('ORIGINAL_CONSENT_AND_ASSETS_REQUIRED');
 if(!consentStillValid)blockers.push('CURRENT_CONSENT_RECHECK_REQUIRED');
 const channel=publication?.channel;
 if(!CHANNELS914.has(channel)||identity?.channel!==channel||provider?.channel!==channel)blockers.push('CHANNEL_MISMATCH');
 if(!identity?.owner_id||!provider?.owner_id||identity.owner_id!==provider.owner_id)blockers.push('ORIGINAL_OWNER_MISMATCH');
 if(!SAFE_ID.test(String(provider?.id||'')))blockers.push('PROVIDER_CONTENT_ID_REQUIRED');
 if(provider?.public!==true||provider?.published!==true)blockers.push('INDEPENDENT_PUBLIC_READBACK_REQUIRED');
 if(!provider?.observed_at||!Number.isFinite(Date.parse(provider.observed_at))||Math.abs(now-Date.parse(provider.observed_at))>5*60*1000)blockers.push('FRESH_PROVIDER_READBACK_REQUIRED');
 if(!provider?.canonical_url||typeof provider.canonical_url!=='string'||!/^https:\/\//.test(provider.canonical_url))blockers.push('PROVIDER_CANONICAL_URL_REQUIRED');
 if(!provider?.media_type||!['video','reel','short'].includes(provider.media_type))blockers.push('VERIFIED_VIDEO_REQUIRED');
 return {verified:blockers.length===0,blockers,state:blockers.length?'HOLD':'PROVIDER_VERIFIED'};
}
export function summarizeAttribution915(events,{minimumGroupSize=5}={}){
 if(!Array.isArray(events)||!Number.isInteger(minimumGroupSize)||minimumGroupSize<5)throw Error('Invalid aggregation request');
 const groups=new Map();
 for(const e of events){
  if(!UUID914.test(e?.publication_id)||!CHANNELS914.has(e?.source)||!['landing','product_interest','quote_started'].includes(e?.event_kind)||!/^\d{4}-\d{2}-\d{2}$/.test(String(e?.event_day||'')))throw Error('Unsupported attribution row');
  if(Object.keys(e).some(k=>!['publication_id','source','event_kind','event_day'].includes(k)))throw Error('Private data cannot enter attribution');
  const key=[e.publication_id,e.source,e.event_kind,e.event_day].join('|');
  groups.set(key,(groups.get(key)||0)+1);
 }
 return [...groups.entries()].filter(([,n])=>n>=minimumGroupSize).map(([key,count])=>{
  const [publication_id,source,event_kind,event_day]=key.split('|');
  return {publication_id,source,event_kind,event_day,count};
 });
}
