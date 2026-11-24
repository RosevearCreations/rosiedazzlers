// Build 927: diagnostic inventory and receiver readiness, never a certification authority.
import {H40,H64,UUID,validateRuntime926} from './build926-runtime-certification.mjs';
export const PORTS927={hub:8765,caddy:8443,mqtt:1883,ollama:11434};
export const RECEIVERS927=['ai-data-platform','rosevear-comms-hub'];
const fields=['mode','identity','principalSid','definitionSha256','runtimeSha256','commandSha256','port'];
export function inventoryPlan927(inventory){
 if(!inventory||!['READ_ONLY_INVENTORY_NOT_CERTIFICATION','GUIDED_READ_ONLY_INVENTORY_NOT_CERTIFICATION'].includes(inventory.mode)||!Array.isArray(inventory.listeners)||inventory.listeners.length>100)throw Error('INVALID_DIAGNOSTIC_INVENTORY');
 const components=[],draft={};
 for(const [component,port] of Object.entries(PORTS927)){
  const matches=inventory.listeners.filter(x=>x.port===port),pids=new Set(matches.map(x=>x.pid));
  const candidates=matches.flatMap(x=>Array.isArray(x.candidates)?x.candidates:[]).filter(c=>c.port===port&&pids.has(c.runtimePid)&&['SCM','SCHEDULED_TASK'].includes(c.mode)&&typeof c.identity==='string'&&c.identity.length>0&&c.identity.length<=260&&/^S-1-[0-9-]+$/.test(c.principalSid||'')&&[c.definitionSha256,c.runtimeSha256,c.commandSha256].every(x=>H64.test(x||''))&&c.lineage==='VERIFIED'&&c.listener==='OWNED'&&c.stable===true&&c.state==='RUNNING');
  const unique=new Map(candidates.map(c=>[JSON.stringify(fields.map(k=>c[k])),c]));
  let state='UNPROVEN_PROCESS_OWNERSHIP';
  if(!matches.length)state='NO_LISTENER_ON_EXPECTED_PORT';
  else if(pids.size!==1||unique.size>1)state='AMBIGUOUS_RUNTIME';
  else if(unique.size===1){state='CANDIDATE_REQUIRES_INDEPENDENT_REVIEW';const c=[...unique.values()][0];draft[component]=Object.fromEntries(fields.map(k=>[k,c[k]]))}
  components.push({component,port,state,listenerPids:[...pids].filter(x=>Number.isSafeInteger(x)&&x>0),alternativeMqttPorts:component==='mqtt'?[...new Set(inventory.listeners.filter(x=>[8883,9001].includes(x.port)).map(x=>x.port))]:[]});
 }
 return {build:927,components,unapprovedDraft:draft,allCandidatesPresent:Object.keys(draft).length===4,inventoryOnly:true,configurationApproved:false,fieldCertified:false,sevenSourceConnected:false,authorizesAction:false};
}
export function receiverPlan927({id,configurationReady,manifestReady,ledger,ack,expectedCommit,native,now=Date.now()}){
 if(!RECEIVERS927.includes(id))throw Error('UNKNOWN_RECEIVER');
 const ledgerValid=!!ledger&&UUID.test(ledger.id||'')&&ledger.receiver_id===id&&UUID.test(ledger.ack_review_id||'')&&UUID.test(ledger.ledger_entry_id||'')&&H64.test(ledger.ledger_entry_sha256||'')&&H64.test(ledger.ledger_head_sha256||'');
 const ackValid=ledgerValid&&ack?.id===ledger.ack_review_id&&ack.receiver_id===id&&H40.test(ack.receiver_commit||'')&&ack.receiver_commit===expectedCommit;
 const ready=!!configurationReady&&!!manifestReady&&!!ackValid;
 const nativeFresh=!!native&&ready&&native.receiver_id===id&&native.ledger_review_id===ledger.id&&native.api_signer_commit===expectedCommit&&Number.isSafeInteger(Number(native.api_observed_at_ms))&&Number(native.api_observed_at_ms)<=now+2000&&now-Number(native.api_observed_at_ms)<=300000;
 const blockers=[];
 if(!configurationReady)blockers.push('ORIGINAL_READ_ONLY_ORIGIN_TOKEN_AND_PINS_REQUIRED');
 if(!manifestReady)blockers.push('ORIGINAL_RECEIVER_COMPATIBILITY_MANIFEST_REQUIRED');
 if(!ledgerValid)blockers.push('ORIGINAL_SIGNED_920_LEDGER_REQUIRED');
 else if(!ackValid)blockers.push('ORIGINAL_919_ACK_OR_RECEIVER_REVISION_MISMATCH');
 return {receiverId:id,state:nativeFresh?'RECENT_ORIGINAL_NATIVE_WITNESS':ready?'READY_FOR_EXPLICIT_LIVE_GET':'HOLD',ready,blockers,ledgerReviewId:ledgerValid?ledger.id:null,recentNativeWitness:!!nativeFresh,sevenSourceConnected:false};
}
