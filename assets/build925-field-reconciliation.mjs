// Rosie 925: strict independent signed SCM/task, physical and owner closure evidence.
import {canonical918} from './build918-signed-mesh-contract.mjs';
const H40=/^[a-f0-9]{40}$/,H64=/^[a-f0-9]{64}$/,H128=/^[a-f0-9]{128}$/,UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const roles=['INSPECTOR','PHYSICAL_WITNESS','PRIMARY_OWNER','SECOND_OWNER','PRODUCTION_WITNESS'];
export const SERVICES925=['hub','caddy','mqtt','ollama'];
const exact=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===k.length&&k.every(x=>Object.hasOwn(o,x));
const need=(v,m)=>{if(!v)throw Error(m)};
const bytes=s=>Uint8Array.from(s.match(/../g),v=>parseInt(v,16));
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function digest925(x){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical918(x))))}
export function validatePins925(pins,appFingerprint){
 need(exact(pins,roles)&&H64.test(appFingerprint||''),'PIN_ROSTER_REQUIRED');
 const f=new Set([appFingerprint]),ids=new Set();
 for(const role of roles){const p=pins[role];need(p&&UUID.test(p.staffId||'')&&H40.test(p.expectedCommit||'')&&H64.test(p.fingerprintSha256||'')&&typeof p.publicKeySpkiBase64==='string'&&p.publicKeySpkiBase64.length<=2048&&!f.has(p.fingerprintSha256)&&!ids.has(p.staffId),'INDEPENDENT_PIN_REQUIRED');f.add(p.fingerprintSha256);ids.add(p.staffId)}
}
async function verify(e,pin,role,binding,now){
 need(exact(e,['payload','signature'])&&H128.test(e.signature||''),'ENVELOPE_REQUIRED');
 const p=e.payload;
 need(exact(p,['schema','role','staffId','sourceCommit','caseDigest','observedAtMs','expiresAtMs','evidence','authorizesAction'])&&p.schema==='rosevear.rosie.field-evidence.v925'&&p.role===role&&p.staffId===pin.staffId&&p.sourceCommit===pin.expectedCommit&&p.caseDigest===binding&&p.authorizesAction===false,'SIGNED_BINDING_REJECTED');
 need(Number.isSafeInteger(p.observedAtMs)&&Number.isSafeInteger(p.expiresAtMs)&&p.observedAtMs<=now+2000&&now-p.observedAtMs<=300000&&p.expiresAtMs>now&&p.expiresAtMs>p.observedAtMs&&p.expiresAtMs-p.observedAtMs<=300000,'STALE_EVIDENCE');
 const der=Uint8Array.from(atob(pin.publicKeySpkiBase64),c=>c.charCodeAt(0));need(hex(await crypto.subtle.digest('SHA-256',der))===pin.fingerprintSha256,'PIN_MISMATCH');
 const key=await crypto.subtle.importKey('spki',der,{name:'Ed25519'},false,['verify']);
 need(await crypto.subtle.verify('Ed25519',key,bytes(e.signature),new TextEncoder().encode(canonical918(p))),'INVALID_SIGNATURE');
 return p.evidence;
}
export function reconcile925(observations,expected){
 need(Array.isArray(observations)&&observations.length===4&&exact(expected,SERVICES925),'FOUR_COMPONENT_PINS_REQUIRED');
 return observations.map((o,i)=>{
 const id=SERVICES925[i],p=expected[id];
 need(exact(o,['component','mode','identity','principal','state','processId','binarySha256','authenticode','processCorrelation'])&&o.component===id,'BAD_OBSERVATION');
 need(exact(p,['mode','identity','principal','binarySha256'])&&['SCM','SCHEDULED_TASK'].includes(p.mode)&&typeof p.identity==='string'&&p.identity.length>0&&typeof p.principal==='string'&&p.principal.length>0&&H64.test(p.binarySha256),'BAD_EXPECTED_IDENTITY');
 const verified=o.mode===p.mode&&o.identity===p.identity&&o.principal===p.principal&&o.binarySha256===p.binarySha256&&o.state==='RUNNING'&&Number.isSafeInteger(o.processId)&&o.processId>0&&o.authenticode==='VALID'&&o.processCorrelation==='VERIFIED';
 return {component:id,mode:p.mode,verified};
 });
}
// Caller must load binding and pins from trusted server custody, never from a submitted bundle.
export async function evaluate925({binding,pins,appFingerprint,expected,inspector,physical,owners,production,nowMs=Date.now()}={}){
 validatePins925(pins,appFingerprint);
 need(exact(binding,['caseId','appAttestationId','hostId','bootId','nonce','productionSha','nativeReceiptIds'])&&UUID.test(binding.caseId||'')&&UUID.test(binding.appAttestationId||'')&&/^[A-Za-z0-9_-]{6,100}$/.test(binding.hostId||'')&&/^[a-f0-9]{32}$/.test(binding.bootId||'')&&H64.test(binding.nonce||'')&&H40.test(binding.productionSha||'')&&Array.isArray(binding.nativeReceiptIds)&&binding.nativeReceiptIds.length===2&&binding.nativeReceiptIds.every(x=>UUID.test(x))&&new Set(binding.nativeReceiptIds).size===2,'INVALID_CASE_BINDING');
 const caseDigest=await digest925(binding),a=await verify(inspector,pins.INSPECTOR,'INSPECTOR',caseDigest,nowMs);
 need(exact(a,['observations']),'INVALID_INSPECTOR_EVIDENCE');
 const identities=reconcile925(a.observations,expected),inspectionDigest=await digest925(inspector);
 const b=await verify(physical,pins.PHYSICAL_WITNESS,'PHYSICAL_WITNESS',caseDigest,nowMs);
 need(exact(b,['inspectionDigest','presence','observedRecovery','decision'])&&b.inspectionDigest===inspectionDigest,'PHYSICAL_WITNESS_BINDING_REJECTED');
 const c=await verify(production,pins.PRODUCTION_WITNESS,'PRODUCTION_WITNESS',caseDigest,nowMs);
 need(exact(c,['deploymentId','productionSha','canonicalSmoke','providerStatus'])&&typeof c.deploymentId==='string'&&c.deploymentId.length>0&&c.deploymentId.length<=128&&c.productionSha===binding.productionSha,'PRODUCTION_RECEIPT_MISMATCH');
 const reviewDigest=await digest925({caseDigest,inspectionDigest,physical:await digest925(physical),production:await digest925(production)});
 need(Array.isArray(owners)&&owners.length===2,'TWO_OWNER_REVIEWS_REQUIRED');
 const decisions=[];
 for(const [i,role] of ['PRIMARY_OWNER','SECOND_OWNER'].entries()){
 const e=await verify(owners[i],pins[role],role,reviewDigest,nowMs);need(exact(e,['decision'])&&['APPROVE','HOLD'].includes(e.decision),'OWNER_DECISION_REJECTED');decisions.push(e.decision);
 }
 const reasons=[];if(identities.some(x=>!x.verified))reasons.push('SCM_TASK_IDENTITY_HOLD');
 if(b.presence!=='IN_PERSON'||b.observedRecovery!==true||b.decision!=='APPROVE')reasons.push('PHYSICAL_WITNESS_HOLD');
 if(c.canonicalSmoke!=='PASS'||c.providerStatus!=='SUCCESS')reasons.push('PRODUCTION_RECEIPT_HOLD');
 if(decisions.some(x=>x!=='APPROVE'))reasons.push('OWNER_REVIEW_HOLD');
 return {build:925,caseDigest,reviewDigest,identities,reasons,closureReady:reasons.length===0,fieldCertified:false,sevenSourceConnected:false,authorizesAction:false};
}
