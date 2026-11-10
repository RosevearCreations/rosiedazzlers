import {HEALTH_SCHEMA_838,reconcileHealth838} from './build838-health-reconciliation.mjs';
const $=id=>document.getElementById(id);
const endpoints=Object.freeze({it:'/api/admin/system_health_families',
  support:'/api/admin/support_diagnostics',
  backup:'/api/admin/backup_recovery_evidence_closure'});
let busy=false;
async function readOnlySource(url){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),7000);
  try{
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store',
      signal:controller.signal,headers:{Accept:'application/json'}});
    const body=await response.json().catch(()=>null);
    return {status:response.status,body};
  }catch{return {status:503,body:null};}
  finally{clearTimeout(timer);}
}
function show(report){
  const tbody=$('build838Rows');tbody.textContent='';
  if(!report){
    $('build838Summary').textContent='No current authenticated Rosie health sources were reconciled. Source, security and Master connections HOLD.';
    return;
  }
  const reconciliation=report.reconciliation;
  $('build838Summary').textContent=`${report.sourceId} · ${reconciliation.observedSourceCount} recent bounded diagnostic source(s), `+
    `${reconciliation.missingOrStaleCount} unavailable/stale, `+
    `${reconciliation.unqueriedSourceCount} not queried. `+
    'This report cannot certify Production or live Master connections.';
  for(const row of report.sources){
    const tr=document.createElement('tr');
    const fields=[row.family,row.label,row.state,row.evidenceClass,
      row.observedAt??'No original observation',row.nextAction];
    for(const value of fields){const td=document.createElement('td');td.textContent=value;tr.append(td);}
    const td=document.createElement('td'),a=document.createElement('a');
    a.href=row.route;a.textContent='Open owning screen';td.append(a);tr.append(td);tbody.append(tr);
  }
  $('build838Proof').textContent='Runtime SHA is only a Pages claim: '+
    (report.runtimeRevisionClaim?.slice(0,12)??'unavailable')+
    ' · GitHub/Cloudflare exact-SHA verification is independent.';
  $('build838Next').textContent='Review the source-specific errors, original role/device observations, '+
    'recovery artifact/restore proof and the separately HELD AI Data and Comms contracts. '+
    'Only owning evidence and approvals can narrow a HOLD.';
}
async function refresh(){
  if(busy)return;busy=true;$('build838Refresh').disabled=true;
  $('build838State').textContent='Reading the existing protected source diagnostics once…';
  try{
    const baseResponse=await readOnlySource('/api/admin/operations_security_it_health_v838');
    const base=baseResponse.body?.report;
    if(baseResponse.status!==200||baseResponse.body?.ok!==true||
       base?.schema!==HEALTH_SCHEMA_838||base?.sourceId!=='rosiedazzlers'||
       base?.localSessionVerified!==true||base?.sources?.length!==9||
       base?.sourceConnections?.aiData!=='DISCONNECTED / HOLD'||
       base?.sourceConnections?.comms!=='DISCONNECTED / HOLD')
      throw Error('Private baseline not verified');
    const [it,support,backup]=await Promise.all([
      readOnlySource(endpoints.it),readOnlySource(endpoints.support),readOnlySource(endpoints.backup)]);
    const result=reconcileHealth838(base,{it,support,backup},Date.now());
    if(result.reconciliation.platformWideGreen!==false||
       result.outcomes.databaseWrites!==0||result.outcomes.masterEventsPublished!==0)
      throw Error('No source-safe reconciliation');
    show(result);
    $('build838State').textContent='One-time source reconciliation at '+result.generatedAt+
      ' · no active monitoring, recovery operation or Master connection.';
  }catch{
    show(null);$('build838Proof').textContent='No independent deployment proof established by this view.';
    $('build838Next').textContent='Sign in with Rosie operations and I.T. permissions; use the original diagnostic screens if a source is unavailable.';
    $('build838State').textContent='Source unavailable or unauthorized · fail-closed HOLD.';
  }finally{busy=false;$('build838Refresh').disabled=false;}
}
export function startHealthReconciliation838(){
  if(!$('build838Refresh'))return;
  $('build838Refresh').addEventListener('click',refresh);show(null);refresh();
}
