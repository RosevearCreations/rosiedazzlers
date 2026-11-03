import { reconcileShift748, SHIFT_SOURCE748 } from './shift-reconciliation-v748.js';
import { buildConsumableCostTrace750 } from './consumable-job-cost-v750.js';

const SIZES=['small','mid','oversize'];
const ZONES=['urban','township','hamlet','coastal','rural','out_of_zone'];
const cents=(cad)=>cad==null||cad===''||!Number.isFinite(Number(cad))?null:Math.round(Number(cad)*100);
const clean=(value)=>String(value??'').trim();
const sorted=(a,b)=>b.count-a.count||a.key.localeCompare(b.key);

export function seasonBucket751(date) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(clean(date)))return 'unavailable';
  const [year,month,day]=String(date).split('-').map(Number);
  const parsed=new Date(Date.UTC(year,month-1,day));
  if(!year||parsed.getUTCFullYear()!==year||parsed.getUTCMonth()!==month-1||parsed.getUTCDate()!==day)return 'unavailable';
  return [12,1,2].includes(month)?'winter_calendar':[3,4,10,11].includes(month)?'shoulder_calendar':'warm_calendar';
}

function indexUnique(rows, key) {
  const map=new Map(),duplicates=new Set();
  for(const row of rows||[]){const id=clean(row?.[key]);if(!id)continue;if(map.has(id))duplicates.add(id);else map.set(id,row);}
  return {map,duplicates};
}

function travelByBooking(punches=[]) {
  const grouped=new Map();
  for(const row of punches){if(row?.source!==SHIFT_SOURCE748)continue;const key=`${row.booking_id}:${row.staff_user_id}`;
    if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(row);}
  const outcome=new Map();
  for(const [key,rows] of grouped){const bookingId=key.split(':')[0],summary=reconcileShift748(rows),item=outcome.get(bookingId)||{minutes:0,staff_count:0,all_closed:true,issues:[]};
    item.staff_count++;item.minutes+=summary.totals.travel_minutes;
    if(!summary.ready_to_submit){item.all_closed=false;item.issues.push(...summary.issues);}
    outcome.set(bookingId,item);
  }
  return outcome;
}

function summarizeGroups(rows,select){
  const groups=new Map();for(const row of rows){const key=select(row);const g=groups.get(key)||{key,count:0,review_ready:0,review_count:0,recognized_revenue_cents:0,known_pre_travel_contribution_cents:0,verified_contribution_cents:0};
    g.count++;if(row.margin_review_status==='review_ready'){g.review_ready++;g.verified_contribution_cents+=row.pre_travel_contribution_cents;}else g.review_count++;
    if(row.recognized_revenue_cents!=null)g.recognized_revenue_cents+=row.recognized_revenue_cents;
    if(row.pre_travel_contribution_cents!=null)g.known_pre_travel_contribution_cents+=row.pre_travel_contribution_cents;
    groups.set(key,g);
  }
  return [...groups.values()].sort(sorted).map(g=>({...g,
    review_ready_contribution_cents:g.count>0&&g.review_count===0?g.verified_contribution_cents:null,
    observed_margin_pct:g.count>0&&g.review_count===0&&g.recognized_revenue_cents>0?
      Math.round(g.verified_contribution_cents/g.recognized_revenue_cents*1000)/10:null,
    incomplete_cohort_margin_claim_allowed:false}));
}

export function buildMarginReview751({economics={},accounting_rows=[],bookings=[],shift_punches=[],posting_batches=[],posting_rows=[],catalog={},source_status={}}={}) {
  const econ=Array.isArray(economics.rows)?economics.rows:[],accounts=indexUnique(accounting_rows,'booking_id'),book=indexUnique(bookings,'id');
  const travel=travelByBooking(shift_punches),batchByBooking=new Map();
  for(const batch of posting_batches){const id=clean(batch.source_reference_id||batch.booking_id);if(!id||batch.source_kind!=='booking')continue;
    if(!batchByBooking.has(id))batchByBooking.set(id,[]);batchByBooking.get(id).push(batch);}
  const rowByBatch=new Map();for(const row of posting_rows){const key=clean(row.batch_id);if(!rowByBatch.has(key))rowByBatch.set(key,[]);rowByBatch.get(key).push(row);}
  const seen=new Set();
  const rows=econ.map(e=>{
    const bookingId=clean(e.booking_id),a=accounts.map.get(bookingId)||{},b=book.map.get(bookingId)||{},issue=[];
    if(!bookingId||seen.has(bookingId)||accounts.duplicates.has(bookingId)||book.duplicates.has(bookingId))issue.push('Missing or duplicate booking identity.');
    seen.add(bookingId);
    if(!accounts.map.has(bookingId))issue.push('The corresponding accounting vehicle-size/date source record is missing.');
    if(!book.map.has(bookingId))issue.push('The corresponding booking travel-zone source record is missing.');
    const pkg=clean(e.package_code||a.package_code||b.package_code),size=clean(a.vehicle_size||b.vehicle_size).toLowerCase();
    if(!pkg||!SIZES.includes(size))issue.push('Canonical package or vehicle size is missing or unrecognized.');
    if(a.package_code&&e.package_code&&a.package_code!==e.package_code||b.package_code&&pkg&&b.package_code!==pkg)issue.push('Package differs between recorded accounting and booking sources.');
    if(a.vehicle_size&&b.vehicle_size&&a.vehicle_size!==b.vehicle_size)issue.push('Vehicle size differs between booking and accounting; owner review required.');
    const day=clean(a.service_date||e.service_date||b.service_date),season=seasonBucket751(day);
    if(season==='unavailable'||(a.service_date&&b.service_date&&a.service_date!==b.service_date))issue.push('Service date is missing or inconsistent.');
    const zone=clean(b.service_area_zone).toLowerCase();if(!ZONES.includes(zone))issue.push('No verified travel zone; no surcharge inferred.');
    const batches=batchByBooking.get(bookingId)||[],ledgerRows=batches.flatMap(batch=>rowByBatch.get(batch.id)||[]);
    const ledger=buildConsumableCostTrace750(batches,ledgerRows);
    const ledgerComplete=batches.length>0&&ledgerRows.length>0&&ledgerRows.length>=batches.reduce((n,b)=>n+Number(b.row_count||1),0);
    if(!ledgerComplete)issue.push('Immutable inventory-posting cost evidence missing or incomplete.');
    if(ledger.missing_cost_lines||ledger.accounting_review_batches)issue.push('Inventory cost or COGS accounting requires reconciliation.');
    const recordedMaterial=cents(e.recorded_material_cost_cad),frozen=ledgerComplete?ledger.net_material_cost_cents:null;
    if(recordedMaterial==null||frozen==null||Math.abs(recordedMaterial-frozen)>1)issue.push('Material cost does not reconcile to the posting-time ledger.');
    const travelDetail=travel.get(bookingId),travelStatus=!travelDetail?'unavailable':travelDetail.all_closed?'observed_unapproved':'review';
    if(!travelDetail)issue.push('No source-linked travel-time punches; travel labour cost is unknown.');
    else if(!travelDetail.all_closed)issue.push('Travel shift punches contain open or conflicting intervals.');
    const revenue=cents(e.recognized_revenue_cad),labor=cents(e.estimated_direct_labor_cad);
    const sourceReady=e.evidence_status==='ready'&&e.revenue_evidence_status==='ready'&&e.material_evidence_status==='ready'&&e.labor_evidence_status==='ready'&&e.cash_evidence_status==='ready'&&e.cogs_reconciliation_status==='ready';
    if(!sourceReady)issue.push('Recorded revenue, material, labour, refund or COGS evidence is not fully ready.');
    const preTravel=revenue!=null&&frozen!=null&&labor!=null?revenue-frozen-labor:null;
    const marginReady=sourceReady&&issue.length===0&&preTravel!=null;
    const guide=Number(catalog?.package_map?.[pkg]?.prices_cad?.[size]);
    const starting=Number.isFinite(guide)&&guide>0?Math.round(guide*100):null;
    const charge=Number(catalog?.booking_rules?.travel_pricing?.[zone]);
    return {booking_id:bookingId,package_code:pkg||null,vehicle_size:SIZES.includes(size)?size:null,
      service_date:day||null,season_bucket:season,travel_zone:ZONES.includes(zone)?zone:null,
      current_starting_price_cents:starting,current_travel_zone_guide_cents:ZONES.includes(zone)&&Number.isFinite(charge)&&charge>=0?Math.round(charge*100):null,
      recognized_revenue_cents:revenue,recorded_material_cents:frozen,recorded_direct_labor_cents:labor,
      pre_travel_contribution_cents:preTravel,review_ready_pre_travel_contribution_cents:marginReady?preTravel:null,
      observed_travel_minutes:travelDetail?.all_closed?Math.round(travelDetail.minutes*100)/100:null,travel_status:travelStatus,
      margin_review_status:marginReady?'review_ready':'review',review_reasons:[...new Set(issue)],
      full_net_margin_cents:null,travel_labor_cost_cents:null,overhead_cost_cents:null,seasonal_capability_proven:false,
      ledger_batch_ids:batches.map(x=>x.id),pricing_is_reference_only:true};
  });
  const reviewReady=rows.filter(x=>x.margin_review_status==='review_ready').length;
  return {build:751,authority:'package_size_travel_seasonal_margin_review',evidence_status:!rows.length?'unavailable':reviewReady===rows.length?'review_ready':'review',
    rows:rows.sort((a,b)=>a.package_code?.localeCompare(b.package_code||'')||a.vehicle_size?.localeCompare(b.vehicle_size||'')||0),
    summary:{booking_count:rows.length,review_ready_booking_count:reviewReady,review_booking_count:rows.length-reviewReady,
      package_size_cohorts:summarizeGroups(rows,r=>`${r.package_code||'unclassified'} / ${r.vehicle_size||'unclassified'}`),
      seasonal_cohorts:summarizeGroups(rows,r=>r.season_bucket),travel_zone_cohorts:summarizeGroups(rows,r=>r.travel_zone||'unverified')},
    source_status,boundaries:{read_only:true,pricing_or_discount_write:false,booking_or_availability_write:false,
      inventory_or_accounting_write:false,seasonal_rule_activation:false,winter_availability_hold_retained:true,
      current_starting_prices_are_not_realized_revenue:true,travel_zone_guide_is_not_paid_travel:true,
      time_punches_are_not_payroll_approval:true,pre_travel_contribution_is_not_net_margin:true,
      no_margin_from_incomplete_cohort:true,no_live_capacity_claim:true}};
}
