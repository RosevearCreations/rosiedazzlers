import {verify926,H64,UUID} from './build926-runtime-certification.mjs';
import {roles930} from './build930-signed-guest-custody.mjs';
import {digest925} from './build925-field-reconciliation.mjs';
const need=(v,m)=>{if(!v)throw Error(m)};
const exact=(o,k)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===k.length&&k.every(x=>Object.hasOwn(o,x));
export function capture931(x,now=Date.now()){
 need(x?.mode==='ORIGINAL_931_UNSIGNED_CAPTURE'&&Number.isSafeInteger(x.observedAtMs)&&Number.isSafeInteger(x.bootTimeMs)&&x.bootTimeMs<=x.observedAtMs&&x.observedAtMs<=now+2000&&Array.isArray(x.launchers)&&x.launchers.length===3,'CAPTURE_INVALID');
 const fresh=now-x.observedAtMs<=300000;
 const components=['hub','caddy','ollama'],ports=[8765,8443,11434];
 const launchers=components.map((component,i)=>{const a=x.launchers.filter(r=>r?.component===component);need(a.length===1,'CAPTURE_COMPONENT_INVALID');const r=a[0];return {component,candidate:fresh&&r.port===ports[i]&&r.stableListener===true&&Number.isSafeInteger(r.pid)&&r.pid>0&&Number.isSafeInteger(r.startedAtMs)&&r.startedAtMs>=x.bootTimeMs&&r.startedAtMs<=x.observedAtMs&&H64.test(r.binarySha256||''),signedLaunchReceiptRequired:true}});
 return {fresh,guestIdentityCandidate:fresh&&x.guest?.vmRunning===true&&H64.test(x.guest.guestIdentitySha256||''),launchers,bootLogHashPresent:H64.test(x.bootLogSha256||''),mqttAuthenticationVerified:false,detachedCustodyVerified:false,fieldCertified:false,authorizesAction:false};
}
export async function verifyEnrollment931({binding,envelope,pin,actorId,configDigest,now=Date.now()}){
 need(exact(binding,['challengeId','nonce','role','staffId','fingerprint','configDigest'])&&UUID.test(binding.challengeId||'')&&H64.test(binding.nonce||'')&&roles930.includes(binding.role)&&binding.staffId===actorId&&actorId===pin?.staffId&&binding.fingerprint===pin.fingerprintSha256&&binding.configDigest===configDigest,'ENROLLMENT_BINDING_INVALID');
 const d=await digest925(binding),e=await verify926({envelope,pin,role:binding.role,bindingDigest:d,now});
 need(exact(e,['decision','scope'])&&e.decision==='ENROLL'&&e.scope==='KEY_POSSESSION_ONLY','ENROLLMENT_DECISION_REQUIRED');
 return {role:binding.role,staffId:actorId,fingerprint:pin.fingerprintSha256,configDigest,enrollmentDigest:await digest925(envelope),keyPossessionVerified:true,physicalIdentityVerified:false,authorizesAction:false};
}
export function enrollmentReady931(rows,config,configDigest){
 return roles930.map(role=>{const p=config.pins[role];const match=Array.isArray(rows)&&rows.some(r=>r.role===role&&r.staff_id===p.staffId&&r.fingerprint===p.fingerprintSha256&&r.config_digest===configDigest&&H64.test(r.enrollment_digest||''));return {role,enrolled:!!match}});
}
