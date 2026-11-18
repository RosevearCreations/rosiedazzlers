// Build 906: advisory customer wizard only. Server catalog, availability and
// checkout remain authoritative. Never silently add an extra or charge a deposit.
const packageCodes={
 exterior:{light:'premium_wash',moderate:'exterior_detail',heavy:'exterior_detail'},
 interior:{light:'basic_detail',moderate:'interior_detail',heavy:'interior_detail'},
 complete:{light:'complete_detail',moderate:'complete_detail',heavy:'complete_detail'},
 protection:{light:'exterior_detail',moderate:'exterior_detail',heavy:'exterior_detail'}
};
const needs={
 pets:/pet.?hair|fur|animal/i,
 salt:/salt|winter/i,
 odour:/odou?r|smell|smoke/i,
 paint:/paint|polish|correction|swirl/i,
 coating:/ceramic|graphene|coating|wax|sealant/i,
 headlights:/headlight/i
};
export const SMART_GOALS906=Object.freeze(['exterior','interior','complete','protection']);
export const SMART_CONDITIONS906=Object.freeze(['light','moderate','heavy']);
export const SMART_SIZES906=Object.freeze(['small','mid','oversize']);
export function recommendSmart906({goal,condition,size,concerns=[],catalog}={}){
 if(!SMART_GOALS906.includes(goal)||!SMART_CONDITIONS906.includes(condition)||
  !SMART_SIZES906.includes(size)||!Array.isArray(concerns)||!catalog||!Array.isArray(catalog.packages))
  return {ok:false,error:'Choose a vehicle size, goal and condition'};
 const wanted=packageCodes[goal][condition];
 const pack=catalog.packages.find(p=>p.code===wanted)||
  catalog.packages.find(p=>p.code==='complete_detail')||null;
 if(!pack||!Number.isFinite(Number(pack.prices_cad?.[size]))||Number(pack.prices_cad[size])<=0)
  return {ok:false,error:'A current verified catalogue price is unavailable'};
 const unique=[...new Set(concerns)].filter(x=>Object.hasOwn(needs,x));
 const addons=(Array.isArray(catalog.addons)?catalog.addons:[])
 .filter(a=>a&&typeof a.code==='string'&&
    (!Array.isArray(a.requires_package_codes_any)||!a.requires_package_codes_any.length||
      a.standalone_allowed===true||a.requires_package_codes_any.includes(pack.code)))
 .filter(a=>unique.some(flag=>needs[flag].test([a.name,a.category,a.type,a.description].join(' '))))
 .slice(0,8)
 .map(a=>({code:a.code,name:String(a.name||a.code),quote_required:a.quote_required===true,
  price_cad:Number.isFinite(Number(a.prices_cad?.[size]))?Number(a.prices_cad[size]):null}));
 return {ok:true,package_code:pack.code,package_name:String(pack.name||pack.code),
  price_cad:Number(pack.prices_cad[size]),deposit_cad:Number(pack.deposit_cad||0),
  size,condition,goal,suggested_extras:addons,extra_auto_selected:false,
  photo_review_recommended:condition==='heavy'||unique.length>0||pack.photo_estimate_recommended===true,
  checkout_authoritative:false};
}
export function smartHandoff906(result,acceptedAddons=[]){
 if(!result?.ok)return null;
 const suggested=new Set(result.suggested_extras.map(a=>a.code));
 const extras=[...new Set(acceptedAddons)].filter(code=>suggested.has(code));
 const p=new URLSearchParams({size:result.size,package:result.package_code,mode:'smart'});
 if(extras.length)p.set('addons',extras.join(','));
 return '/booking-planner?'+p.toString();
}
