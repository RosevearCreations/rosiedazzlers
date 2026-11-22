import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {APPS918,canonical918,verify918,project918} from '../assets/build918-signed-mesh-contract.mjs';
import {readFileSync} from 'node:fs';
assert.deepEqual(APPS918,['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub','icamp','yw','devilndove','rosiedazzlers']);
const pub=generateKeyPairSync('ed25519');const publicKeySpkiBase64=pub.publicKey.export({format:'der',type:'spki'}).toString('base64');
const digest=await crypto.subtle.digest('SHA-256',Buffer.from(publicKeySpkiBase64,'base64'));
const fingerprintSha256=Buffer.from(digest).toString('hex');
const pin={publicKeySpkiBase64,fingerprintSha256,expectedCommit:'b'.repeat(40)};
const nowMs=1800000000000,challenge='c'.repeat(64);
const payload={schema:'rosevear.sysop.statistics.v1',protocolVersion:'1.2',appId:'rosiedazzlers',sourceCommit:'b'.repeat(40),eventId:'event_abcdefghijklmnop',nonce:'d'.repeat(32),issuedAtMs:nowMs,expiresAtMs:nowMs+60000,
 state:'UNKNOWN',metricsWindowSeconds:60,
 metrics:{requests:null,serverErrors:null,jobsCompleted:null,jobsFailed:null,queueDepth:null,latencyP95Ms:null,activeSessions:null},
 sysop:{eventKind:'HEARTBEAT',observedAtMs:nowMs,processUptimeSec:null,restartCount:null,lastRestartAtMs:null,bootTimeMs:null,rebootIsIndependentlyWitnessed:false},
 dataClass:'NON_SENSITIVE_AGGREGATE',tenantId:null,authorizesAction:false,challenge};
const envelope=p=>({payload:p,signature:sign(null,Buffer.from(canonical918(p)),pub.privateKey).toString('hex')});
const verified=await verify918({envelope:envelope(payload),pin,challenge,nowMs});
assert.equal(verified.sourceSignatureVerified,true);
assert.equal(verified.originalHostRecoveryVerified,false);
const corrupt=(data,expected='INVALID')=>assert.rejects(verify918(data),/INVALID|MISMATCH|SCOPE|MISSING/);
await corrupt({envelope:envelope({...payload,tenantId:'customer'}),pin,challenge,nowMs});
await corrupt({envelope:envelope({...payload,sourceCommit:'f'.repeat(40)}),pin,challenge,nowMs});
await corrupt({envelope:envelope({...payload,challenge:'e'.repeat(64)}),pin,challenge,nowMs});
await corrupt({envelope:envelope({...payload,sysop:{...payload.sysop,bootTimeMs:nowMs-30000}}),pin,challenge,nowMs});
await corrupt({envelope:envelope(payload),pin,challenge,nowMs:nowMs+200000});
await corrupt({envelope:{...envelope(payload),signature:'f'.repeat(128)},pin,challenge,nowMs});
const t=project918([{app_id:'rosiedazzlers',created_at:new Date(nowMs).toISOString(),source_state:'UNKNOWN',source_commit:'b'.repeat(40)}],[],nowMs);
assert.equal(t.sources.length,7);
assert.equal(t.sevenAppConnected,false);
assert.equal(t.connectedToAIDP,false);
assert.equal(t.originalHost.recoveryAccepted,false);
assert.equal(t.signedSourceCount,0);
const sql=readFileSync('sql/2026-11-22_build918_seven_source_signed_health.sql','utf8');
for(const key of ['unique(app_id,event_id)','unique(app_id,nonce)','for update','enable row level security','grant select,insert','HOST_BOOT_OBSERVED','SECOND_STAFF_REPORTED_UNVERIFIED'])assert.ok(sql.includes(key),key);
console.log('Rosie 918 seven-app pinned signatures, protocol freshness, privacy, original host & replay HOLD PASS');
