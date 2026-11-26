#!/usr/bin/env node
// Rosie 918 every-30-minute read-only main/Cloudflare acceptance and HTTP boundary observer.
import {assessProduction918} from '../assets/build918-production-watch-contract.mjs';
import {observeAdmin933,observeBoundary933} from '../assets/build933-canonical-telemetry-probe.mjs';
const repo=process.env.GITHUB_REPOSITORY||'RosevearCreations/rosiedazzlers';
const token=process.env.GITHUB_TOKEN||'';
const base=process.env.ROSIE_PRODUCTION_ORIGIN||'https://rosiedazzlers.ca';
const summary=process.env.GITHUB_STEP_SUMMARY||'';
const fetchBound=async(uri,headers={})=>{
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),12000);
 try{return await fetch(uri,{method:'GET',headers,redirect:'error',cache:'no-store',signal:abort.signal});}
 finally{clearTimeout(timer);}
};
async function github(path){
 if(!token)throw Error('READONLY_GITHUB_TOKEN_MISSING');
 const r=await fetchBound('https://api.github.com/repos/'+repo+path,{
  Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'rosie918-production-observer'});
 if(!r.ok)throw Error('GITHUB_SOURCE_UNAVAILABLE');
 return r.json();
}
// Never follow redirects for private API boundary checks. The static admin page
// uses Cloudflare Pages' canonical extensionless route.
async function probe(path){return fetchBound(base+path);}
async function main(){
 if(repo!=='RosevearCreations/rosiedazzlers'||base!=='https://rosiedazzlers.ca')throw Error('PRODUCTION_SCOPE_NOT_APPROVED');
 const sha=(await github('/commits/main')).sha;
 const checks=[];
 // The active commit may accumulate thousands of scheduled checks without a code change.
 // Filter exact named gates instead of truncating an expanding chronological list.
 const names=['Cloudflare Pages','source checks','Production release health and operator alert','Verify exact Production deployment'];
 for(const name of names){
  const result=await github('/commits/'+sha+'/check-runs?check_name='+encodeURIComponent(name)+'&per_page=100');
  if(!Array.isArray(result.check_runs))throw Error('EXACT_NAMED_CHECK_READ_UNAVAILABLE');
  checks.push(...result.check_runs);
  if(name==='Verify exact Production deployment'&&result.total_count>100)throw Error('EXACT_PRODUCTION_CHECK_SET_UNBOUNDED');
 }
 const [admin,privateEndpoint,sourceScope]=await Promise.all([observeAdmin933(probe),observeBoundary933(probe,'/api/admin/sysop_918'),observeBoundary933(probe,'/internal/rosevear/sysop/telemetry/v1')]);
 const http={admin:admin.status,privateEndpoint:privateEndpoint.status,sourceScope:sourceScope.status};
 const result={...assessProduction918({checks,http,sha}),httpDiagnostics:{admin,privateEndpoint,sourceScope}};
 process.stdout.write(JSON.stringify(result)+'\n');
 if(summary){
  const fs=await import('node:fs/promises');
  await fs.appendFile(summary,'### Rosie 918 read-only Production watch\n\n- Software: **'+result.softwareProduction+'**\n- Main SHA: '+sha+'\n- Exact Cloudflare verifiers: '+result.exactProductionVerifierPasses+'\n- Source scope: '+JSON.stringify(http)+'\n- Seven sources / independent AIDP ACK / original Windows recovery: **HOLD (not observed here)**\n- Blockers: '+(result.blockers.join(', ')||'none')+'\n');
 }
 if(result.blockers.length)process.exitCode=1;
}
main().catch(e=>{process.stderr.write('ROSIE_918_PRODUCTION_WATCH_HOLD '+String(e.message||e).slice(0,100)+'\n');process.exitCode=1;});
