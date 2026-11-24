// 928 — Diagnostic history and guest broker correlation. Never treats it as authenticated runtime or SCM proof.
import {inventoryPlan927,PORTS927} from './build927-guided-readiness.mjs';
import {H64} from './build926-runtime-certification.mjs';
const knownTasks=['Rosevear AI Hub LAN Gateway','Rosevear AI Hub Recovery','Rosevear AI Hub Startup','Rosevear AI Hub Unattended Boot','Rosevear AI Hub Unattended Recovery','Rosevear AI Server Startup'];
const time=v=>typeof v==='string'?Date.parse(v):NaN;
const validHash=v=>typeof v==='string'&&H64.test(v);
export function correlate928(i){
 if(!i||i.mode!=='ORIGINAL_READ_ONLY_CORRELATION_NOT_CERTIFICATION'||!Number.isSafeInteger(i.bootTimeMs)||!Number.isSafeInteger(i.observedAtMs)||i.observedAtMs<i.bootTimeMs||!Array.isArray(i.registeredTasks)||i.registeredTasks.length>40||!Array.isArray(i.listeners)||i.listeners.length>100)throw Error('INVALID_ORIGINAL_CORRELATION');
 const plan=inventoryPlan927({...i,mode:'GUIDED_READ_ONLY_INVENTORY_NOT_CERTIFICATION'});
 const tasks=i.registeredTasks.filter(t=>knownTasks.includes(String(t.path).replace(/^\\+/,''))).map(t=>{
  const run=time(t.lastRun);const state=!t.enabled?'DISABLED_PRESERVED':!Number.isFinite(run)||run<i.bootTimeMs||run>i.observedAtMs+2000?'LAST_RUN_UNVERIFIED':t.lastResult===0?'LAST_RUN_REPORTED_SUCCESS': 'LAST_RUN_NONZERO_REVIEW_REQUIRED';
  return {path:t.path,state,lastResult:Number.isSafeInteger(t.lastResult)?t.lastResult:null,definitionHashPresent:validHash(t.definitionSha256),recognizedLauncher:typeof t.launcher==='string'&&/^(hub-recovery|start-hub|start-hub-lan|start-rosevear|restart-hub|start-caddy|hub-unattended)[a-z0-9_-]*\.ps1$/i.test(t.launcher)};
 });
 const history=Array.isArray(i.taskHistory)?i.taskHistory.slice(0,100):[];
 const correlations=plan.components.map(c=>{
  const ls=i.listeners.filter(l=>l.port===c.port);
  const matches=[];
  for(const l of ls)for(const p of Array.isArray(l.processChain)?l.processChain.slice(0,12):[]){
   if(!Number.isSafeInteger(p.pid)||p.pid<=0||!Number.isSafeInteger(p.createdAtMs)||p.createdAtMs<i.bootTimeMs||p.createdAtMs>i.observedAtMs)continue;
   for(const e of history){
    const ms=time(e.time);
    if(i.taskHistoryState==='ENABLED'&&e.eventId===129&&e.processId===p.pid&&Number.isFinite(ms)&&ms>=i.bootTimeMs&&ms<=i.observedAtMs&&Math.abs(ms-p.createdAtMs)<=5000&&tasks.some(t=>t.path===e.task))matches.push({task:e.task,recordId:e.recordId,pid:p.pid});
   }
  }
  return {component:c.component,listenerState:c.state,historyHints:matches.slice(0,12),state:c.state==='CANDIDATE_REQUIRES_INDEPENDENT_REVIEW'?c.state:matches.length?'HISTORICAL_PID_TIME_CORRELATION_ONLY':'LIVE_LAUNCHER_IDENTITY_UNPROVEN'};
 });
 const b=i.broker||{};
 const guest=b.vmName==='Home Assistant'&&b.vmState==='RUNNING',privateTcp=b.target==='homeassistant.local'&&b.privateResolution===true&&b.mqttTcp==='REACHABLE';
 const location=guest&&privateTcp?'HOME_ASSISTANT_GUEST_AND_PRIVATE_TCP_OBSERVED':guest?'ORIGINAL_VM_RUNNING_BROKER_UNVERIFIED':privateTcp?'PRIVATE_TCP_REACHABLE_VM_UNVERIFIED':'BROKER_LOCATION_UNVERIFIED';
 return {build:928,tasks,taskHistoryState:i.taskHistoryState,correlations,broker:{location,vmRunning:guest,privateTcpReachable:privateTcp,authenticated:false,guestProcessOwnershipVerified:false},draft:plan.unapprovedDraft,configurationApproved:false,configurationReady:false,fieldCertified:false,sevenSourceConnected:false,authorizesAction:false};
}
export function verifyRuntimeDraft928({draft,expected}){
 if(!draft||!expected)return {state:'INDEPENDENT_RUNTIME_CONFIGURATION_REQUIRED',matched:false};
 try{
 const entries=Object.entries(PORTS927);
 if(Object.keys(draft).length!==4||Object.keys(expected).length!==4)throw Error('INCOMPLETE');
 const keys=['mode','identity','principalSid','definitionSha256','runtimeSha256','commandSha256','port'];
 const valid=(x,port)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k))&&['SCM','SCHEDULED_TASK'].includes(x.mode)&&typeof x.identity==='string'&&x.identity.length>0&&x.identity.length<=260&&/^S-1-[0-9-]+$/.test(x.principalSid||'')&&[x.definitionSha256,x.runtimeSha256,x.commandSha256].every(validHash)&&x.port===port;
 const matched=entries.every(([id,port])=>valid(draft[id],port)&&valid(expected[id],port)&&keys.every(k=>draft[id][k]===expected[id][k]));
 return {state:matched?'DRAFT_MATCHES_APPROVED_PINS_NOT_LIVE_ATTESTATION':'DRAFT_PIN_MISMATCH',matched};
 }catch{return {state:'DRAFT_INCOMPLETE_OR_INVALID',matched:false}}
}
export function receiverClosure928(row){
 const blockers=Array.isArray(row?.blockers)?row.blockers:[];
 const steps=[];
 if(blockers.includes('ORIGINAL_READ_ONLY_ORIGIN_TOKEN_AND_PINS_REQUIRED'))steps.push({step:'RECEIVER_SERVER_SETTINGS',url:'/admin-sysop-927.html'});
 if(blockers.includes('ORIGINAL_RECEIVER_COMPATIBILITY_MANIFEST_REQUIRED'))steps.push({step:'INDEPENDENT_COMPATIBILITY_MANIFEST',url:'/admin-sysop-927.html'});
 if(blockers.includes('ORIGINAL_SIGNED_920_LEDGER_REQUIRED'))steps.push({step:'SIGNED_SOURCE_RECEIPT_AND_ACK',url:'/admin-sysop-919.html'},{step:'ORIGINAL_SIGNED_LEDGER',url:'/admin-sysop-920.html'});
 if(blockers.includes('ORIGINAL_919_ACK_OR_RECEIVER_REVISION_MISMATCH'))steps.push({step:'RECONCILE_ACTUAL_RECEIVER_REVISION',url:'/admin-sysop-919.html'});
 if(row?.ready===true&&!blockers.length)steps.push({step:'EXPLICIT_NATIVE_GET',url:'/admin-sysop-921.html'});
 return {receiverId:row?.receiverId,state:row?.recentNativeWitness===true&&row?.ready===true&&!blockers.length?'RECENT_NATIVE_WITNESS_ONLY':'HOLD_OR_READY_FOR_EXPLICIT_GET',steps,sevenSourceConnected:false};
}
