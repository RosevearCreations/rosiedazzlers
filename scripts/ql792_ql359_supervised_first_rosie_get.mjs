/** Rosie Build 792. The original, authenticated QL-359 device TEST must
 * already have a genuine independently signed STOP/closeout transcript.
 * Only then may a separately enrolled Rosie source run exactly ONE original
 * QL-350/790 signed health GET and independently reconcile its immutable
 * first source receipt. No public activation, owner impersonation, DB writes,
 * receiver start/stop, device commands or customer communications exist.
 */
import {pathToFileURL} from 'node:url';
import {originalSourceProof} from './ql791_original_ql358_live_rosie_handoff.mjs';

const SHA=/^[a-f0-9]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const HEALTH='/api/integration/v1/shell/health';
const held=(state,extra={})=>({schema:'rosie.comms.ql792.ql359-supervised-first-rosie-get.v1',
  state,accepted:false,genuineFirstRosieTestAccepted:false,
  originalDeviceCloseoutAccepted:false,connected:false,
  connectionState:'DISCONNECTED / HOLD',sixAppGrants:0,
  customerCommunications:0,deviceActions:0,retryAutomatically:false,...extra});
const fields=['schema','sourceId','tenantId','method','path','environment',
  'ql359SessionId','ql359TranscriptSha256','sourceEnrollmentSha256',
  'operationId','requestSha256','brokerReceiptSha256','signedWitnessSha256',
  'firstSourceReceiptCount','customerBytes','sixHeldPeers','connected'];
const exact=(v,ks)=>v&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).length===ks.length&&Object.keys(v).every(k=>ks.includes(k));
const deviceCloseout=v=>v?.schema===
    'rosevear.hub.ql359.original-supervised-private-test.v1'&&
  v.state==='ONE_SUPERVISED_ORIGINAL_PRIVATE_TEST_CLOSED_SIX_PEERS_STILL_HELD'&&
  v.originalIssuerAuthenticated===true&&v.independentWitnessAuthenticated===true&&
  v.ownersIndependentlyApproved===true&&v.databaseEnrollmentVerified===true&&
  v.dedicatedReceiverCredentialVerified===true&&
  v.supervisedReceiverStopVerified===true&&
  v.independentCloseoutWitnessVerified===true&&
  v.firstPrivateTestReceiptVerified===true&&
  v.verifiedReceiptCount===1&&v.deviceId==='rosevear-windows-hub'&&
  v.receiverActivated===false&&v.connected===false&&v.connectedCount===0&&
  v.connectionState==='DISCONNECTED / HOLD'&&
  typeof v.sessionId==='string'&&v.sessionId.length>0&&v.sessionId.length<=128&&
  SHA.test(v.transcriptSha256??'')&&
  typeof v.closedAt==='string'&&Number.isFinite(Date.parse(v.closedAt));

/** The trusted original private host must inject actual QL-359's ticket-
 * consuming reconciliation, protected Rosie source-signature/DB verification,
 * the existing QL-790 one-use broker and a DISTINCT original ledger reader.
 * Public JSON and CI test fixtures cannot install these authenticated roles.
 */
export function createQl792OriginalFirstRosieGet({originalOperator,
  now=()=>Date.now()}={}){
  const required=['verifyQl359IndependentDeviceCloseout',
    'verifyRosieOriginalSourceEnrollment','runOneOriginalRosie790',
    'readFirstSourceGetAfterQl359'];
  if(typeof now!=='function'||required.some(k=>typeof originalOperator?.[k]!=='function'))
    throw Error('HOLD_ORIGINAL_QL359_REE_JACK_PRIVATE_OPERATOR_NOT_ENROLLED');
  let used=false,busy=false;
  return Object.freeze({
    inspect(){return held('HOLD_ORIGINAL_INDEPENDENT_QL359_CLOSEOUT_AND_ROSIE_SOURCE_TEST',
      {attempted:used,active:busy});},
    async runOne(packet){
      if(used||busy)return held('DENY_PARALLEL_OR_REPLAYED_ROSIE_TEST');
      const e=packet?.envelope;
      if(e?.source!=='rosiedazzlers'||e?.tenant!=='rosie-dazzlers'||
        e?.environment!=='TEST'||e?.method!=='GET'||e?.path!==HEALTH||
        !SHA.test(e.authorizationSha256??'')||
        !Number.isFinite(Date.parse(e.issuedAt))||
        !Number.isFinite(Date.parse(e.expiresAt))||
        now()<Date.parse(e.issuedAt)||now()>=Date.parse(e.expiresAt))
        return held('DENY_EXPIRED_OR_WRONG_SOURCE_TENANT_OR_GET');
      used=true;busy=true;
      try{
        const device=await originalOperator.verifyQl359IndependentDeviceCloseout();
        if(!deviceCloseout(device)||Date.parse(device.closedAt)>now())
          return held('HOLD_REAL_QL359_DEVICE_RECEIPT_RECEIVER_STOP_AND_SIGNED_WITNESS_REQUIRED');
        const enrolled=await originalOperator.verifyRosieOriginalSourceEnrollment({
          sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',
          environment:'TEST',method:'GET',path:HEALTH,
          authorizationSha256:e.authorizationSha256});
        if(!originalSourceProof(enrolled)||
          enrolled.authorizationSha256!==e.authorizationSha256)
          return held('HOLD_ORIGINAL_ROSIE_SIGNER_CHILD_AND_SEPARATE_OWNER_DECISIONS');
        const gotten=await originalOperator.runOneOriginalRosie790(packet);
        if(gotten?.state!==
            'ONE_GENUINE_ROSIE_BROKER_GET_AND_INDEPENDENT_FIRST_RECEIPT_ACCEPTED_STILL_HELD'||
          gotten.accepted!==true||gotten.firstGenuineRosieGetAccepted!==true||
          gotten.connected!==false||gotten.connectionState!=='DISCONNECTED / HOLD'||
          !UUID.test(gotten.originalOperationId??'')||
          !SHA.test(gotten.requestSha256??'')||
          !SHA.test(gotten.brokerReceiptSha256??'')||
          !SHA.test(gotten.signedFieldWitnessSha256??''))
          return held('HOLD_GENUINE_FIRST_ROSIE_QL350_SIGNED_GET_REQUIRED');
        const original=await originalOperator.readFirstSourceGetAfterQl359({
          sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',
          ql359SessionId:device.sessionId,
          ql359TranscriptSha256:device.transcriptSha256,
          sourceEnrollmentSha256:enrolled.originalRosieSourceEnrollmentSha256,
          operationId:gotten.originalOperationId,
          requestSha256:gotten.requestSha256,
          brokerReceiptSha256:gotten.brokerReceiptSha256,
          signedWitnessSha256:gotten.signedFieldWitnessSha256});
        if(!exact(original,fields)||
          original.schema!=='rosie.comms.ql792.first-original-source-get-readback.v1'||
          original.sourceId!=='rosiedazzlers'||original.tenantId!=='rosie-dazzlers'||
          original.environment!=='TEST'||original.method!=='GET'||original.path!==HEALTH||
          original.ql359SessionId!==device.sessionId||
          original.ql359TranscriptSha256!==device.transcriptSha256||
          original.sourceEnrollmentSha256!==enrolled.originalRosieSourceEnrollmentSha256||
          original.operationId!==gotten.originalOperationId||
          original.requestSha256!==gotten.requestSha256||
          original.brokerReceiptSha256!==gotten.brokerReceiptSha256||
          original.signedWitnessSha256!==gotten.signedFieldWitnessSha256||
          original.firstSourceReceiptCount!==1||original.customerBytes!==0||
          original.sixHeldPeers!==6||original.connected!==false)
          return held('HOLD_ORIGINAL_QL359_ROSIE_GET_LEDGER_OR_SIX_HELD_PEERS_MISMATCH');
        return {...held('ONE_ORIGINAL_SIGNED_ROSIE_GET_VERIFIED_INDEPENDENTLY_SIX_APPS_STILL_HELD'),
          accepted:true,genuineFirstRosieTestAccepted:true,
          originalDeviceCloseoutAccepted:true,
          originalOperationId:gotten.originalOperationId,
          sourceEnrollmentSha256:enrolled.originalRosieSourceEnrollmentSha256,
          signedBrokerReceiptSha256:gotten.brokerReceiptSha256,
          independentWitnessSha256:gotten.signedFieldWitnessSha256};
      }catch{return held('HOLD_ORIGINAL_WINDOWS_PRIVATE_FIELD_OR_LEDGER_UNAVAILABLE');}
      finally{busy=false;}
    }
  });
}

export function ql792Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--status')
    return held('HOLD_ORIGINAL_REE_JACK_QL359_AUTHORITY_NOT_IN_PUBLIC_CHECKOUT');
  throw Error('DENY_PUBLIC_UNSUPERVISED_ROSIE_BROKER_GET');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{process.stdout.write(JSON.stringify(ql792Cli())+'\n');}
  catch{process.stderr.write('DENY_PUBLIC_UNSUPERVISED_ROSIE_GET\n');process.exitCode=1;}
}
