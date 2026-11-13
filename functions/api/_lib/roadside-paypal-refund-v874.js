// Rosie 874: source-bound PayPal capture and individual refund verification.
// Only live GET /v2/payments/refunds/{id} results plus an independent, current
// PayPal cumulative refund total can prove an exact partial-refund remainder.
import {assessPaypalCapture,holdResult} from './roadside-refund-871.js';
const HOLD=reason=>holdResult(reason,'paypal_live');
function money(m){
 if(m?.currency_code!=='CAD'||typeof m.value!=='string'||!/^(0|[1-9][0-9]*)\.[0-9]{2}$/.test(m.value))return null;
 const [major,minor]=m.value.split('.');
 const value=Number(major)*100+Number(minor);
 return Number.isSafeInteger(value)?value:null;
}
const safe=x=>Number.isSafeInteger(x)&&x>=0;
const ref=x=>typeof x==='string'&&/^[A-Za-z0-9._:-]{8,160}$/.test(x);
function originalUpLink(refund,captureId){
 return Array.isArray(refund?.links)&&refund.links.some(link=>{
  if(link?.rel!=='up'||link?.method!=='GET'||typeof link.href!=='string')return false;
  try{
   const u=new URL(link.href);
   return u.protocol==='https:'&&['api.paypal.com','api-m.paypal.com','api-m.sandbox.paypal.com','api.sandbox.paypal.com'].includes(u.hostname)&&
    u.pathname==='/v2/payments/captures/'+encodeURIComponent(captureId);
  }catch{return false;}
 });
}
export function assessPaypalPartialRefundLedger({order,capture,bookingId,captureId,expectedCents,refundRows,liveRefunds}={}){
 const base=assessPaypalCapture({order,capture,bookingId,captureId,expectedCents});
 if(capture?.status!=='PARTIALLY_REFUNDED')return base;
 if(!safe(expectedCents)||expectedCents<2||!ref(captureId)||
  base?.state!=='refund_review_hold')return HOLD('Original PayPal capture authority mismatch');
 if(!Array.isArray(refundRows)||!refundRows.length||refundRows.length>=100||
  !Array.isArray(liveRefunds)||liveRefunds.length!==refundRows.length)
  return HOLD('Complete original PayPal refund ID ledger not available');
 const unit=order.purchase_units[0];
 const orderCapture=unit.payments.captures.find(x=>x.id===captureId);
 if(!orderCapture||orderCapture.status!=='PARTIALLY_REFUNDED')
  return HOLD('PayPal order and capture refund states differ');
 const captureTotal=money(capture.seller_receivable_breakdown?.total_refunded_amount);
 const orderTotal=money(orderCapture.seller_receivable_breakdown?.total_refunded_amount);
 // The cumulative total is required: saved local records alone cannot prove
 // no externally initiated refunds occurred after they were recorded.
 if(captureTotal===null&&orderTotal===null)
  return HOLD('Current PayPal cumulative refund amount is unavailable');
 if(captureTotal!==null&&orderTotal!==null&&captureTotal!==orderTotal)
  return HOLD('Current PayPal aggregate refund sources disagree');
 const expectedTotal=captureTotal??orderTotal;
 if(!safe(expectedTotal)||expectedTotal<=0||expectedTotal>=expectedCents)
  return HOLD('PayPal cumulative partial refund outside capture bounds');
 const seen=new Set(); let summed=0;
 for(let i=0;i<refundRows.length;i++){
  const row=refundRows[i],live=liveRefunds[i];
  if(row?.provider!=='paypal'||row?.booking_id!==bookingId||
   !ref(row.provider_refund_id)||seen.has(row.provider_refund_id)||
   !safe(row.refund_amount_cents)||row.refund_amount_cents<=0||
   String(row.currency).toUpperCase()!=='CAD')
   return HOLD('Unrelated, duplicated or malformed saved PayPal refund ID');
  seen.add(row.provider_refund_id);
  const amount=money(live?.amount);
  if(live?.id!==row.provider_refund_id||live.status!=='COMPLETED'||
   amount===null||amount!==row.refund_amount_cents||
   !originalUpLink(live,captureId))
   return HOLD('Live PayPal refund transaction did not match original capture and saved amount');
  summed+=amount;
  if(!safe(summed)||summed>expectedCents)return HOLD('PayPal refund sum exceeds original deposit');
 }
 if(summed!==expectedTotal)return HOLD('PayPal refund transactions do not reconcile to current cumulative total');
 return {state:'partial_refund_verified',net_verified:true,source:'paypal_live',
  gross_cents:expectedCents,refunded_cents:summed,net_cents:expectedCents-summed,
  refund_count:seen.size,
  note:'Live original PayPal capture and individually verified complete refund ledger; point-in-time snapshot only.'};
}
