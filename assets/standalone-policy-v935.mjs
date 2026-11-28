// Only validate explicitly activated policies; absent/disabled configurations remain safe.
const exactMoney=x=>typeof x==='number'&&Number.isFinite(x)&&x>0&&/^\d+(?:\.\d{1,2})?$/.test(String(x))&&Number.isSafeInteger(Math.round(x*100));
export function validateStandalonePolicy935(catalog){
 const p=catalog?.booking_rules?.ala_carte_policy;
 if(p==null||p.enabled!==true)return {ok:true};
 const fail=error=>({ok:false,error});
 if(p.owner_approved!==true||typeof p.version!=='string'||!p.version.trim()||p.version.length>100)return fail('Explicit owner approval and a policy reference are required.');
 if(!exactMoney(p.deposit_cad)||![1,2].includes(p.minimum_duration_slots))return fail('Enter a positive exact-cent deposit and half-day or full-day duration.');
 const items=(Array.isArray(catalog.addons)?catalog.addons:[]).filter(a=>a?.standalone_allowed===true&&a.quote_required!==true);
 if(!items.length)return fail('Approve at least one standalone service that does not require a quote.');
 if(new Set(items.map(x=>x.code)).size!==items.length)return fail('Standalone service codes must be unique.');
 for(const item of items){
  if(typeof item.code!=='string'||! /^[a-z0-9_-]{2,80}$/.test(item.code))return fail('A standalone service code is invalid.');
  for(const size of ['small','mid','oversize'])if(!exactMoney(item.prices_cad?.[size]))return fail('Set valid exact-cent prices for all three vehicle sizes on each approved standalone service.');
 }
 if(!items.some(a=>Object.values(a.prices_cad).some(x=>exactMoney(x)&&x>=p.deposit_cad)))return fail('The deposit exceeds every individual service price; review the deposit before enabling checkout.');
 return {ok:true};
}
