import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ECONOMICS_SCHEMA_832,ECONOMICS_HANDOFFS_832,projectJobEconomics832}
  from '../assets/build832-job-economics.mjs';
import {onRequestGet,onRequestPost,onRequestOptions}
  from '../functions/api/admin/job_economics_reconciliation_v832.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const now='2026-11-09T18:00:00.000Z';
const booking=(n=1)=>({id:id(n),created_at:now,status:'completed',customer_email:'PII@example.invalid'});
const finance=(n=2,other={})=>({id:id(n),booking_id:id(1),created_at:now,
  accounting_stage:'open',subtotal_cad:'100.00',total_cad:'113.00',tax_cad:'13.00',
  deposit_paid_cad:'20.00',final_paid_cad:'93.00',other_paid_cad:'0.00',tip_cad:'0.00',
  refund_cad:'0.00',collected_total_cad:'113.00',balance_due_cad:'0.00',
  customer_name:'PRIVATE CUSTOMERS',notes:'Never expose',...other});
const movement=(n=3,other={})=>({id:id(n),booking_id:id(1),created_at:now,
  movement_type:'job_use',qty_delta:'-2.00',actor_name:'PRIVATE STAFF',...other});
const time=(n=4,other={})=>({id:id(n),booking_id:id(1),created_at:now,
  entry_type:'manual',minutes:'75',staff_name:'PRIVATE DETAILER',...other});
const journal=(n=5,other={})=>({id:id(n),reference_id:id(1),created_at:now,
  reference_type:'booking_inventory_usage',entry_type:'inventory_usage_cogs',
  status:'posted',total_cad:'4.00',memo:'PRIVATE',...other});
const payroll=(n=6,other={})=>({id:id(n),created_at:now,period_start:'2026-11-01',
  period_end:'2026-11-14',status:'posted',total_gross_cad:'800.00',...other});
const run=more=>projectJobEconomics832({bookings:[booking()],...more});
const empty=projectJobEconomics832();
assert.equal(empty.schema,ECONOMICS_SCHEMA_832);
assert.equal(empty.rows.length,0);
assert.equal(empty.sourceConnectionState,'DISCONNECTED / HOLD');
for(const flag of ['jobPayrollLinkAvailable','invoiceTemplateIsIssuedInvoice',
  'validatedHistoricalCostBasis','signedProviderReceiptsVerified','accountingTaxWorksheetsVerified',
  'taxPeriodClosed','accountantAccepted','ownerAccepted','bookingsChanged',
  'inventoryChanged','payrollChanged','financeChanged','invoicesIssued','taxFiled',
  'notificationsSent','dataSentToMaster','canonicalHoldChanged'])assert.equal(empty[flag],false,flag);
for(const key of ['reportedMarginCad','verifiedHstReturnCad','approvedNumerator',
  'approvedDenominator','masterCompletionPercent'])assert.equal(empty[key],null,key);
const missing=run();
assert.equal(missing.rows[0].primaryIssue,'ACCOUNTING_RECORD_MISSING');
assert.equal(missing.rows[0].localInvoiceTotalCad,null);
const full=run({finance:[finance()],inventory:[movement()],time:[time()],
  journals:[journal()],payroll:[payroll()]});
const row=full.rows[0];
assert.equal(row.localInvoiceTotalCad,'113.00');
assert.equal(row.localTaxCad,'13.00');
assert.equal(row.localBalanceCad,'0.00');
assert.equal(row.localAccountingRecordCount,1);
assert.equal(row.postedCogsJournalCount,1);
assert.equal(row.positiveTimeMinutesSnapshot,75);
assert.equal(row.jobUseMovementCount,1);
assert.equal(full.globalPostedPayrollRunCount,1);
assert.equal(full.payrollRunsNotJobAllocations,true);
assert.equal(row.bookingPayrollAllocationVerified,false);
assert.equal(row.verifiedJobMarginCad,null);
assert.equal(row.historicInventoryCostCad,null);
assert.equal(row.actualWageCostCad,null);
assert.equal(row.issuedInvoiceVerified,false);
assert.equal(row.postedHstVerified,false);
assert.equal(row.taxReturnVerified,false);
assert.equal(row.signedReceiptsVerified,false);
assert.equal(row.accountantAccepted,false);
assert.equal(row.ownerAccepted,false);
assert.ok(row.issueCodes.includes('INVENTORY_COGS_REVIEW'));
assert.ok(row.issueCodes.includes('LABOUR_PAYROLL_ALLOCATION_REVIEW'));
assert.ok(row.issueCodes.includes('INVOICE_OR_RECEIPT_REVIEW'));
assert.ok(row.issueCodes.includes('TAX_WORKPAPER_REVIEW'));
assert.equal(Object.keys(ECONOMICS_HANDOFFS_832).length,8);
assert.doesNotMatch(JSON.stringify(full),/PII@example.invalid|PRIVATE CUSTOMERS|PRIVATE STAFF|PRIVATE DETAILER|PRIVATE/);
assert.equal(run({finance:[finance(2,{tax_cad:'-13'})]}).rows[0].primaryIssue,'AMOUNT_OR_TAX_CONFLICT');
assert.equal(run({finance:[finance(2,{collected_total_cad:'112.00'})]}).rows[0].primaryIssue,'AMOUNT_OR_TAX_CONFLICT');
assert.equal(run({finance:[finance(2,{total_cad:'NaN'})]}).rows[0].primaryIssue,'AMOUNT_OR_TAX_CONFLICT');
assert.equal(run({finance:[finance(),finance(9)]}).rows[0].primaryIssue,'SOURCE_IDENTITY_REVIEW');
assert.equal(run({time:[time(4,{minutes:'-1'})]}).rows[0].primaryIssue,'SOURCE_IDENTITY_REVIEW');
assert.equal(run({inventory:[movement(3,{qty_delta:'1.00'})]}).rows[0].jobUseMovementCount,1);
assert.equal(run({inventory:[movement(3,{qty_delta:'1.00'})]}).rows[0].primaryIssue,'ACCOUNTING_RECORD_MISSING');
assert.throws(()=>run({finance:[finance(2,{booking_id:id(80)})]}),/Out-of-scope/);
assert.throws(()=>run({inventory:[movement(3,{id:'not-uuid'})]}),/Out-of-scope/);
assert.throws(()=>run({time:[time(),time()]}),/Duplicate/);
assert.throws(()=>run({journals:[journal(5,{reference_id:id(80)})]}),/Invalid/);
assert.throws(()=>run({journals:[journal(),journal()]}),/Invalid/);
assert.throws(()=>run({payroll:[payroll(6,{period_start:'not-date'})]}),/Invalid/);
assert.throws(()=>run({payroll:[payroll(),payroll()]}),/Invalid/);
assert.throws(()=>run({bookings:[booking(),booking()]}),/duplicate/);
assert.throws(()=>projectJobEconomics832({bookings:Array.from({length:41},(_,n)=>booking(n+1))}),/Bounded/);
assert.equal(run({payroll:Array.from({length:40},(_,n)=>payroll(n+6))}).sourceWindowMayOmitHistory,true);
assert.equal(run({revision:'c'.repeat(40)}).currentDeploymentRevisionClaim,'c'.repeat(40));
assert.equal(run({revision:'bad'}).currentDeploymentRevisionClaim,null);

let signed=false,role='detailer',staffPrivilege=true,assignment=true,sourceOk=true;
const reads=[];
const request=new Request('https://rosiedazzlers.ca/api/admin/job_economics_reconciliation_v832',
  {headers:{Cookie:'rd_staff_session=token'}});
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'server-only',
  CF_PAGES_COMMIT_SHA:'d'.repeat(40)};
const oldFetch=globalThis.fetch;
globalThis.fetch=async(input,init={})=>{
  const url=new URL(input),table=url.pathname.split('/').pop();
  reads.push({table,query:url.search,method:init.method,headers:init.headers});
  assert.equal(init.method||'GET','GET');
  if(table==='staff_auth_sessions')return Response.json(signed?[{expires_at:'2031-01-01T00:00:00Z',
    revoked_at:null,staff_user:{id:id(99),role_code:role,is_active:true,
      can_manage_bookings:true,can_manage_staff:staffPrivilege,
      permissions_profile:{action_access:{'operations.customer.manage':true,
        'operations.assignment.manage':assignment}}}}]:[]);
  if(!sourceOk&&table==='catalog_inventory_movements')return Response.json({error:'offline'},{status:503});
  const sources={bookings:[booking()],accounting_records:[finance()],
    catalog_inventory_movements:[movement()],job_time_entries:[time()],
    accounting_journal_entries:[journal()],staff_payroll_runs:[payroll()]};
  if(!Object.hasOwn(sources,table))throw Error('Unexpected read: '+table);
  assert.equal(init.headers.apikey,'server-only');
  return Response.json(sources[table]);
};
try{
  assert.equal((await onRequestGet({request,env})).status,401);
  signed=true;assert.equal((await onRequestGet({request,env})).status,403);
  role='admin';staffPrivilege=false;assert.equal((await onRequestGet({request,env})).status,403);
  staffPrivilege=true;assignment=false;const res=await onRequestGet({request,env});assert.equal(res.status,200);
  assert.match(res.headers.get('Cache-Control'),/no-store/);
  const body=await res.json();assert.equal(body.report.schema,ECONOMICS_SCHEMA_832);
  assert.equal(body.report.rows[0].localInvoiceTotalCad,'113.00');
  assert.equal(body.sourceAuthority.no_tax_filing,true);
  assert.equal(body.report.currentDeploymentRevisionClaim,'d'.repeat(40));
  assert.ok(reads.some(x=>x.table==='accounting_records'&&x.query.includes('booking_id=in.(')));
  assert.ok(reads.some(x=>x.table==='catalog_inventory_movements'&&x.query.includes('booking_id=in.(')));
  assert.ok(reads.some(x=>x.table==='accounting_journal_entries'&&x.query.includes('reference_id=in.(')));
  assert.ok(reads.some(x=>x.table==='staff_payroll_runs'&&!x.query.includes('booking_id=')));
  assert.ok(reads.every(x=>(x.method||'GET')==='GET'));
  assert.equal((await onRequestPost()).status,405);
  assert.equal((await onRequestOptions()).status,405);
  sourceOk=false;const err=await onRequestGet({request,env});assert.equal(err.status,503);
  assert.equal(Object.hasOwn(await err.json(),'report'),false);
}finally{globalThis.fetch=oldFetch;}
const html=read('../admin-handoff-acceptance.html');
const ui=read('../assets/build832-economics-ui.mjs');
const css=read('../assets/build832-economics.css');
const api=read('../functions/api/admin/job_economics_reconciliation_v832.js');
assert.match(html,/build832Heading/);assert.match(html,/id="build832Rows"/);
assert.match(html,/startEconomics832\(\)/);assert.match(html,/build832-economics\.css/);
assert.match(ui,/textContent/);assert.doesNotMatch(ui,/innerHTML|\.post\(|method:\s*['"]POST/);
assert.match(css,/focus-visible/);
assert.match(api,/staffAccess811/);assert.match(api,/can_manage_staff/);
assert.doesNotMatch(api,/method:\s*['"](?:POST|PATCH|DELETE|PUT)/);
assert.match(read('./current_booking_wizard_regression.sh'),/build832_job_economics_reconciliation_test/);
console.log('Build 832 private job economics, source isolation, finance, payroll, inventory, invoice/HST HOLD and UI tests PASS');
