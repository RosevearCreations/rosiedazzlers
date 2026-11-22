// Rosie Build 918: seven original signed sources, privacy boundaries, and fail-closed readiness.
// No guessed metrics, browser public keys, signer self-approval, or host reboot certification.
export const APPS918=Object.freeze(['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub','icamp','yw','devilndove','rosiedazzlers']);
export const SCHEMA918='rosevear.sysop.statistics.v1';
export const HEX40=/^[a-f0-9]{40}$/,HEX64=/^[a-f0-9]{64}$/,HEX128=/^[a-f0-9]{128}$/;
const payloadKeys=['schema','protocolVersion','appId','sourceCommit','eventId','nonce','issuedAtMs','expiresAtMs','state','metricsWindowSeconds','metrics','sysop','dataClass','tenantId','authorizesAction','challenge'];
const metricKeys=['requests','serverErrors','jobsCompleted','jobsFailed','queueDepth','latencyP95Ms','activeSessions'];
const sysopKeys=['eventKind','observedAtMs','processUptimeSec','restartCount','lastRestartAtMs','bootTimeMs','rebootIsIndependentlyWitnessed'];
const events=['HEARTBEAT','PROCESS_RESTART_OBSERVED','HOST_BOOT_OBSERVED','SCHEDULED_MAINTENANCE_OBSERVED','BACKUP_VERIFY_OBSERVED','INCIDENT_OBSERVED'];
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const bounded=v=>v===null||(Number.isSafeInteger(v)&&v>=0&&v<=2147483647);
const b64ToBytes=s=>{if(typeof s!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(s)||s.length>4096)throw Error('PIN_ENCODING_INVALID');return Uint8Array.from(atob(s),c=>c.charCodeAt(0))};
const hexToBytes=s=>Uint8Array.from(s.match(/.{2}/g).map(x=>parseInt(x,16)));
const toHex=arr=>[...new Uint8Array(arr)].map(x=>x.toString(16).padStart(2,'0')).join('');
export const canonical918=v=>Array.isArray(v)?'['+v.map(canonical918).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical918(v[k])).join(',')+'}':JSON.stringify(v);
export async function verify918({envelope,pin,challenge,nowMs=Date.now()}={}){
 if(!envelope||!exact(envelope,['payload','signature'])||!HEX128.test(envelope.signature))throw Error('ENVELOPE_INVALID');
 const p=envelope.payload;
 if(!exact(p,payloadKeys)||p.schema!==SCHEMA918||p.protocolVersion!=='1.2'||!APPS918.includes(p.appId)||!HEX40.test(p.sourceCommit)||!/^[A-Za-z0-9_-]{16,80}$/.test(p.eventId)||!HEX64.test(p.challenge)||p.challenge!==challenge||!HEX64.test(challenge||'')||!/^[a-f0-9]{32}$/.test(p.nonce))throw Error('ORIGINAL_PROTOCOL_CHALLENGE_MISMATCH');
 if(!Number.isSafeInteger(nowMs)||!Number.isSafeInteger(p.issuedAtMs)||!Number.isSafeInteger(p.expiresAtMs)||p.issuedAtMs>nowMs+2000||nowMs-p.issuedAtMs>90000||p.expiresAtMs<=nowMs||p.expiresAtMs-p.issuedAtMs>90000||p.expiresAtMs<=p.issuedAtMs)throw Error('FRESHNESS_INVALID');
 if(!['HEALTHY','DEGRADED','UNHEALTHY','UNKNOWN'].includes(p.state)||!Number.isSafeInteger(p.metricsWindowSeconds)||p.metricsWindowSeconds<60||p.metricsWindowSeconds>86400||p.dataClass!=='NON_SENSITIVE_AGGREGATE'||p.tenantId!==null||p.authorizesAction!==false||!exact(p.metrics,metricKeys)||!metricKeys.every(k=>bounded(p.metrics[k])))throw Error('PRIVACY_METRICS_INVALID');
 const s=p.sysop;
 if(!exact(s,sysopKeys)||!events.includes(s.eventKind)||!Number.isSafeInteger(s.observedAtMs)||s.observedAtMs<0||s.observedAtMs>nowMs+2000||nowMs-s.observedAtMs>90000||!bounded(s.processUptimeSec)||!bounded(s.restartCount)||![s.lastRestartAtMs,s.bootTimeMs].every(x=>x===null||(Number.isSafeInteger(x)&&x>=0&&x<=nowMs+2000))||s.rebootIsIndependentlyWitnessed!==false)throw Error('SYSOP_SCOPE_INVALID');
 if(p.appId!=='rosevear-ai-hub'&&(s.bootTimeMs!==null||s.eventKind==='HOST_BOOT_OBSERVED'))throw Error('HOST_BOOT_SCOPE_INVALID');
 if(!pin||!HEX40.test(pin.expectedCommit)||pin.expectedCommit!==p.sourceCommit||!HEX64.test(pin.fingerprintSha256||''))throw Error('SOURCE_PIN_OR_COMMIT_MISSING');
 const keyBytes=b64ToBytes(pin.publicKeySpkiBase64);
 const fingerprint=toHex(await crypto.subtle.digest('SHA-256',keyBytes));
 if(fingerprint!==pin.fingerprintSha256)throw Error('INDEPENDENT_PIN_FINGERPRINT_INVALID');
 const key=await crypto.subtle.importKey('spki',keyBytes,{name:'Ed25519'},false,['verify']);
 const valid=await crypto.subtle.verify('Ed25519',key,hexToBytes(envelope.signature),new TextEncoder().encode(canonical918(p)));
 if(!valid)throw Error('ORIGINAL_SIGNATURE_INVALID');
 return {appId:p.appId,eventId:p.eventId,nonce:p.nonce,sourceCommit:p.sourceCommit,state:p.state,eventKind:s.eventKind,observedAtMs:s.observedAtMs,issuedAtMs:p.issuedAtMs,
  sourceSignatureVerified:true,challengeVerified:true,privacyBoundaryVerified:true,sourceCommitVerified:true,
  independentOwnerWitnessVerified:false,independentReceiverAckVerified:false,originalHostRecoveryVerified:false,
  softwareObservation:'SIGNED_SOURCE_ONLY',authorizesAction:false};
}
export function project918(receipts=[],hostWitnesses=[],nowMs=Date.now()){
 const rows=Array.isArray(receipts)?receipts:[];
 const sources=APPS918.map(appId=>{
  const rec=rows.find(r=>r.app_id===appId);
  if(!rec)return {appId,sourceState:'HOLD_NO_ORIGINAL_SIGNED_RECEIPT',latestAt:null,sourceCommit:null};
  const ts=Date.parse(rec.created_at||'');
  if(!Number.isFinite(ts)||ts>nowMs+2000||nowMs-ts>300000)return {appId,sourceState:'STALE_SIGNED_RECEIPT_HOLD',latestAt:Number.isFinite(ts)?new Date(ts).toISOString():null,sourceCommit:rec.source_commit||null};
  return {appId,sourceState:rec.source_state==='HEALTHY'?'FRESH_SIGNED_SOURCE_ONLY':'SOURCE_'+String(rec.source_state||'UNKNOWN')+'_HOLD',
   latestAt:new Date(ts).toISOString(),sourceCommit:rec.source_commit||null,eventKind:rec.event_kind||null};
 });
 const hasHubBoot=rows.some(r=>r.app_id==='rosevear-ai-hub'&&r.event_kind==='HOST_BOOT_OBSERVED'&&nowMs-Date.parse(r.created_at||'')<=300000);
 return {build:918,schema:'rosie.operational-mesh-read-model.v918',sources,signedSourceCount:sources.filter(x=>x.sourceState==='FRESH_SIGNED_SOURCE_ONLY').length,
  connectedToAIDP:false,sevenAppConnected:false,independentMasterAckVerified:false,
  originalHost:{sourceBootReceiptObserved:hasHubBoot,secondStaffReportCount:Array.isArray(hostWitnesses)?hostWitnesses.length:0,
   independentHostBootWitnessVerified:false,recoveryAccepted:false,state:'ORIGINAL_HOST_INDEPENDENT_WITNESS_HOLD'},
  state:'ORIGINAL_MULTI_SOURCE_ACCEPTANCE_HOLD',customerDataExposed:false,authorizesAction:false};
}
