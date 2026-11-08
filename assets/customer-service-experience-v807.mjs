// Build 807: pure UI projections over authenticated, customer-scoped history and
// staff-only interest review. No booking, consent, outreach or payment authority.
import {seasonalGuidance744,torontoSeason744} from './customer-followup-v744.mjs';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text=value=>String(value??'').trim();

export function exactDate807(value){
  const date=text(value).slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
  const parsed=new Date(`${date}T12:00:00Z`);
  return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===date?date:null;
}

export function currentPackage807(catalog,code){
  const pkg=Array.isArray(catalog?.packages)?catalog.packages.find(item=>item?.code===code):null;
  if(!pkg||pkg.active===false||pkg.enabled===false||pkg.bookable===false||
    /retired|inactive|disabled|archived|unavailable/i.test(`${pkg.status||''} ${pkg.lifecycle_status||''}`))return null;
  return ['small','mid','oversize'].some(size=>Number(pkg.prices_cad?.[size])>0)?pkg:null;
}

export function historyProjection807(completedServices,catalog,{now=new Date(),season=torontoSeason744(now)}={}){
  if(!Array.isArray(completedServices))throw Error('Authenticated completed-service history is required.');
  const today=now.toISOString().slice(0,10),ids=new Set();
  const entries=[];
  for(const row of completedServices){
    const id=text(row?.id),serviceDate=exactDate807(row?.service_date),completedDate=exactDate807(row?.completed_at);
    const packageCode=text(row?.package_code);
    if(!UUID.test(id)||ids.has(id.toLowerCase())||!serviceDate||!completedDate||completedDate>today||!packageCode)continue;
    ids.add(id.toLowerCase());
    const packageRow=currentPackage807(catalog,packageCode);
    const recommendation=seasonalGuidance744({id,package_code:packageCode,detailing_completed_at:row.completed_at,job_status:'completed'},season);
    entries.push({id,serviceDate,completedDate,year:completedDate.slice(0,4),packageCode,
      packageName:packageRow?text(packageRow.name)||packageCode:packageCode,
      serviceArea:text(row.service_area),catalogVerified:Boolean(packageRow),
      recommendation:recommendation?{label:recommendation.label,copy:recommendation.copy}:null});
  }
  entries.sort((a,b)=>b.completedDate.localeCompare(a.completedDate)||a.id.localeCompare(b.id));
  return {entries,summary:{completed:entries.length,repeatable:entries.filter(entry=>entry.catalogVerified).length,
    uniqueServices:new Set(entries.map(entry=>entry.packageCode)).size},
    years:[...new Set(entries.map(entry=>entry.year))].sort((a,b)=>b.localeCompare(a)),
    packages:[...new Map(entries.map(entry=>[entry.packageCode,entry.packageName])).entries()].sort((a,b)=>a[1].localeCompare(b[1]))};
}

export function rebookingPath807(entry){
  if(!entry?.catalogVerified||!UUID.test(text(entry.id))||!exactDate807(entry.serviceDate)||!text(entry.packageCode))return null;
  return `/book?${new URLSearchParams({rebook_package:entry.packageCode,rebook_date:entry.serviceDate}).toString()}`;
}

export function filterHistory807(entries,{search='',year='all',service='all',repeatableOnly=false}={}){
  const needle=text(search).toLowerCase();
  return entries.filter(entry=>(year==='all'||entry.year===year)&&
    (service==='all'||entry.packageCode===service)&&(!repeatableOnly||entry.catalogVerified)&&
    (!needle||`${entry.packageName} ${entry.packageCode} ${entry.serviceArea} ${entry.completedDate}`.toLowerCase().includes(needle)));
}

export function followupTriage807(interests,{now=new Date()}={}){
  if(!Array.isArray(interests))throw Error('Authorized staff interest queue is required.');
  const time=now.getTime(),seen=new Set();
  const entries=interests.filter(row=>UUID.test(text(row?.id))&&!seen.has(text(row.id).toLowerCase())&&seen.add(text(row.id).toLowerCase())).map(row=>{
    const date=Date.parse(row.submitted_at||'');
    const days=Number.isFinite(date)&&date<=time?Math.floor((time-date)/86400000):null;
    const channels=Array.isArray(row.currently_allowed_channels)?row.currently_allowed_channels.filter(channel=>['email','sms','phone'].includes(channel)):[];
    const changed=row.consent_changed_since_submission===true;
    const current=row.consent_fresh===true&&!changed&&channels.length>0;
    return {...row,daysOld:days,channels:[...new Set(channels)],needsConsentReview:!current,
      triage:current?'staff_review':'consent_review',
      consentLabel:changed?'Consent changed since interest':!row.consent_fresh?'Consent missing or stale':!channels.length?'No currently eligible channel':'Current preference; still requires staff review'};
  });
  entries.sort((a,b)=>text(b.submitted_at).localeCompare(text(a.submitted_at)));
  return {entries,summary:{total:entries.length,pending:entries.filter(row=>row.review_status==='pending_review').length,
    consentReview:entries.filter(row=>row.needsConsentReview).length,staffReview:entries.filter(row=>!row.needsConsentReview).length}};
}

export function filterFollowup807(entries,{search='',kind='all',review='all',triage='all'}={}){
  const needle=text(search).toLowerCase();
  return entries.filter(row=>(kind==='all'||row.interest_kind===kind)&&
    (review==='all'||(review==='pending'?row.review_status==='pending_review':Boolean(text(row.review_status))&&row.review_status!=='pending_review'))&&
    (triage==='all'||row.triage===triage)&&
    (!needle||`${text(row.customer_label)} ${text(row.interest_kind)} ${text(row.cycle_hint)} ${text(row.submitted_at).slice(0,10)}`.toLowerCase().includes(needle)));
}
