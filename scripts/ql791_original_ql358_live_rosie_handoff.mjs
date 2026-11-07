/** Rosie Build 791: original QL-358 one-device receipt, exact Rosie source
 * enrollment custody and ONE protected QL-790/350 signed health GET.
 * Only a separately authenticated original Windows private process may
 * supply these original trust and append-only database accessors. No HTTP,
 * browser, CLI --run, credential, role grant or auto-retry is provided.
 */
import {pathToFileURL} from 'node:url';
const SHA=/^[0-9a-f]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const HEALTH='/api/integration/v1/shell/health';
const held=(state,extra={})=>({schema:'rosie.comms.ql791.original-live-handshake.v1',
  state,accepted:false,sourceTestVerified:false,connected:false,
  connectionState:'DISCONNECTED / HOLD',customerCommunications:0,
  deviceActions:0,sourceGrants:0,retryAutomatically:false,...extra});
const exact=(v,ks)=>v&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).length===ks.length&&Object.keys(v).every(k=>ks.includes(k));
const ENROLL=['schema','state','sourceId','tenantId','environment','method','path',
  'authorizationSha256',
  'originalDeviceEnrollmentSha256','originalRosieSourceEnrollmentSha256',
  'sourceSignerSpkiSha256','sourceOwnerDecisionSha256','masterOwnerDecisionSha256',
  'issuerSpkiSha256','witnessSpkiSha256','sourceEnrollmentCount',
  'sourceTestAuthorized','customerDataAllowed','connectionState'];
const POST=['schema','sourceId','tenantId','environment','method','path',
  'operationId','requestSha256','brokerReceiptSha256','fieldWitnessSha256',
  'originalRosieSourceEnrollmentSha256','sourceTestCount','customerBytes',
  'sourceConnected','connectionState'];
const DEVICE='FIRST_AUTHENTIC_ORIGINAL_TEST_RECEIPT_RECONCILED_SIX_APPS_HELD';
const LIVE='ONE_GENUINE_ROSIE_BROKER_GET_AND_INDEPENDENT_FIRST_RECEIPT_ACCEPTED_STILL_HELD';
function originalSourceProof(v){
  const hexes=['originalDeviceEnrollmentSha256','originalRosieSourceEnrollmentSha256',
    'sourceSignerSpkiSha256','sourceOwnerDecisionSha256',
    'masterOwnerDecisionSha256','issuerSpkiSha256','witnessSpkiSha256'];
  return exact(v,ENROLL)&&
    v.schema==='rosie.comms.ql791.protected-original-source-enrollment.v1'&&
    v.state==='ORIGINAL_ROSIE_SOURCE_AND_CHILD_SCOPE_ENROLLMENT_VERIFIED'&&
    v.sourceId==='rosiedazzlers'&&v.tenantId==='rosie-dazzlers'&&
    v.environment==='TEST'&&v.method==='GET'&&v.path===HEALTH&&
    SHA.test(v.authorizationSha256??'')&&
    v.sourceEnrollmentCount===1&&v.sourceTestAuthorized===false&&
    v.customerDataAllowed===false&&v.connectionState==='DISCONNECTED / HOLD'&&
    hexes.every(k=>SHA.test(v[k]??''))&&
    new Set(hexes.map(k=>v[k])).size===hexes.length;
}

export function createQl791OriginalLiveRosieHandoff({originalPrivateOperator,
  now=()=>Date.now()}={}){
  const funcs=['verifyQl358FirstLiveDeviceReceipt','verifyRosieOriginalSourceEnrollment',
    'runOneOriginalRosie790','readOriginalRosieCrossAppHandshake'];
  if(typeof now!=='function'||funcs.some(f=>typeof originalPrivateOperator?.[f]!=='function'))
    throw Error('HOLD_GENUINE_QL358_ORIGINAL_PRIVATE_SOURCE_OPERATOR_REQUIRED');
  let used=false,active=false;
  return Object.freeze({
    inspect(){return held('HOLD_ORIGINAL_REE_JACK_ISSUER_AND_SOURCE_SIGNER_ENROLLMENT',
      {attempted:used,active});},
    async runOne(packet){
      if(used||active)return held('DENY_REPLAY_OR_PARALLEL_CROSS_APP_HANDSHAKE');
      const e=packet?.envelope;
      if(e?.source!=='rosiedazzlers'||e?.tenant!=='rosie-dazzlers'||
        e?.environment!=='TEST'||e?.method!=='GET'||e?.path!==HEALTH||
        !SHA.test(e.authorizationSha256??'')||
        !Number.isFinite(Date.parse(e.issuedAt))||
        !Number.isFinite(Date.parse(e.expiresAt))||
        now()<Date.parse(e.issuedAt)||now()>=Date.parse(e.expiresAt))
        return held('DENY_UNSCOPED_OR_EXPIRED_ORIGINAL_ROSIE_GET');
      used=true;active=true;
      try{
        // This calls the ORIGINAL QL-358 ticket-consuming verifier. It cannot
        // be replaced by the Windows read-only -Status JSON or a device key
        // candidate. The device TEST alone grants no Rosie source permission.
        const device=await originalPrivateOperator.verifyQl358FirstLiveDeviceReceipt();
        if(device?.schema!=='rosevear.hub.ql358.original-field-credential-live-test.v1'||
          device.state!==DEVICE||device.firstLiveTestReceiptVerified!==true||
          device.verifiedReceiptCount!==1||device.deviceId!=='rosevear-windows-hub'||
          device.originalIssuerAuthenticated!==true||
          device.independentWitnessAuthenticated!==true||
          device.ownersIndependentlyApproved!==true||
          device.databaseEnrollmentVerified!==true||
          device.dedicatedReceiverCredentialVerified!==true||
          device.connected!==false||device.connectedCount!==0||
          device.connectionState!=='DISCONNECTED / HOLD')
          return held('HOLD_QL358_GENUINE_DEVICE_RECEIPT_AND_PRIVATE_CREDENTIAL_REQUIRED');
        // Must be an original protected DB + signature verifier, not a copied
        // JSON status. No source enrollment write happens in this adapter.
        const enrollment=await originalPrivateOperator.verifyRosieOriginalSourceEnrollment({
          sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',environment:'TEST',
          method:'GET',path:HEALTH,authorizationSha256:e.authorizationSha256});
        if(!originalSourceProof(enrollment)||
          enrollment.authorizationSha256!==e.authorizationSha256)
          return held('HOLD_INDEPENDENT_ROSIE_SOURCE_SIGNER_OWNER_AND_CHILD_ENROLLMENT_REQUIRED');
        const outcome=await originalPrivateOperator.runOneOriginalRosie790(packet);
        if(outcome?.state!==LIVE||outcome.accepted!==true||
          outcome.firstGenuineRosieGetAccepted!==true||
          outcome.connected!==false||outcome.connectionState!=='DISCONNECTED / HOLD'||
          !UUID.test(outcome.originalOperationId??'')||
          !SHA.test(outcome.requestSha256??'')||
          !SHA.test(outcome.brokerReceiptSha256??'')||
          !SHA.test(outcome.signedFieldWitnessSha256??''))
          return held('HOLD_FIRST_ORIGINAL_ROSIE_GET_AND_SIGNED_WITNESS_NOT_ACCEPTED');
        const record=await originalPrivateOperator.readOriginalRosieCrossAppHandshake({
          sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',
          operationId:outcome.originalOperationId,
          requestSha256:outcome.requestSha256,
          brokerReceiptSha256:outcome.brokerReceiptSha256,
          fieldWitnessSha256:outcome.signedFieldWitnessSha256,
          sourceEnrollmentSha256:enrollment.originalRosieSourceEnrollmentSha256});
        if(!exact(record,POST)||
          record.schema!=='rosie.comms.ql791.original-first-source-handshake.v1'||
          record.sourceId!=='rosiedazzlers'||record.tenantId!=='rosie-dazzlers'||
          record.environment!=='TEST'||record.method!=='GET'||record.path!==HEALTH||
          record.operationId!==outcome.originalOperationId||
          record.requestSha256!==outcome.requestSha256||
          record.brokerReceiptSha256!==outcome.brokerReceiptSha256||
          record.fieldWitnessSha256!==outcome.signedFieldWitnessSha256||
          record.originalRosieSourceEnrollmentSha256!==enrollment.originalRosieSourceEnrollmentSha256||
          record.sourceTestCount!==1||record.customerBytes!==0||
          record.sourceConnected!==false||record.connectionState!=='DISCONNECTED / HOLD')
          return held('HOLD_ORIGINAL_INDEPENDENT_FIRST_SOURCE_RECEIPT_MISMATCH');
        return {...held('FIRST_AUTHENTICATED_ROSIE_CROSS_APP_TEST_VERIFIED_STILL_HELD'),
          accepted:true,sourceTestVerified:true,
          sourceEnrollmentSha256:enrollment.originalRosieSourceEnrollmentSha256,
          originalOperationId:outcome.originalOperationId,
          brokerReceiptSha256:outcome.brokerReceiptSha256,
          witnessSha256:outcome.signedFieldWitnessSha256};
      }catch{return held('HOLD_ORIGINAL_PRIVATE_QL358_SOURCE_OR_GET_READBACK_FAILED');}
      finally{active=false;}
    }
  });
}

export function ql791Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--status')
    return held('HOLD_ORIGINAL_QL358_AUTHORITY_SOURCE_AND_PRIVATE_BROKER_NOT_IN_REPO');
  throw Error('DENY_UNSUPERVISED_SOURCE_ENROLLMENT_OR_LIVE_ROSIE_GET');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{process.stdout.write(JSON.stringify(ql791Cli())+'\n');}
  catch{process.stderr.write('DENY_UNSUPERVISED_ORIGINAL_ROSIE_GET\n');process.exitCode=1;}
}
