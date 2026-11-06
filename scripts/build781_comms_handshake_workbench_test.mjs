import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {COMMS781_CONTRACT,COMMS781_PATHS,inspectCommsReadback781,
  buildUnsignedCommsHandoff781} from '../assets/ql781-comms-evidence.mjs';
import {connectionStatus781} from '../functions/api/_lib/ql781-comms-status.mjs';
import {onRequest as shellRequest} from '../functions/api/_lib/ql336-owned-shell.mjs';

const now=Date.parse('2026-11-07T12:00:00Z');
const repos={rosiedazzlers:['business','rosiedazzlers'],
  devilndove:['business','devilndove-site'],icamp:['business','iCamp'],
  yw:['business','yw'],'ai-data-platform':['support','ai-data-platform'],
  'rosevear-ai-hub':['support','rosevear-ai-hub']};
const peers=Object.entries(repos).map(([peerId,[kind,repository]])=>({peerId,kind,
  repository,connection:'DISCONNECTED / HOLD',sourceTestAuthorized:false,
  customerDataAllowed:false}));
const readback={schema:'rosevear.hub.ql341.private-peer-readback.v1',
  exportedAt:new Date(now).toISOString(),source:'PRIVATE_POSTGRES_OWNER_READBACK',
  peerCount:6,connectedCount:0,customerCommunications:0,deviceActions:0,
  authorizedExternalGets:0,heldDeviceReceiptCount:0,peers,
  witness:{state:'NOT_OBSERVED_NO_ORIGINAL_SIGNED_TEST_PACKET',verified:false,connected:false}};
const inspect=(value)=>inspectCommsReadback781(value,{now});
const ok=inspect(readback);
assert.equal(ok.ok,true);
assert.equal(ok.formatValid,true);
assert.equal(ok.connection,'DISCONNECTED / HOLD');
assert.equal(ok.originalIssuerIndependentlyVerified,false);
assert.equal(ok.authenticated,false);
assert.equal(ok.networkRequests,0);
assert.equal(ok.rosiePeerStatus,'DISCONNECTED / HOLD');
for(const altered of [
  {...readback,connectedCount:1},{...readback,authorizedExternalGets:1},
  {...readback,customerCommunications:1},{...readback,deviceActions:1},
  {...readback,peerCount:5},{...readback,peers:peers.slice(0,5)},
  {...readback,peers:[{...peers[0],sourceTestAuthorized:true},...peers.slice(1)]},
  {...readback,peers:[{...peers[0],repository:'untrusted'},...peers.slice(1)]},
  {...readback,peers:[{...peers[0],connection:'CONNECTED'},...peers.slice(1)]},
  {...readback,peers:[{...peers[0],privateToken:'secret'},...peers.slice(1)]},
  {...readback,serviceRoleKey:'secret'},
  {...readback,witness:{...readback.witness,verified:true}},
  {...readback,witness:{...readback.witness,connected:true}}
])assert.equal(inspect(altered).ok,false,'elevated/malformed QL341 readback denied');
const signedClaim=inspect({...readback,heldDeviceReceiptCount:1,
  witness:{state:'ORIGINAL_SIGNED_TEST_HEARTBEAT_AND_DB_RECEIPT_VERIFIED',
    verified:true,connected:false,receivedAt:new Date(now).toISOString(),freshness:'RECENT_TEST_ONLY'}});
assert.equal(signedClaim.ok,true);
assert.equal(signedClaim.authenticated,false);
assert.equal(signedClaim.connection,'DISCONNECTED / HOLD');
const handoff=buildUnsignedCommsHandoff781({sourceRevision:'a'.repeat(40),
  importedReadback:ok,now});
assert.equal(handoff.unsigned,true);
assert.equal(handoff.notAnAuthorization,true);
assert.equal(handoff.owner_test_approved,false);
assert.equal(handoff.source_test_approved,false);
assert.equal(handoff.receiver_activated,false);
assert.equal(handoff.connected,false);
assert.equal(handoff.networkRequests,0);
assert.equal(handoff.production_source_revision_reference,'a'.repeat(40));
assert.deepEqual(handoff.proposed_paths,COMMS781_PATHS);
assert.equal(handoff.proposed_max_window_minutes,15);
assert.equal(handoff.original_owner_test_authorization,'NOT_GIVEN');
assert.equal(buildUnsignedCommsHandoff781({sourceRevision:'invalid',now}).production_source_revision_reference,null);
const state=connectionStatus781({revision:'b'.repeat(40),now});
assert.equal(state.ok,true);
assert.equal(state.connection_state,'DISCONNECTED / HOLD');
assert.equal(state.actual_remote_handshakes,0);
assert.equal(state.network_requests_by_status_check,0);
assert.equal(state.eligible_to_start_test,false);
assert.equal(state.private_receiver_activation_allowed,false);
assert.equal(state.outstanding_gates.length,6);
assert.equal(COMMS781_CONTRACT,'rosevear.shell.nonproduction.v1');
for(const path of COMMS781_PATHS){
  const r=await shellRequest({request:new Request('https://preview.example'+path)});
  assert.equal(r.status,503);
  assert.equal((await r.json()).authenticated,false);
}
const health='https://preview.example'+COMMS781_PATHS[0];
assert.equal((await shellRequest({request:new Request(health,{method:'POST'})})).status,405);
assert.equal((await shellRequest({request:new Request(health,{headers:{'X-Rosevear-Child':'rosie-dazzlers'}})})).status,403);
const api=await import('../functions/api/admin/comms_hub_connection_status_v781.js');
const oldFetch=globalThis.fetch;let outbound=0;
try{
  globalThis.fetch=async()=>{outbound++;throw Error('Unexpected outbound network');};
  const denied=await api.onRequestGet({request:new Request('https://rosiedazzlers.ca/api/admin/comms_hub_connection_status_v781'),env:{}});
  assert.ok(denied.status>=400);
  for(const fn of [api.onRequestPost,api.onRequestPut,api.onRequestPatch,api.onRequestDelete])
    assert.equal((await fn()).status,405);
  assert.equal(outbound,0);
}finally{globalThis.fetch=oldFetch;}
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
assert.equal(read('admin-integrations.html'),read('admin-integrations/index.html'));
assert.equal(read('admin-catalog.html'),read('admin-catalog/index.html'));
assert.match(read('admin-integrations.html'),/admin-comms-hub-v781.html/);
assert.match(read('admin-catalog.html'),/admin-comms-hub-v781.html/);
assert.match(read('admin-comms-hub-v781.html'),/signed nonproduction handshake evidence/i);
assert.match(read('assets/ql781-comms-workbench.js'),/\/api\/admin\/comms_hub_connection_status_v781/);
assert.doesNotMatch(read('assets/ql781-comms-workbench.js'),/fetch\([^)]*comms-hub\.com/);
assert.equal(existsSync(new URL('../docs/integration/ql246-source-proof.json',import.meta.url)),false,
  'original signed source proof B remains unissued; never fabricate it');
console.log('Build 781 Comms workbench PASS: QL341 local six-peer readback denial, unsigned handoff, source 503 HOLD, original proof missing and zero remote effects.');
