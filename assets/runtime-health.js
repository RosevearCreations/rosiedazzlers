// Build 262 — browser-side runtime reliability dashboard. No diagnostic API calls are made.
(function attachRuntimeHealth(globalScope){
'use strict';
const $=(id)=>document.getElementById(id);
const esc=(v)=>String(v??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let sourceAudit=null;

function rows(){ return globalScope.RosieApiDiagnostics?.list?.() || []; }
function classify(row){
  if(Number(row.status||0)>=500 || row.outcome==='network_error') return 'critical';
  if(Number(row.status||0)>=400) return 'warning';
  if(Number(row.duration_ms||0)>=2500) return 'slow';
  return 'ok';
}
function summarize(items){
  const byRoute=new Map();
  for(const row of items){
    const key=`${row.method||'GET'} ${row.route||'unknown'}`;
    const cur=byRoute.get(key)||{route:key,calls:0,failures:0,total_ms:0,max_ms:0,last_status:0,last_at:null,rays:new Set()};
    cur.calls+=1;cur.total_ms+=Number(row.duration_ms||0);cur.max_ms=Math.max(cur.max_ms,Number(row.duration_ms||0));cur.last_status=Number(row.status||0);cur.last_at=row.at||cur.last_at;if(!row.ok)cur.failures+=1;if(row.ray_id)cur.rays.add(row.ray_id);byRoute.set(key,cur);
  }
  return [...byRoute.values()].map(r=>({...r,avg_ms:r.calls?Math.round(r.total_ms/r.calls):0,rays:[...r.rays].slice(-3)})).sort((a,b)=>b.failures-a.failures||b.max_ms-a.max_ms||b.calls-a.calls);
}
function render(){
  const items=rows();const routes=summarize(items);const failures=items.filter(r=>!r.ok);const serverErrors=items.filter(r=>Number(r.status||0)>=500||r.outcome==='network_error');const slow=items.filter(r=>Number(r.duration_ms||0)>=2500);
  $('runtimeSummary').innerHTML=[['Recorded API calls',items.length],['Failed calls',failures.length],['5xx/network failures',serverErrors.length],['Slow wall-time ≥2.5s',slow.length]].map(([k,v])=>`<article class="panel metric"><span class="mini">${esc(k)}</span><strong>${esc(v)}</strong></article>`).join('');
  $('runtimeRoutes').innerHTML=routes.length?routes.map(r=>`<tr><td>${esc(r.route)}</td><td>${r.calls}</td><td>${r.failures}</td><td>${r.avg_ms} ms</td><td>${r.max_ms} ms</td><td>${r.last_status||'network'}</td><td>${esc(r.last_at||'—')}</td></tr>`).join(''):'<tr><td colspan="7">No API calls recorded in this browser yet.</td></tr>';
  $('recentFailures').innerHTML=serverErrors.length?serverErrors.slice(-40).reverse().map(r=>`<article class="failure"><strong>${esc(r.method)} ${esc(r.route)}</strong><div>${esc(r.outcome)} · status ${esc(r.status||'network')} · ${esc(r.duration_ms)} ms</div><div class="mini">${esc(r.at)} · page ${esc(r.page||'—')}${r.ray_id?` · Ray ${esc(r.ray_id)}`:''}</div></article>`).join(''):'<div class="notice ok">No 5xx/network failures are stored in this browser diagnostic ring.</div>';
  $('runtimeStatus').className='notice '+(serverErrors.length?'warn':'ok');
  $('runtimeStatus').textContent=serverErrors.length?`${serverErrors.length} recent 5xx/network failure(s) recorded locally. Export the JSON/CSV before clearing browser storage.`:'No recent 5xx/network failures are recorded locally. Leave this instrumentation enabled while we stabilize Rosie.';
}
function download(name,text,type){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function csvCell(v){return `"${String(v??'').replaceAll('"','""')}"`;}
function exportCsv(){const items=rows();const cols=['at','page','route','method','status','ok','duration_ms','outcome','ray_id','build'];download(`rosie-api-runtime-${new Date().toISOString().slice(0,10)}.csv`,[cols.join(','),...items.map(r=>cols.map(c=>csvCell(r[c])).join(','))].join('\r\n'),'text/csv;charset=utf-8');}
function exportJson(){download(`rosie-api-runtime-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({build:262,exported_at:new Date().toISOString(),records:rows(),source_audit:sourceAudit},null,2),'application/json');}
async function loadSourceAudit(){try{const res=await fetch('/data/build262_cpu_source_audit.json',{cache:'no-store'});sourceAudit=await res.json();const list=sourceAudit?.highest_risk_routes||[];$('sourceRisk').innerHTML=list.slice(0,20).map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.path)}</td><td>${esc(r.heuristic_score)}</td><td>${r.fetch_calls}</td><td>${r.loop_constructs}</td><td>${esc((r.large_query_limits||[]).join(', ')||'—')}</td></tr>`).join('');}catch(err){$('sourceRisk').innerHTML=`<tr><td colspan="6">Could not load packaged source audit: ${esc(err.message)}</td></tr>`;}}
function clear(){if(!confirm('Clear the browser-side Rosie API diagnostic ring? Export it first if you may need the evidence.'))return;globalScope.RosieApiDiagnostics?.clear?.();render();}
async function boot(){await globalScope.AdminShell.boot({pageKey:'admin-runtime-health',onReady:async()=>{await loadSourceAudit();render();}});$('refreshRuntime').onclick=render;$('exportRuntimeCsv').onclick=exportCsv;$('exportRuntimeJson').onclick=exportJson;$('clearRuntime').onclick=clear;}
boot();
})(window);
