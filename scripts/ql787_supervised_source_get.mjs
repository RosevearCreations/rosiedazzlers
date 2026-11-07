/** Build 787 — PRIVATE OPERATOR ONLY, no public endpoint or default network path.
 * The original control plane injects independently authenticated verifiers,
 * an atomic replay ledger and a fixed-route private GET dispatcher. No keys,
 * URLs, credentials or approval claims are accepted from browser documents.
 */
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const SHA=/^[a-f0-9]{64}$/;
const NONCE=/^[A-Za-z0-9_-]{24,96}$/;
const paths=['/api/integration/v1/shell/health',
  '/api/integration/v1/shell/capabilities'];
const names=['verifyOriginalIssuer','verifyIndependentWitness',
  'verifyOriginalDeviceReceipt','verifyOriginalSourceEnrollment',
  'verifySourceOwnerDecision','verifyMasterOwnerDecision',
  'verifySourceSignature','verifyPrivateOperator','verifyPrivateTransport',
  'claimNonceOnce','performPrivateGet','verifyOriginalBrokerReceipt'];
const strict=(x,k)=>x&&typeof x==='object'&&!Array.isArray(x)&&
  Object.keys(x).length===k.length&&Object.keys(x).every(v=>k.includes(v));
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const sha=x=>createHash('sha256').update(canonical(x)).digest('hex');
const time=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x)?Date.parse(x):NaN;
const held=(state,attempts=0)=>({schema:'rosie.comms.ql787.original-get-operator.v1',
  state,accepted:false,originalIssuerVerified:false,
  genuineOwnerAuthorizationVerified:false,originalSourceEnrollmentVerified:false,
  independentBrokerReceiptAccepted:false,connected:false,
  connection:'DISCONNECTED / HOLD',customerCommunications:0,
  customerBytes:0,deviceActions:0,privateGetAttempts:attempts});

/** Only the original trusted private operator may supply these callbacks.
 * `performPrivateGet` must dispatch to an independently pinned PRIVATE broker
 * using an internally fixed allowlisted GET route (never a supplied URL).
 * A callback can lie in a synthetic test; this module cannot create trust. */
export async function performSupervisedRosieGet787({packet,
  privateDependencies,now=Date.now()}={}){
  if(!Number.isInteger(now)||!strict(privateDependencies,names)||
    names.some(n=>typeof privateDependencies[n]!=='function'))
    return held('HOLD_ORIGINAL_PRIVATE_OPERATOR_DEPENDENCIES_NOT_INSTALLED');
  const body=packet?.envelope;
  const k=['schema','source','tenant','audience','environment','method',
    'path','nonce','issuedAt','expiresAt','authorizationSha256'];
  if(!strict(packet,['envelope','signature'])||!strict(body,k)||
    body.schema!=='rosie.comms.source-signed-get.v1'||
    body.source!=='rosiedazzlers'||body.tenant!=='rosie-dazzlers'||
    body.audience!=='rosevear-comms-hub:nonproduction'||
    body.environment!=='TEST'||body.method!=='GET'||
    !paths.includes(body.path)||!NONCE.test(body.nonce??'')||
    !SHA.test(body.authorizationSha256??'')||
    !/^[A-Za-z0-9_-]{86}$/.test(packet.signature??'')||
    !Number.isFinite(time(body.issuedAt))||
    !Number.isFinite(time(body.expiresAt))||
    time(body.issuedAt)>now||now>=time(body.expiresAt)||
    time(body.expiresAt)-time(body.issuedAt)>90_000)
    return held('DENY_EXPIRED_OR_UNSCOPED_OR_UNSIGNED_SOURCE_GET');
  const requestSha256=sha(packet),nonceSha256=sha(body.nonce),auth=body.authorizationSha256;
  const d=privateDependencies;
  try{
    const [issuer,witness,device]=await Promise.all([
      d.verifyOriginalIssuer({deviceId:'rosevear-windows-hub'}),
      d.verifyIndependentWitness({deviceId:'rosevear-windows-hub'}),
      d.verifyOriginalDeviceReceipt()]);
    if(issuer?.role!=='original_issuer'||issuer.authenticated!==true||
      issuer.revoked!==false||!SHA.test(issuer.spkiSha256??'')||
      witness?.role!=='field_witness'||witness.authenticated!==true||
      witness.revoked!==false||!SHA.test(witness.spkiSha256??'')||
      issuer.spkiSha256===witness.spkiSha256||
      !SHA.test(issuer.enrollmentPayloadSha256??'')||
      issuer.enrollmentPayloadSha256!==witness.enrollmentPayloadSha256||
      device?.state!=='FIRST_PRIVATE_ORIGINAL_DEVICE_TEST_ACCEPTED_SIX_SOURCES_STILL_HELD'||
      device.enrollmentPayloadSha256!==issuer.enrollmentPayloadSha256||
      device.receiptCount!==1||device.firstPrivateTestAccepted!==true||
      device.sourceTestAuthorized!==false||device.connected!==false)
      return held('HOLD_GENUINE_QL355_DEVICE_ISSUER_AND_WITNESS_REQUIRED');

    const source=await d.verifyOriginalSourceEnrollment({
      source:'rosiedazzlers',tenant:'rosie-dazzlers',authorizationSha256:auth});
    if(source?.state!=='ORIGINAL_ROSIE_SOURCE_ENROLLED_TEST'||
      source.source!=='rosiedazzlers'||source.tenant!=='rosie-dazzlers'||
      source.environment!=='TEST'||source.revoked!==false||
      source.originalDeviceEnrollmentSha256!==issuer.enrollmentPayloadSha256||
      !SHA.test(source.keyPin??'')||source.sourceTestAuthorized!==true)
      return held('HOLD_ORIGINAL_ROSIE_SOURCE_ENROLLMENT_NOT_VERIFIED');

    const [ree,jack,sourceSig]=await Promise.all([
      d.verifySourceOwnerDecision({authorizationSha256:auth}),
      d.verifyMasterOwnerDecision({authorizationSha256:auth}),
      d.verifySourceSignature({packet,expectedSourcePin:source.keyPin})]);
    const ownerOk=(v,role)=>v?.role===role&&v.decision==='APPROVE_TEST_ONLY'&&
      v.authorizationSha256===auth&&SHA.test(v.spkiSha256??'')&&
      Number.isFinite(v.expiresAt)&&v.expiresAt>now&&v.expiresAt-now<=900_000;
    if(!ownerOk(ree,'source')||!ownerOk(jack,'master')||
      ree.spkiSha256===jack.spkiSha256||
      [ree.spkiSha256,jack.spkiSha256].includes(source.keyPin)||
      [ree.spkiSha256,jack.spkiSha256].includes(issuer.spkiSha256)||
      [ree.spkiSha256,jack.spkiSha256].includes(witness.spkiSha256)||
      sourceSig?.verified!==true||sourceSig.sourceKeyPin!==source.keyPin||
      sourceSig.requestSha256!==requestSha256)
      return held('HOLD_EXACT_SEPARATE_OWNER_TEST_AND_SOURCE_SIGNATURE_REQUIRED');

    const [operator,transport]=await Promise.all([
      d.verifyPrivateOperator(),d.verifyPrivateTransport()]);
    if(operator?.state!=='ORIGINAL_OWNER_AUTHENTICATED_PRIVATE_SESSION'||
      operator.expiresAt<=now||!Number.isFinite(operator.expiresAt)||
      operator.originalComputer!=='DESKTOP-AE894KC'||
      transport?.state!=='ORIGINAL_TLS_TAILNET_TRANSPORT_INDEPENDENTLY_VERIFIED'||
      transport.tlsVerified!==true||transport.originalComputer!=='DESKTOP-AE894KC'||
      transport.privateReceiverLoopbackVerified!==true||
      !Number.isFinite(transport.observedAt)||Math.abs(now-transport.observedAt)>30_000)
      return held('HOLD_AUTHENTICATED_PRIVATE_OPERATOR_AND_ORIGINAL_TRANSPORT_REQUIRED');

    // Atomic one-use claim from the ORIGINAL private replay ledger is required
    // before dispatch; failure consumes the attempt, and there is no auto retry.
    const claim=await d.claimNonceOnce({nonceSha256,requestSha256,
      authorizationSha256:auth});
    if(claim?.claimed!==true||claim.nonceSha256!==nonceSha256||
      claim.requestSha256!==requestSha256)
      return held('DENY_REPLAY_OR_UNTRUSTED_NONCE_LEDGER');
    let result;
    try{result=await d.performPrivateGet({
      fixedPath:body.path,method:'GET',source:'rosiedazzlers',
      tenant:'rosie-dazzlers',packet,requestSha256,nonceSha256});}
    catch{return held('HOLD_ONE_PRIVATE_GET_FAILED_NO_AUTOMATIC_RETRY',1);}
    if(result?.httpStatus!==200||result.customerBytes!==0||
      result.method!=='GET'||result.path!==body.path||
      result.requestSha256!==requestSha256)
      return held('DENY_ORIGINAL_GET_RESPONSE_OR_SCOPE_MISMATCH_NO_RETRY',1);
    const receipt=await d.verifyOriginalBrokerReceipt({
      receipt:result.receipt,requestSha256,nonceSha256,
      authorizationSha256:auth,source:'rosiedazzlers',tenant:'rosie-dazzlers'});
    if(receipt?.verified!==true||!SHA.test(receipt.receiptSha256??'')||
      !SHA.test(receipt.originalBrokerSpkiSha256??'')||
      receipt.requestSha256!==requestSha256||
      receipt.nonceSha256!==nonceSha256||
      receipt.authorizationSha256!==auth||
      receipt.source!=='rosiedazzlers'||receipt.tenant!=='rosie-dazzlers'||
      receipt.path!==body.path||receipt.customerBytes!==0||
      !Number.isFinite(receipt.observedAt)||receipt.observedAt<time(body.issuedAt)||
      receipt.observedAt>now||receipt.observedAt>=time(body.expiresAt))
      return held('DENY_ORIGINAL_BROKER_RECEIPT_NOT_INDEPENDENTLY_VERIFIED',1);
    // A single genuine TEST receipt never enrolls other peers or authorizes
    // customer/device actions. Only the independent original control plane
    // may later make a separate explicit connection/grant decision.
    return {...held('ONE_SUPERVISED_ROSIE_TEST_GET_ACCEPTED_SOURCE_STILL_HELD',1),
      accepted:true,originalIssuerVerified:true,
      genuineOwnerAuthorizationVerified:true,originalSourceEnrollmentVerified:true,
      independentBrokerReceiptAccepted:true,
      signedGetRequestSha256:requestSha256,brokerReceiptSha256:receipt.receiptSha256};
  }catch{return held('HOLD_ORIGINAL_PRIVATE_VERIFICATION_FAILED_NO_DISPATCH');}
}

export function ql787Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--status')return held(
    'HOLD_NO_ORIGINAL_PRIVATE_OPERATOR_INSTALLED_FOR_CLI');
  throw Error('DENY_PUBLIC_OR_UNSUPERVISED_BROKER_GET');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{process.stdout.write(JSON.stringify(ql787Cli())+'\n');}
  catch{process.stderr.write('DENY_PUBLIC_OR_UNSUPERVISED_BROKER_GET\n');process.exitCode=1;}
}
