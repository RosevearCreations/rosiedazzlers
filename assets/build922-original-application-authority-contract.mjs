// Rosie 922: external receiver contract compatibility and independently signed application health.
// Pure fail-closed validation; NEVER turns readiness into original field certification.
import {canonical918} from './build918-signed-mesh-contract.mjs';
export const RECEIVER_PROTOCOL922='rosevear.sysop.receiver-native-ledger-readback.v1';
export const APP_HEALTH_SCHEMA922='rosevear.sysop.windows-app-health-attestation.v1';
export const RECEIVER_PATH922='/v1/rosevear/sysop/ledger-readback';
export const REQUIRED_SERVICES922=Object.freeze(['hub','caddy','mqtt','ollama']);
const H40=/^[a-f0-9]{40}$/,H64=/^[a-f0-9]{64}$/,H128=/^[a-f0-9]{128}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const exact=(x,keys)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const hexBytes=s=>Uint8Array.from(s.match(/.{2}/g).map(v=>parseInt(v,16)));
const digest=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');
const base64=s=>{if(typeof s!=='string'||s.length>2048||!/^[A-Za-z0-9+/]+={0,2}$/.test(s))throw Error('ORIGINAL_PUBLIC_KEY_INVALID');return Uint8Array.from(atob(s),c=>c.charCodeAt(0))};
export function checkReceiverCompatibility922(manifest,{expectedCommit,expectedFingerprint}={}){
 const keys=['protocol','path','method','auth','signerAlgorithm','challengeBits','redirects','maxResponseBytes','dataClass','receiverCommit','signerFingerprintSha256'];
 if(!exact(manifest,keys)||manifest.protocol!==RECEIVER_PROTOCOL922||manifest.path!==RECEIVER_PATH922||manifest.method!=='GET'||manifest.auth!=='SCOPED_READ_ONLY_BEARER'||manifest.signerAlgorithm!=='Ed25519'||manifest.challengeBits!==256||manifest.redirects!==false||manifest.maxResponseBytes>8000||manifest.maxResponseBytes<256||manifest.dataClass!=='NON_SENSITIVE_AGGREGATE'||!H40.test(expectedCommit||'')||manifest.receiverCommit!==expectedCommit||!H64.test(expectedFingerprint||'')||manifest.signerFingerprintSha256!==expectedFingerprint)throw Error('ORIGINAL_RECEIVER_NATIVE_CONTRACT_INCOMPATIBLE');
 return {compatible:true,readOnly:true,originalEndpointObserved:false,fieldCertified:false};
}
const healthKeys=['schema','hostId','bootId','healthSampleId','attestationId','sampledAtMs','issuedAtMs','expiresAtMs','challengeNonce','samplerCommit','serviceResults','dataClass','authorizesAction'];
export async function verifyAppHealth922({envelope,pin,original921Sample,challengeNonce,nowMs=Date.now()}={}){
 const p=envelope?.payload;
 if(!exact(envelope,['payload','signature'])||!H128.test(envelope.signature||'')||!exact(p,healthKeys)||p.schema!==APP_HEALTH_SCHEMA922||!UUID.test(p.attestationId||'')||!UUID.test(p.healthSampleId||'')||!H64.test(p.challengeNonce||'')||p.challengeNonce!==challengeNonce||!H40.test(p.samplerCommit||'')||!Number.isSafeInteger(p.sampledAtMs)||!Number.isSafeInteger(p.issuedAtMs)||!Number.isSafeInteger(p.expiresAtMs)||p.issuedAtMs>nowMs+2000||nowMs-p.issuedAtMs>60000||p.expiresAtMs<=nowMs||p.expiresAtMs-p.issuedAtMs>60000)throw Error('ORIGINAL_APP_HEALTH_ENVELOPE_INVALID_OR_STALE');
 if(p.dataClass!=='NON_SENSITIVE_AGGREGATE'||p.authorizesAction!==false||p.samplerCommit!==pin?.expectedCommit||!H40.test(pin?.expectedCommit||'')||!H64.test(pin?.fingerprintSha256||''))throw Error('ORIGINAL_APP_HEALTH_SIGNER_OR_SCOPE_DENIED');
 if(!original921Sample||p.hostId!==original921Sample.host_id||p.bootId!==original921Sample.boot_id||p.healthSampleId!==original921Sample.sample_id||p.sampledAtMs<Number(original921Sample.sampled_at_ms)||p.sampledAtMs-Number(original921Sample.sampled_at_ms)>60000)throw Error('ORIGINAL_APP_HEALTH_921_BINDING_FAILED');
 if(!Array.isArray(p.serviceResults)||p.serviceResults.length!==4||p.serviceResults.some((s,i)=>!exact(s,['service','state','proof'])||s.service!==REQUIRED_SERVICES922[i]||!['AUTHENTICATED','UNAVAILABLE','UNKNOWN'].includes(s.state)||typeof s.proof!=='string'||s.proof.length>120||!['HTTP_LOCAL_CHALLENGE','PROTOCOL_CHALLENGE','NONE'].includes(s.proof)))throw Error('ORIGINAL_APP_HEALTH_SERVICE_RESULTS_INVALID');
 if(p.serviceResults.some(x=>x.state==='AUTHENTICATED'&&x.proof==='NONE'))throw Error('ORIGINAL_APP_HEALTH_UNPROVEN_CLAIM');
 const pub=base64(pin.publicKeySpkiBase64);if(await digest(pub)!==pin.fingerprintSha256)throw Error('ORIGINAL_APP_HEALTH_PIN_MISMATCH');
 const key=await crypto.subtle.importKey('spki',pub,{name:'Ed25519'},false,['verify']);
 if(!await crypto.subtle.verify('Ed25519',key,hexBytes(envelope.signature),new TextEncoder().encode(canonical918(p))))throw Error('ORIGINAL_APP_HEALTH_SIGNATURE_REJECTED');
 return {attestationId:p.attestationId,healthSampleId:p.healthSampleId,serviceStates:p.serviceResults.map(x=>({service:x.service,state:x.state})),signatureSha256:await digest(hexBytes(envelope.signature)),signedObservation:true,originalApplicationHealthCertified:false,physicalRebootCertified:false,sevenSourceConnected:false};
}
export function finalFieldGate922({receiverWitnesses=[],healthAttestations=[],original921Samples=[],twoOwnerSignatures=[],independentPhysicalObservation=false,productionExactShaVerified=false}={}){
 const reasons=[];
 if(receiverWitnesses.length<2||new Set(receiverWitnesses.map(x=>x.receiver_id)).size!==2)reasons.push('ORIGINAL_BOTH_RECEIVER_NATIVE_WITNESSES_REQUIRED');
 if(original921Samples.length<3)reasons.push('THREE_ORIGINAL_WINDOWS_SAMPLES_REQUIRED');
 if(healthAttestations.length<3)reasons.push('THREE_SIGNED_APPLICATION_HEALTH_ATTESTATIONS_REQUIRED');
 if(new Set(twoOwnerSignatures.map(x=>x.owner_staff_id)).size!==2)reasons.push('TWO_DISTINCT_GENUINE_OWNER_SIGNATURES_REQUIRED');
 if(!independentPhysicalObservation)reasons.push('INDEPENDENT_PHYSICAL_WINDOWS_OBSERVATION_REQUIRED');
 if(!productionExactShaVerified)reasons.push('EXACT_SHA_PRODUCTION_VERIFICATION_REQUIRED');
 return {build:922,reviewReady:reasons.length===0,fieldCertified:false,sevenSourceConnected:false,operationalState:'ORIGINAL_FIELD_CERTIFICATION_HOLD',reasons,requiresIndependentHumanAuthority:true};
}
