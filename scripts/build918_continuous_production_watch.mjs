#!/usr/bin/env node
// Rosie 918 every-30-minute read-only main/Cloudflare acceptance and HTTP boundary observer.
import {assessProduction918} from '../assets/build918-production-watch-contract.mjs';
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
async function status(path){
 try{const r=await fetchBound(base+path);return r.status;}
 catch{return null;}
}
async function main(){
 if(repo!=='RosevearCreations/rosiedazzlers'||base!=='https://rosiedazzlers.ca')throw Error('PRODUCTION_SCOPE_NOT_APPROVED');
 const sha=(await github('/commits/main')).sha;
 const page1=await github('/commits/'+sha+'/check-runs?per_page=100&page=1');
 const page2=(page1.total_count||0)>100?await github('/commits/'+sha+'/check-runs?per_page=100&page=2'):{check_runs:[]};
 const checks=[...(page1.check_runs||[]),...(page2.check_runs||[])];
 if((page1.total_count||0)>200)throw Error('EXACT_CHECK_HISTORY_INCOMPLETE');
 const http={admin:await status('/admin-sysop-918.html'),privateEndpoint:await status('/api/admin/sysop_918'),sourceScope:await status('/internal/rosevear/sysop/telemetry/v1')};
 const result=assessProduction918({checks,http,sha});
 process.stdout.write(JSON.stringify(result)+'\n');
 if(summary){
  const fs=await import('node:fs/promises');
  await fs.appendFile(summary,'### Rosie 918 read-only Production watch\n\n- Software: **'+result.softwareProduction+'**\n- Main SHA: '+sha+'\n- Exact Cloudflare verifiers: '+result.exactProductionVerifierPasses+'\n- Source scope: '+JSON.stringify(http)+'\n- Seven sources / independent AIDP ACK / original Windows recovery: **HOLD (not observed here)**\n- Blockers: '+(result.blockers.join(', ')||'none')+'\n');
 }
 if(result.blockers.length)process.exitCode=1;
}
main().catch(e=>{process.stderr.write('ROSIE_918_PRODUCTION_WATCH_HOLD '+String(e.message||e).slice(0,100)+'\n');process.exitCode=1;});
