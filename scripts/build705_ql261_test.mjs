import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {onRequest} from '../functions/api/_lib/rosevear-integration-v1.js';
import {BOOKING_CONVERSION_CHECKS705,bookingConversionReadiness705} from '../assets/quote-followup-v704.mjs';
import {sanitizedRosieOwnerPacket261,parseOwnerProgressCli261,QL258_FIELDS}
  from './ql261_rosie_owner_packet.mjs';

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const packet=sanitizedRosieOwnerPacket261();
const published=JSON.parse(read('docs/integration/ql261-rosie-owner-return.json'));
assert.deepEqual(packet,published,'Committed packet must be exactly generated, not a template');
assert.deepEqual(Object.keys(packet.ownerReportedUnverifiedProgress),QL258_FIELDS);
assert.equal(packet.ownerReportedUnverifiedProgress.tenantIsolation,'NOT_APPLICABLE');
assert.ok(QL258_FIELDS.filter(field=>field!=='tenantIsolation').every(
  field=>packet.ownerReportedUnverifiedProgress[field]==='NOT_REPORTED'));
assert.equal(packet.connection,'DISCONNECTED');
assert.equal(packet.ownerTestAuthorization,'NOT_GIVEN');
assert.equal(packet.authenticatedGatewayGets,0);
assert.equal(packet.livePilotHolds,12);
assert.equal(packet.independentCustodyAuthenticated,false);
assert.equal(packet.sourceProofAccepted,false);
assert.equal(packet.publicGitHubSnapshot.httpStatusAtObservedSha,404);
assert.equal(existsSync(resolve(root,'docs/integration/ql246-source-proof.json')),false,
  'Never substitute an unsigned original proof placeholder for real source evidence');
assert.throws(()=>sanitizedRosieOwnerPacket261({custodianName:'Never allowed'}));
assert.throws(()=>sanitizedRosieOwnerPacket261({privateCustodian:'APPROVED'}));
assert.throws(()=>sanitizedRosieOwnerPacket261({privateHost:'https://private-host.example.test'}));
assert.throws(()=>sanitizedRosieOwnerPacket261({tenantIsolation:'NOT_REPORTED'}));
assert.deepEqual(parseOwnerProgressCli261(['--step','privateCustodian=OWNER_REPORTS_IN_PROGRESS']),
  {privateCustodian:'OWNER_REPORTS_IN_PROGRESS'});
assert.throws(()=>parseOwnerProgressCli261(['--step','privateCustodian=OWNER_REPORTS_DONE_NOT_VERIFIED',
  '--step','privateCustodian=NOT_REPORTED']));
assert.equal(sanitizedRosieOwnerPacket261({
  privateCustodian:'OWNER_REPORTS_DONE_NOT_VERIFIED'
}).independentCustodyAuthenticated,false,'Self-report never elevates trust');
assert.doesNotMatch(JSON.stringify(packet),/secret|password|access_token|@|private_key/i);

const quote={id:'sample-record',status:'accepted',accepted_amount_cents:30000};
const complete=Object.fromEntries(BOOKING_CONVERSION_CHECKS705.map(key=>[key,true]));
assert.equal(bookingConversionReadiness705(quote,complete).ready,true);
assert.equal(bookingConversionReadiness705(quote,{...complete,capacity:false}).ready,false);
assert.equal(bookingConversionReadiness705({...quote,status:'requested'},complete).ready,false);
assert.equal(bookingConversionReadiness705({...quote,booking_id:'real-booking'},complete).ready,false);
assert.equal(bookingConversionReadiness705({...quote,accepted_amount_cents:0},complete).ready,false);
assert.equal(read('admin-quotes.html'),read('admin-quotes/index.html'));
for(const key of BOOKING_CONVERSION_CHECKS705)
  assert.match(read('admin-quotes.html'),new RegExp('id="qBookingCheck705_'+key+'"'));
assert.match(read('assets/admin-quotes-v298.js'),/bookingConversionReadiness705/);
assert.match(read('admin-gift-recovery-review.html'),/Gift testing paused/);

// QL-261 execution boundary: no network, customer mutation or GET trial is authorized.
const oldFetch=globalThis.fetch;
let calls=0;
globalThis.fetch=()=>{calls++;throw Error('Integration may not make a network call in this test');};
try {
  for(const method of ['GET','POST','PUT','PATCH','DELETE']) {
    const request=new Request('https://rosiedazzlers.ca/api/integration/v1/health',{method});
    const res=await onRequest({request,env:{CF_PAGES_BRANCH:'main',ROSEVEAR_INTEGRATION_V1_MODE:'off'}});
    assert.equal(res.status,503,'Production trial remains disabled');
    assert.equal((await res.json()).connection_status,'HOLD');
  }
  const nonproduction=new Request('https://dev.example.test/api/integration/v1/capabilities');
  const denied=await onRequest({request:nonproduction,env:{CF_PAGES_BRANCH:'dev',ROSEVEAR_INTEGRATION_V1_MODE:'off'}});
  assert.equal(denied.status,503);
}finally{globalThis.fetch=oldFetch;}
assert.equal(calls,0);
assert.match(read('functions/api/_lib/rosevear-integration-v1.js'),/allowed_operations:\[\]/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build705_ql261_test\.mjs/);
console.log('Build 705 PASS: exact sanitized QL-258 return, no invented custody/proof/approval, offline gateway denial and booking checklist');
