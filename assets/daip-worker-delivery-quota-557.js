// Build 557 — read-only private worker/quota evidence reconciliation.
const arr=x=>Array.isArray(x)?x:[];
const ref=x=>typeof x==="string"&&/^[A-Za-z0-9][A-Za-z0-9._:-]{2,100}$/.test(x.trim())?x.trim():null;
const number=(x,positive=false)=>typeof x==="number"&&Number.isFinite(x)&&x>=(positive?Number.EPSILON:0)&&x<=1e13?x:null;
const date=x=>{if(typeof x!=="string"||!/^\d{4}-\d\d-\d\dT/.test(x))return null;const n=Date.parse(x);return Number.isFinite(n)?n:null};
const state=x=>String(x??"").trim().toLowerCase();
const round=x=>Math.round(x*100)/100;
export function build557DaipWorkerQuotaBaseline({project_id="",projects=[],processing_jobs=[],delivery_receipts=[],quota_observation=null,now=new Date().toISOString()}={}){
 const pid=String(project_id??"").trim(),owned=arr(projects).some(p=>p?.id===pid);
 const jobs=arr(processing_jobs).filter(j=>owned&&j?.project_id===pid),byId=new Map(jobs.filter(j=>typeof j?.id==="string").map(j=>[j.id,j]));
 const queued=jobs.filter(j=>["pending","queued","retry","running","processing"].includes(state(j?.status))).length;
 const failed=jobs.filter(j=>["failed","blocked","cancelled"].includes(state(j?.status))||Boolean(j?.dead_lettered_at)).length;
 const completed=jobs.filter(j=>["complete","completed","succeeded"].includes(state(j?.status))).length;
 const gaps=[],warnings=[],used=new Set(),receipts=[],clock=date(now)??Date.now();
 if(!pid||!owned)gaps.push("choose_existing_private_creative_project");
 if(!jobs.length)gaps.push("observed_processing_job_metadata_missing");
 const q=quota_observation;
 let window=null,limits=null;
 if(!q||typeof q!=="object"||Array.isArray(q))gaps.push("real_provider_quota_observation_required");
 else{
  const start=date(q.window_start),end=date(q.window_end),seen=date(q.observed_at),source=ref(q.source_reference);
  const cpu=number(q.cpu_limit_ms,true),bytes=number(q.storage_limit_bytes,true),count=number(q.dispatch_limit,true),cost=number(q.cost_ceiling_cad,true);
  if(!source||start===null||end===null||seen===null||start>=end||seen<start||seen>end||seen>clock+300000||cpu===null||bytes===null||count===null||!Number.isInteger(count)||cost===null)gaps.push("valid_dated_provider_quota_source_and_limits_required");
  else{window={window_start:new Date(start).toISOString(),window_end:new Date(end).toISOString(),observed_at:new Date(seen).toISOString(),source_reference:source};limits={cpu_limit_ms:cpu,storage_limit_bytes:bytes,dispatch_limit:count,cost_ceiling_cad:cost}}
 }
 if(!Array.isArray(delivery_receipts)||delivery_receipts.length>100)gaps.push("bounded_delivery_receipts_array_required");
 else for(const item of delivery_receipts){
  const id=typeof item?.job_id==="string"?item.job_id.trim():"",job=byId.get(id),when=date(item?.observed_at),source=ref(item?.source_reference),worker=ref(item?.worker_reference);
  const cpu=number(item?.cpu_ms),elapsed=number(item?.elapsed_ms,true),bytes=number(item?.private_output_bytes),cost=number(item?.cost_cad);
  const valid=Boolean(id&&job&&!used.has(id)&&["complete","completed","succeeded"].includes(state(job.status))&&source&&worker&&when!==null&&when<=clock+300000&&(!window||(when>=date(window.window_start)&&when<=date(window.window_end)))&&cpu!==null&&elapsed!==null&&bytes!==null&&cost!==null&&state(item?.outcome)==="succeeded");
  if(!valid){gaps.push("invalid_duplicate_mismatched_or_unverified_job_receipt");continue}
  used.add(id);receipts.push({job_id:id,source_reference:source,worker_reference:worker,observed_at:new Date(when).toISOString(),cpu_ms:cpu,elapsed_ms:elapsed,private_output_bytes:bytes,cost_cad:cost});
 }
 if(!receipts.length)gaps.push("matched_observed_worker_delivery_receipt_required");
 if(completed>receipts.length)gaps.push("completed_metadata_jobs_lack_matching_delivery_receipts");
 const sum=k=>round(receipts.reduce((n,r)=>n+r[k],0));
 const usage={cpu_ms:sum("cpu_ms"),elapsed_ms:sum("elapsed_ms"),private_output_bytes:sum("private_output_bytes"),cost_cad:sum("cost_cad"),dispatched_receipts:receipts.length};
 let utilization=null;
 if(limits){
  utilization={cpu_percent:round(100*usage.cpu_ms/limits.cpu_limit_ms),storage_percent:round(100*usage.private_output_bytes/limits.storage_limit_bytes),dispatch_percent:round(100*usage.dispatched_receipts/limits.dispatch_limit),cost_percent:round(100*usage.cost_cad/limits.cost_ceiling_cad)};
  if(Object.values(utilization).some(x=>x>100))gaps.push("reported_usage_exceeds_quota_limit");
  if(Object.values(utilization).some(x=>x>=80))warnings.push("quota_headroom_below_twenty_percent");
 }
 return Object.freeze({build:557,authority:"daip_worker_delivery_quota_baseline",project_id:owned?pid:null,status:"delivery_quota_baseline_requires_independent_provider_acceptance",
  private_job_metadata:{total:jobs.length,queued,failed,completed},matched_operator_receipt_count:receipts.length,operator_receipts:receipts,reported_measured_usage:receipts.length?usage:null,
  provider_quota_claim:limits&&window?{...window,...limits}:null,reported_quota_utilization:utilization,gaps:[...new Set(gaps)],warnings,
  provider_verified:false,worker_execution_performed_by_this_review:false,real_private_output_inspected:false,public_media_url_created:false,
  social_post_created:false,db_or_storage_written:false,canonical_hold_closed:false});
}
