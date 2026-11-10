// Build 832 — private, read-only source reconciliation; no accountant or owner approval inferred.
// Numeric accounting values are decimal CAD strings in PostgREST. Convert to cents
// without floating-point accumulation; never treat a snapshot as a posted invoice.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/;
export const ECONOMICS_SCHEMA_832='rosie.job-economics.local-reconciliation.v1';
export const ECONOMICS_LIMITS_832=Object.freeze({bookings:40,finance:40,inventory:200,time:200,journals:200,payroll:40});
export const ECONOMICS_HANDOFFS_832=Object.freeze({
  SOURCE_IDENTITY_REVIEW:{route:'/admin-accounting.html',message:'Check duplicate, out-of-scope or undated finance source identity; do not accept a financial period.'},
  ACCOUNTING_RECORD_MISSING:{route:'/admin-accounting.html',message:'Review the original booking accounting record and source posting; absent data is not zero revenue.'},
  AMOUNT_OR_TAX_CONFLICT:{route:'/admin-accounting.html',message:'Review local totals, tax component, collections, refunds and balance with the actual invoice and accountant.'},
  INVENTORY_COGS_REVIEW:{route:'/admin-inventory.html',message:'Check signed physical consumables usage, reversals and historical unit costs against posted COGS; current stock price is not a historical cost.'},
  LABOUR_PAYROLL_ALLOCATION_REVIEW:{route:'/admin-payroll.html',message:'Confirm staff time, wage rate at work date, payroll-run membership and bank payout using original payroll evidence; period runs do not allocate wages to bookings.'},
  INVOICE_OR_RECEIPT_REVIEW:{route:'/admin-accounting.html',message:'Compare the actual issued customer invoice and provider/bank receipts with local invoice-template and accounting values.'},
  TAX_WORKPAPER_REVIEW:{route:'/admin-accounting.html',message:'Check Ontario HST/ITC treatment, exemptions and GL sales-tax posting against original invoices, CRA workpapers and accountant review.'},
  OWNER_ACCOUNTANT_REVIEW:{route:'/admin-economic-owner-v768.html',message:'Collect original finance, inventory, payroll, invoice and HST proof, then obtain separate accountant and owner decisions.'}
});
const stamp=v=>typeof v==='string'&&ISO.test(v)&&Number.isFinite(Date.parse(v))?Date.parse(v):null;
const safeId=v=>typeof v==='string'&&UUID.test(v);
const norm=v=>typeof v==='string'?v.trim().toLowerCase():'';
// Bound prices to reasonable 12,2 decimals and reject unsafe representations.
const cents=v=>{
  if(typeof v!=='string'&&typeof v!=='number')return null;
  const s=String(v).trim();if(!/^-?\d{1,10}(?:\.\d{1,2})?$/.test(s))return null;
  const negative=s.startsWith('-'),parts=(negative?s.slice(1):s).split('.');
  const amount=Number(parts[0])*100+Number((parts[1]||'').padEnd(2,'0'));
  return Number.isSafeInteger(amount)?(negative?-amount:amount):null;
};
const qty=v=>{
  const s=String(v??'');return /^-?\d{1,10}(?:\.\d{1,2})?$/.test(s)&&Number.isFinite(Number(s))?Number(s):null;
};
function indexed(rows,ids,kind){
  const by=new Map(),seen=new Set();
  for(const row of rows){
    if(!row||!safeId(row.id)||!safeId(row.booking_id)||!ids.has(row.booking_id))
      throw Error('Out-of-scope '+kind+' source');
    if(seen.has(row.id))throw Error('Duplicate '+kind+' source');
    seen.add(row.id);
    if(stamp(row.created_at)===null)throw Error('Undated '+kind+' source');
    if(!by.has(row.booking_id))by.set(row.booking_id,[]);
    by.get(row.booking_id).push(row);
  }
  return by;
}
export function projectJobEconomics832({bookings=[],finance=[],inventory=[],time=[],journals=[],payroll=[],
  sampledAt=null,revision=null}={}){
  const arrays={bookings,finance,inventory,time,journals,payroll};
  for(const [key,rows] of Object.entries(arrays))
    if(!Array.isArray(rows)||rows.length>ECONOMICS_LIMITS_832[key])throw Error('Bounded '+key+' source required');
  const ids=new Set();
  for(const row of bookings){
    if(!row||!safeId(row.id)||stamp(row.created_at)===null||ids.has(row.id))
      throw Error('Malformed or duplicate booking source');
    ids.add(row.id);
  }
  const financeMap=indexed(finance,ids,'accounting'),stockMap=indexed(inventory,ids,'inventory'),
    labourMap=indexed(time,ids,'time');
  const journalMap=new Map();const journalIds=new Set();
  for(const row of journals){
    if(!row||!safeId(row.id)||!safeId(row.reference_id)||!ids.has(row.reference_id)||
      stamp(row.created_at)===null||journalIds.has(row.id))throw Error('Invalid booking journal reference');
    journalIds.add(row.id);
    if(!journalMap.has(row.reference_id))journalMap.set(row.reference_id,[]);
    journalMap.get(row.reference_id).push(row);
  }
  const runIds=new Set();
  for(const row of payroll){
    if(!row||!safeId(row.id)||stamp(row.created_at)===null||runIds.has(row.id)||
      !/^\d{4}-\d\d-\d\d$/.test(row.period_start)||
      !/^\d{4}-\d\d-\d\d$/.test(row.period_end))throw Error('Invalid payroll run snapshot');
    runIds.add(row.id);
  }
  const rows=bookings.map(booking=>{
    const accts=financeMap.get(booking.id)||[];
    const movements=stockMap.get(booking.id)||[];
    const timed=labourMap.get(booking.id)||[];
    const ledgers=journalMap.get(booking.id)||[];
    const a=accts[0];const issues=[];
    if(accts.length>1)issues.push('SOURCE_IDENTITY_REVIEW');
    if(!a)issues.push('ACCOUNTING_RECORD_MISSING');
    const amounts=a?Object.fromEntries(['subtotal_cad','total_cad','tax_cad','deposit_paid_cad',
      'final_paid_cad','other_paid_cad','tip_cad','refund_cad','collected_total_cad','balance_due_cad']
      .map(k=>[k,cents(a[k])])):null;
    if(a&&(Object.values(amounts).some(v=>v===null)||
      amounts.tax_cad<0||amounts.total_cad<0||amounts.refund_cad<0||
      amounts.balance_due_cad<0||amounts.collected_total_cad<0||
      Math.abs(amounts.collected_total_cad-(amounts.deposit_paid_cad+
        amounts.final_paid_cad+amounts.other_paid_cad+amounts.tip_cad-amounts.refund_cad))>1||
      Math.abs(amounts.total_cad-(amounts.collected_total_cad+amounts.balance_due_cad))>1))
      issues.push('AMOUNT_OR_TAX_CONFLICT');
    const uses=movements.filter(m=>norm(m.movement_type)==='job_use');
    const negative=movements.some(m=>qty(m.qty_delta)===null||
      (norm(m.movement_type)==='job_use'&&qty(m.qty_delta)>=0));
    const cogs=ledgers.filter(j=>norm(j.reference_type)==='booking_inventory_usage'&&
      norm(j.entry_type)==='inventory_usage_cogs'&&norm(j.status)==='posted');
    if(uses.length||movements.length||negative)issues.push('INVENTORY_COGS_REVIEW');
    if(timed.length)issues.push('LABOUR_PAYROLL_ALLOCATION_REVIEW');
    issues.push('INVOICE_OR_RECEIPT_REVIEW','TAX_WORKPAPER_REVIEW','OWNER_ACCOUNTANT_REVIEW');
    const timeInvalid=timed.some(t=>qty(t.minutes)===null||qty(t.minutes)<0);
    if(timeInvalid&&!issues.includes('SOURCE_IDENTITY_REVIEW'))issues.unshift('SOURCE_IDENTITY_REVIEW');
    const positiveMinutes=timed.reduce((sum,t)=>sum+(qty(t.minutes)>0?qty(t.minutes):0),0);
    const primary=issues[0];
    return {bookingSuffix:booking.id.slice(-8),bookingState:norm(booking.status)||'unknown',
      sourceBookingCreatedAt:booking.created_at,primaryIssue:primary,issueCodes:issues,
      localAccountingRecordCount:accts.length,localAccountingStage:norm(a?.accounting_stage)||'unknown',
      localInvoiceTotalCad:amounts&&amounts.total_cad!==null?(amounts.total_cad/100).toFixed(2):null,
      localTaxCad:amounts&&amounts.tax_cad!==null?(amounts.tax_cad/100).toFixed(2):null,
      localBalanceCad:amounts&&amounts.balance_due_cad!==null?(amounts.balance_due_cad/100).toFixed(2):null,
      inventoryMovementCount:movements.length,jobUseMovementCount:uses.length,
      postedCogsJournalCount:cogs.length,localTimeEntryCount:timed.length,
      positiveTimeMinutesSnapshot:Number(positiveMinutes.toFixed(2)),
      bookingPayrollAllocationVerified:false,actualWageCostCad:null,
      historicInventoryCostCad:null,verifiedJobMarginCad:null,
      issuedInvoiceVerified:false,postedHstVerified:false,taxReturnVerified:false,
      signedReceiptsVerified:false,accountantAccepted:false,ownerAccepted:false,
      nextAction:ECONOMICS_HANDOFFS_832[primary].message,
      nextRoute:ECONOMICS_HANDOFFS_832[primary].route};
  });
  return {schema:ECONOMICS_SCHEMA_832,build:832,sourceId:'rosiedazzlers',
    shellBoundary:'owned_business_shell',generatedAt:stamp(sampledAt)!==null?sampledAt:new Date().toISOString(),
    currentDeploymentRevisionClaim:typeof revision==='string'&&/^[a-f0-9]{40}$/.test(revision)?revision:null,
    sourceCounts:Object.fromEntries(Object.entries(arrays).map(([k,v])=>[k,v.length])),
    sourceLimits:ECONOMICS_LIMITS_832,sourceWindowMayOmitHistory:Object.entries(arrays)
      .some(([k,v])=>v.length===ECONOMICS_LIMITS_832[k]),
    jobPayrollLinkAvailable:false,globalPayrollRunCount:payroll.length,
    globalPostedPayrollRunCount:payroll.filter(r=>norm(r.status)==='posted').length,
    payrollRunsNotJobAllocations:true,sourceHistoryComplete:false,
    invoiceTemplateIsIssuedInvoice:false,validatedHistoricalCostBasis:false,
    signedProviderReceiptsVerified:false,accountingTaxWorksheetsVerified:false,
    taxPeriodClosed:false,accountantAccepted:false,ownerAccepted:false,
    reportedMarginCad:null,verifiedHstReturnCad:null,approvedNumerator:null,
    approvedDenominator:null,masterCompletionPercent:null,sourceConnectionState:'DISCONNECTED / HOLD',
    bookingsChanged:false,inventoryChanged:false,payrollChanged:false,financeChanged:false,
    invoicesIssued:false,taxFiled:false,notificationsSent:false,dataSentToMaster:false,canonicalHoldChanged:false,
    rows,handoffCounts:Object.fromEntries(Object.keys(ECONOMICS_HANDOFFS_832)
      .map(k=>[k,rows.filter(x=>x.issueCodes.includes(k)).length])),
    nextStep:'Independently verify original job time, stock receipts, historical costs, payroll allocations, issued invoices, signed payment receipts, GL tax and HST workpapers. Obtain accountant and owner acceptance before closure.'};
}
