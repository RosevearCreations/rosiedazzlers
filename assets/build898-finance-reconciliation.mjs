// Rosie Build 898. Pure source reconciliation; not a settlement, ledger-posting or HST filing authority.
export const LIMITS898=Object.freeze({payments:60,refunds:100,events:150,applications:100,accounting:100,finalBalances:60});
export const SOURCE_NAMES898=Object.freeze(Object.keys(LIMITS898));
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const finalRefund=new Set(['succeeded','completed','refunded']);
const paidState=new Set(['paid','succeeded','completed','partially_refunded','refunded']);
const callbackState=new Set(['processed','completed']);
const paymentTypes=new Set(['checkout.session.completed','payment_intent.succeeded','payment.capture.completed','payment.capture.denied','payment.captured']);
const clean=x=>String(x??'').trim().toLowerCase();
const id=x=>typeof x==='string'&&UUID.test(x);
const integer=x=>{if(x===null||x===undefined||x==='')return 0;const s=String(x);if(!/^\d{1,12}$/.test(s))throw Error('Invalid integer-cent source amount');const n=Number(s);if(!Number.isSafeInteger(n))throw Error('Unsafe cent value');return n};
const decimalCents=x=>{if(x===null||x===undefined||x==='')return 0;const s=String(x);if(!/^-?\d{1,10}(?:\.\d{1,2})?$/.test(s))throw Error('Invalid decimal CAD amount');const negative=s.startsWith('-'),parts=(negative?s.slice(1):s).split('.');const n=Number(parts[0])*100+Number((parts[1]||'').padEnd(2,'0'));if(!Number.isSafeInteger(n))throw Error('Unsafe CAD amount');return negative?-n:n};
const suffix=x=>id(x)?x.slice(-8):'unlinked';
const add=(target,key)=>{target[key]=(target[key]||0)+1};
const safeArray=(name,rows)=>{if(!Array.isArray(rows)||rows.length>LIMITS898[name])throw Error('Invalid '+name+' source window');const ids=new Set();for(const row of rows){if(!row||!id(row.id)||ids.has(row.id))throw Error('Malformed/duplicate '+name+' source identity');ids.add(row.id)}return rows};
export function projectFinance898({payments=[],refunds=[],events=[],applications=[],accounting=[],finalBalances=[],sampledAt=new Date().toISOString(),revision=null}={}){
 const args={payments,refunds,events,applications,accounting,finalBalances};
 for(const [name,rows] of Object.entries(args))safeArray(name,rows);
 const byPayment=new Map(payments.map(p=>[p.id,p]));
 const eventKeys=new Set(),eventById=new Map(),eventsByPayment=new Map();
 for(const e of events){
  if(!['stripe','paypal'].includes(clean(e.provider)))throw Error('Unrecognized webhook provider');
  const key=clean(e.provider)+'|'+String(e.provider_event_id||'');
  if(!e.provider_event_id||eventKeys.has(key))throw Error('Duplicate or absent original provider event identity');
  eventKeys.add(key);
  eventById.set(key,e);
  if(e.quote_deposit_payment_request_id&&!id(e.quote_deposit_payment_request_id))throw Error('Malformed callback payment binding');
  const group=eventsByPayment.get(e.quote_deposit_payment_request_id)||[];
  group.push(e);eventsByPayment.set(e.quote_deposit_payment_request_id,group);
 }
 const refundsByPayment=new Map();
 const orphanRefunds=[];
 for(const x of refunds){
  if(!id(x.quote_deposit_payment_request_id))throw Error('Malformed refund source link');
  const group=refundsByPayment.get(x.quote_deposit_payment_request_id)||[];
  group.push(x);refundsByPayment.set(x.quote_deposit_payment_request_id,group);
  if(!byPayment.has(x.quote_deposit_payment_request_id))orphanRefunds.push(suffix(x.id));
 }
 const appsByBooking=new Map(),appsBySource=new Map(),applicationSignatures=new Set(),duplicateApplications=[];
 for(const a of applications){
  if(a.booking_id&&!id(a.booking_id))throw Error('Malformed application booking ID');
  integer(a.amount_cents);
  const sig=[a.source_type,a.source_id,a.target_type,a.target_id,a.booking_id,a.amount_cents,clean(a.application_status)].join('|');
  if(applicationSignatures.has(sig)&&clean(a.application_status)==='applied')duplicateApplications.push(suffix(a.id));
  applicationSignatures.add(sig);
  if(a.booking_id){const group=appsByBooking.get(a.booking_id)||[];group.push(a);appsByBooking.set(a.booking_id,group)}
  if(a.source_id){const group=appsBySource.get(a.source_id)||[];group.push(a);appsBySource.set(a.source_id,group)}
 }
 const accountingByBooking=new Map();
 for(const a of accounting){if(!id(a.booking_id))throw Error('Malformed accounting booking link');const group=accountingByBooking.get(a.booking_id)||[];group.push(a);accountingByBooking.set(a.booking_id,group)}
 const finalByBooking=new Map();
 for(const f of finalBalances){if(f.booking_id&&!id(f.booking_id))throw Error('Malformed final balance booking ID');integer(f.amount_cents);integer(f.paid_amount_cents);
  if(f.booking_id){const group=finalByBooking.get(f.booking_id)||[];group.push(f);finalByBooking.set(f.booking_id,group)}}
 const issues=Object.create(null),items=[],totals={source_reported_paid_cents:0,source_reported_refunded_cents:0,
  source_reported_processor_fee_cents:0,recorded_hst_cents:0,source_reported_final_balance_paid_cents:0};
 const seenAccounting=new Set();
 for(const a of accounting){if(seenAccounting.has(a.booking_id))continue;seenAccounting.add(a.booking_id);
   if((accountingByBooking.get(a.booking_id)||[]).length===1)totals.recorded_hst_cents+=decimalCents(a.tax_cad);
 }
 for(const f of finalBalances){if(paidState.has(clean(f.status)))totals.source_reported_final_balance_paid_cents+=integer(f.paid_amount_cents)}
 for(const p of payments){
  const warnings=[],provider=clean(p.provider),payState=clean(p.payment_status||p.status),paid=integer(p.paid_amount_cents),
   expected=integer(p.amount_cents),fee=integer(p.processor_fee_cents),refundLocal=integer(p.refunded_amount_cents);
  if(!['stripe','paypal','manual'].includes(provider))warnings.push('UNKNOWN_PROVIDER');
  if(clean(p.currency)!=='cad')warnings.push('CURRENCY_OR_MISSING_CAD');
  if(paid>0&&expected>0&&paid!==expected)warnings.push('AMOUNT_DIFFERS_FROM_REQUEST');
  if(paidState.has('paid')&&paid===0)warnings.push('PAID_WITHOUT_AMOUNT');
  if(paidState.has(payState)&&paid===0)warnings.push('PAID_WITHOUT_AMOUNT');
  if(paid>0&&!paidState.has(payState))warnings.push('AMOUNT_WITHOUT_FINAL_PAYMENT_STATUS');
  if(paid>0&&fee===0&&provider!=='manual')warnings.push('PROCESSOR_FEE_NOT_RECORDED');
  const bound=eventsByPayment.get(p.id)||[],matched=bound.filter(e=>clean(e.provider)===provider&&
   String(e.provider_event_id||'')===String(p.provider_event_id||'')&&callbackState.has(clean(e.status))&&
   paymentTypes.has(clean(e.provider_event_type))&&clean(e.provider_event_type)!=='payment.capture.denied');
  const callback=matched.length===1&&provider!=='manual';
  if(paid>0&&!callback)warnings.push('NO_EXACT_PROCESSED_PROVIDER_CALLBACK');
  if(matched.length>1)warnings.push('AMBIGUOUS_PROVIDER_CALLBACK');
  const rs=refundsByPayment.get(p.id)||[];
  let refunded=0,refundPending=0;
  for(const ref of rs){
   const amount=integer(ref.refund_amount_cents);
   if(clean(ref.currency)!=='cad'||clean(ref.provider)!==provider)warnings.push('REFUND_PROVIDER_OR_CURRENCY_MISMATCH');
   if(finalRefund.has(clean(ref.refund_status))){refunded+=amount;
    const refEvent=ref.provider_event_id?eventById.get(provider+'|'+ref.provider_event_id):null;
    if(!refEvent||!callbackState.has(clean(refEvent.status)))warnings.push('REFUND_PROVIDER_RECEIPT_UNVERIFIED');
   }else refundPending+=amount;
  }
  if(refunded>paid||refundLocal>paid)warnings.push('REFUND_EXCEEDS_PAYMENT');
  if(refunded!==refundLocal)warnings.push('REFUND_LEDGER_VARIANCE');
  if(refundPending>0)warnings.push('REFUND_PENDING_OR_FAILED');
  const booking=p.confirmed_booking_id||p.booking_id||null;
  if(booking&&!id(booking))throw Error('Invalid booking in payment source');
  const books=booking?accountingByBooking.get(booking)||[]:[];
  if(books.length!==1)warnings.push('INVOICE_ACCOUNTING_RECORD_NOT_EXACT');
  else{
   const book=books[0];
   if(decimalCents(book.deposit_paid_cad)<paid-refunded)warnings.push('DEPOSIT_ACCOUNTING_UNDERAPPLIED');
   if(decimalCents(book.tax_cad)<0)warnings.push('NEGATIVE_TAX_REVIEW');
  }
  const linkedApps=appsBySource.get(p.id)||[];
  if(linkedApps.some(a=>clean(a.currency)!=='cad'))warnings.push('APPLICATION_CURRENCY_MISMATCH');
  if(!linkedApps.some(a=>clean(a.application_status)==='applied'))warnings.push('NO_PAYMENT_APPLICATION');
  const finals=booking?finalByBooking.get(booking)||[]:[];
  if(finals.some(f=>paidState.has(clean(f.status))&&integer(f.paid_amount_cents)>0&&!f.provider_event_id))
   warnings.push('FINAL_BALANCE_PROVIDER_PROOF_MISSING');
  totals.source_reported_paid_cents+=paid;
  totals.source_reported_refunded_cents+=refunded;
  totals.source_reported_processor_fee_cents+=fee;
  for(const key of new Set(warnings))add(issues,key);
  items.push({payment_suffix:suffix(p.id),booking_suffix:suffix(booking),provider,source_status:payState,
   source_paid_cents:paid,source_refunded_cents:refunded,source_fee_cents:fee,
   callback_recorded:callback,provider_settlement_verified:false,bank_match_verified:false,
   issued_invoice_verified:false,accountant_tax_approved:false,
   payment_application_count:linkedApps.length,final_balance_count:finals.length,
   exception_codes:[...new Set(warnings)],
   review_status:warnings.length?'REVIEW_REQUIRED':'SOURCE_MATCHED_EXTERNAL_PROOF_HOLD'});
 }
 if(orphanRefunds.length)add(issues,'ORPHAN_REFUND_OUTSIDE_WINDOW');
 if(duplicateApplications.length)add(issues,'DUPLICATE_APPLICATION_CANDIDATE');
 const capped=Object.entries(args).filter(([name,rows])=>rows.length>=LIMITS898[name]).map(([name])=>name);
 return {schema:'rosie.finance-reconciliation.local.v898',build:898,sampled_at:sampledAt,source_revision:revision,
  disposition:'BUSINESS_ACCEPTANCE_HOLD',windows:Object.fromEntries(Object.entries(args).map(([k,rows])=>[k,{count:rows.length,limit:LIMITS898[k],possibly_truncated:rows.length>=LIMITS898[k]}])),
  totals,issue_counts:{...issues},orphan_refund_suffixes:orphanRefunds,duplicate_application_suffixes:duplicateApplications,
  source_window_review:capped,items,scope:{
   original_business_only:true,server_only_private_read:true,customer_identity_excluded:true,
   source_reported_not_provider_settled:true,original_webhook_record_not_bank_settlement:true,
   no_tax_rate_assumed:true,recorded_hst_not_filed_or_remitted:true,issued_invoice_proof_required:true,
   no_mutation:true,no_provider_calls:true,no_refund_or_charge:true,no_master_export:true,
   no_automatic_close:true,no_double_counting_final_balance:true}};
}
