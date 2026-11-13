import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {reviewDelivery879,reviewRenewal879,checkRotation879}
 from '../functions/api/_lib/roadside-watch-rotation-v879.js';
const read=p=>readFileSync(p,'utf8');
const paths=[
 'functions/api/_lib/roadside-watch-rotation-v879.js',
 'functions/api/admin/roadside_stability_watch_v879.js',
 'functions/api/admin/roadside_rotation_execution_v879.js',
 'assets/admin-booking-v879.js'
];
for(const p of paths)execFileSync('node',['--check',p],{stdio:'pipe'});
const t=Date.now(),when=new Date(t-60000).toISOString();
const good={ok:true,delivery_corroborated:true,original_dispatch_record_verified:true,
 original_owner_draft_scope_verified:true,original_evidence_missing_is_hold:false,
 original_native_event_chain_sha256:'a'.repeat(64),latest_signed_event_at:when};
assert.equal(reviewDelivery879(good,t).state,'ORIGINAL_DELIVERY_CURRENT_SNAPSHOT');
assert.equal(reviewDelivery879({...good,delivery_corroborated:false},t).state,'HOLD');
assert.equal(reviewDelivery879({...good,original_native_event_chain_sha256:'bad'},t).state,'HOLD');
assert.equal(reviewDelivery879({...good,latest_signed_event_at:new Date(t+600000).toISOString()},t).state,'HOLD');
assert.equal(reviewDelivery879({...good,latest_signed_event_at:new Date(t-31*86400000).toISOString()},t).state,
 'ORIGINAL_DELIVERY_AGED_REVIEW');
const ack={ok:true,source_check_id:'00000000-0000-4000-8000-000000000879',
 severity:'HIGH',original_sla_state:'SLA_BREACHED',original_cases_missing:false,
 cases:[{state:'OWNER_ACK_REQUIRED'}]};
assert.equal(reviewRenewal879(ack).state,'OWNER_SLA_RENEWAL_REQUIRED');
assert.equal(reviewRenewal879({...ack,cases:[{state:'OWNER_ACKNOWLEDGED'}]}).state,
 'CURRENT_SOURCE_ACKNOWLEDGED');
assert.equal(reviewRenewal879({...ack,cases:[]}).state,'OWNER_SLA_RENEWAL_HOLD');
assert.equal(reviewRenewal879({...ack,cases:[{state:'ACK_SOURCE_HOLD'}]}).state,
 'OWNER_SLA_RENEWAL_HOLD');
const old='ed25519-sha256:old',active='ed25519-sha256:new';
const roster={ok:true,rows:[{status:'active',issuer_id:active},{status:'previous',
 issuer_id:old,verify_until:new Date(t+3600000).toISOString()}]};
const proof={ok:true,key_status:'previous',issuer_key_id:old,
 rotation_readiness:'PREVIOUS_PIN_WITHIN_GRACE'};
const vars={roster,verifiedPrevious:proof,priorKeyId:old,newKeyId:active,nowMs:t};
assert.equal(checkRotation879(vars).state,'POST_ROTATION_OPERATOR_PIN_CONFIRMED');
assert.equal(checkRotation879({...vars,newKeyId:old}).state,'HOLD');
assert.equal(checkRotation879({...vars,verifiedPrevious:{...proof,key_status:'active'}}).state,'HOLD');
assert.equal(checkRotation879({...vars,roster:{...roster,rows:roster.rows.map(k=>k.status==='previous'?
 {...k,verify_until:new Date(t-1000).toISOString()}:k)}}).state,'HOLD');
assert.equal(checkRotation879({...vars,roster:{ok:true,rows:[roster.rows[0]]}}).state,'HOLD');
const html=read('admin-booking.html');
assert.equal(html,read('admin-booking/index.html'));
for(const id of ['rd879Watch','rd879WatchResult','rd879AckResult','rd879Rotation',
 'rd879RotationResult','rd879OldKey','rd879NewKey','rd879OwnerNote',
 '/assets/admin-booking-v879.js'])assert(html.includes(id),'Missing owner UI '+id);
const watch=read('functions/api/admin/roadside_stability_watch_v879.js');
assert(watch.includes('allowLegacyAdminFallback:false'));
assert(watch.includes('roadside_native_delivery_v878.js'));
assert(watch.includes('roadside_sla_ack_v878.js'));
const gate=read('functions/api/admin/roadside_rotation_execution_v879.js');
assert(gate.includes('allowLegacyAdminFallback:false'));
assert(gate.includes("request.headers.get('Origin')"));
assert(gate.indexOf('verifyOriginal({')<gate.indexOf('pinnedIssuerRoster878('));
assert(!gate.includes('serviceHeaders('));
assert(!gate.includes('writeSecret('));
console.log('Rosie 879 native snapshot watch, SLA renewal and supervised post-rotation gate: PASS');
