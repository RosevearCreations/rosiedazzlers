// Build 820: ephemeral aggregates of the authenticated, filtered staff queue.
// These are cohort snapshots of a bounded load, never historical totals or SLA evidence.
import {outcome819,outcomeSummary819} from './build819-followup-outcomes.mjs';

export const COHORTS_820=Object.freeze([
  {key:'latest',label:'Requested in the last 24 hours'},
  {key:'previous',label:'Requested 24–48 hours ago'},
  {key:'week',label:'Requested 2–7 days ago'},
  {key:'older',label:'Requested over 7 days ago'},
  {key:'unknown',label:'Request date unavailable or in the future'},
]);
const validTime=(value,now)=>{
  if(typeof value!=='string'||!value.trim())return null;
  const ms=Date.parse(value);
  return Number.isFinite(ms)&&ms<=now?ms:null;
};
const boundedRows=rows=>Array.isArray(rows)?rows.slice(0,150):[];
const safeCount=n=>Number.isSafeInteger(n)&&n>=0&&n<=150?n:null;

export function trendSnapshot820(rows,now=Date.now()){
  const cohorts=Object.fromEntries(COHORTS_820.map(c=>[c.key,outcomeSummary819([])]));
  for(const row of boundedRows(rows)){
    const requested=validTime(row?.requested_at,now),age=requested===null?null:now-requested;
    const key=age===null?'unknown':age<86400000?'latest':age<172800000?'previous':age<604800000?'week':'older';
    const status=outcome819(row).kind;
    cohorts[key][status]++;cohorts[key].total++;
  }
  return {cohorts,totals:outcomeSummary819(boundedRows(rows)),observedAt:new Date(now).toISOString(),scope:'filtered-newest-150-maximum'};
}

export function workloadSignals820(rows,{now=Date.now(),ownershipReady=false,owners=[],escalationReady=false,escalations=[]}={}){
  const bounded=boundedRows(rows),ownerMap=new Map(),escalationMap=new Map();
  if(ownershipReady)for(const owner of Array.isArray(owners)?owners:[])if(typeof owner?.followup_id==='string')ownerMap.set(owner.followup_id,owner);
  if(escalationReady)for(const escalation of Array.isArray(escalations)?escalations:[])if(typeof escalation?.followup_id==='string')escalationMap.set(escalation.followup_id,escalation);
  let waiting=0,older48h=0,unknownAge=0,unowned=0,reviewPast=0,openEscalations=0;
  for(const row of bounded){
    if(outcome819(row).kind!=='waiting'||typeof row?.id!=='string'||!row.id)continue;
    waiting++;
    const requested=validTime(row.requested_at,now);
    if(requested===null)unknownAge++;else if(now-requested>=172800000)older48h++;
    const owner=ownerMap.get(row.id);
    if(ownershipReady){
      if(!owner)unowned++;
      const due=validTime(owner?.review_due_at,now);
      if(due!==null)reviewPast++;
    }
    const escalation=escalationMap.get(row.id);
    if(escalationReady&&escalation&&escalation.status!=='cleared')openEscalations++;
  }
  return {waiting,older48h,unknownAge,unowned:ownershipReady?unowned:null,reviewPast:ownershipReady?reviewPast:null,openEscalations:escalationReady?openEscalations:null,scope:'filtered-waiting-only'};
}

// Explicitly a preview, not a raw data export: no identifiers, search strings,
// customer/staff text, private notes, owner names, event history or timestamps.
export function safeQueuePreview820(snapshot,workload){
  const lines=['section,metric,count'];
  const add=(section,metric,value)=>{
    const n=safeCount(value);
    lines.push(`${section},${metric},${n===null?'unavailable':n}`);
  };
  for(const {key} of COHORTS_820){
    const group=snapshot?.cohorts?.[key];
    for(const status of ['waiting','responded','needs_help','confirmed','review','total'])add(`cohort_${key}`,status,group?.[status]);
  }
  for(const field of ['waiting','older48h','unknownAge','unowned','reviewPast','openEscalations'])add('workload',field,workload?.[field]);
  return lines.join('\n');
}
