// Rosie 926: signed enrollment, runtime lineage and bounded historical operational certification.
import {canonical918} from './build918-signed-mesh-contract.mjs';
import {digest925,SERVICES925,validatePins925} from './build925-field-reconciliation.mjs';
export const H40=/^[a-f0-9]{40}$/,H64=/^[a-f0-9]{64}$/,UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const exact=(v,k)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===k.length&&k.every(x=>Object.hasOwn(v,x));
const need=(v,m)=>{if(!v)throw Error(m)};
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const bytes=s=>Uint8Array.from(s.match(/../g),x=>parseInt(x,16));
export async function verify926({envelope,pin,role,bindingDigest,now=Date.now()}){
 const p=envelope?.payload;
 need(exact(envelope,['payload','signature'])&&/^[a-f0-9]{128}$/.test(envelope.signature||'')&&exact(p,['schema','role','staffId','sourceCommit','bindingDigest','issuedAtMs','expiresAtMs','evidence','authorizesAction']),'ENVELOPE_REQUIRED');
 need(p.schema==='rosevear.rosie.original.v926'&&p.role===role&&p.staffId===pin?.staffId&&UUID.test(p.staffId||'')&&H40.test(p.sourceCommit||'')&&p.sourceCommit===pin.expectedCommit&&H64.test(bindingDigest||'')&&p.bindingDigest===bindingDigest&&p.authorizesAction===false,'SIGNED_BINDING_REJECTED');
 need(Number.isSafeInteger(p.issuedAtMs)&&Number.isSafeInteger(p.expiresAtMs)&&p.issuedAtMs<=now+2000&&now-p.issuedAtMs<=300000&&p.expiresAtMs>now&&p.expiresAtMs>p.issuedAtMs&&p.expiresAtMs-p.issuedAtMs<=300000,'STALE_EVIDENCE');
 need(typeof pin.publicKeySpkiBase64==='string'&&pin.publicKeySpkiBase64.length<=2048&&/^[A-Za-z0-9+/]+={0,2}$/.test(pin.publicKeySpkiBase64),'PIN_REQUIRED');
 const der=Uint8Array.from(atob(pin.publicKeySpkiBase64),c=>c.charCodeAt(0));need(hex(await crypto.subtle.digest('SHA-256',der))===pin.fingerprintSha256,'PIN_MISMATCH');
 const key=await crypto.subtle.importKey('spki',der,{name:'Ed25519'},false,['verify']);
 need(await crypto.subtle.verify('Ed25519',key,bytes(envelope.signature),new TextEncoder().encode(canonical918(p))),'SIGNATURE_REJECTED');
 return p.evidence;
}
export function validateRoster926(roles,appFingerprint,runtime,authority){
 validatePins925(roles,appFingerprint);
 const all=[...Object.values(roles),runtime,authority];need(all.every(p=>p&&UUID.test(p.staffId||'')&&H40.test(p.expectedCommit||'')&&H64.test(p.fingerprintSha256||'')&&typeof p.publicKeySpkiBase64==='string'),'ROLE_PIN_REQUIRED');
 need(new Set(all.map(p=>p.fingerprintSha256).concat(appFingerprint)).size===8&&new Set(all.map(p=>p.staffId)).size===7,'INDEPENDENT_ROLES_REQUIRED');
}
export function validateRuntime926(observations,expected){
 need(Array.isArray(observations)&&observations.length===4&&exact(expected,SERVICES925),'FOUR_COMPONENTS_REQUIRED');
 return observations.map((o,i)=>{
 const component=SERVICES925[i],p=expected[component];
 need(exact(p,['mode','identity','principalSid','definitionSha256','runtimeSha256','commandSha256','port'])&&['SCM','SCHEDULED_TASK'].includes(p.mode)&&typeof p.identity==='string'&&p.identity.length>0&&p.identity.length<=260&&/^S-1-[0-9-]+$/.test(p.principalSid)&&[p.definitionSha256,p.runtimeSha256,p.commandSha256].every(x=>H64.test(x||''))&&Number.isInteger(p.port)&&p.port>0&&p.port<=65535,'IDENTITY_PIN_REQUIRED');
 need(exact(o,['component','mode','identity','principalSid','definitionSha256','runtimeSha256','commandSha256','port','runtimePid','lineage','listener','stable','state'])&&o.component===component,'OBSERVATION_SHAPE');
 const verified=['mode','identity','principalSid','definitionSha256','runtimeSha256','commandSha256','port'].every(k=>o[k]===p[k])&&Number.isSafeInteger(o.runtimePid)&&o.runtimePid>0&&o.lineage==='VERIFIED'&&o.listener==='OWNED'&&o.stable===true&&o.state==='RUNNING';
 return {component,verified,mode:p.mode};
 });
}
export function priorReview926(review,oldCase,productionSha){
 need(review?.case_id===oldCase?.id&&review?.result?.build===925&&oldCase.binding?.productionSha===productionSha&&H64.test(review.review_digest||'')&&H64.test(review.case_digest||'')&&Array.isArray(review.result.reasons),'PRIOR_REVIEW_REQUIRED');
 // Only the old direct-SCM/task limitation may be reconciled; physical, owner and provider HOLDs never bypassed.
 need(review.result.reasons.every(x=>x==='SCM_TASK_IDENTITY_HOLD')&&review.result.fieldCertified===false&&review.result.sevenSourceConnected===false,'PRIOR_AUTHORITY_HOLD');
 return oldCase.binding;
}
export async function evaluate926({binding,expected,runtimePin,authorityPin,runtime,approval,now=Date.now()}){
 need(binding&&UUID.test(binding.caseId||'')&&UUID.test(binding.reviewId||'')&&H64.test(binding.reviewDigest||'')&&H64.test(binding.nonce||'')&&H40.test(binding.productionSha||'')&&H64.test(binding.enrollmentDigest||'')&&/^[a-f0-9]{32}$/.test(binding.bootId||''),'CASE_INVALID');
 const d=await digest925(binding),r=await verify926({envelope:runtime,pin:runtimePin,role:'RUNTIME_INSPECTOR',bindingDigest:d,now});
 need(exact(r,['observations']),'RUNTIME_EVIDENCE_REQUIRED');const identities=validateRuntime926(r.observations,expected);
 const runtimeDigest=await digest925(runtime),approvalDigest=await digest925({bindingDigest:d,runtimeDigest});
 const a=await verify926({envelope:approval,pin:authorityPin,role:'CERTIFICATION_AUTHORITY',bindingDigest:approvalDigest,now});
 need(exact(a,['decision','scope'])&&['APPROVE','HOLD'].includes(a.decision)&&a.scope==='ORIGINAL_HOST_RUNTIME_AT_OBSERVATION','EXPLICIT_AUTHORITY_REQUIRED');
 const certified=identities.every(x=>x.verified)&&a.decision==='APPROVE';
 return {build:926,identities,bindingDigest:d,runtimeDigest,approvalDigest,certified,scope:'ORIGINAL_HOST_RUNTIME_AT_OBSERVATION',observedAtMs:runtime.payload.issuedAtMs,continuousHealthCertified:false,sevenSourceConnected:false,authorizesAction:false};
}
