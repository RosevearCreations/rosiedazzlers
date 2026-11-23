// Rosie 921 — original receiver-native GET witness, and original Windows read-only health sample signatures.
// No simulated connectivity, remote reboot, physical field certification or automatic acceptance.
import {canonical918} from './build918-signed-mesh-contract.mjs';
import {RECEIVERS919} from './build919-ack-recovery-contract.mjs';
export const API_SCHEMA921='rosevear.sysop.receiver-native-api-witness.v1';
export const HEALTH_SCHEMA921='rosevear.sysop.original-windows-readonly-health.v1';
export const PORT_STATES921=Object.freeze(['LISTENING','NO_LISTENER','UNKNOWN']);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const H40=/^[a-f0-9]{40}$/,H64=/^[a-f0-9]{64}$/,H128=/^[a-f0-9]{128}$/;
const exact=(v,keys)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
const from64=s=>{if(typeof s!=='string'||s.length>2048||!/^[A-Za-z0-9+/]+={0,2}$/.test(s))throw Error('PIN_PUBLIC_KEY_ENCODING_INVALID');return Uint8Array.from(atob(s),x=>x.charCodeAt(0))};
const fresh=(i,e,n)=>Number.isSafeInteger(i)&&Number.isSafeInteger(e)&&i<=n+2000&&n-i<=120000&&e>n&&e>i&&e-i<=120000;
async function verifySig(envelope,pin){
 if(!exact(envelope,['payload','signature'])||!H128.test(envelope.signature))throw Error('ORIGINAL_ENVELOPE_INVALID');
 if(!pin||!H64.test(pin.fingerprintSha256||'')||!H40.test(pin.expectedCommit||''))throw Error('SIGNER_PIN_REQUIRED');
 const pub=from64(pin.publicKeySpkiBase64);
 if(await digest(pub)!==pin.fingerprintSha256)throw Error('INDEPENDENT_PIN_FINGERPRINT_MISMATCH');
 const key=await crypto.subtle.importKey('spki',pub,{name:'Ed25519'},false,['verify']);
 const sig=Uint8Array.from(envelope.signature.match(/.{2}/g).map(x=>parseInt(x,16)));
 if(!await crypto.subtle.verify('Ed25519',key,sig,new TextEncoder().encode(canonical918(envelope.payload))))throw Error('SIGNED_ORIGINAL_SOURCE_MISMATCH');
 return await digest(sig);
}
const apiKeys=['schema','receiverId','receiverCommit','ledgerReviewId','ledgerEntryId','ledgerEntrySha256','ledgerHeadSha256','challengeNonce','apiObservedAtMs','apiSignerCommit','readMethod','entryState','issuedAtMs','expiresAtMs','dataClass','authorizesAction'];
export async function verifyNativeReceiver921({envelope,pin,ledger,ledgerSignerPin,challengeNonce,nowMs=Date.now()}={}){
 const p=envelope?.payload;
 if(!exact(p,apiKeys)||p.schema!==API_SCHEMA921||!RECEIVERS919.includes(p.receiverId)||!H40.test(p.receiverCommit||'')||!H40.test(p.apiSignerCommit||'')||!UUID.test(p.ledgerReviewId||'')||!UUID.test(p.ledgerEntryId||'')||!H64.test(p.ledgerEntrySha256||'')||!H64.test(p.ledgerHeadSha256||'')||!H64.test(p.challengeNonce||''))throw Error('ORIGINAL_NATIVE_API_SHAPE_INVALID');
 if(!fresh(p.issuedAtMs,p.expiresAtMs,nowMs)||!Number.isSafeInteger(p.apiObservedAtMs)||p.apiObservedAtMs>p.issuedAtMs+2000||nowMs-p.apiObservedAtMs>120000)throw Error('ORIGINAL_NATIVE_API_STALE');
 if(p.readMethod!=='ORIGINAL_NATIVE_HTTPS_GET'||p.entryState!=='DURABLE_ENTRY_PRESENT'||p.dataClass!=='NON_SENSITIVE_AGGREGATE'||p.authorizesAction!==false)throw Error('ORIGINAL_NATIVE_API_SCOPE_DENIED');
 if(!ledger||p.ledgerReviewId!==ledger.id||p.receiverId!==ledger.receiver_id||p.ledgerEntryId!==ledger.ledger_entry_id||p.ledgerEntrySha256!==ledger.ledger_entry_sha256||p.ledgerHeadSha256!==ledger.ledger_head_sha256)throw Error('ORIGINAL_NATIVE_API_LEDGER_MISMATCH');
 if(p.challengeNonce!==challengeNonce||p.receiverCommit!==pin?.expectedCommit||p.apiSignerCommit!==pin?.expectedCommit||pin?.fingerprintSha256===ledgerSignerPin?.fingerprintSha256)throw Error('NATIVE_API_NONCE_COMMIT_OR_INDEPENDENCE_INVALID');
 if(p.apiObservedAtMs<Number(ledger.ledger_observed_at_ms))throw Error('ORIGINAL_NATIVE_API_TIME_BEFORE_LEDGER');
 const signatureSha256=await verifySig(envelope,pin);
 return {ledgerReviewId:ledger.id,receiverId:p.receiverId,ledgerEntryId:p.ledgerEntryId,challengeNonce:p.challengeNonce,
  apiObservedAtMs:p.apiObservedAtMs,signatureSha256,apiSignerCommit:p.apiSignerCommit,apiSignerFingerprintSha256:pin.fingerprintSha256,
  reviewState:'ORIGINAL_NATIVE_API_GET_SIGNATURE_VERIFIED',readOnly:true,externalNativeApiAuthenticated:true,sevenSourceConnected:false,physicalRecoveryCertified:false};
}
const healthKeys=['schema','hostReviewId','ceremonyId','hostId','bootId','bootTimeMs','sampleId','sampleSeq','sampledAtMs','osUptimeSec','samplerCommit','hubApiPort','caddyPort','mqttPort','ollamaPort','collectionMode','issuedAtMs','expiresAtMs','dataClass','authorizesAction'];
export async function verifyWindowsHealth921({envelope,pin,host,ceremony,previous,hostSignerPin,ownerSignerPins=[],nowMs=Date.now()}={}){
 const p=envelope?.payload;
 if(!exact(p,healthKeys)||p.schema!==HEALTH_SCHEMA921||!UUID.test(p.hostReviewId||'')||!UUID.test(p.ceremonyId||'')||!UUID.test(p.sampleId||'')||!H40.test(p.samplerCommit||'')||!Number.isSafeInteger(p.sampleSeq)||p.sampleSeq<1||p.sampleSeq>10000||!Number.isSafeInteger(p.bootTimeMs)||!Number.isSafeInteger(p.osUptimeSec)||p.osUptimeSec<0||!Number.isSafeInteger(p.sampledAtMs)||!PORT_STATES921.includes(p.hubApiPort)||!PORT_STATES921.includes(p.caddyPort)||!PORT_STATES921.includes(p.mqttPort)||!PORT_STATES921.includes(p.ollamaPort))throw Error('ORIGINAL_HOST_SAMPLE_SHAPE_INVALID');
 if(!fresh(p.issuedAtMs,p.expiresAtMs,nowMs)||p.sampledAtMs>p.issuedAtMs+2000||nowMs-p.sampledAtMs>120000)throw Error('ORIGINAL_HOST_SAMPLE_STALE');
 if(p.collectionMode!=='ORIGINAL_WINDOWS_LOOPBACK_READ_ONLY'||p.dataClass!=='NON_SENSITIVE_AGGREGATE'||p.authorizesAction!==false)throw Error('ORIGINAL_HOST_SAMPLE_SCOPE_DENIED');
 if(!host||!ceremony||p.hostReviewId!==host.id||p.ceremonyId!==ceremony.id||p.hostId!==host.host_id||p.hostId!==ceremony.host_id||p.bootId!==host.boot_id||p.bootTimeMs!==Number(host.boot_time_ms))throw Error('ORIGINAL_HOST_REVIEW_CORRELATION_INVALID');
 if(p.sampledAtMs<=p.bootTimeMs||p.bootTimeMs<=Date.parse(ceremony.created_at||'')||p.bootTimeMs>=Date.parse(ceremony.expires_at||''))throw Error('ORIGINAL_WINDOWS_PREFLIGHT_BOOT_ORDER_INVALID');
 if(Math.abs((p.sampledAtMs-p.bootTimeMs)/1000-p.osUptimeSec)>120)throw Error('ORIGINAL_WINDOWS_UPTIME_BOOT_DRIFT_INVALID');
 if(p.samplerCommit!==pin?.expectedCommit||pin?.hostId!==p.hostId||pin?.fingerprintSha256===hostSignerPin?.fingerprintSha256||ownerSignerPins.some(x=>x?.fingerprintSha256===pin?.fingerprintSha256))throw Error('ORIGINAL_HOST_SAMPLER_INDEPENDENCE_INVALID');
 if(previous){
  if(p.sampleSeq!==Number(previous.sample_seq)+1||p.sampledAtMs-Number(previous.sampled_at_ms)<30000||p.osUptimeSec<=Number(previous.os_uptime_sec)||p.sampledAtMs<=Number(previous.sampled_at_ms))throw Error('ORIGINAL_WINDOWS_MONOTONIC_SAMPLE_INVALID');
 }else if(p.sampleSeq!==1)throw Error('ORIGINAL_WINDOWS_FIRST_SAMPLE_SEQUENCE_INVALID');
 const signatureSha256=await verifySig(envelope,pin);
 const listening=[p.hubApiPort,p.caddyPort,p.mqttPort,p.ollamaPort].filter(x=>x==='LISTENING').length;
 return {hostReviewId:host.id,ceremonyId:ceremony.id,hostId:p.hostId,bootId:p.bootId,sampleId:p.sampleId,sampleSeq:p.sampleSeq,sampledAtMs:p.sampledAtMs,
  osUptimeSec:p.osUptimeSec,hubApiPort:p.hubApiPort,caddyPort:p.caddyPort,mqttPort:p.mqttPort,ollamaPort:p.ollamaPort,signatureSha256,
  samplerCommit:p.samplerCommit,samplerFingerprintSha256:pin.fingerprintSha256,
  evidenceState:listening===4?'SIGNED_ORIGINAL_LOOPBACK_PORTS_LISTENING':'SIGNED_ORIGINAL_LOOPBACK_PORTS_PARTIAL_OR_UNKNOWN',
  servicesAuthenticated:false,physicalRecoveryCertified:false,authorizesAction:false};
}
export function reconcile921({sources=[],ackReviews=[],ledgerReviews=[],nativeReviews=[],hostReviews=[],preflights=[],ownerReports=[],healthSamples=[]}={}){
 const src=Array.isArray(sources)?sources:[],a=Array.isArray(ackReviews)?ackReviews:[],l=Array.isArray(ledgerReviews)?ledgerReviews:[],n=Array.isArray(nativeReviews)?nativeReviews:[],h=Array.isArray(hostReviews)?hostReviews:[],p=Array.isArray(preflights)?preflights:[],o=Array.isArray(ownerReports)?ownerReports:[],s=Array.isArray(healthSamples)?healthSamples:[];
 const pairs=p.map(c=>{const two=o.filter(x=>x.ceremony_id===c.id);const hasTwo=two.some(x=>x.owner_role==='PRIMARY_OWNER')&&two.some(x=>x.owner_role==='SECOND_OWNER')&&new Set(two.map(x=>x.owner_staff_id)).size===2;
  const hostIds=new Set(two.map(x=>x.host_review_id));const samples=s.filter(x=>x.ceremony_id===c.id&&hostIds.has(x.host_review_id)).sort((x,y)=>x.sample_seq-y.sample_seq);
  const healthy=samples.length>=3&&samples.slice(-3).every(x=>['hub_api_port','caddy_port','mqtt_port','ollama_port'].every(k=>x[k]==='LISTENING'))&&samples.slice(-3).every((x,i,a)=>i===0||Number(x.sampled_at_ms)-Number(a[i-1].sampled_at_ms)>=30000);
  return {ceremonyId:c.id,hostId:c.host_id,twoOwnerSignedReport:hasTwo,originalHealthSamples:samples.length,threeSignedPortObservations:healthy,physicalRebootVerified:false};
 });
 return {build:921,sourceReceipts:src.length,receiverAckReviews:a.length,independentLedgerReviews:l.length,originalNativeApiWitnesses:n.length,originalHostWitnessReviews:h.length,
  originalPreflights:p.length,twoOwnerReports:o.length,windowsReadOnlyHealthSamples:s.length,receiverStatus:RECEIVERS919.map(id=>({receiverId:id,nativeApiVerifiedCount:n.filter(x=>x.receiver_id===id).length,
   apiOriginalEnrolledStatus:'SERVER_PIN_REQUIRED'})),fieldCases:pairs,sevenSourceConnected:false,receiverNetworkDeliveryAccepted:false,
  physicalWindowsRebootCertified:false,ownerFinalAuthorityAccepted:false,operationalState:'ORIGINAL_RECEIVER_AND_WINDOWS_FIELD_AUTHORITY_HOLD',customerDataExposed:false,automaticRestart:false};
}
