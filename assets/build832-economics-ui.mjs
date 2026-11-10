// Build 832: finance admin read-only review; no exports or write controls.
import {ECONOMICS_SCHEMA_832,ECONOMICS_HANDOFFS_832} from './build832-job-economics.mjs';
const $=id=>document.getElementById(id);
let report=null,busy=false;
const cell=(row,tag,value)=>{const el=document.createElement(tag);el.textContent=String(value??'UNKNOWN');row.append(el);return el;};
function render(){
  const body=$('build832Rows');body.textContent='';
  if(!report){$('build832Count').textContent='No authorized financial snapshot. All period, accountant and owner outcomes HOLD.';return;}
  const focus=$('build832Filter').value;
  const rows=report.rows.filter(row=>focus==='all'||row.issueCodes.some(code=>
    focus==='inventory'?code==='INVENTORY_COGS_REVIEW':
    focus==='payroll'?code==='LABOUR_PAYROLL_ALLOCATION_REVIEW':
    focus==='finance'?['ACCOUNTING_RECORD_MISSING','AMOUNT_OR_TAX_CONFLICT','SOURCE_IDENTITY_REVIEW'].includes(code):
    ['INVOICE_OR_RECEIPT_REVIEW','TAX_WORKPAPER_REVIEW'].includes(code)));
  for(const record of rows){
    const tr=document.createElement('tr');const th=cell(tr,'th','…'+record.bookingSuffix);th.scope='row';
    cell(tr,'td',record.localAccountingRecordCount+' record(s); stage '+record.localAccountingStage+
      '; source total '+(record.localInvoiceTotalCad??'UNKNOWN')+' CAD; tax '+(record.localTaxCad??'UNKNOWN')+' CAD');
    cell(tr,'td',record.jobUseMovementCount+' job-use / '+record.inventoryMovementCount+' movements; '+
      record.postedCogsJournalCount+' local posted COGS reference(s)');
    cell(tr,'td',record.localTimeEntryCount+' time records / '+record.positiveTimeMinutesSnapshot+
      ' recorded positive minutes (not paid hours)');
    cell(tr,'td',record.issueCodes.join(' · '));
    const handoff=document.createElement('td');const details=document.createElement('details');
    cell(details,'summary','Manual evidence checklist');
    for(const code of record.issueCodes){const descriptor=ECONOMICS_HANDOFFS_832[code];
      if(descriptor)cell(details,'p',code+': '+descriptor.message);}
    handoff.append(details);
    const link=cell(handoff,'a','Open owning review');link.href=record.nextRoute;link.className='btn ghost';
    tr.append(handoff);body.append(tr);
  }
  $('build832Count').textContent=rows.length+'/'+report.rows.length+' sampled bookings; '+
    report.globalPayrollRunCount+' recent company-wide payroll run records, never a per-booking allocation. '+
    'Original invoice, historic inventory cost, payroll, tax, accountant and owner proof unverified.';
}
async function refresh(){
  if(busy)return;busy=true;$('build832Refresh').disabled=true;
  $('build832Status').textContent='Reading signed-finance-admin booking economics sources…';
  try{
    const response=await fetch('/api/admin/job_economics_reconciliation_v832',{credentials:'same-origin',cache:'no-store'});
    const body=await response.json().catch(()=>null);
    if(!response.ok||!body?.ok||body.build!==832||body.report?.schema!==ECONOMICS_SCHEMA_832||
      !Array.isArray(body.report.rows)||body.report.rows.length>40||body.report.canonicalHoldChanged!==false)
      throw Error('Private finance source unavailable');
    report=body.report;
    $('build832Status').textContent='Local bounded source snapshot loaded. '+
      (report.sourceWindowMayOmitHistory?'One or more source windows reached the cap; older records may be missing. ':'')+
      'This is not a signed accountant reconciliation, issued invoice or tax return.';
  }catch{
    report=null;
    $('build832Status').textContent='Financial source unavailable or access denied. No tax, payroll, invoice, margin or owner outcome inferred.';
  }finally{busy=false;$('build832Refresh').disabled=false;render();}
}
export function startEconomics832(){
  $('build832Filter').addEventListener('change',render);
  $('build832Refresh').addEventListener('click',refresh);
  render();refresh();
}
