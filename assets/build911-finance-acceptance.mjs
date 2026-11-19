// Build 911: read-only original-source finance proof matrix.
// No provider settlement, issued invoice, CRA/HST filing or bank match can be certified by a local webhook.
const evidenceFields=['payments','refunds','events','applications','accounting','finalBalances'];
const number=n=>Number.isSafeInteger(n)&&n>=0?n:null;
export function buildFinanceAcceptance911(report,receivedAt=new Date().toISOString()){
 if(!report||report.schema!=='rosie.finance-reconciliation.local.v898'||!report.windows||!report.totals)
  throw Error('Original Build 898 finance source report required');
 const counts={};
 for(const name of evidenceFields){
  const row=report.windows[name];
  if(!row||number(row.count)===null||row.possibly_truncated===true)throw Error('Original source incomplete: '+name);
  counts[name]=row.count;
 }
 const sampleSize=counts.payments+counts.refunds+counts.events+counts.applications+counts.accounting+counts.finalBalances;
 const issues=Object.entries(report.issue_counts||{}).filter(([,v])=>Number(v)>0)
  .map(([code,count])=>({code,count:Number(count)}));
 const blockers=[];
 if(!counts.payments)blockers.push('NO_ORIGINAL_STRIPE_PAYPAL_PAYMENT_REQUESTS');
 if(!counts.events)blockers.push('NO_ORIGINAL_PROCESSED_PROVIDER_CALLBACKS');
 if(!counts.refunds)blockers.push('NO_ORIGINAL_REFUND_LIFECYCLE_SAMPLE');
 if(!counts.accounting)blockers.push('NO_ORIGINAL_INVOICE_HST_ACCOUNTING_SAMPLE');
 if(issues.length)blockers.push('ORIGINAL_FINANCE_EXCEPTIONS_REQUIRE_REVIEW');
 blockers.push('INDEPENDENT_STRIPE_PAYPAL_SETTLEMENT_WITNESS_REQUIRED');
 blockers.push('BANK_AND_REFUND_RECONCILIATION_SIGNOFF_REQUIRED');
 blockers.push('ISSUED_INVOICE_AND_ACCOUNTANT_HST_SIGNOFF_REQUIRED');
 const totals=report.totals;
 for(const key of ['source_reported_paid_cents','source_reported_refunded_cents','source_reported_processor_fee_cents',
  'recorded_hst_cents','source_reported_final_balance_paid_cents']){
  if(!Number.isSafeInteger(totals[key]))throw Error('Unreliable original monetary totals');
 }
 return {schema:'rosie.finance.acceptance.v911',source:'ORIGINAL_ROSIE_APP_RECORDS',
  sampled_at:receivedAt,source_revision:report.source_revision||null,
  counts,source_reported_cents:{...totals},exceptions:issues,
  states:{local_source_review:sampleSize?'SOURCE_AVAILABLE_EXTERNAL_HOLD':'NO_ORIGINAL_TRANSACTIONS',
   stripe_settlement:'HOLD_EXTERNAL_PROVIDER',paypal_settlement:'HOLD_EXTERNAL_PROVIDER',
   refunds:'HOLD_PROVIDER_AND_BANK',invoice_hst:'HOLD_ISSUED_INVOICE_ACCOUNTANT',
   revenue_analytics:sampleSize?'SOURCE_ONLY_NOT_SETTLED':'NO_LIVE_REVENUE_SAMPLE',
   live_business_acceptance:'HOLD'},
  blockers,manual_witness_required:true,
  authority:{read_only:true,charge:false,refund:false,ledger_post:false,
   accountant_close:false,tax_file:false,marketing_publish:false,
   original_provider_data_fetched:false,bank_data_fetched:false,
   allow_claim_green_business:false}};
}
