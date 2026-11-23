// Rosie Build 920 — independently pinned receiver ledger and two-owner original-host field REVIEW.
// Signed reports are not independent physical reboot certification or receiver network CONNECTED.
import {RECEIVERS919} from './build919-ack-recovery-contract.mjs';
import {canonical918} from './build918-signed-mesh-contract.mjs';
export const LEDGER_SCHEMA920='rosevear.sysop.receiver-ledger-readback.v1';
export const OWNER_SCHEMA920='rosevear.sysop.original-host-owner-witness.v1';
export const ROLES920=Object.freeze(['PRIMARY_OWNER','SECOND_OWNER']);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const H40=/^[a-f0-9]{40}$/;const H64=/^[a-f0-9]{64}$/;const H32=/^[a-f0-9]{32}$/;const H128=/^[a-f0-9]{128}$/;
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
const from64=s=>{if(typeof s!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(s)||s.length>2048)throw Error('PUBLIC_PIN_INVALID');return Uint8Array.from(atob(s),x=>x.charCodeAt(0))};
const fresh=(issue,expiry,now)=>Number.isSafeInteger(issue)&&Number.isSafeInteger(expiry)&&issue<=now+2000&&now-issue<=120000&&expiry>now&&expiry>issue&&expiry-issue<=120000;
async function verifySignature920(envelope,pin){
 if(!exact(envelope,['payload','signature'])||!H128.test(envelope.signature))throw Error('ENVELOPE_SIGNATURE_SHAPE_INVALID');
 if(!pin||!H40.test(pin.expectedCommit||'')||!H64.test(pin.fingerprintSha256||''))throw Error('INDEPENDENT_SIGNER_PIN_MISSING');
 const pub=from64(pin.publicKeySpkiBase64);
 if(await digest(pub)!==pin.fingerprintSha256)throw Error('INDEPENDENT_SIGNER_FINGERPRINT_INVALID');
 const key=await crypto.subtle.importKey('spki',pub,{name:'Ed25519'},false,['verify']);
 const sig=Uint8Array.from(envelope.signature.match(/.{2}/g).map(x=>parseInt(x,16)));
 if(!await crypto.subtle.verify('Ed25519',key,sig,new TextEncoder().encode(canonical918(envelope.payload))))throw Error('INDEPENDENT_SIGNER_SIGNATURE_INVALID');
 return await digest(sig);
}
const ledgerKeys=['schema','receiverId','receiverCommit','ackReviewId','sourceReceiptId','receiverReceiptId','deliveryId','deliveryNonce','ledgerEntryId','ledgerEntrySha256','ledgerHeadSha256','ledgerObservedAtMs','issuedAtMs','expiresAtMs','disposition','dataClass','authorizesAction'];
export async function verifyLedgerReadback920({envelope,pin,ack,ackSignerPin,nowMs=Date.now()}={}){
 const p=envelope?.payload;
 if(!exact(p,ledgerKeys)||p.schema!==LEDGER_SCHEMA920||!RECEIVERS919.includes(p.receiverId)||!H40.test(p.receiverCommit||'')||!UUID.test(p.ackReviewId||'')||!UUID.test(p.sourceReceiptId||'')||!UUID.test(p.receiverReceiptId||'')||!UUID.test(p.ledgerEntryId||'')||!H64.test(p.ledgerEntrySha256||'')||!H64.test(p.ledgerHeadSha256||'')||!H32.test(p.deliveryNonce||'')||!/^[-A-Za-z0-9_]{20,100}$/.test(p.deliveryId||''))throw Error('ORIGINAL_LEDGER_SHAPE_INVALID');
 if(!fresh(p.issuedAtMs,p.expiresAtMs,nowMs)||!Number.isSafeInteger(p.ledgerObservedAtMs)||p.ledgerObservedAtMs>p.issuedAtMs+2000||nowMs-p.ledgerObservedAtMs>900000)throw Error('ORIGINAL_LEDGER_FRESHNESS_INVALID');
 if(p.disposition!=='DURABLE_ACK_PRESENT'||p.dataClass!=='NON_SENSITIVE_AGGREGATE'||p.authorizesAction!==false)throw Error('ORIGINAL_LEDGER_SCOPE_INVALID');
 if(!ack||p.ackReviewId!==ack.id||p.sourceReceiptId!==ack.source_receipt_id||p.receiverId!==ack.receiver_id||p.receiverCommit!==ack.receiver_commit||p.receiverReceiptId!==ack.receiver_receipt_id||p.deliveryId!==ack.delivery_id||p.deliveryNonce!==ack.delivery_nonce||p.ledgerObservedAtMs<Number(ack.receiver_received_at_ms))throw Error('ORIGINAL_RECEIVER_LEDGER_CORRELATION_INVALID');
 if(pin?.expectedCommit!==p.receiverCommit||pin?.fingerprintSha256===ackSignerPin?.fingerprintSha256)throw Error('INDEPENDENT_LEDGER_SIGNER_REQUIRED');
 const signatureSha256=await verifySignature920(envelope,pin);
 return {ackReviewId:ack.id,sourceReceiptId:ack.source_receipt_id,receiverId:p.receiverId,ledgerEntryId:p.ledgerEntryId,ledgerEntrySha256:p.ledgerEntrySha256,ledgerHeadSha256:p.ledgerHeadSha256,ledgerObservedAtMs:p.ledgerObservedAtMs,signatureSha256,reviewState:'SIGNED_INDEPENDENT_LEDGER_READBACK_REVIEW',receiverTransportAccepted:false,authorizesAction:false};
}
const ownerKeys=['schema','ceremonyId','preflightNonce','hostReviewId','hostId','hostWitnessCommit','bootId','bootTimeMs','windowsEventDigestSha256','serviceReadbackDigestSha256','ownerStaffId','ownerRole','ownerSignerCommit','observedAtMs','issuedAtMs','expiresAtMs','physicalObservationReported','automaticRestartApproved','dataClass'];
export async function verifyOwnerWitness920({envelope,pin,ceremony,host,hostSignerPin,otherOwnerPin,actorId,nowMs=Date.now()}={}){
 const p=envelope?.payload;
 if(!exact(p,ownerKeys)||p.schema!==OWNER_SCHEMA920||!UUID.test(p.ceremonyId||'')||!H64.test(p.preflightNonce||'')||!UUID.test(p.hostReviewId||'')||!H40.test(p.hostWitnessCommit||'')||!H40.test(p.ownerSignerCommit||'')||!H32.test(p.bootId||'')||!H64.test(p.windowsEventDigestSha256||'')||!H64.test(p.serviceReadbackDigestSha256||'')||!UUID.test(p.ownerStaffId||'')||!ROLES920.includes(p.ownerRole))throw Error('ORIGINAL_OWNER_WITNESS_SHAPE_INVALID');
 if(!fresh(p.issuedAtMs,p.expiresAtMs,nowMs)||!Number.isSafeInteger(p.observedAtMs)||p.observedAtMs>nowMs+2000||nowMs-p.observedAtMs>900000)throw Error('ORIGINAL_OWNER_WITNESS_FRESHNESS_INVALID');
 if(p.dataClass!=='NON_SENSITIVE_AGGREGATE'||p.physicalObservationReported!==true||p.automaticRestartApproved!==false)throw Error('OWNER_WITNESS_SCOPE_INVALID');
 if(!ceremony||p.ceremonyId!==ceremony.id||p.preflightNonce!==ceremony.preflight_nonce||p.hostId!==ceremony.host_id||!UUID.test(ceremony.id||''))throw Error('ORIGINAL_PREFLIGHT_MISMATCH');
 if(!host||host.id!==p.hostReviewId||host.host_id!==p.hostId||host.host_witness_commit!==p.hostWitnessCommit||host.boot_id!==p.bootId||Number(host.boot_time_ms)!==p.bootTimeMs||host.windows_event_sha256!==p.windowsEventDigestSha256||host.service_readback_sha256!==p.serviceReadbackDigestSha256)throw Error('ORIGINAL_WINDOWS_READBACK_MISMATCH');
 const start=Date.parse(ceremony.created_at||''),end=Date.parse(ceremony.expires_at||'');
 if(!Number.isFinite(start)||!Number.isFinite(end)||end-start>3600000||end<=start||p.bootTimeMs<=start||p.bootTimeMs>=end||p.observedAtMs<p.bootTimeMs||nowMs>end+900000)throw Error('ORIGINAL_PREFLIGHT_BOOT_SEQUENCE_INVALID');
 if(p.ownerStaffId!==actorId||pin?.staffId!==actorId||pin?.ownerRole!==p.ownerRole||pin?.expectedCommit!==p.ownerSignerCommit||pin?.fingerprintSha256===hostSignerPin?.fingerprintSha256||pin?.fingerprintSha256===otherOwnerPin?.fingerprintSha256)throw Error('DISTINCT_TWO_OWNER_PIN_REQUIRED');
 const signatureSha256=await verifySignature920(envelope,pin);
 return {ceremonyId:ceremony.id,hostReviewId:host.id,ownerStaffId:actorId,ownerRole:p.ownerRole,ownerSignerCommit:p.ownerSignerCommit,signatureSha256,observedAtMs:p.observedAtMs,reviewState:'OWNER_SIGNED_PHYSICAL_OBSERVATION_REPORT_ONLY',physicalRecoveryCertified:false,authorizesRestart:false};
}
export function project920({ackReviews=[],ledgerReviews=[],hostReviews=[],ceremonies=[],ownerReviews=[]}={}){
 const a=Array.isArray(ackReviews)?ackReviews:[],l=Array.isArray(ledgerReviews)?ledgerReviews:[],h=Array.isArray(hostReviews)?hostReviews:[],c=Array.isArray(ceremonies)?ceremonies:[],o=Array.isArray(ownerReviews)?ownerReviews:[];
 const twoOwnerCases=c.filter(ceremony=>{
  const matching=o.filter(r=>r.ceremony_id===ceremony.id);return ROLES920.every(role=>matching.some(x=>x.owner_role===role))&&new Set(matching.map(x=>x.owner_staff_id)).size>=2;
 }).length;
 return {build:920,receiverAckReviewCount:a.length,ledgerReadbackReviewCount:l.length,hostWitnessReviewCount:h.length,openedPreflightCount:c.length,ownerFieldReportCount:o.length,twoOwnerReviewCount:twoOwnerCases,
  receiverBreakdown:RECEIVERS919.map(receiverId=>({receiverId,ackReviews:a.filter(x=>x.receiver_id===receiverId).length,independentLedgerReviews:l.filter(x=>x.receiver_id===receiverId).length})),
  signedTwoOwnerReportPresent:twoOwnerCases>0,independentTransportVerified:false,sevenSourceConnected:false,originalHostPhysicallyCertified:false,operationalState:'SOURCE_LEDGER_AND_ORIGINAL_HOST_FIELD_CERTIFICATION_HOLD',authorizesRestart:false,customerDataExposed:false};
}
