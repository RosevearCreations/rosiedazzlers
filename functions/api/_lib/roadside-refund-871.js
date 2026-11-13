// Build 871 pure fail-closed provider refund assessment; no booking/payment writes.
const hold=(reason,source='original_booking')=>({state:'refund_review_hold',net_verified:false,
 gross_cents:null,refunded_cents:null,net_cents:null,refund_count:null,source,reason});
const integer=x=>Number.isSafeInteger(x)&&x>=0;
export function assessStripeRefunds({session,charges,refunds,paymentIntentId}={}){
 if(!session||session.payment_status!=='paid'||!integer(session.amount_total)||
  session.amount_total<1||String(session.currency).toLowerCase()!=='cad')
  return hold('Stripe source amount/currency or payment state is not verified','stripe_live');
 if(charges?.object!=='list'||refunds?.object!=='list'||
  !Array.isArray(charges.data)||!Array.isArray(refunds.data)||
  charges.has_more!==false||refunds.has_more!==false)
  return hold('Incomplete Stripe charge or refund pagination','stripe_live');
 const paid=charges.data.filter(c=>c?.paid===true&&c?.status==='succeeded');
 if(paid.length!==1||paid[0].payment_intent!==paymentIntentId)
  return hold('Expected single successful source-bound Stripe charge not verified','stripe_live');
 const charge=paid[0],gross=charge.amount,refundTotal=charge.amount_refunded;
 if(!integer(gross)||!integer(refundTotal)||gross!==session.amount_total||
  String(charge.currency).toLowerCase()!=='cad')
  return hold('Stripe charge amount/refund/currency mismatch','stripe_live');
 let refundCents=0,count=0;
 const seen=new Set();
 for(const r of refunds.data){
  if(!r?.id||seen.has(r.id)||r.charge!==charge.id||
   (r.payment_intent&&r.payment_intent!==paymentIntentId))
   return hold('Unmatched or repeated Stripe refund identity','stripe_live');
  seen.add(r.id);
  if(!integer(r.amount)||String(r.currency).toLowerCase()!=='cad')
   return hold('Stripe refund amount or currency mismatch','stripe_live');
  if(r.status==='succeeded'){refundCents+=r.amount;count++;}
  else if(!['failed','canceled'].includes(r.status))
   return hold('Refund pending, in progress or unknown; net cannot be asserted','stripe_live');
 }
 if(refundCents!==refundTotal||refundCents>gross)
  return hold('Stripe live refund ledger does not match charge total','stripe_live');
 const net=gross-refundCents;
 return {state:refundCents===0?'net_deposit_intact':
   net===0?'full_refund_verified':'partial_refund_verified',
  net_verified:true,gross_cents:gross,refunded_cents:refundCents,
  net_cents:net,refund_count:count,source:'stripe_live',
  note:'Provider snapshot for original deposit only, not total invoice or future refunds.'};
}
function paypalCents(value){
 if(typeof value!=='string'||!/^[0-9]+(?:\.[0-9]{2})$/.test(value))return null;
 const [major,minor]=value.split('.');
 const cents=Number(major)*100+Number(minor);
 return Number.isSafeInteger(cents)?cents:null;
}
export function assessPaypalCapture({order,capture,bookingId,captureId,expectedCents}={}){
 const unit=Array.isArray(order?.purchase_units)?order.purchase_units[0]:null;
 const orderCaptures=unit?.payments?.captures;
 if(!unit||!Array.isArray(orderCaptures)||unit.reference_id!==bookingId||
  unit.custom_id!==bookingId||!orderCaptures.some(c=>c.id===captureId)||
  capture?.id!==captureId)
  return hold('PayPal order/booking/capture correlation failed','paypal_live');
 const gross=paypalCents(capture.amount?.value);
 if(!integer(gross)||gross!==expectedCents||
   String(capture.amount?.currency_code).toUpperCase()!=='CAD')
  return hold('PayPal capture amount or currency mismatch','paypal_live');
 if(capture.status==='COMPLETED')
  return {state:'net_deposit_intact',net_verified:true,gross_cents:gross,
   refunded_cents:0,net_cents:gross,refund_count:0,source:'paypal_live',
   note:'Current PayPal capture state shows COMPLETED; future refunds may change this.'};
 if(capture.status==='REFUNDED')
  return {state:'full_refund_verified',net_verified:true,gross_cents:gross,
   refunded_cents:gross,net_cents:0,refund_count:null,source:'paypal_live',
   note:'PayPal reports capture REFUNDED; total refunded is original capture amount.'};
 if(capture.status==='PARTIALLY_REFUNDED')
  return hold('PayPal reports a partial refund but does not certify exact net amount here','paypal_live');
 return hold('PayPal capture pending, failed or unrecognized','paypal_live');
}
export function holdResult(reason,source){return hold(reason,source);}
