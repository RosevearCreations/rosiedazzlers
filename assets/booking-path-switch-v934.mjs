// Explicit same-tab, one-use, non-sensitive path transfer; never a price or reservation.
const key='rosie.booking-path-switch.v934', ttl=30*60*1000;
const sizes=['small','mid','oversize'],goals=['exterior','interior','complete','protection'],conditions=['light','moderate','heavy'],flags=['pets','salt','odour','paint','coating','headlights'];
const code=/^[a-z0-9][a-z0-9_-]{0,79}$/;
const list=(xs,max)=>Array.isArray(xs)&&xs.length<=max&&xs.every(x=>typeof x==='string'&&code.test(x))?[...new Set(xs)]:null;
function clean(mode,p){
 if(!p||!sizes.includes(p.size))return null;
 if(mode==='smart'){
  const concerns=list(p.concerns,6),extras=list(p.accepted_addons,8);
  if(!goals.includes(p.goal)||!conditions.includes(p.condition)||!concerns||concerns.some(x=>!flags.includes(x))||!extras||!(p.package_code===null||typeof p.package_code==='string'&&code.test(p.package_code)))return null;
  return {size:p.size,goal:p.goal,condition:p.condition,concerns,accepted_addons:extras,package_code:p.package_code};
 }
 if(mode==='manual'){
  const payable=list(p.payable_codes,100),quote=list(p.quote_codes,100);
  if(!payable||!quote||payable.some(x=>quote.includes(x)))return null;
  return {size:p.size,payable_codes:payable,quote_codes:quote};
 }
 return null;
}
export function writeSwitch934(storage,mode,input,previous=null,now=Date.now()){
 const p=clean(mode,input);if(!p||!Number.isSafeInteger(now))throw Error('INVALID_SWITCH');
 const other=mode==='smart'?'manual':'smart';
 const carry={version:934,target:other,size:p.size,at:now,smart:null,manual:null};
 carry[mode]=p;carry[other]=clean(other,previous?.[other]);
 storage.setItem(key,JSON.stringify(carry));
 return carry;
}
export function consumeSwitch934(storage,target,now=Date.now()){
 const raw=storage.getItem(key);if(!raw)return null;
 storage.removeItem(key);
 if(raw.length>24000)return null;
 try{
  const p=JSON.parse(raw);
  if(p.version!==934||p.target!==target||!['smart','manual'].includes(target)||!sizes.includes(p.size)||!Number.isSafeInteger(p.at)||p.at>now||now-p.at>ttl)return null;
  const smart=clean('smart',p.smart),manual=clean('manual',p.manual);
  if(target==='smart'&&!manual||target==='manual'&&!smart)return null;
  return {size:p.size,smart,manual};
 }catch{return null}
}
export function restoreSmart934(x){
 return x.smart?{size:x.size,goal:x.smart.goal,condition:x.smart.condition,concerns:x.smart.concerns}:{size:x.size};
}
export function describeSwitch934(x,catalog){
 const packages=new Map((catalog?.packages||[]).map(p=>[p.code,p.name||p.code]));
 const addons=new Map((catalog?.addons||[]).map(p=>[p.code,p.name||p.code]));
 const labels=[];
 if(x.smart){labels.push('Smart goal: '+x.smart.goal+'; condition: '+x.smart.condition);
 if(x.smart.package_code)labels.push('Previous package: '+(packages.get(x.smart.package_code)||x.smart.package_code+' (recheck availability)'));
 for(const c of x.smart.concerns)labels.push('Concern: '+c);
 for(const c of x.smart.accepted_addons)labels.push('Previous Smart extra: '+(addons.get(c)||c+' (recheck availability)'));}
 if(x.manual){for(const c of x.manual.payable_codes)labels.push('Previous Manual service: '+(addons.get(c)||c+' (recheck availability)'));for(const c of x.manual.quote_codes)labels.push('Previous Manual quote request: '+(addons.get(c)||c+' (recheck availability)'));}
 return labels.length?labels:['No earlier extras selected.'];
}
