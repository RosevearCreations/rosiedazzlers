// Build 912 commerce validation and server-only pricing. No browser price is authoritative.
export const UUID912=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const clean=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
const check=(ok,message)=>{if(!ok)throw Error(message);};
const int=(v,min,max,label)=>{check(Number.isSafeInteger(v)&&v>=min&&v<=max,label+' invalid');return v;};
const known=(x,keys)=>check(!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>keys.includes(k)),'Unexpected fields');
export function normalizeProduct912(raw){
 known(raw,['sku','title','description','category','price_cents','stock_on_hand','active','publish_confirmed','supplier_review_id']);
 const sku=clean(raw.sku,32).toUpperCase();
 check(/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(sku),'Invalid SKU');
 const title=clean(raw.title,140);
 check(title.length>=4,'Product title required');
 const supplier_review_id=raw.supplier_review_id==null||raw.supplier_review_id===''?null:String(raw.supplier_review_id);
 check(!supplier_review_id||UUID912.test(supplier_review_id),'Invalid supplier link');
 const active=raw.active===true;
 return {sku,title,description:clean(raw.description,1000),category:clean(raw.category,50)||'general',
  price_cents:int(raw.price_cents,1,10000000,'Price'),stock_on_hand:int(raw.stock_on_hand,0,1000000,'Stock'),
  active,publish_approved:active&&raw.publish_confirmed===true,supplier_review_id};
}
export function normalizeLocation912(raw){
 known(raw,['name','mode','service_area','customer_directions','active','starts_at','ends_at']);
 const name=clean(raw.name,120),mode=clean(raw.mode,30),service_area=clean(raw.service_area,120);
 check(name.length>=4&&service_area.length>=3,'Location name and service area required');
 check(['pickup','stand','remote_service'].includes(mode),'Unknown location mode');
 const start=raw.starts_at?new Date(raw.starts_at):null,end=raw.ends_at?new Date(raw.ends_at):null;
 check((!start||!Number.isNaN(start.valueOf()))&&(!end||!Number.isNaN(end.valueOf())),'Invalid location dates');
 check(!start||!end||end>start,'Location end must follow start');
 return {name,mode,service_area,customer_directions:clean(raw.customer_directions,400),
  active:raw.active===true,starts_at:start?.toISOString()||null,ends_at:end?.toISOString()||null};
}
export function normalizeSpecial912(raw){
 known(raw,['code','title','location_id','percent_off','starts_at','ends_at','active']);
 const code=clean(raw.code,30).toUpperCase(),title=clean(raw.title,140),location_id=String(raw.location_id||'');
 check(/^[A-Z0-9_-]{4,30}$/.test(code)&&title.length>=4,'Special code/title invalid');
 check(UUID912.test(location_id),'Special location UUID required');
 const start=new Date(raw.starts_at),end=new Date(raw.ends_at);
 check(Number.isFinite(start.valueOf())&&Number.isFinite(end.valueOf())&&end>start,'Special date range invalid');
 return {code,title,location_id,percent_off:int(raw.percent_off,1,50,'Special discount'),
  starts_at:start.toISOString(),ends_at:end.toISOString(),active:raw.active===true,quote_required:true};
}
export function locationReady912(location,mode,now=Date.now()){
 return !!location&&location.active===true&&location.mode===mode&&
  (!location.starts_at||Date.parse(location.starts_at)<=now)&&
  (!location.ends_at||Date.parse(location.ends_at)>now);
}
export function publicCatalog912(products,locations,specials,now=Date.now()){
 const activeLocations=locations.filter(l=>locationReady912(l,l.mode,now));
 const locationIds=new Set(activeLocations.map(l=>l.id));
 return {
  products:products.filter(p=>p.active===true&&p.publish_approved===true&&p.stock_on_hand>0)
   .map(p=>({id:p.id,sku:p.sku,title:p.title,description:p.description,category:p.category,
    price_cents:p.price_cents,stock_available:p.stock_on_hand>0,currency:'CAD'})),
  locations:activeLocations.map(l=>({id:l.id,name:l.name,mode:l.mode,service_area:l.service_area,
   directions:l.customer_directions,starts_at:l.starts_at,ends_at:l.ends_at})),
  remote_specials:specials.filter(s=>s.active===true&&s.quote_required===true&&
   locationIds.has(s.location_id)&&activeLocations.some(l=>l.id===s.location_id&&l.mode==='remote_service')&&
   Date.parse(s.starts_at)<=now&&Date.parse(s.ends_at)>now)
   .map(s=>({code:s.code,title:s.title,location_id:s.location_id,percent_off:s.percent_off,
    quote_required:true,starts_at:s.starts_at,ends_at:s.ends_at}))
 };
}
export function priceRetailIntent912(raw,products,locations,now=Date.now()){
 known(raw,['mode','location_id','items','idempotency_key']);
 check(['pickup','stand'].includes(raw.mode),'Pickup or stand must be selected');
 check(UUID912.test(String(raw.location_id||''))&&UUID912.test(String(raw.idempotency_key||'')),
  'Valid location and idempotency key required');
 const location=locations.find(l=>l.id===raw.location_id);
 check(locationReady912(location,raw.mode,now),'Location not currently accepting requests');
 check(Array.isArray(raw.items)&&raw.items.length>=1&&raw.items.length<=12,'One to twelve lines required');
 const seen=new Set(),lines=[];let subtotal=0;
 for(const line of raw.items){
  known(line,['product_id','quantity']);
  const id=String(line.product_id||'');check(UUID912.test(id)&&!seen.has(id),'Duplicate or invalid product');
  seen.add(id);const qty=int(line.quantity,1,10,'Quantity');
  const item=products.find(p=>p.id===id);
  check(!!item&&item.active===true&&item.publish_approved===true,'Product not approved for sale');
  check(item.stock_on_hand>=qty,'Item stock is insufficient; no stock reserved');
  subtotal+=item.price_cents*qty;
  check(Number.isSafeInteger(subtotal)&&subtotal<=10000000,'Cart exceeds safe limit');
  lines.push({product_id:id,sku:item.sku,title:item.title,quantity:qty,unit_cents:item.price_cents,line_cents:item.price_cents*qty});
 }
 // Display-only Ontario estimate; real tax, shipping, and final amount need independent merchant approval.
 const estimated_hst_cents=Math.round(subtotal*0.13);
 return {mode:raw.mode,location_id:raw.location_id,lines,subtotal_cents:subtotal,estimated_hst_cents,
  currency:'CAD',payment_status:'NOT_ATTEMPTED',stock_reserved:false,invoice_issued:false};
}
