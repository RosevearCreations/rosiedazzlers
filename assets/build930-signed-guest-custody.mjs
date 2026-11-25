// Build 930: independently pinned signed observations, never remote control or physical certification.
import {verify926,H40,H64,UUID} from './build926-runtime-certification.mjs';
import {digest925} from './build925-field-reconciliation.mjs';
export const roles930=['GUEST_WITNESS','LAUNCHER_INSPECTOR','CUSTODY_AUTHORITY'];
export const components930=['hub','caddy','ollama'];
const ports={hub:8765,caddy:8443,ollama:11434};
const receivers=['ai-data-platform','rosevear-comms-hub'];
const reasons=['VM_LAUNCH_HOLD','OLLAMA_PORT_OWNERSHIP_HOLD','OLLAMA_START_HOLD','HUB_RECOVERY_HOLD','GATEWAY_HOLD'];
const exact=(o,k)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===k.length&&k.every(x=>Object.hasOwn(o,x));
const need=(x,m)=>{if(!x)throw Error(m)};
const hash=x=>typeof x==='string'&&H64.test(x);
const ts=x=>Number.isSafeInteger(x)&&x>0;
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
export async function config930(c,excluded=[]){
 need(exact(c,['pins','hostId','guestIdentitySha256','expectedLaunchers','productionSha'])&&exact(c.pins,roles930)&&/^[A-Za-z0-9_-]{6,100}$/.test(c.hostId)&&hash(c.guestIdentitySha256)&&H40.test(c.productionSha||'')&&exact(c.expectedLaunchers,components930),'ORIGINAL_930_CONFIG_REQUIRED');
 const ids=new Set(),fps=new Set(excluded);
 for(const role of roles930){const p=c.pins[role];need(exact(p,['staffId','expectedCommit','fingerprintSha256','publicKeySpkiBase64'])&&UUID.test(p.staffId||'')&&H40.test(p.expectedCommit||'')&&hash(p.fingerprintSha256)&&typeof p.publicKeySpkiBase64==='string'&&p.publicKeySpkiBase64.length<=2048&&!ids.has(p.staffId)&&!fps.has(p.fingerprintSha256),'INDEPENDENT_930_PIN_REQUIRED');const der=Uint8Array.from(atob(p.publicKeySpkiBase64),x=>x.charCodeAt(0));need(hex(await crypto.subtle.digest('SHA-256',der))===p.fingerprintSha256,'PIN_FINGERPRINT_MISMATCH');await crypto.subtle.importKey('spki',der,{name:'Ed25519'},false,['verify']);ids.add(p.staffId);fps.add(p.fingerprintSha256)}
 for(const id of components930){const p=c.expectedLaunchers[id];need(exact(p,['definitionSha256','launcherSha256','binarySha256','port'])&&[p.definitionSha256,p.launcherSha256,p.binarySha256].every(hash)&&p.port===ports[id],'LAUNCHER_PIN_REQUIRED')}
 return digest925(c);
}
export function receiverChain930(current,prior,now){
 need(Array.isArray(current)&&current.length===2&&current.every((x,i)=>exact(x,['receiverId','witnessId','ledgerReviewId','observedAtMs','signatureSha256','fingerprintSha256','sourceCommit','challengeNonce'])&&x.receiverId===receivers[i]&&UUID.test(x.witnessId)&&UUID.test(x.ledgerReviewId)&&ts(x.observedAtMs)&&x.observedAtMs<=now+2000&&now-x.observedAtMs<=300000&&[x.signatureSha256,x.fingerprintSha256,x.challengeNonce].every(hash)&&H40.test(x.sourceCommit))&&new Set(current.map(x=>x.challengeNonce)).size===2&&new Set(current.map(x=>x.fingerprintSha256)).size===2&&new Set(current.map(x=>x.witnessId)).size===2,'ORIGINAL_RECEIVER_PAIR_REQUIRED');
 if(!prior)return 'FRESH_PAIR_BASELINE_ONLY';
 if(!Array.isArray(prior)||prior.length!==2)return 'CONTINUITY_HOLD';
 return current.every((x,i)=>{const p=prior[i];return p&&x.receiverId===p.receiverId&&x.ledgerReviewId===p.ledgerReviewId&&x.fingerprintSha256===p.fingerprintSha256&&x.sourceCommit===p.sourceCommit&&x.witnessId!==p.witnessId&&x.challengeNonce!==p.challengeNonce&&x.signatureSha256!==p.signatureSha256&&x.observedAtMs>p.observedAtMs})?'NEW_WITNESSES_SAME_PINNED_LEDGER':'CONTINUITY_HOLD';
}
export async function evaluate930({binding,config,configDigest,guest,launcher,authority,prior=null,now=Date.now()}){
 need(exact(binding,['caseId','nonce','hostId','productionSha','configDigest','priorReceiptId','receivers'])&&UUID.test(binding.caseId||'')&&hash(binding.nonce)&&binding.hostId===config.hostId&&binding.productionSha===config.productionSha&&binding.configDigest===configDigest&&binding.priorReceiptId===(prior?.id??null),'CASE_BINDING_INVALID');
 const continuity=receiverChain930(binding.receivers,prior?.result?.receivers,now),d=await digest925(binding);
 const g=await verify926({envelope:guest,pin:config.pins.GUEST_WITNESS,role:'GUEST_WITNESS',bindingDigest:d,now});
 const l=await verify926({envelope:launcher,pin:config.pins.LAUNCHER_INSPECTOR,role:'LAUNCHER_INSPECTOR',bindingDigest:d,now});
 need(exact(g,['hostId','bootTimeMs','guestIdentitySha256','endpointEvidenceSha256','brokerEvidenceSha256','vmRunning','mqttCredentialHandshake','guestBrokerOwnership'])&&g.hostId===binding.hostId&&ts(g.bootTimeMs)&&g.bootTimeMs<=now&&[g.guestIdentitySha256,g.endpointEvidenceSha256,g.brokerEvidenceSha256].every(hash)&&typeof g.vmRunning==='boolean'&&typeof g.mqttCredentialHandshake==='boolean'&&typeof g.guestBrokerOwnership==='boolean','GUEST_EVIDENCE_SHAPE');
 need(exact(l,['hostId','bootTimeMs','observations','bootTask'])&&l.hostId===binding.hostId&&l.bootTimeMs===g.bootTimeMs&&Array.isArray(l.observations)&&l.observations.length===3,'LAUNCHER_EVIDENCE_SHAPE');
 const launchers=l.observations.map((o,i)=>{const component=components930[i],p=config.expectedLaunchers[component];need(exact(o,['component','definitionSha256','launcherSha256','binarySha256','port','pid','startedAtMs','launchReceiptSha256','processIdentityVerified','receiptCorrelated'])&&o.component===component&&[o.definitionSha256,o.launcherSha256,o.binarySha256,o.launchReceiptSha256].every(hash)&&ts(o.pid)&&ts(o.startedAtMs)&&o.startedAtMs>=l.bootTimeMs&&o.startedAtMs<=now&&typeof o.processIdentityVerified==='boolean'&&typeof o.receiptCorrelated==='boolean','LAUNCHER_OBSERVATION_INVALID');return {component,verified:Object.keys(p).every(k=>o[k]===p[k])&&o.processIdentityVerified&&o.receiptCorrelated}});
 const b=l.bootTask;
 need(exact(b,['result','runAtMs','logSha256','reasonCodes','logCorrelated','preLoginWitnessed'])&&[0,2].includes(b.result)&&ts(b.runAtMs)&&b.runAtMs>=l.bootTimeMs&&b.runAtMs<=now&&hash(b.logSha256)&&Array.isArray(b.reasonCodes)&&b.reasonCodes.length<=reasons.length&&new Set(b.reasonCodes).size===b.reasonCodes.length&&b.reasonCodes.every(x=>reasons.includes(x))&&typeof b.logCorrelated==='boolean'&&typeof b.preLoginWitnessed==='boolean'&&(b.result===0?b.reasonCodes.length===0:b.reasonCodes.length>0),'BOOT_EVIDENCE_INVALID');
 const guestVerified=g.guestIdentitySha256===config.guestIdentitySha256&&g.vmRunning&&g.mqttCredentialHandshake&&g.guestBrokerOwnership;
 const launcherVerified=launchers.every(x=>x.verified)&&new Set(l.observations.map(x=>x.launchReceiptSha256)).size===3;
 const previous=prior?.result?.boot;
 const bootHoldClosed=prior?.result?.approved===true&&prior?.result?.configDigest===configDigest&&previous?.result===2&&previous.logCorrelated===true&&previous.reasonCodes.length>0&&b.result===0&&b.logCorrelated&&b.preLoginWitnessed&&l.bootTimeMs>prior.result.bootTimeMs&&b.runAtMs>previous.runAtMs&&b.logSha256!==previous.logSha256&&guestVerified&&launcherVerified;
 const guestDigest=await digest925(guest),launcherDigest=await digest925(launcher),approvalBinding=await digest925({bindingDigest:d,guestDigest,launcherDigest});
 const a=await verify926({envelope:authority,pin:config.pins.CUSTODY_AUTHORITY,role:'CUSTODY_AUTHORITY',bindingDigest:approvalBinding,now});
 need(exact(a,['decision','scope'])&&['APPROVE','HOLD'].includes(a.decision)&&a.scope==='SIGNED_ORIGINAL_OBSERVATION_ONLY','INDEPENDENT_DECISION_REQUIRED');
 const approved=a.decision==='APPROVE';
 return {build:930,configDigest,bindingDigest:d,guestDigest,launcherDigest,authorityDigest:await digest925(authority),approved,guestSignedObservationAccepted:approved&&guestVerified,detachedLauncherSignedObservationAccepted:approved&&launcherVerified,launchers,bootTimeMs:l.bootTimeMs,boot:b,bootHoldClosed:approved&&bootHoldClosed===true,receivers:binding.receivers,receiverContinuity:continuity,fieldCertified:false,sevenSourceConnected:false,authorizesAction:false};
}
