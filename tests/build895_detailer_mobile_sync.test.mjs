import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {actionSnapshot895,actionStillCurrent895,actionRecoveryMessage895} from '../assets/detailer-action-guard-v895.mjs';
import {inspectRosiePeer895} from '../assets/rosie-sync-compat-v895.mjs';

const job={id:'00112233-4455-4677-8899-aabbccddeeff',updated_at:'2026-11-15T10:02:03Z'};
const snap=actionSnapshot895(job,'arrive','dispatched',4);
const current=(j=job,stage='dispatched',epoch=4,verified=true,allowed=true)=>
 actionStillCurrent895(snap,j,stage,epoch,{verified,allowed});

test('action snapshot stays immutable across delayed geolocation and job selection',()=>{
  assert.ok(Object.isFrozen(snap));
  assert.equal(current(),true);
  assert.equal(current({...job,id:'11112233-4455-4677-8899-aabbccddeeff'}),false,'cannot apply an earlier job action to a newly selected job');
  assert.equal(current({...job,updated_at:'2026-11-15T10:02:04Z'}),false,'stale server revision');
  assert.equal(current(job,'arrived'),false,'stale workflow stage');
  assert.equal(current(job,'dispatched',5),false,'manual refresh/offline epoch changed');
  assert.equal(current(job,'dispatched',4,false),false,'disconnected is always denied');
  assert.equal(current(job,'dispatched',4,true,false),false,'stage capability revoked');
  assert.equal(actionSnapshot895({...job,updated_at:''},'arrive','dispatched',1),null);
  assert.equal(actionSnapshot895(job,'','dispatched',1),null);
  assert.equal(actionSnapshot895(job,'arrive','dispatched',-1),null);
});
test('uncertain outcomes require staff review rather than automatic replay',()=>{
  assert.match(actionRecoveryMessage895({assignmentGone:true}),/no longer assigned/);
  assert.match(actionRecoveryMessage895({stageChanged:true}),/stage changed/i);
  assert.match(actionRecoveryMessage895({revisionChanged:true}),/record changed/);
  assert.match(actionRecoveryMessage895(),/may have succeeded/);
  const app=readFileSync(new URL('../apps/detailer/detailer-app.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../app/detailer/index.html',import.meta.url),'utf8');
  assert.match(app,/actionBusy895=true;updateActionButtons\(\)/);
  assert.match(app,/if\(actionBusy895\)/);
  assert.match(app,/if\(pendingOutcome895\)/);
  assert.match(app,/continuityEpoch\+\+;[\s\S]*?setWorkspaceBusy/ .source ? /continuityEpoch\+\+/.source : /continuityEpoch\+\+/); // keep the explicit epoch guard below
  assert.match(app,/const isCurrent=\(\)=>mobile895\.actionStillCurrent895/);
  assert.ok(app.indexOf('if(!isCurrent()){') < app.indexOf("api.requestJson('/api/detailer/job_action'"),'must revalidate before POST');
  assert.match(app,/pendingOutcome895=\{snapshot,reconciled:false\}/);
  assert.match(app,/pendingOutcome895\.reconciled=true/);
  assert.match(app,/action895Acknowledge/);
  assert.match(app,/mobile895=await import\('\/assets\/detailer-action-guard-v895\.mjs/);
  assert.match(html,/id="action895RecoveryStatus"/);
  assert.match(html,/id="action895Acknowledge"[^>]*disabled/);
  assert.doesNotMatch(app,/localStorage|indexedDB|SyncManager|setInterval\s*\(/i);
  assert.doesNotMatch(html,/data-build895="automatic-offline-replay"/);
});
test('Rosie local protocol 1.1 is additive, 1.0-compatible and denies unknown capabilities',()=>{
  const contract=JSON.parse(readFileSync(new URL('../.github/rosevear-master-communications.v1.json',import.meta.url),'utf8'));
  const r=contract.releaseCoordination;
  assert.equal(contract.appId,'rosiedazzlers');
  assert.equal(contract.state,'CONTRACT_READY');
  assert.equal(contract.peerRuntimeVerification,'UNVERIFIED');
  assert.equal(r.protocolVersion,'1.1');
  assert.equal(r.compatibleWithExistingProtocol,'1.0');
  assert.equal(r.lockstepReleaseRequired,false);
  assert.equal(r.applicationLocalChangesMayReleaseIndependently,true);
  assert.equal(r.unavailablePeerBlocksOnlyDependentCrossAppCapability,true);
  assert.equal(r.unrelatedLocalOperationsContinue,true);
  assert.equal(r.unknownCapabilitiesFailClosed,true);
  assert.equal(r.rawSecretSynchronization,false);
  assert.equal(r.directPeerDatabaseSynchronization,false);
  for(const minor of [0,1]){
    const result=inspectRosiePeer895({protocol:{major:1,minor},capabilities:['HEALTH_EVIDENCE']},'HEALTH_EVIDENCE');
    assert.equal(result.contractCompatible,true);
    assert.equal(result.negotiatedVersion,minor===0?'1.0':'1.1');
    assert.equal(result.remoteExecutionAuthorized,false,'contract is not runtime authentication');
  }
  for(const result of [
    inspectRosiePeer895(null,'HEALTH_EVIDENCE'),
    inspectRosiePeer895({protocol:{major:2,minor:0},capabilities:['HEALTH_EVIDENCE']},'HEALTH_EVIDENCE'),
    inspectRosiePeer895({protocol:{major:1,minor:1},capabilities:[]},'HEALTH_EVIDENCE'),
    inspectRosiePeer895({protocol:{major:1,minor:1},capabilities:['OWNER_GATED_COMMAND']},'OWNER_GATED_COMMAND')
  ]){
    assert.equal(result.contractCompatible,false);
    assert.equal(result.localOperationsContinue,true);
    assert.equal(result.remoteExecutionAuthorized,false);
  }
});
