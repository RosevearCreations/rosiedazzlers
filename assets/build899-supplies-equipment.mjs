// Rosie 899 — private, source-only stock and equipment stewardship. Pure functions.
export const LIMITS899=Object.freeze({items:150,purchaseOrders:100,movements:150,service:80,counts:80});
export const SERVICE_TYPES899=Object.freeze(['inspection','cleaning','filter_service','calibration','repair','preventive']);
export const COUNT_TYPES899=Object.freeze(['cycle_count','before_job','after_job','recount']);
const ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const id=x=>typeof x==='string'&&ID.test(x);
const unit=x=>{
 const s=String(x===undefined||x===null?'':x).trim();
 if(!/^\d{1,9}(?:\.\d{1,3})?$/.test(s))return null;
 const p=s.split('.'),v=Number(p[0])*1000+Number((p[1]||'').padEnd(3,'0'));
 return Number.isSafeInteger(v)?v:null;
};
const toDate=(x)=>typeof x==='string'&&/^\d{4}-\d\d-\d\d$/.test(x)&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x?x:null;
const unique=(name,rows)=>{
 if(!Array.isArray(rows)||rows.length>LIMITS899[name])throw Error('Invalid bounded '+name+' window');
 const seen=new Set();
 for(const row of rows){if(!row||!id(row.id)||seen.has(row.id))throw Error('Invalid/duplicate '+name+' identity');seen.add(row.id);}
 return rows;
};
const day=(now)=>new Date(now).toISOString().slice(0,10);
export function normalizeReview899(input,now=new Date()){
 if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,error:'Invalid review request.'};
 const kind=String(input.kind||'').trim();
 const allowed=kind==='service'?['kind','client_request_id','inventory_item_id','event_kind','service_type','review_date','staff_note']:
  kind==='count'?['kind','client_request_id','inventory_item_id','review_kind','observed_qty','review_date','staff_note']:[];
 if(!allowed.length||Object.keys(input).some(x=>!allowed.includes(x)))return {ok:false,error:'Unsupported review fields.'};
 if(!id(input.client_request_id)||!id(input.inventory_item_id))return {ok:false,error:'Exact inventory and request UUID required.'};
 const staff_note=typeof input.staff_note==='string'?input.staff_note.trim():'';
 if(staff_note.length<8||staff_note.length>500)return {ok:false,error:'Provide 8–500 characters describing the original observation or work.'};
 let date;try{date=toDate(input.review_date)}catch{return {ok:false,error:'Invalid review date.'}}
 if(!date||!Number.isFinite(new Date(now).getTime()))return {ok:false,error:'Invalid review date.'};
 const current=day(now);
 if(kind==='service'){
  const event_kind=String(input.event_kind||''),service_type=String(input.service_type||'');
  if(!['planned','staff_reported'].includes(event_kind)||!SERVICE_TYPES899.includes(service_type))return {ok:false,error:'Unknown service action.'};
  const min=new Date(new Date(now).getTime()-365*86400000).toISOString().slice(0,10);
  const max=new Date(new Date(now).getTime()+365*86400000).toISOString().slice(0,10);
  if(event_kind==='planned'&&(date<current||date>max))return {ok:false,error:'Schedule service within 365 days.'};
  if(event_kind==='staff_reported'&&(date<min||date>current))return {ok:false,error:'Staff-reported work date cannot be in the future.'};
  return {ok:true,kind,client_request_id:input.client_request_id,inventory_item_id:input.inventory_item_id,
   event_kind,service_type,due_date:date,service_note:staff_note};
 }
 const review_kind=String(input.review_kind||'');
 const observed=unit(input.observed_qty);
 if(!COUNT_TYPES899.includes(review_kind)||observed===null||observed>100000000000)return {ok:false,error:'Count type or observed quantity invalid.'};
 const min=new Date(new Date(now).getTime()-30*86400000).toISOString().slice(0,10);
 if(date<min||date>current)return {ok:false,error:'Use a real count date within the past 30 days.'};
 return {ok:true,kind,client_request_id:input.client_request_id,inventory_item_id:input.inventory_item_id,
  review_kind,observed_qty:(observed/1000).toFixed(3),observed_on:date,staff_note};
}
export function projectSupplies899({items=[],purchaseOrders=[],movements=[],service=[],counts=[],now=new Date(),revision=null}={}){
 for(const [name,rows] of Object.entries({items,purchaseOrders,movements,service,counts}))unique(name,rows);
 const today=day(now),deadline=new Date(new Date(now).getTime()+14*86400000).toISOString().slice(0,10);
 const byId=new Map(items.map(row=>[row.id,row]));
 const orders=new Map();
 for(const p of purchaseOrders){if(p.item_id&&!id(p.item_id))throw Error('Malformed purchase order link');if(!p.item_id)continue;
  const list=orders.get(p.item_id)||[];list.push(p);orders.set(p.item_id,list);}
 const plans=new Map(),serviceHistory=new Map();
 for(const row of service){if(!id(row.inventory_item_id))throw Error('Invalid service item link');
  if(row.event_kind==='planned'){const arr=plans.get(row.inventory_item_id)||[];arr.push(row);plans.set(row.inventory_item_id,arr);}
  else if(row.event_kind==='staff_reported'){const arr=serviceHistory.get(row.inventory_item_id)||[];arr.push(row);serviceHistory.set(row.inventory_item_id,arr);}
  else throw Error('Invalid maintenance event');
 }
 const stockCountById=new Map();
 for(const row of counts){if(!id(row.inventory_item_id))throw Error('Invalid count item link');const list=stockCountById.get(row.inventory_item_id)||[];list.push(row);stockCountById.set(row.inventory_item_id,list);}
 const active=items.filter(x=>x.is_active===true);
 const result=active.map(item=>{
  const quantity=unit(item.qty_on_hand),reorder=unit(item.reorder_point);
  if(quantity===null||reorder===null)throw Error('Invalid original stock quantity');
  const po=orders.get(item.id)||[],openPo=po.some(p=>['draft','requested','ordered'].includes(String(p.status||'').toLowerCase()));
  const low=item.item_type==='consumable'&&quantity<=reorder;
  const scheduled=(plans.get(item.id)||[]).filter(p=>p.due_date>=today);
  const overdue=(plans.get(item.id)||[]).filter(p=>p.due_date<today);
  const dueSoon=scheduled.filter(p=>p.due_date<=deadline);
  const review=(stockCountById.get(item.id)||[]).sort((a,b)=>String(b.recorded_at).localeCompare(String(a.recorded_at)))[0]||null;
  let countVariance=null;
  if(review){const seen=unit(review.observed_qty),snapshot=unit(review.catalog_qty_snapshot);
   if(seen===null||snapshot===null)throw Error('Invalid count snapshot');
   countVariance=((seen-snapshot)/1000).toFixed(3);}
  return {id:item.id,name:String(item.name||'Unnamed item').slice(0,100),item_type:item.item_type,
   unit_label:String(item.unit_label||'units').slice(0,40),assigned_station:String(item.assigned_station||'').slice(0,100),
   qty_on_hand:(quantity/1000).toFixed(3),reorder_point:(reorder/1000).toFixed(3),
   low_stock:low,open_purchase_order:openPo,reorder_review_needed:low&&!openPo,
   supplier_order_verified:false,physical_count_verified:false,
   unscheduled_service_review:item.item_type==='tool'&&scheduled.length===0,
   service_due_soon:dueSoon.length,service_planned_overdue:overdue.length,
   staff_reported_service:(serviceHistory.get(item.id)||[]).length,
   latest_count_review:review?{id:review.id,review_kind:review.review_kind,observed_on:review.observed_on,
    observed_qty:review.observed_qty,catalog_qty_snapshot:review.catalog_qty_snapshot,
    variance_qty:countVariance,owner_approved:false,stock_adjustment_applied:false}:null};
 });
 const summary={consumables:result.filter(x=>x.item_type==='consumable').length,
  tools:result.filter(x=>x.item_type==='tool').length,
  low_stock:result.filter(x=>x.low_stock).length,
  reorder_review_needed:result.filter(x=>x.reorder_review_needed).length,
  service_due_soon:result.reduce((s,x)=>s+x.service_due_soon,0),
  tool_schedule_review:result.filter(x=>x.unscheduled_service_review).length,
  count_variance_review:result.filter(x=>x.latest_count_review&&x.latest_count_review.variance_qty!=='0.000').length};
 return {schema:'rosie.inventory-equipment.review.v899',build:899,sampled_at:new Date(now).toISOString(),
  source_revision:revision,summary,items:result,original_movements_sampled:movements.length,
  service_events:service.map(s=>({id:s.id,inventory_item_id:s.inventory_item_id,event_kind:s.event_kind,
   service_type:s.service_type,due_date:s.due_date,recorded_at:s.recorded_at,
   staff_report_unverified:true,owner_verified:false})),
  count_reviews:counts.map(c=>({id:c.id,inventory_item_id:c.inventory_item_id,review_kind:c.review_kind,
   observed_on:c.observed_on,recorded_at:c.recorded_at,staff_report_unverified:true,owner_approved:false})),
  windows:Object.fromEntries(Object.entries({items,purchaseOrders,movements,service,counts}).map(([key,rows])=>
   [key,{count:rows.length,limit:LIMITS899[key],possibly_truncated:rows.length>=LIMITS899[key]}])),
  authority:{original_business_only:true,external_supplier_order:false,automatic_purchase:false,
   inventory_count_is_proposal_only:true,physical_service_not_independently_verified:true,
   stock_updated:false,inventory_posted:false,accounting_posted:false,owner_approval:false,
   no_customer_or_provider_changes:true,no_master_send:true}};
}
