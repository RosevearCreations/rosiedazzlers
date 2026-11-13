import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {generateKeyPairSync,sign} from 'node:crypto';
import {assessRoadsideOperational881,validateAnchorPublic881,
 verifyAnchorCandidate881} from '../functions/api/_lib/roadside-operational-v881.js';
import {safeReport881} from './build881_native_drift_alert_runner.mjs';
import {keyId881,anchorComment881,parseAnchorComment881,verifyAnchor881}
 from './build881_independent_anchor_runner.mjs';
const read=p=>readFileSync(p,'utf8');
const paths=['functions/api/_lib/roadside-operational-v881.js',
'functions/api/_lib/roadside-watch-source-v881.js',
'functions/api/roadside_operational_watch_v881.js',
'functions/api/roadside_anchor_candidates_v881.js',
'functions/api/admin/roadside_operational_watch_v881.js',
'scripts/build881_owner_issue_client.mjs',
'scripts/build881_native_drift_alert_runner.mjs',
'scripts/build881_independent_anchor_runner.mjs',
'assets/admin-booking-v881.js'];
for(const path of paths)execFileSync('node',['--check',path],{stdio:'pipe'});
const t=Date.now(),iso=x=>new Date(x).toISOString(),sha=x=>String(x).repeat(64);
const roster={ok:true,rows:[{status:'active',issuer_id:'next'},
{status:'previous',issuer_id:'old',verify_until:iso(t+8*86400000)}]};
const base=assessRoadsideOperational881({nativeRows:[],rotationRows:[],roster,nowMs:t});
assert.equal(base.severity,'REVIEW');
assert.equal(base.alert,true);
assert.equal(base.no_original_native_history,true);
assert.equal(base.no_original_rotation_receipts,true);
assert.equal(base.no_customer_identifiers,true);
const draft='00000000-0000-4000-8000-000000000881';
const first={draft_id:draft,observed_at:iso(t-3600000),source_chain_sha256:sha('a'),
entry_sha256:sha('b'),previous_entry_sha256:null,latest_signed_event_at:iso(t-3600000)};
const latest={...first,observed_at:iso(t-1000),source_chain_sha256:sha('c'),
entry_sha256:sha('d'),previous_entry_sha256:sha('b')};
const receipt={draft_id:draft,observed_at:iso(t-1000),receipt_sha256:sha('e'),
previous_receipt_sha256:null,grace_verify_until:iso(t+8*86400000),
previous_issuer_key_id:'old',active_issuer_key_id:'next'};
const healthy=assessRoadsideOperational881({nativeRows:[first],rotationRows:[receipt],roster,nowMs:t});
assert.equal(healthy.severity,'NONE');
assert.equal(healthy.alert,false);
assert.equal(healthy.original_provider_current_delivery_not_inferred,true);
const changed=assessRoadsideOperational881({nativeRows:[latest,first],rotationRows:[receipt],roster,nowMs:t});
assert.equal(changed.native_source_changes_review,1);
assert.equal(changed.severity,'HIGH');
const broken=assessRoadsideOperational881({nativeRows:[{...latest,previous_entry_sha256:sha('f')},first],
 rotationRows:[receipt],roster,nowMs:t});
assert.equal(broken.severity,'CRITICAL');
const expiry=assessRoadsideOperational881({nativeRows:[first],
 rotationRows:[{...receipt,grace_verify_until:iso(t+3600000)}],
 roster:{...roster,rows:[roster.rows[0],{...roster.rows[1],verify_until:iso(t+3600000)}]},nowMs:t});
assert.equal(expiry.grace_expiring_72_hours,1);
assert.equal(expiry.severity,'HIGH');
const expired=assessRoadsideOperational881({nativeRows:[first],
 rotationRows:[{...receipt,grace_verify_until:iso(t-3600000)}],
 roster:{...roster,rows:[roster.rows[0],{...roster.rows[1],verify_until:iso(t-3600000)}]},nowMs:t});
assert.equal(expired.severity,'CRITICAL');
assert.equal(assessRoadsideOperational881({nativeRows:[first],rotationRows:[receipt],
 roster,nowMs:t,nativeTruncated:true}).severity,'HIGH');
assert.equal(assessRoadsideOperational881({nativeRows:[{...first,entry_sha256:'bad'}],rotationRows:[],roster}).ok,false);
assert.equal(safeReport881(base).severity,'REVIEW');
assert.throws(()=>safeReport881({...base,no_customer_identifiers:false}));
const {publicKey,privateKey}=generateKeyPairSync('ed25519');
const jwk=publicKey.export({format:'jwk'});
const distinct={ok:true,rows:[{public_jwk:{...jwk,x:'A'.repeat(43)}}]};
assert.equal(validateAnchorPublic881(jwk,distinct),true);
assert.equal(validateAnchorPublic881(jwk,{ok:true,rows:[{public_jwk:jwk}]}),false);
assert.equal(verifyAnchorCandidate881(receipt),true);
assert.equal(verifyAnchorCandidate881({...receipt,receipt_sha256:'bad'}),false);
const payload={schema:'rosie881-independent-rotation-receipt-anchor-v1',
 receipt_sha256:sha('f'),anchor_public_key_id:keyId881(jwk),
 anchored_at:iso(t)};
const signature=sign(null,Buffer.from(JSON.stringify(payload)),privateKey).toString('base64url');
const comment=anchorComment881(payload,signature);
assert.equal(verifyAnchor881(parseAnchorComment881(comment),jwk),true);
assert.equal(verifyAnchor881({...parseAnchorComment881(comment),
 payload:{...payload,receipt_sha256:sha('a')}},jwk),false);
assert.equal(verifyAnchor881(parseAnchorComment881(comment),{...jwk,x:'A'.repeat(43)}),false);
assert.equal(parseAnchorComment881(comment.replace('<!-- rosie881-rotation-anchor:','<!-- tampered:')),null);
const a=read('admin-booking.html');
assert.equal(a,read('admin-booking/index.html'));
for(const marker of ['rd881Review','rd881OwnerStatus','/assets/admin-booking-v881.js'])
 assert(a.includes(marker),'Missing Build 881 owner UI: '+marker);
const protectedGate=read('.github/workflows/rosie881-protected-source.yml');
const scheduled=read('.github/workflows/rosie881-scheduled-watch.yml');
const external=read('.github/workflows/rosie881-independent-anchor.yml');
for(const w of [scheduled,external]){
 assert(w.includes('schedule:')&&w.includes('workflow_dispatch:'));
 assert(w.includes('issues: write')&&w.includes('github.repository'));
 assert(!w.includes('pull_request:'));
}
assert(scheduled.includes('ROSIE881_OWNER_WATCH_JOB_SECRET'));
assert(external.includes('ROSIE881_EXTERNAL_ANCHOR_PRIVATE_JWK'));
assert(protectedGate.includes('scripts/build881_scheduled_anchor_grace_test.mjs'));
const watch=read('functions/api/roadside_operational_watch_v881.js');
const candidates=read('functions/api/roadside_anchor_candidates_v881.js');
const admin=read('functions/api/admin/roadside_operational_watch_v881.js');
assert(watch.includes('signedJob881')&&candidates.includes('signedJob881'));
assert(candidates.includes('validateAnchorPublic881'));
assert(admin.includes('allowLegacyAdminFallback:false'));
assert(!watch.includes('createStripeCheckoutSession')&&!candidates.includes('writeSecret'));
console.log('Rosie 881 scheduled native drift, explicit empty-data HOLD, signed independent external anchor and owner expiry regression: PASS');
