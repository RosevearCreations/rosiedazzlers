import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {plannedWindow716} from '../assets/quote-followup-availability-v716.mjs';
import {shiftRosterDecision717,shiftRosterUnconfigured717,SHIFT_ROSTER_LIMIT717} from
  '../assets/quote-followup-roster-v717.mjs';
import {signerCustodyAudit717} from '../assets/quote-followup-custody-v717.mjs';
import {acceptedDeviceReceipt717,crossDeviceReceipt717} from '../assets/quote-owner-crossdevice-v717.mjs';
import {onRequestGet} from '../functions/api/admin/quote_followup_rebalance.js';

const id='4211709f-4ca2-4cbd-9f27-c8f4c6bf4d94',now=new Date(),
  planned=new Date(now.getTime()+86400000).toISOString(),window=plannedWindow716(planned,now);
const approved=(start,end,shiftId='approved-shift-1')=>({id:shiftId,staff_user_id:id,
  start_at:new Date(start).toISOString(),end_at:new Date(end).toISOString(),
  status:'approved',approved_by:'actual-roster-manager'});
const start=Date.parse(planned);
const payload={complete:true,source_revision:'real-provider-revision-10',generated_at:now.toISOString(),
  shifts:[approved(start-3600000,start+3600000)]};
const verified=shiftRosterDecision717(payload,id,window,now);
assert.equal(verified.shift_schedule_verified,true);
assert.equal(verified.hard_hold,false);
assert.deepEqual(verified.verified_shift_ids,['approved-shift-1']);
assert.equal(shiftRosterDecision717({...payload,complete:false},id,window,now).hard_hold,true);
assert.equal(shiftRosterDecision717({...payload,generated_at:new Date(now.getTime()-13*3600000).toISOString()},id,window,now).hard_hold,true);
assert.equal(shiftRosterDecision717({...payload,shifts:[approved(start-600000,start+600000)]},id,window,now).hard_hold,true);
assert.equal(shiftRosterDecision717({...payload,shifts:[{...payload.shifts[0],status:'draft'}]},id,window,now).hard_hold,true);
assert.equal(shiftRosterDecision717({...payload,shifts:[{...payload.shifts[0],staff_user_id:'different'}]},id,window,now).hard_hold,true);
assert.equal(shiftRosterDecision717({...payload,shifts:Array.from({length:SHIFT_ROSTER_LIMIT717},()=>payload.shifts[0])},id,window,now).hard_hold,true);
assert.equal(shiftRosterDecision717({...payload,shifts:[approved(start,start+1800000,'first'),approved(start+1800000,start+3600000,'second')]},id,window,now).shift_schedule_verified,true);
assert.equal(shiftRosterUnconfigured717(id,window).shift_schedule_verified,false);
assert.equal(shiftRosterUnconfigured717(id,window).requires_manual_shift_acknowledgement,true);

assert.equal((await signerCustodyAudit717({})).status,'unconfigured');
const keys=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const jwk=await webcrypto.subtle.exportKey('jwk',keys.privateKey);
const env={ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK:JSON.stringify(jwk),
  ROSIE_FOLLOWUP_EXPORT_SIGNER_ID:'test-export-owner'};
const audit=await signerCustodyAudit717(env,webcrypto);
assert.equal(audit.server_signature_test_passed,true);
assert.equal(audit.signing_available,true);
assert.match(audit.public_key_sha256,/^[0-9a-f]{64}$/);
assert.equal(audit.independent_custodian_verified,false);
assert.equal(audit.proof_b_authorized,false);
assert.equal(JSON.stringify(audit).includes(jwk.d),false);
assert.equal((await signerCustodyAudit717({...env,ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK:'broken'},webcrypto)).signing_available,false);

const base={app:'Rosie Dazzlers',build:716,receipt_kind:'owner_self_attested_local_visual_review',
  feedback_disposition:'accepted',server_acceptance_recorded:false,owner_name:'Owner',
  device_findings_note:'Actually observed on this device',generated_at:now.toISOString(),
  checked:Object.fromEntries(['acceptDesktop714','acceptMobile714','acceptRoles714','acceptEvidence714','acceptNoSend714'].map(k=>[k,true]))};
assert.ok(acceptedDeviceReceipt717(base,'desktop'));
assert.equal(acceptedDeviceReceipt717({...base,checked:{...base.checked,acceptMobile714:false}},'mobile'),null);
const original={build:716,generated_at:new Date(now.getTime()-86400000).toISOString()};
const desktop={receipt:base,hash:'a'.repeat(64)},mobile={receipt:{...base,device_findings_note:'Real phone readback'},hash:'b'.repeat(64)};
const review=crossDeviceReceipt717('c'.repeat(64),original,desktop,mobile,
  'Desktop and mobile screens were independently retested after the visual repair.',now);
assert.ok(review);
assert.equal(review.source_receipts.length,2);
assert.equal(review.devices_technically_verified_by_server,false);
assert.equal(review.server_acceptance_recorded,false);
assert.equal(crossDeviceReceipt717('c'.repeat(64),original,desktop,desktop,'Different devices are required.',now),null);
assert.equal(crossDeviceReceipt717('c'.repeat(64),original,desktop,
  {...mobile,receipt:{...mobile.receipt,owner_name:'Different Owner'}},
  'Actual testing completed on separate devices.',now),null);

const apiEnv={SUPABASE_URL:'https://db.example.test',SUPABASE_SERVICE_ROLE_KEY:'secret-server-only',
  ADMIN_PASSWORD:'test-only',ALLOW_LEGACY_ADMIN_FALLBACK:'true',
  ROSIE_STAFF_SHIFT_ROSTER_URL:'https://roster.example.test/approved-shifts',
  ROSIE_STAFF_SHIFT_ROSTER_BEARER:'private-roster-secret'};
const originalFetch=globalThis.fetch;
let availabilitySourceFailure=false,rosterSourceFailure=false,seenBearer=false;
globalThis.fetch=async input=>{
  const u=new URL(String(input));
  if(u.pathname.endsWith('/staff_users'))return Response.json([{id,role_code:'detailer',is_active:true,can_manage_bookings:true}]);
  if(u.pathname.endsWith('/staff_availability_blocks'))return availabilitySourceFailure?
    new Response('failed',{status:503}):Response.json([]);
  if(u.hostname==='roster.example.test'){
    seenBearer=true;
    if(rosterSourceFailure)return new Response('failed',{status:503});
    assert.equal(u.searchParams.get('staff_user_id'),id);
    return Response.json(payload);
  }
  throw Error(`Unexpected URL: ${u}`);
};
try{
  const url='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance?staff_user_id='+id+
    '&planned_followup_at='+encodeURIComponent(planned);
  const unauthorized=await onRequestGet({request:new Request(url),env:apiEnv});
  assert.equal(unauthorized.status,401);
  let response=await onRequestGet({request:new Request(url,{headers:{'x-admin-password':'test-only'}}),env:apiEnv});
  assert.equal(response.status,200);
  assert.equal((await response.json()).shift_roster.shift_schedule_verified,true);
  assert.equal(seenBearer,true);
  rosterSourceFailure=true;
  response=await onRequestGet({request:new Request(url,{headers:{'x-admin-password':'test-only'}}),env:apiEnv});
  assert.equal(response.status,503);
  rosterSourceFailure=false;availabilitySourceFailure=true;
  response=await onRequestGet({request:new Request(url,{headers:{'x-admin-password':'test-only'}}),env:apiEnv});
  assert.equal(response.status,503);
  availabilitySourceFailure=false;
  const unconfigured={...apiEnv};delete unconfigured.ROSIE_STAFF_SHIFT_ROSTER_URL;
  response=await onRequestGet({request:new Request(url,{headers:{'x-admin-password':'test-only'}}),env:unconfigured});
  assert.equal((await response.json()).shift_roster.requires_manual_shift_acknowledgement,true);
  response=await onRequestGet({request:new Request('https://rosiedazzlers.ca/api/admin/quote_followup_rebalance?audit=signer',
    {headers:{'x-admin-password':'test-only'}}),env:apiEnv});
  assert.equal((await response.json()).audit.proof_b_authorized,false);
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..'),read=path=>readFileSync(resolve(root,path),'utf8');
const html=read('admin-followup-workload.html'),js=read('assets/admin-followup-workload-v713.js'),
  api=read('functions/api/admin/quote_followup_rebalance.js');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['shiftRosterStatus717','unverifiedShift717','signerCustodyAudit717',
  'deviceDesktop717','deviceMobile717','crossDeviceNote717','crossDeviceExport717'])
  assert.match(html,new RegExp(`id="${id}"`));
assert.match(js,/crossDeviceReceipt717/);
assert.match(api,/shiftRosterRead717\(env,target.id,availability.window\)/);
assert.match(api,/acknowledge_unverified_shift/);
assert.match(read('assets/admin-followup-workload-v717.css'),/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build717_shift_roster_custody_crossdevice_test\.mjs/);
console.log('Build 717 PASS: authenticated fresh roster check, missing-source acknowledgement, actual server key self-test, distinct linked local cross-device receipts');
