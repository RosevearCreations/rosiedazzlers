import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {onRequest as onShellRequest} from '../functions/api/_lib/ql336-owned-shell.mjs';
import {auditRosieQl365dAttachment,inspectRosieQl365dManifest,
  PINNED_HANDLER_COMMIT,PINNED_HANDLER_SHA256,HANDLER_PATH}
  from './ql799_ql365d_rosie_attachment_audit.mjs';

const base=auditRosieQl365dAttachment();
assert.equal(base.softwareCompatible,true);
assert.equal(base.sourceId,'rosiedazzlers');
assert.equal(base.repository,'RosevearCreations/rosiedazzlers');
assert.equal(base.shellBoundary,'owned_business_legacy');
assert.equal(base.pinnedQl364SourceRevision,PINNED_HANDLER_COMMIT);
assert.equal(base.manifestImmutableRevisionValid,true);
assert.equal(base.manifestPublicDiscoveryCompatible,true);
assert.equal(base.handlerPath,HANDLER_PATH);
assert.equal(base.handlerPinned,true);
assert.equal(base.routeWired,true);
assert.equal(base.schemasValid,true);
assert.equal(base.handlerSha256,PINNED_HANDLER_SHA256);
assert.match(base.mainCommitSha,/^[a-f0-9]{40}$/);
assert.equal(base.ql363ContractSha256,null);
assert.equal(base.sourceSignerIndependentlyAuthenticated,false);
assert.equal(base.originalOwnerQl365dReviewVerified,false);
assert.equal(base.originalIssuerAndWitnessVerified,false);
assert.equal(base.oneUsePrivateGetReceiptVerified,false);
assert.equal(base.sixAppPersistentConnectionAuthorized,false);
assert.equal(base.connected,false);
assert.equal(base.connectionState,'DISCONNECTED / HOLD');
assert.equal(base.sourceRepositoryWritesForConnection,0);
assert.equal(base.customerCommunications,false);
assert.equal(base.deviceActions,false);
assert.equal(base.outstandingEvidence.length,7);

const original=JSON.parse(readFileSync('.well-known/rosevear-integration-manifest.json','utf8'));
const clone=x=>structuredClone(x);
const negatives=[
  ['wrong source ID',m=>m.source_id='yw'],
  ['wrong app',m=>m.source_app_id='yw'],
  ['wrong repository',m=>m.repository='RosevearCreations/yw'],
  ['wrong shell',m=>m.tenant_boundary='customer_tenant'],
  ['wrong audience',m=>m.audience='customer'],
  ['legacy nonimmutable revision',m=>m.source_revision='ql333-discovery-v1'],
  ['unreviewed revision',m=>m.source_revision='0'.repeat(40)],
  ['wrong role',m=>m.source_role='tenant'],
  ['wrong issuer',m=>m.issuer='comms-master'],
  ['legacy path changed',m=>m.legacy_integration_v1.allowed_paths.push('/api/orders')],
  ['legacy write',m=>m.legacy_integration_v1.method='POST'],
  ['public origin impersonation',m=>m.transport.origin='https://evil.example'],
  ['redirect accepted',m=>m.transport.redirects='FOLLOW'],
  ['customer scope',m=>m.requested_scope='customer_bookings'],
  ['connection forged',m=>m.connection_state='CONNECTED'],
  ['signature forged',m=>m.signature.state='SIGNED'],
  ['unknown property',m=>m.customerRecords=[]]
];
for(const [label,change] of negatives){
  const bad=clone(original);change(bad);
  assert.equal(inspectRosieQl365dManifest(bad).discoveryCompatible,false,label);
  const inspected=auditRosieQl365dAttachment({manifestOverride:Buffer.from(JSON.stringify(bad))});
  assert.equal(inspected.softwareCompatible,false,label);
  assert.equal(inspected.connectionState,'DISCONNECTED / HOLD',label);
  assert.equal(inspected.sourceSignerIndependentlyAuthenticated,false,label);
}
assert.equal(auditRosieQl365dAttachment({handlerOverride:Buffer.from('tampered')}).softwareCompatible,false);
assert.equal(auditRosieQl365dAttachment({routeOverride:Buffer.from('export default {}')}).softwareCompatible,false);
assert.equal(auditRosieQl365dAttachment({shellOverride:Buffer.from('export const shell="other"')}).softwareCompatible,false);
assert.equal(createHash('sha256').update(readFileSync(HANDLER_PATH)).digest('hex'),PINNED_HANDLER_SHA256);

const baseUrl='https://original.example/api/integration/v1/shell/health';
const get=(method='GET',headers={},url=baseUrl)=>new Request(url,{method,headers});
for(const [label,req,expected] of [
  ['anonymous source path',get(),503],
  ['unsigned test request',get('GET',{'x-rosevear-ql362-request':'e30'}),503],
  ['POST with test header',get('POST',{'x-rosevear-ql362-request':'e30'}),405],
  ['child tenant impersonation',get('GET',{'x-rosevear-ql362-request':'e30','x-child-id':'camp-1'}),403],
  ['query escalation',get('GET',{'x-rosevear-ql362-request':'e30'},baseUrl+'?customer=true'),403]
]){
  const res=await onShellRequest({request:req});
  assert.equal(res.status,expected,label);
  const payload=await res.json();
  assert.equal(payload.authenticated??false,false,label);
  assert.equal(payload.connected??false,false,label);
  assert.equal(res.headers.get('cache-control'),'private, no-store',label);
  assert.ok(!JSON.stringify(payload).includes('customer_id'),label);
}
assert.equal(base.outstandingEvidence.some(x=>x.includes('source-signed QL363 receipt')),true);
assert.match(readFileSync('scripts/current_booking_wizard_regression.sh','utf8'),
  /build799_ql365d_rosie_attachment_test\.mjs/);
assert.match(readFileSync('scripts/current_booking_wizard_regression.sh','utf8'),
  /ql364-source-health\.test\.mjs/);
assert.match(readFileSync('admin-comms-hub-v781.html','utf8'),/id="originalQl365dTitle799"/);
for(const path of ['admin-integrations.html','admin-integrations/index.html',
  'admin-catalog.html','admin-catalog/index.html'])
  assert.match(readFileSync(path,'utf8'),/#originalQl365dTitle799/,path);
console.log(`Build 799 QL365D Rosie source-identity / immutable QL364 handler + `+
  `${negatives.length+3} drift denials and 5 safe route checks PASS; `+
  `original signer/owners/private GET remain DISCONNECTED / HOLD.`);
