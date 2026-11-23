// Rosie 924 — separate Windows SCM identity, live receiver evidence and two-owner decision gates.
// Source validation only: no synthetic hardware, auto-CONNECTED, restart or automatic certification.
import {canonical918} from './build918-signed-mesh-contract.mjs';
import {checkReceiverCompatibility922,REQUIRED_SERVICES922} from './build922-original-application-authority-contract.mjs';
export const IDENTITY_SCHEMA924='rosevear.sysop.windows-service-identity.v1';
export const OWNER_REVIEW_SCHEMA924='rosevear.sysop.owner-final-field-review.v1';
const H40=/^[a-f0-9]{40}$/,H64=/^[a-f0-9]{64}$/,H128=/^[a-f0-9]{128}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const exact=(v,ks)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===ks.length&&ks.every(k=>Object.hasOwn(v,k));
const bytes=s=>Uint8Array.from(s.match(/.{2}/g),x=>parseInt(x,16));
const sha=async data=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');
async function signed(envelope,pin){
 if(!exact(envelope,['payload','signature'])||!H128.test(envelope.signature||'')||!H40.test(pin?.expectedCommit||'')||!H64.test(pin?.fingerprintSha256||'')||
 typeof pin.publicKeySpkiBase64!=='string'||pin.publicKeySpkiBase64.length>2048||!/^[A-Za-z0-9+/]+={0,2}$/.test(pin.publicKeySpkiBase64))throw Error('ORIGINAL_924_SIGNATURE_SHAPE_OR_PIN_REJECTED');
 let der;try{der=Uint8Array.from(atob(pin.publicKeySpkiBase64),c=>c.charCodeAt(0))}catch{throw Error('ORIGINAL_924_PUBLIC_KEY_INVALID')}
 if(await sha(der)!==pin.fingerprintSha256)throw Error('ORIGINAL_924_PIN_MISMATCH');
 const key=await crypto.subtle.importKey('spki',der,{name:'Ed25519'},false,['verify']);
 if(!await crypto.subtle.verify('Ed25519',key,bytes(envelope.signature),new TextEncoder().encode(canonical918(envelope.payload))))throw Error('ORIGINAL_924_SIGNATURE_REJECTED');
 return await sha(bytes(envelope.signature));
}
export async function verifyWindowsServiceIdentity924({envelope,pin,sourceAttestation,challenge,appSignerFingerprint,nowMs=Date.now()}={}){
 const p=envelope?.payload,fields=['schema','hostId','bootId','sourceAttestationId','inspectionId','challengeNonce','inspectorCommit','observedAtMs','expiresAtMs','services','dataClass','authorizesAction'];
 if(!exact(p,fields)||p.schema!==IDENTITY_SCHEMA924||!UUID.test(p.inspectionId||'')||
 !UUID.test(p.sourceAttestationId||'')||!H64.test(p.challengeNonce||'')||!H40.test(p.inspectorCommit||'')||
 !Number.isSafeInteger(p.observedAtMs)||!Number.isSafeInteger(p.expiresAtMs)||
 p.observedAtMs>nowMs+2000||nowMs-p.observedAtMs>60000||p.expiresAtMs<=nowMs||p.expiresAtMs-p.observedAtMs>60000||
 p.dataClass!=='NON_SENSITIVE_AGGREGATE'||p.authorizesAction!==false)throw Error('ORIGINAL_924_IDENTITY_EXPIRED_OR_INVALID');
 if(p.inspectorCommit!==pin?.expectedCommit||pin?.fingerprintSha256===appSignerFingerprint||
 !H64.test(appSignerFingerprint||''))throw Error('ORIGINAL_924_INDEPENDENT_INSPECTOR_REQUIRED');
 if(!sourceAttestation||p.sourceAttestationId!==sourceAttestation.id||p.hostId!==sourceAttestation.host_id||
 p.bootId!==sourceAttestation.boot_id||!challenge||p.challengeNonce!==challenge.challenge_nonce||
 challenge.app_attestation_id!==sourceAttestation.id||Date.parse(challenge.expires_at)<=nowMs)
 throw Error('ORIGINAL_924_CHALLENGE_BINDING_REJECTED');
 if(!Array.isArray(p.services)||p.services.length!==4||p.services.some((s,i)=>
 !exact(s,['service','serviceName','state','processId','binarySha256','authenticode','account'])||
 s.service!==REQUIRED_SERVICES922[i]||typeof s.serviceName!=='string'||!/^[A-Za-z0-9_.-]{1,80}$/.test(s.serviceName)||
 !['RUNNING','MISSING','UNKNOWN'].includes(s.state)||!Number.isSafeInteger(s.processId)||s.processId<0||
 !(s.binarySha256===null||H64.test(s.binarySha256))||!['VALID','INVALID','UNKNOWN'].includes(s.authenticode)||
 typeof s.account!=='string'||s.account.length>128||
 (s.state==='RUNNING'&&(!s.processId||!H64.test(s.binarySha256||'')))))
 throw Error('ORIGINAL_924_WINDOWS_SCM_EVIDENCE_INVALID');
 const signatureSha256=await signed(envelope,pin);
 return {inspectionId:p.inspectionId,sourceAttestationId:p.sourceAttestationId,hostId:p.hostId,bootId:p.bootId,
  observedAtMs:p.observedAtMs,inspectorCommit:p.inspectorCommit,signatureSha256,
  services:p.services.map(s=>({service:s.service,state:s.state,serviceName:s.serviceName,processId:s.processId,binarySha256:s.binarySha256,authenticode:s.authenticode,account:s.account})),
  allServiceIdentitiesObserved:p.services.every(x=>x.state==='RUNNING'&&x.authenticode==='VALID'),independentFieldCertified:false};
}
export function checkLiveReceiverEvidence924({observations=[],manifests={},pins={},nowMs=Date.now()}={}){
 const required=['ai-data-platform','rosevear-comms-hub'],accepted=[];
 for(const id of required){
  const rows=observations.filter(x=>x.receiver_id===id);
  if(rows.length!==1)throw Error('ORIGINAL_924_EXACTLY_ONE_LIVE_RECEIVER_WITNESS_REQUIRED');
  const row=rows[0],pin=pins[id],manifest=manifests[id];
  checkReceiverCompatibility922(manifest,{expectedCommit:pin?.expectedCommit,expectedFingerprint:pin?.fingerprintSha256});
  if(!UUID.test(row.id||'')||!UUID.test(row.ledger_review_id||'')||
   !H64.test(row.challenge_nonce||'')||!Number.isSafeInteger(Number(row.api_observed_at_ms))||
   nowMs-Number(row.api_observed_at_ms)>300000||Number(row.api_observed_at_ms)>nowMs+2000||
   row.api_signer_commit!==pin.expectedCommit||row.api_signer_fingerprint_sha256!==pin.fingerprintSha256)
   throw Error('ORIGINAL_924_RECEIVER_LIVE_WITNESS_STALE_OR_UNPINNED');
  accepted.push({receiverId:id,witnessId:row.id,ledgerReviewId:row.ledger_review_id});
 }
 if(observations.length!==2||observations[0].challenge_nonce===observations[1].challenge_nonce)throw Error('ORIGINAL_924_RECEIVER_REPLAY_OR_EXTRA_SOURCE');
 return {twoOriginalLiveReceiversObserved:true,accepted,certifiesCustomerOrTransport:false};
}
export async function verifyOwnerFinalReview924({envelope,pin,actorId,caseDigestSha256,nowMs=Date.now()}={}){
 const p=envelope?.payload,ks=['schema','ownerStaffId','ownerRole','ownerSignerCommit','reviewId','identityWitnessId','caseDigestSha256','decision','observedAtMs','expiresAtMs','dataClass','authorizesAction'];
 if(!exact(p,ks)||p.schema!==OWNER_REVIEW_SCHEMA924||!UUID.test(p.reviewId||'')||!UUID.test(p.identityWitnessId||'')||
 !UUID.test(p.ownerStaffId||'')||p.ownerStaffId!==actorId||pin?.staffId!==actorId||p.ownerRole!==pin?.ownerRole||p.ownerSignerCommit!==pin?.expectedCommit||
 !H64.test(caseDigestSha256||'')||p.caseDigestSha256!==caseDigestSha256||
 !['APPROVE_REVIEW','HOLD'].includes(p.decision)||!Number.isSafeInteger(p.observedAtMs)||
 !Number.isSafeInteger(p.expiresAtMs)||p.observedAtMs>nowMs+2000||nowMs-p.observedAtMs>300000||
 p.expiresAtMs<=nowMs||p.expiresAtMs-p.observedAtMs>300000||
 p.dataClass!=='NON_SENSITIVE_AGGREGATE'||p.authorizesAction!==false)throw Error('ORIGINAL_924_OWNER_FIELD_REVIEW_INVALID_OR_STALE');
 const signatureSha256=await signed(envelope,pin);
 return {reviewId:p.reviewId,identityWitnessId:p.identityWitnessId,ownerStaffId:actorId,ownerRole:p.ownerRole,
  decision:p.decision,caseDigestSha256,observedAtMs:p.observedAtMs,signatureSha256,fieldCertified:false};
}
export function finalFieldReview924({identityWitness,liveReceivers,ownerReviews=[],independentPhysicalObservation=false,exactShaProductionVerified=false}={}){
 const reasons=[];
 if(!identityWitness?.allServiceIdentitiesObserved)reasons.push('INDEPENDENT_WINDOWS_SERVICE_IDENTITY_REQUIRED');
 if(!liveReceivers?.twoOriginalLiveReceiversObserved)reasons.push('BOTH_LIVE_NATIVE_RECEIVER_WITNESSES_REQUIRED');
 if(ownerReviews.length!==2||new Set(ownerReviews.map(x=>x.ownerStaffId)).size!==2||
 ownerReviews.some(x=>x.decision!=='APPROVE_REVIEW'||x.identityWitnessId!==identityWitness?.inspectionId))reasons.push('TWO_DISTINCT_OWNER_SIGNED_REVIEWS_REQUIRED');
 if(!independentPhysicalObservation)reasons.push('INDEPENDENT_PHYSICAL_OBSERVATION_REQUIRED');
 if(!exactShaProductionVerified)reasons.push('EXACT_SHA_PRODUCTION_RECEIPT_REQUIRED');
 return {build:924,reviewReady:reasons.length===0,fieldCertified:false,sevenSourceConnected:false,
  operationalState:'ORIGINAL_FIELD_CERTIFICATION_HOLD',reasons,requiresOriginalHumanAuthority:true};
}
