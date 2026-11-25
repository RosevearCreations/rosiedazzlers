// Local diagnostics do not constitute a signed receipt or detached launch proof.
import {H64} from './build926-runtime-certification.mjs';
import {RECEIVERS927} from './build927-guided-readiness.mjs';
const holds=['VM_LAUNCH_HOLD','OLLAMA_PORT_OWNERSHIP_HOLD','OLLAMA_START_HOLD','HUB_RECOVERY_HOLD','GATEWAY_HOLD'];
const tasks=['Rosevear AI Hub Unattended Boot','Rosevear AI Hub Unattended Recovery','Rosevear AI Hub Recovery','Rosevear AI Hub Startup','Rosevear AI Hub LAN Gateway'];
const launchers=['boot-hub-unattended356.ps1','hub-recovery.ps1','start-hub-lan-gateway.ps1'];
const hash=x=>typeof x==='string'&&H64.test(x);
export function analyse929(i,now=Date.now()){
 if(!i||i.mode!=='ORIGINAL_GUEST_LAUNCHER_DIAGNOSTIC_NOT_CERTIFICATION'||!Number.isSafeInteger(i.observedAtMs)||!Number.isSafeInteger(i.bootTimeMs)||i.bootTimeMs>i.observedAtMs||i.observedAtMs>now+2000||!Array.isArray(i.launchers)||i.launchers.length!==tasks.length||!tasks.every(n=>i.launchers.filter(x=>x?.task===n).length===1)||!Array.isArray(i.listeners)||i.listeners.length>40)throw Error('INVALID_DIAGNOSTIC');
 const fresh=now-i.observedAtMs<=300000;
 const rows=tasks.map(task=>{const x=i.launchers.find(x=>x.task===task);const pinned=x.actionMatchesHubRoot===true&&launchers.includes(x.launcher)&&hash(x.definitionSha256)&&hash(x.scriptSha256);return {task,definition:pinned?'LOCAL_HASH_CANDIDATE_ONLY':'HOLD_TASK_ACTION_OR_HASH',passwordLogon:x.passwordLogon===true,lastResult:Number.isSafeInteger(x.lastResult)?x.lastResult:null,liveCustodyVerified:false}});
 const boot=rows[0],log=i.bootLog;
 const reasonCodes=boot.lastResult===2&&log?.state==='TIME_ALIGNED_LOG_ONLY'&&log.matchedPassCount===1&&Array.isArray(log.reasonCodes)&&log.reasonCodes.length>0&&log.reasonCodes.length<=holds.length&&new Set(log.reasonCodes).size===log.reasonCodes.length&&log.reasonCodes.every(c=>holds.includes(c))?log.reasonCodes:[];
 const guest=i.guest||{};
 const guestTcp=guest.vmRunning===true&&['OWNER_AND_VM_PROPERTY_AGREE','OWNER_REPORTED_GUEST_ADDRESS'].includes(guest.addressSource)&&guest.mqttTcp==='REACHABLE';
 return {build:929,fresh,boot:{lastResult:boot.lastResult,reasonCodes,state:reasonCodes.length?'TIME_ALIGNED_REASON_CANDIDATE_NOT_CAUSAL_PROOF':boot.lastResult===0?'LAST_RUN_REPORTED_SUCCESS':'BOOT_CAUSE_UNRESOLVED'},launchers:rows,detachedCustodyVerified:false,taskHistoryState: i.taskHistoryState==='DISABLED_NOT_CHANGED'?'DISABLED_NOT_CHANGED':'REVIEW_ORIGINAL_HISTORY',guest:{vmRunning:guest.vmRunning===true,guestTcp,guestAddressPropertyReported:guest.guestPropertyState==='PRIVATE_IPV4_REPORTED',mqttAuthenticationVerified:false,guestBrokerIdentityVerified:false},fieldCertified:false,authorizesAction:false};
}
// Existing local authenticated Hub UI; operator reports cannot become independent proof.
export function mqttObservation929({online,usernameConfigured,passwordConfigured,guestEndpointConfirmed,observedAtMs}={},now=Date.now()){
 const fresh=Number.isSafeInteger(observedAtMs)&&observedAtMs<=now+2000&&now-observedAtMs<=300000;
 const ready=fresh&&[online,usernameConfigured,passwordConfigured,guestEndpointConfirmed].every(x=>x===true);
 return {state:ready?'OPERATOR_REPORTED_CONFIGURED_GUEST_CONNECTION':'HOLD_ORIGINAL_GUEST_MQTT',fresh,independentAuthenticationVerified:false,authorizesAction:false};
}
// Only call from authenticated server-side 928 readback; not from pasted inventory.
export function receiverEnrollment929(rows){
 const result=RECEIVERS927.map(receiverId=>{
 const matches=Array.isArray(rows)?rows.filter(r=>r?.receiverId===receiverId):[];
 const r=matches.length===1?matches[0]:null;
 const ready=r?.ready===true&&Array.isArray(r.blockers)&&r.blockers.length===0;
 return {receiverId,state:ready&&r.recentNativeWitness===true?'RECENT_NATIVE_WITNESS_REPORTED_BY_SERVER':ready?'EXPLICIT_NATIVE_READ_REQUIRED':'ENROLLMENT_HOLD',next:r?.closure?.steps||[]};
 });
 return {receivers:result,bothRecentNativeWitnesses:result.every(x=>x.state==='RECENT_NATIVE_WITNESS_REPORTED_BY_SERVER'),independentFinalAcceptance:false,fieldCertified:false,sevenSourceConnected:false,authorizesAction:false};
}
