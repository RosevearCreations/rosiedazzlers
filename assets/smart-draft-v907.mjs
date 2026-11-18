// Rosie 907: privacy-minimized, explicit SAVE/RESTORE for generic Smart Wizard choices.
// Never persist names, contact, address, date, slot, prices, images, upload tokens or consent.
import {SMART_GOALS906,SMART_CONDITIONS906,SMART_SIZES906,recommendSmart906} from './book-smart-v906.mjs';
export const SMART_DRAFT_KEY907='rd_smart_booking_nonpersonal_v907';
export const SMART_DRAFT_TTL_MS907=24*60*60*1000;
export const SMART_CONCERNS907=Object.freeze(['pets','salt','odour','paint','coating','headlights']);
const validCode=x=>typeof x==='string'&&/^[a-z0-9][a-z0-9_-]{0,79}$/.test(x);
export function sanitizeSmartDraft907(raw={},now=Date.now()){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const size=raw.size,goal=raw.goal,condition=raw.condition;
 if(!SMART_SIZES906.includes(size)||!SMART_GOALS906.includes(goal)||!SMART_CONDITIONS906.includes(condition))return null;
 const concerns=[...new Set(Array.isArray(raw.concerns)?raw.concerns:[])].filter(x=>SMART_CONCERNS907.includes(x)).slice(0,6);
 const accepted_addons=[...new Set(Array.isArray(raw.accepted_addons)?raw.accepted_addons:[])].filter(validCode).slice(0,8);
 const stamp=Number(raw.saved_at);
 const saved_at=Number.isFinite(stamp)&&stamp>0&&stamp<=now+60000?stamp:now;
 return {schema:'rosie.smart-choices.v907',version:907,saved_at,size,goal,condition,concerns,accepted_addons};
}
export function parseSmartDraft907(text,now=Date.now()){
 if(typeof text!=='string'||text.length>2500)return null;
 let raw;try{raw=JSON.parse(text);}catch{return null;}
 if(raw?.schema!=='rosie.smart-choices.v907'||raw?.version!==907)return null;
 const saved=Number(raw.saved_at);
 if(!Number.isFinite(saved)||saved>now+60000||saved<=0||now-saved>SMART_DRAFT_TTL_MS907)return null;
 return sanitizeSmartDraft907(raw,now);
}
export function reconcileSmartDraft907(saved,catalog,now=Date.now()){
 const draft=parseSmartDraft907(JSON.stringify(saved||null),now);
 if(!draft)return null;
 const recommendation=recommendSmart906({...draft,catalog});
 if(!recommendation.ok)return null;
 const eligible=new Set(recommendation.suggested_extras.map(x=>x.code));
 return {...draft,accepted_addons:draft.accepted_addons.filter(x=>eligible.has(x)),
  recommendation,requires_current_price_recheck:true,holds_reservation:false,guarantees_quote:false};
}
