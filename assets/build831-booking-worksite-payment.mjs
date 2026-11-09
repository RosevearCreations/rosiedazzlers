// Build 831 — local, bounded source join for an operator-led pilot.
// Application state and a stored provider-event ID are NOT signed provider receipts.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/;
const LIMITS=Object.freeze({bookings:40,updates:200,signoffs:200,payments:400});
const FINISHED=new Set(['completed','complete']);
const NEGATIVE=new Set(['failed','error','declined','cancelled','canceled','expired','refunded','disputed','chargeback','partially_refunded']);
const PAID=new Set(['paid','complete','completed','succeeded']);
const safeId=value=>typeof value==='string'&&UUID.test(value);
const stamp=value=>typeof value==='string'&&ISO.test(value)&&Number.isFinite(Date.parse(value))?Date.parse(value):null;
const norm=value=>typeof value==='string'?value.trim().toLowerCase().replace(/[ -]/g,'_'):'';
const validAmount=value=>Number.isSafeInteger(value)&&value>=0&&value<=1000000000;
const sortNewest=(a,b)=>(stamp(b.created_at)??0)-(stamp(a.created_at)??0)||String(b.id).localeCompare(String(a.id));

export const PILOT_SCHEMA_831='rosie.booking-worksite-payment.local-pilot.v1';
export const PILOT_SOURCE_LIMITS_831=LIMITS;
export const PILOT_HANDOFFS_831=Object.freeze({
  SOURCE_CONFLICT:{route:'/admin-handoff-acceptance.html',message:'Check source identity, timestamps and duplicate records; do not interpret this join as a complete booking.'},
  PAYMENT_EXCEPTION_REVIEW:{route:'/admin-payment-recovery.html',message:'Review failed, refunded, reversed or mismatched local deposit/final-balance attempts; obtain original provider and accounting receipts before correction.'},
  WORKSITE_EXCEPTION_REVIEW:{route:'/admin-jobsite.html',message:'Review flagged worksite/customer decisions with the authorized supervisor; do not automatically change the booking.'},
  WORKSITE_SIGNOFF_MISSING:{route:'/admin-jobsite.html',message:'Inspect original before/after evidence and a dated customer/worksite signoff before completion acceptance.'},
  PROVIDER_RECEIPT_REVIEW_REQUIRED:{route:'/admin-payment-reconciliation.html',message:'A local paid record is not a signed Stripe/PayPal receipt. Independently verify provider identity, amount, currency and finance posting.'},
  MANUAL_PAYMENT_REVIEW_REQUIRED:{route:'/admin-payment-reconciliation.html',message:'A manual paid record needs the actual cashier, customer and accounting evidence; no online provider success is inferred.'},
  PAYMENT_PENDING_REVIEW:{route:'/admin-payments.html',message:'Review the latest payment request and the customer/provider exception, without automatically sending a reminder or charging.'},
  PAYMENT_REQUEST_MISSING:{route:'/admin-payments.html',message:'Check deposit/final-balance applicability and inspect original finance records; no payment request does not prove an unpaid booking.'},
  EARLY_PAYMENT_REVIEW:{route:'/admin-booking.html',message:'A payment request shows paid before verified worksite completion; reconcile its purpose before any fulfillment decision.'},
  WORKSITE_IN_PROGRESS:{route:'/admin-jobsite.html',message:'Continue the genuine worksite walkthrough and preserve dated review evidence.'},
  BOOKING_HANDOFF_PENDING:{route:'/admin-booking.html',message:'Verify booking authorization and assignment in the existing private booking workflow.'}
});

function group(rows,bookingIds){
  const output=new Map();const seen=new Set();
  for(const row of rows){
    if(!row||!safeId(row.id)||!safeId(row.booking_id)||!bookingIds.has(row.booking_id))
      throw Error('Out-of-scope or malformed source identity');
    const target=output.get(row.booking_id)||{rows:[],conflict:false};
    if(seen.has(row.id)||stamp(row.created_at)===null)target.conflict=true;
    seen.add(row.id);target.rows.push(row);output.set(row.booking_id,target);
  }
  return output;
}

// Never infer a provider-backed payment from a bare quote draft. The API
// maps each persisted deposit and final-balance row onto this one shape.
export function normalizePayment831(row,kind){
  if(!row||!['deposit','final_balance'].includes(kind))throw Error('Unknown local payment phase');
  const link=kind==='deposit'?row.confirmed_booking_id||row.booking_id:row.booking_id;
  return {...row,booking_id:link,status:kind==='deposit'?row.payment_status:row.status,
    payment_phase:kind,linkConflict:kind==='deposit'&&!!row.confirmed_booking_id&&
      !!row.booking_id&&row.confirmed_booking_id!==row.booking_id};
}

export function bookingWorksitePaymentPilot831({bookings=[],updates=[],signoffs=[],payments=[],
  generatedAt=null,sourceRevision=null,sourceWindowAtLimit=false}={}){
  for(const [name,rows] of Object.entries({bookings,updates,signoffs,payments}))
    if(!Array.isArray(rows)||rows.length>LIMITS[name])throw Error('Bounded '+name+' source required');
  const ids=new Set();const duplicateBookings=new Set();
  for(const booking of bookings){
    if(!booking||!safeId(booking.id)||stamp(booking.created_at)===null)
      throw Error('Malformed original booking identity');
    if(ids.has(booking.id))duplicateBookings.add(booking.id);ids.add(booking.id);
  }
  const updateMap=group(updates,ids),signoffMap=group(signoffs,ids),paymentMap=group(payments,ids);
  const rows=bookings.map(booking=>{
    const worksite=updateMap.get(booking.id)||{rows:[],conflict:false};
    const signatures=signoffMap.get(booking.id)||{rows:[],conflict:false};
    const requests=paymentMap.get(booking.id)||{rows:[],conflict:false};
    const orderedRequests=requests.rows.slice().sort(sortNewest);
    const pay=orderedRequests[0]||null;
    const isCompleted=FINISHED.has(norm(booking.job_status))||FINISHED.has(norm(booking.status));
    const worksiteReview=worksite.rows.some(x=>x.requires_admin_review===true||
      x.customer_action_required===true||['pending_review','rejected','returned','blocked'].includes(norm(x.review_status)));
    const priorNegative=requests.rows.some(x=>NEGATIVE.has(norm(x.status))||NEGATIVE.has(norm(x.provider_status)));
    const paid=orderedRequests.filter(x=>PAID.has(norm(x.status))||PAID.has(norm(x.provider_status)));
    const persistedPaid=paid.some(x=>stamp(x.paid_at)!==null);
    const paymentMismatch=orderedRequests.some(x=>(x.amount_cents!=null&&!validAmount(x.amount_cents))||
      (x.paid_amount_cents!=null&&!validAmount(x.paid_amount_cents))||
      (x.paid_at!=null&&stamp(x.paid_at)===null)||
      (x.refunded_amount_cents!=null&&!validAmount(x.refunded_amount_cents))||
      (PAID.has(norm(x.status))&&(!x.paid_at||x.paid_amount_cents!==x.amount_cents))||
      (x.paid_at!=null&&x.paid_amount_cents==null)||
      (x.refunded_amount_cents>0)||
      (x.paid_amount_cents>0&&x.refunded_amount_cents>x.paid_amount_cents)||
      (!['cad','usd'].includes(norm(x.currency))));
    const sourceConflict=duplicateBookings.has(booking.id)||worksite.conflict||signatures.conflict||
      requests.conflict||worksite.rows.some(x=>x.requires_admin_review!=null&&typeof x.requires_admin_review!=='boolean')||
      signatures.rows.some(x=>x.signed_at!=null&&stamp(x.signed_at)===null)||
      requests.rows.some(x=>x.linkConflict||!['deposit','final_balance'].includes(x.payment_phase))||
      requests.rows.some(x=>x.paid_at!=null&&stamp(x.paid_at)===null);
    const hasDatedSignoff=signatures.rows.some(x=>stamp(x.signed_at)!==null);
    const provider=norm(pay?.provider)||'unknown';
    let status='BOOKING_HANDOFF_PENDING';
    if(sourceConflict)status='SOURCE_CONFLICT';
    else if(paymentMismatch||priorNegative)status='PAYMENT_EXCEPTION_REVIEW';
    else if(worksiteReview)status='WORKSITE_EXCEPTION_REVIEW';
    else if(isCompleted&&!hasDatedSignoff)status='WORKSITE_SIGNOFF_MISSING';
    else if(persistedPaid&&!isCompleted)status='EARLY_PAYMENT_REVIEW';
    else if(isCompleted&&persistedPaid)status=orderedRequests.some(x=>norm(x.provider)==='manual')?'MANUAL_PAYMENT_REVIEW_REQUIRED':
      'PROVIDER_RECEIPT_REVIEW_REQUIRED';
    else if(isCompleted&&pay)status='PAYMENT_PENDING_REVIEW';
    else if(isCompleted)status='PAYMENT_REQUEST_MISSING';
    else if(worksite.rows.length||signatures.rows.length)status='WORKSITE_IN_PROGRESS';
    const next=PILOT_HANDOFFS_831[status];
    return {
      bookingSuffix:booking.id.slice(-8),status,bookingState:norm(booking.status)||'unknown',
      worksiteState:norm(booking.job_status)||'unknown',sourceBookingCreatedAt:booking.created_at,
      localUpdateCount:worksite.rows.length,localSignoffRecordCount:signatures.rows.length,
      localDatedSignoffPresent:hasDatedSignoff,
      localReviewFlag:worksiteReview,localPaymentRequestCount:requests.rows.length,
      localDepositRequestCount:requests.rows.filter(x=>x.payment_phase==='deposit').length,
      localFinalBalanceRequestCount:requests.rows.filter(x=>x.payment_phase==='final_balance').length,
      latestPaymentProvider:provider,latestLocalPaymentState:norm(pay?.status)||'unavailable',
      latestPaymentPhase:pay?.payment_phase||'unknown',
      providerEventReferencePresent:requests.rows.some(x=>!!x.provider_event_id),
      localPersistedPaid:!!persistedPaid,earlierNegativePaymentPresent:priorNegative,
      localAmountReconciliation:pay?(paymentMismatch?'CONFLICT':persistedPaid?'LOCAL_MATCH_NOT_PROVIDER_PROOF':'NOT_PROVEN'):'NO_REQUEST',
      nextAction:next.message,nextRoute:next.route,
      originalProviderReceiptVerified:false,ownerAccepted:false,bookingFulfillmentApproved:false,
      masterCompletionPercent:null,canonicalHoldChanged:false
    };
  });
  const categories=Object.fromEntries(Object.keys(PILOT_HANDOFFS_831).map(k=>[k,rows.filter(x=>x.status===k).length]));
  return {
    schema:PILOT_SCHEMA_831,build:831,sourceId:'rosiedazzlers',shellBoundary:'owned_business_shell',
    generatedAt:stamp(generatedAt)!==null?generatedAt:new Date().toISOString(),
    currentDeploymentRevisionClaim:typeof sourceRevision==='string'&&/^[a-f0-9]{40}$/.test(sourceRevision)?sourceRevision:null,
    sampleOnly:true,completeBookingHistory:false,completeWorksiteHistory:false,completePaymentHistory:false,
    sourceLimits:LIMITS,sourceCounts:{bookings:bookings.length,updates:updates.length,signoffs:signoffs.length,payments:payments.length},
    sourceWindowMayOmitHistory:!!sourceWindowAtLimit||Object.entries({bookings,updates,signoffs,payments}).some(([name,list])=>list.length===LIMITS[name]),
    sampleBookingCount:rows.length,handoffCounts:categories,rows,
    originalBookingConsentVerified:false,independentWorksiteWitnessVerified:false,
    providerWebhookSignatureVerified:false,independentPaymentProviderReceiptVerified:false,
    accountingReconciliationVerified:false,ownerPilotSignedOff:false,
    approvedNumerator:null,approvedDenominator:null,completionPercent:null,
    sourceConnectionState:'DISCONNECTED / HOLD',dataSentToAIPlatform:false,dataSentToCommsHub:false,
    paymentProviderContacted:false,customerNotified:false,bookingChanged:false,financeChanged:false,
    canonicalHoldChanged:false,
    nextStep:'Use a consented real booking, independent worksite observer, original provider/finance receipts and explicit owner decisions before approving any pilot outcome.'
  };
}
