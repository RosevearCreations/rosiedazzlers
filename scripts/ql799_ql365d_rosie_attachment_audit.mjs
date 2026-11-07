/** QL-365D Rosie final code attachment audit. Read-only and credential-free.
 * Immutable revision points to the already-promoted Build 798 QL-364 handler.
 * This does NOT pin a TLS origin, authenticate a source signer, perform a GET,
 * establish original-owner trust or activate a Comms connection. */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {QL364_PATH,QL364_CONTRACT_SCHEMA,QL364_ENVELOPE_SCHEMA,
  QL364_RECEIPT_SCHEMA} from '../functions/api/_lib/ql364-source-health.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const ROSIE_SOURCE_ID='rosiedazzlers';
export const ROSIE_REPO='RosevearCreations/rosiedazzlers';
export const ROSIE_BOUNDARY='owned_business_legacy';
export const PINNED_HANDLER_COMMIT='83b03717b828ac70984a5f9279cd05d9f163faae';
export const PINNED_HANDLER_SHA256='43c99b4270a3894cd48bf626a032652b16fb61bc67770f60c937550d742a46ee';
export const HANDLER_PATH='functions/api/_lib/ql364-source-health.mjs';
export const ROUTE_PATH='functions/api/integration/v1/shell/health.js';
export const MANIFEST_PATH='.well-known/rosevear-integration-manifest.json';
const SHA=/^[a-f0-9]{64}$/;
const COMMIT=/^[a-f0-9]{40}$/;
const exact=(value,keys)=>value!==null&&typeof value==='object'&&
  !Array.isArray(value)&&Object.keys(value).length===keys.length&&
  Object.keys(value).every(key=>keys.includes(key));
const hash=value=>createHash('sha256').update(value).digest('hex');
const manifestFields=['schema','manifest_version','source_id','source_app_id',
  'source_role','repository','source_revision','issuer','audience',
  'tenant_boundary','legacy_integration_v1','transport','requested_scope',
  'failure_behavior','signature','connection_state'];

/** Inspection only: public discovery is not an independent signature pin. */
export function inspectRosieQl365dManifest(manifest){
  const structure=exact(manifest,manifestFields)&&
    exact(manifest?.legacy_integration_v1,['app_id','method','allowed_paths','authorization'])&&
    exact(manifest?.transport,['origin','manifest_path','redirects'])&&
    exact(manifest?.signature,['algorithm','key_id','value','state']);
  const identity=structure&&manifest.source_id===ROSIE_SOURCE_ID&&
    manifest.source_app_id===ROSIE_SOURCE_ID&&manifest.issuer===ROSIE_SOURCE_ID&&
    manifest.source_role==='business_shell'&&manifest.repository===ROSIE_REPO&&
    manifest.tenant_boundary===ROSIE_BOUNDARY&&manifest.audience==='rosevear-master';
  const pinned=identity&&COMMIT.test(manifest.source_revision??'')&&
    manifest.source_revision===PINNED_HANDLER_COMMIT;
  const discovery=identity&&pinned&&
    manifest.schema==='rosevear.integration.discovery.v1'&&
    manifest.manifest_version==='1.0.0'&&
    manifest.legacy_integration_v1.app_id===ROSIE_SOURCE_ID&&
    manifest.legacy_integration_v1.method==='GET'&&
    JSON.stringify(manifest.legacy_integration_v1.allowed_paths)===
      JSON.stringify(['/api/integration/v1/health','/api/integration/v1/capabilities'])&&
    manifest.legacy_integration_v1.authorization==='source_owned_required'&&
    manifest.transport.origin===null&&
    manifest.transport.manifest_path==='/.well-known/rosevear-integration-manifest.json'&&
    manifest.transport.redirects==='DENY'&&
    manifest.requested_scope==='public_nonsecret_discovery_only'&&
    manifest.failure_behavior==='HOLD_AND_QUARANTINE'&&
    manifest.connection_state==='DISCONNECTED / HOLD'&&
    manifest.signature.algorithm==='Ed25519'&&
    manifest.signature.state==='AWAITING_INDEPENDENT_SOURCE_SIGNER'&&
    manifest.signature.key_id===null&&manifest.signature.value===null;
  return Object.freeze({structure:!!structure,identity:!!identity,
    immutableRevisionPinned:!!pinned,discoveryCompatible:!!discovery,
    independentlySigned:false,connected:false});
}

/** Completely local source and release readback. Does not invoke a server. */
export function auditRosieQl365dAttachment({root=ROOT,manifestOverride=null,
  handlerOverride=null,routeOverride=null,shellOverride=null}={}){
  const files={manifest:join(root,MANIFEST_PATH),handler:join(root,HANDLER_PATH),
    route:join(root,ROUTE_PATH),shell:join(root,'functions/api/_lib/ql336-owned-shell.mjs')};
  const bytes=manifestOverride??readFileSync(files.manifest);
  const manifest=JSON.parse(bytes.toString('utf8'));
  const manifestInspection=inspectRosieQl365dManifest(manifest);
  const handler=handlerOverride??readFileSync(files.handler);
  const route=routeOverride??readFileSync(files.route);
  const shell=shellOverride??readFileSync(files.shell);
  const handlerSha256=hash(handler),manifestSha256=hash(bytes);
  const routeText=route.toString('utf8'),shellText=shell.toString('utf8');
  const routeWired=routeText.includes("export {onRequest} from '../../../_lib/ql336-owned-shell.mjs'")&&
    shellText.includes("import {handleQl364SourceHealth} from './ql364-source-health.mjs'")&&
    shellText.includes('handleQl364SourceHealth({request,sourceId:')&&
    shellText.includes("repository:'rosiedazzlers'");
  const handlerPinned=handlerSha256===PINNED_HANDLER_SHA256;
  const schemasValid=QL364_PATH==='/api/integration/v1/shell/health'&&
    QL364_CONTRACT_SCHEMA==='rosevear.hub.ql363.six-source-health-contract.v1'&&
    QL364_ENVELOPE_SCHEMA==='rosevear.hub.ql363.source-health-envelope.v1'&&
    QL364_RECEIPT_SCHEMA==='rosevear.hub.ql363.source-signed-health-receipt.v1';
  let mainCommitSha=null;
  try{mainCommitSha=execFileSync('git',['rev-parse','HEAD'],
    {cwd:root,encoding:'utf8',timeout:5000}).trim();}
  catch{/* Some deployment packages omit Git history. Do not invent it. */}
  const softwareCompatible=manifestInspection.discoveryCompatible&&handlerPinned&&
    routeWired&&schemasValid;
  return Object.freeze({
    schema:'rosevear.hub.ql365d.source-attachment-handoff.v1',
    application:'Rosie Dazzlers',sourceId:ROSIE_SOURCE_ID,repository:ROSIE_REPO,
    shellBoundary:ROSIE_BOUNDARY,mainCommitSha:COMMIT.test(mainCommitSha??'')?mainCommitSha:null,
    pinnedQl364SourceRevision:PINNED_HANDLER_COMMIT,handlerPath:HANDLER_PATH,
    handlerSha256,manifestPath:MANIFEST_PATH,manifestSha256,
    integrationMethod:'GET',integrationEndpoint:QL364_PATH,
    ql363ContractSchema:QL364_CONTRACT_SCHEMA,
    ql363ContractSha256:null,
    manifestIdentityValid:manifestInspection.identity,
    manifestImmutableRevisionValid:manifestInspection.immutableRevisionPinned,
    manifestPublicDiscoveryCompatible:manifestInspection.discoveryCompatible,
    manifestIndependentlySigned:false,handlerPinned,routeWired,schemasValid,
    softwareCompatible,
    sourceSignerIndependentlyAuthenticated:false,
    originalOwnerQl365dReviewVerified:false,originalIssuerAndWitnessVerified:false,
    oneUsePrivateGetReceiptVerified:false,sixAppPersistentConnectionAuthorized:false,
    sourceRepositoryWritesForConnection:0,customerCommunications:false,
    deviceActions:false,connected:false,connectionState:'DISCONNECTED / HOLD',
    state:softwareCompatible?'SOFTWARE_COMPATIBLE_ORIGINAL_PRIVATE_EVIDENCE_HELD':
      'DENY_SOURCE_MANIFEST_HANDLER_OR_ROUTE_DRIFT',
    outstandingEvidence:[
      'Independent original QL363 source contract signature and signer custody',
      'Approved original HTTPS source origin and independently pinned TLS key',
      'Original Ree and Jack QL365D source-specific offline signed review',
      'Independent QL355 issuer and field witness, QL354 enrollment',
      'QL362 one-use original private GET, source-signed QL363 receipt',
      'Original receiver STOP, independent TEST closure, six HELD peers',
      'Separate explicit production connection grant for CONNECTED status'
    ]});
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const args=process.argv.slice(2);
  if(args.length!==1||args[0]!=='--status'){
    process.stderr.write('DENY_QL799_SIGNING_ENROLLMENT_OR_PRIVATE_GET_FROM_PUBLIC_CLI\n');
    process.exitCode=1;
  }else{
    try{const result=auditRosieQl365dAttachment();
      process.stdout.write(JSON.stringify(result,null,2)+'\n');
      if(!result.softwareCompatible)process.exitCode=1;
    }catch{process.stderr.write('HOLD_QL799_LOCAL_ATTACHMENT_READBACK_UNAVAILABLE\n');
      process.exitCode=1;}
  }
}
