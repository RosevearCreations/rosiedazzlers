#!/usr/bin/env node
// Scheduled source-history watch: redacted aggregate owner issue only, never customer email.
import {github881,originalIssue881,repo881} from './build881_owner_issue_client.mjs';
const url='https://rosiedazzlers.ca/api/roadside_operational_watch_v881';
const title='[Rosie 881] Original signed native history / issuer grace owner alert';
export function safeReport881(v){
 const allowed=['CRITICAL','HIGH','REVIEW','NONE'];
 const measures=['native_observations','original_drafts_observed',
 'native_source_changes_review','broken_native_chain_links',
 'stale_native_observations','aged_signed_events','rotation_receipts',
 'broken_rotation_chain_links','grace_expiring_seven_days',
 'grace_expiring_72_hours','grace_expired','pin_custody_hold'];
 if(v?.ok!==true||v.build!==881||!allowed.includes(v.severity)||
   typeof v.alert!=='boolean'||v.no_customer_identifiers!==true||
   v.original_provider_current_delivery_not_inferred!==true||
   v.no_financial_or_key_mutation!==true||
   v.alert!==(v.severity!=='NONE')||
   measures.some(k=>!Number.isSafeInteger(v[k])||v[k]<0||v[k]>60))
  throw Error('Unverified or identity-unsafe original owner watch output');
 return {severity:v.severity,coverage_incomplete:v.coverage_incomplete===true,
  no_original_native_history:v.no_original_native_history===true,
  no_original_rotation_receipts:v.no_original_rotation_receipts===true,
  measures:Object.fromEntries(measures.map(k=>[k,v[k]]))};
}
export async function run881(){
 const key=process.env.ROSIE881_OWNER_WATCH_JOB_SECRET||'';
 if(key.length<32||process.env.GITHUB_REPOSITORY!==repo881)
  throw Error('Rosie 881 scheduled watch NOT ENROLLED; no live monitoring claimed');
 const res=await fetch(url,{method:'POST',redirect:'error',headers:{
  Authorization:'Bearer '+key,Accept:'application/json'}});
 if(!res.ok)throw Error('Rosie 881 original scheduled source HOLD (HTTP '+res.status+')');
 const payload=await res.json();
 const report=safeReport881(payload);
 console.log('Rosie 881 original history watch: '+report.severity+
  ' (not live vendor confirmation, no customer identifiers)');
 if(!payload.alert)return;
 const body='<!-- rosie881-watch-state:'+JSON.stringify(report)+' -->\n'+
  '## Original Native Evidence and Issuer Grace Review\n'+
  'Original source-history alert level: **'+report.severity+'**.\n'+
  'Coverage incomplete: **'+report.coverage_incomplete+'**.\n'+
  'No original native observation history: '+report.no_original_native_history+'.\n'+
  'No original issuer readback receipts: '+report.no_original_rotation_receipts+'.\n'+
  'Redacted counts (bounded, source-history only):\n'+
  Object.entries(report.measures).map(([k,v])=>'- '+k+': '+v).join('\n')+'\n'+
  'No customer identifiers, original draft IDs, notes, tokens, payments or keys included.\n'+
  'A changed signed-event chain requires independent original provider review; it is not automatically tampering.\n'+
  'No customer opened-email proof, refund settlement, issuer rotation or active live provider acceptance is asserted.\n'+
  'Owner review required; this issue is not automatically closed by a successful later check.\n';
 const issue=await originalIssue881(title,body);
 if(issue.body!==body){
  await github881('/issues/'+issue.number,'PATCH',{body});
  console.log('Existing redacted owner issue updated; no auto-closure.');
 }else console.log('Existing owner issue unchanged; no repetitive comment.');
}
if(import.meta.url===new URL('file://'+process.argv[1]).href)
 run881().catch(e=>{console.error('Rosie 881 watch: '+e.message);process.exitCode=1;});
