#!/usr/bin/env node
// Rosie 876: scheduled owner issue escalation, never posts customer identifiers.
const repo='RosevearCreations/rosiedazzlers';
const title='[Rosie 876] Original roadside refund-source HOLD requires owner review';
const severitySet=new Set(['NONE','REVIEW','HIGH','CRITICAL']);
const url='https://rosiedazzlers.ca/api/roadside_drift_watch_v876';
async function github(path,method='GET',body){
 const response=await fetch('https://api.github.com/repos/'+repo+path,{
  method,headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,
   Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',
   ...(body?{'Content-Type':'application/json'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json().catch(()=>null);
 if(!response.ok)throw Error('Private GitHub owner alert authority returned '+response.status);
 return data;
}
async function run(){
 const secret=process.env.ROSIE_ROADSIDE_ESCALATION_JOB_SECRET||'';
 if(secret.length<32||process.env.GITHUB_REPOSITORY!==repo){
  console.log('ROADSIDE ESCALATION NOT ENROLLED: no signed scheduler secret / unexpected repo. No monitoring asserted.');
  return;
 }
 if(!process.env.GITHUB_TOKEN)throw Error('Private GitHub issue write authority missing');
 const response=await fetch(url,{method:'POST',redirect:'error',
  headers:{Authorization:'Bearer '+secret,Accept:'application/json'}});
 if(!response.ok)throw Error('Original refund watch unavailable (HTTP '+response.status+'); owner HOLD requires review');
 const state=await response.json();
 if(state.ok!==true||!severitySet.has(state.severity)||state.no_customer_identifiers!==true||
  typeof state.checked_bookings!=='number'||state.checked_bookings>8)
  throw Error('Original refund watch response failed safety contract');
 const description='<!-- rosie876-owner-watch-state:'+state.severity+' -->\n'+
  '## Original provider refund-source watch\n'+
  'Highest owner urgency: **'+state.severity+'**.\n'+
  'Analyzed original bookings (bounded): '+state.checked_bookings+'.\n'+
  'Source coverage: '+(state.source_coverage_incomplete?'PARTIAL — manual review required':'BOUNDED to last 24 hours')+'.\n'+
  'Only private owner reconciliation and original source verification can clear HOLD.\n'+
  'No customer names, addresses, booking IDs, tokens, or financial figures are exported.\n'+
  'No booking, refund, payment, quote or owner closure has been changed.\n';
 console.log('Rosie 876 owner watch: '+state.severity+'; checked '+state.checked_bookings+
  '; coverage '+(state.source_coverage_incomplete?'PARTIAL':'BOUNDED'));
 if(!state.alert)return;
 const list=await github('/issues?state=open&per_page=100');
 const current=Array.isArray(list)?list.find(x=>x.title===title&&x.pull_request===undefined):null;
 if(current){
  if(String(current.body||'').includes('rosie876-owner-watch-state:'+state.severity)){
   console.log('Owner incident unchanged: no repetitive comment.');
   return;
  }
  await github('/issues/'+current.number,'PATCH',{body:description});
  console.log('Existing private owner incident updated.');
 }else{
  await github('/issues','POST',{title,body:description});
  console.log('Private owner incident created.');
 }
}
run().catch(e=>{console.error('Rosie 876 scheduled watch: '+e.message);process.exitCode=1;});
