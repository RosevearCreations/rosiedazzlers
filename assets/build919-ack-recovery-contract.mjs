// Build 919: independently pinned receiver ACK and host recovery evidence reviews.
// Cryptographic review is not physical reboot certification or receiver CONNECTED authority.
import {APPS918,HEX64,HEX128,canonical918} from './build918-signed-mesh-contract.mjs';
export const RECEIVERS919=Object.freeze(['ai-data-platform','rosevear-comms-hub']);
export const ACK_SCHEMA919='rosevear.sysop.receiver-ack.v1';
export const HOST_SCHEMA919='rosevear.sysop.original-host-witness.v1';
const H40=/^[a-f0-9]{40}$/;const H32=/^[a-f0-9]{32}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const goodTime=(issued,expires,now)=>Number.isSafeInteger(issued)&&Number.isSafeInteger(expires)&&issued<=now+2000&&now-issued<=120000&&expires>now&&expires-issued<=120000&&expires>issued;
const digest=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
const from64=s=>{if(typeof s!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(s)||s.length>2048)throw Error('INDEPENDENT_PIN_ENCODING_INVALID');return Uint8Array.from(atob(s),x=>x.charCodeAt(0))};
async function verifiedSignature(envelope,pin,now){
 if(!exact(envelope,['payload','signature'])||!HEX128.test(envelope.signature))throw Error('ORIGINAL_ENVELOPE_INVALID');
 if(!pin||!H40.test(pin.expectedCommit||'')||!HEX64.test(pin.fingerprintSha256||''))throw Error('INDEPENDENT_PIN_MISSING');
 const bytes=from64(pin.publicKeySpkiBase64);
 if(await digest(bytes)!==pin.fingerprintSha256)throw Error('INDEPENDENT_PIN_FINGERPRINT_INVALID');
 const key=await crypto.subtle.importKey('spki',bytes,{name:'Ed25519'},false,['verify']);
 const signature=Uint8Array.from(envelope.signature.match(/.{2}/g).map(x=>parseInt(x,16)));
 if(!await crypto.subtle.verify('Ed25519',key,signature,new TextEncoder().encode(canonical918(envelope.payload))))throw Error('INDEPENDENT_SIGNATURE_INVALID');
 return await digest(signature);
}
const ackKeys=['schema','receiverId','receiverCommit','sourceAppId','sourceCommit','sourceReceiptId','sourceEventId','sourceSignatureSha256','deliveryId','deliveryNonce','receiverReceiptId','receivedAtMs','issuedAtMs','expiresAtMs','dataClass','authorizesAction'];
export async function verifyReceiver919({envelope,pin,source,nowMs=Date.now()}={}){
 const p=envelope?.payload;
 if(!exact(p,ackKeys)||p.schema!==ACK_SCHEMA919||!RECEIVERS919.includes(p.receiverId)||!APPS918.includes(p.sourceAppId)||!H40.test(p.receiverCommit||'')||!H40.test(p.sourceCommit||'')||!UUID.test(p.sourceReceiptId||'')||!HEX64.test(p.sourceSignatureSha256||'')||!UUID.test(p.receiverReceiptId||'')||!H32.test(p.deliveryNonce||'')||!/^[-A-Za-z0-9_]{20,100}$/.test(p.deliveryId||'')||!/^[-A-Za-z0-9_]{16,80}$/.test(p.sourceEventId||''))throw Error('RECEIVER_ACK_SHAPE_INVALID');
 if(!goodTime(p.issuedAtMs,p.expiresAtMs,nowMs)||!Number.isSafeInteger(p.receivedAtMs)||p.receivedAtMs>nowMs+2000||nowMs-p.receivedAtMs>900000)throw Error('RECEIVER_ACK_FRESHNESS_INVALID');
 if(p.dataClass!=='NON_SENSITIVE_AGGREGATE'||p.authorizesAction!==false)throw Error('RECEIVER_ACK_PRIVACY_INVALID');
 if(!source||p.sourceReceiptId!==source.id||p.sourceAppId!==source.app_id||p.sourceCommit!==source.source_commit||p.sourceEventId!==source.event_id||p.sourceSignatureSha256!==source.signature_sha256)throw Error('ORIGINAL_SOURCE_CORRELATION_MISMATCH');
 if(p.receivedAtMs>p.issuedAtMs+2000||p.issuedAtMs-p.receivedAtMs>120000)throw Error('RECEIVER_ACK_TIMELINE_INVALID');
 if(p.receiverCommit!==pin?.expectedCommit)throw Error('RECEIVER_COMMIT_PIN_MISMATCH');
 if(Math.abs(p.receivedAtMs-Date.parse(source.created_at||''))>900000)throw Error('RECEIVER_SOURCE_TIMELINE_MISMATCH');
 const signatureSha256=await verifiedSignature(envelope,pin,nowMs);
 return {sourceReceiptId:source.id,sourceAppId:p.sourceAppId,receiverId:p.receiverId,receiverCommit:p.receiverCommit,receiverReceiptId:p.receiverReceiptId,deliveryId:p.deliveryId,deliveryNonce:p.deliveryNonce,receivedAtMs:p.receivedAtMs,signatureSha256,
  state:'SIGNED_RECEIVER_ACK_REVIEW_ONLY',independentTransportWitnessVerified:false,connected:false,authorizesAction:false};
}
const hostKeys=['schema','sourceReceiptId','sourceSignatureSha256','hostId','hostWitnessCommit','bootId','bootTimeMs','windowsEventDigestSha256','serviceReadbackDigestSha256','originalWitnessEvidenceSha256','witnessStaffId','issuedAtMs','expiresAtMs','dataClass','authorizesRestart'];
export async function verifyHostWitness919({envelope,pin,source,staffWitness,sourcePin,actorId,nowMs=Date.now()}={}){
 const p=envelope?.payload;
 if(!exact(p,hostKeys)||p.schema!==HOST_SCHEMA919||!UUID.test(p.sourceReceiptId||'')||!HEX64.test(p.sourceSignatureSha256||'')||!H32.test(p.bootId||'')||!HEX64.test(p.windowsEventDigestSha256||'')||!HEX64.test(p.serviceReadbackDigestSha256||'')||!HEX64.test(p.originalWitnessEvidenceSha256||'')||!UUID.test(p.witnessStaffId||'')||!H40.test(p.hostWitnessCommit||'')||typeof p.hostId!=='string'||!/^[A-Za-z0-9_-]{6,100}$/.test(p.hostId))throw Error('HOST_WITNESS_SHAPE_INVALID');
 if(!goodTime(p.issuedAtMs,p.expiresAtMs,nowMs)||!Number.isSafeInteger(p.bootTimeMs)||p.bootTimeMs<0||p.bootTimeMs>nowMs+2000||nowMs-p.bootTimeMs>86400000)throw Error('HOST_WITNESS_FRESHNESS_INVALID');
 if(p.dataClass!=='NON_SENSITIVE_AGGREGATE'||p.authorizesRestart!==false||pin?.hostId!==p.hostId||pin?.expectedCommit!==p.hostWitnessCommit||pin?.fingerprintSha256===sourcePin?.fingerprintSha256)throw Error('ORIGINAL_HOST_WITNESS_INDEPENDENCE_INVALID');
 if(!source||source.app_id!=='rosevear-ai-hub'||source.event_kind!=='HOST_BOOT_OBSERVED'||p.sourceReceiptId!==source.id||p.sourceSignatureSha256!==source.signature_sha256||p.bootTimeMs>Number(source.observed_at_ms)||p.bootTimeMs>Number(source.source_signed_at_ms))throw Error('HOST_ORIGINAL_SOURCE_MISMATCH');
 if(!staffWitness||staffWitness.receipt_id!==source.id||staffWitness.witnessed_by_staff_id!==actorId||p.witnessStaffId!==actorId||staffWitness.evidence_sha256!==p.originalWitnessEvidenceSha256||source.registered_by_staff_id===actorId)throw Error('HOST_SECOND_STAFF_CORRELATION_MISMATCH');
 const signatureSha256=await verifiedSignature(envelope,pin,nowMs);
 return {sourceReceiptId:source.id,originalStaffWitnessId:staffWitness.id,hostId:p.hostId,hostWitnessCommit:p.hostWitnessCommit,bootId:p.bootId,bootTimeMs:p.bootTimeMs,windowsEventDigestSha256:p.windowsEventDigestSha256,serviceReadbackDigestSha256:p.serviceReadbackDigestSha256,signatureSha256,
  state:'SIGNED_HOST_SECOND_WITNESS_REVIEW_ONLY',physicalRecoveryVerified:false,authorizesRestart:false};
}
export function project919(sources=[],acks=[],hosts=[]){
 const s=Array.isArray(sources)?sources:[],a=Array.isArray(acks)?acks:[],h=Array.isArray(hosts)?hosts:[];
 return {build:919,sourceReceiptCount:s.length,verifiedReceiverReviewCount:a.length,hostRecoveryReviewCount:h.length,
  sourceCoverage:APPS918.map(appId=>({appId,sourceReceipts:s.filter(x=>x.app_id===appId).length,
    receiverAckReviews:a.filter(x=>x.source_app_id===appId).length})),
  independentlyEnrolledSourcesCount:null,independentReceiverTransportAccepted:false,sevenSourceConnected:false,
  originalHostRecoveryAccepted:false,operationalState:'INDEPENDENT_DELIVERY_AND_ORIGINAL_HOST_ACCEPTANCE_HOLD',
  softwareReleaseCanBeGreenSeparately:true,customerDataExposed:false,authorizesAction:false};
}
