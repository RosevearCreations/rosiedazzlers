// Build 831 — no booking, payment, provider, notification or owner mutation.
import {PILOT_SCHEMA_831,PILOT_HANDOFFS_831} from './build831-booking-worksite-payment.mjs';
const $=id=>document.getElementById(id);
let report=null,loading=false;
const add=(parent,tag,value)=>{const element=document.createElement(tag);
  element.textContent=String(value??'UNKNOWN');parent.append(element);return element;};
const date=value=>{const parsed=new Date(value||'');return Number.isFinite(parsed.getTime())?
  parsed.toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short'}):'UNKNOWN';};
function render(){
  const body=$('build831Rows');body.textContent='';
  if(!report){$('build831Count').textContent='No authorized source. Zero business outcomes asserted; provider and owner acceptance HOLD.';return;}
  const selected=$('build831Filter').value;
  const rows=report.rows.filter(item=>selected==='all'||selected==='payment'&&
    ['PAYMENT_EXCEPTION_REVIEW','PROVIDER_RECEIPT_REVIEW_REQUIRED','MANUAL_PAYMENT_REVIEW_REQUIRED',
      'PAYMENT_PENDING_REVIEW','PAYMENT_REQUEST_MISSING','EARLY_PAYMENT_REVIEW'].includes(item.status)||
    selected==='worksite'&&['WORKSITE_EXCEPTION_REVIEW','WORKSITE_SIGNOFF_MISSING','WORKSITE_IN_PROGRESS'].includes(item.status)||
    selected==='source'&&['SOURCE_CONFLICT','BOOKING_HANDOFF_PENDING'].includes(item.status));
  for(const item of rows){
    if(!PILOT_HANDOFFS_831[item.status])continue;
    const tr=document.createElement('tr');const th=add(tr,'th','…'+item.bookingSuffix);th.scope='row';
    add(tr,'td',item.bookingState+' / '+item.worksiteState);
    add(tr,'td',item.localUpdateCount+' local updates; '+item.localSignoffRecordCount+
      ' signoff records; dated '+(item.localDatedSignoffPresent?'yes':'no'));
    add(tr,'td',item.localDepositRequestCount+' deposit / '+item.localFinalBalanceRequestCount+
      ' final; '+item.latestPaymentPhase+' · '+item.latestLocalPaymentState);
    add(tr,'td',item.status);
    const handoff=document.createElement('td');const details=document.createElement('details');
    add(details,'summary','Review exception and evidence steps');
    add(details,'p',item.nextAction);
    add(details,'p','Created '+date(item.sourceBookingCreatedAt)+'. Provider event ID present: '+
      (item.providerEventReferencePresent?'yes (not signature proof)':'no')+'. Prior local negative: '+
      (item.earlierNegativePaymentPresent?'yes':'not visible in this bounded sample')+'.');
    handoff.append(details);
    const link=add(handoff,'a','Open owning admin review');link.className='btn ghost';
    link.href=PILOT_HANDOFFS_831[item.status].route;
    tr.append(handoff);body.append(tr);
  }
  $('build831Count').textContent=rows.length+'/'+report.sampleBookingCount+' recent bookings shown; '+
    report.sourceCounts.payments+' local payment requests sampled; history bounded and incomplete. '+
    'Accepted pilot outcomes UNKNOWN, no provider proof or owner approval claimed.';
}
async function refresh(){
  if(loading)return;loading=true;$('build831Refresh').disabled=true;
  $('build831Status').textContent='Reading signed-supervisor, private booking/worksite/payment evidence…';
  try{
    const response=await fetch('/api/admin/booking_worksite_payment_pilot_v831',{
      credentials:'same-origin',cache:'no-store'});
    const body=await response.json().catch(()=>null);
    if(!response.ok||!body?.ok||body.build!==831||body.report?.schema!==PILOT_SCHEMA_831||
      !Array.isArray(body.report.rows)||body.report.rows.length>40||
      body.report.canonicalHoldChanged!==false)throw Error('Private pilot source unavailable');
    report=body.report;
    $('build831Status').textContent='Local snapshot refreshed; '+
      (report.sourceWindowMayOmitHistory?'some sources reached their sampling limit. ':'')+
      'This is operator review of stored records only. Original provider receipts, independent field witness, '+
      'customer consent and owner signoff remain unverified.';
  }catch{
    report=null;$('build831Status').textContent='Private pilot source unavailable or access denied. '+
      'No booking, worksite completion, provider outcome, payment or owner approval inferred.';
  }finally{loading=false;$('build831Refresh').disabled=false;render();}
}
export function startBookingWorksitePilot831(){
  $('build831Filter').addEventListener('change',render);
  $('build831Refresh').addEventListener('click',refresh);
  render();refresh();
}
