/** Build 790: original QL-357 device proof -> authenticated QL-789 Rosie
 * broker GET -> independent immutable ledger readback. PRIVATE Node process.
 * Nothing here enrolls authorities, starts the receiver, signs for an owner,
 * opens a network port or changes the six-app connection state.
 */
import {pathToFileURL} from 'node:url';

const SHA=/^[a-f0-9]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const HEALTH='/api/integration/v1/shell/health';
const held=(state,extra={})=>({schema:'rosie.comms.ql790.first-original-test-receipt.v1',
  state,accepted:false,firstGenuineRosieGetAccepted:false,connected:false,
  connectionState:'DISCONNECTED / HOLD',sourceGrants:0,
  customerCommunications:0,deviceActions:0,retryAutomatically:false,...extra});
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const LEDGER=['schema','sourceId','tenantId','environment','method','path',
  'operationId','requestSha256','brokerReceiptSha256','fieldWitnessSha256',
  'sourceTestCount','customerBytes','sourceConnected','connectionState'];

const isOriginalDeviceProof=v=>v?.schema===
  'rosevear.hub.ql357.original-private-test-activation.v1'&&
  v.state==='ONE_ORIGINAL_CROSS_DEVICE_TEST_RECEIPT_VERIFIED_SIX_APPS_STILL_HELD'&&
  v.firstPrivateTestAccepted===true&&v.originalTestReceiptVerified===true&&
  v.originalReceiptCount===1&&v.deviceId==='rosevear-windows-hub'&&
  v.connected===false&&v.connectedCount===0&&
  v.connectionState==='DISCONNECTED / HOLD'&&
  typeof v.receivedAt==='string'&&Number.isFinite(Date.parse(v.receivedAt));

/** The protected original private operator must supply:
 * - verifyQl357DeviceReceipt: *actual* QL-357 export with its private args;
 * - runOriginal789: *actual* QL-789 one-shot instance, backed by QL-350;
 * - readFirstRosieLedger: independent append-only original DB readback.
 * A public JSON object/CLI cannot install or authorize these dependencies.
 */
export function createOriginalQl357RosieFirstReceipt790({originalOperator,
  now=()=>Date.now()}={}){
  if(typeof originalOperator?.verifyQl357DeviceReceipt!=='function'||
    typeof originalOperator?.runOriginal789!=='function'||
    typeof originalOperator?.readFirstRosieLedger!=='function'||
    typeof now!=='function')
    throw Error('HOLD_AUTHENTICATED_ORIGINAL_QL357_QL350_OPERATOR_REQUIRED');
  let attempted=false,active=false;
  return Object.freeze({
    inspect(){return held('HOLD_ORIGINAL_ON_DEVICE_OWNER_AND_PRIVATE_OPERATOR_ACTION',
      {attempted,active});},
    async runOne(packet){
      if(attempted||active)return held('DENY_REPLAY_OR_PARALLEL_PRIVATE_FIELD_OPERATION');
      const e=packet?.envelope;
      if(e?.source!=='rosiedazzlers'||e?.tenant!=='rosie-dazzlers'||
        e?.environment!=='TEST'||e?.method!=='GET'||e?.path!==HEALTH||
        !SHA.test(e.authorizationSha256??'')||
        !Number.isFinite(Date.parse(e.issuedAt))||
        !Number.isFinite(Date.parse(e.expiresAt))||
        Date.parse(e.issuedAt)>now()||Date.parse(e.expiresAt)<=now())
        return held('DENY_EXPIRED_OR_UNSCOPED_ROSIE_ORIGINAL_GET');
      attempted=true;active=true;
      try{
        // No real source GET before the original QL-357 signed *device* TEST.
        // The genuine QL-357 export must verify the device signature and the
        // EXACT one immutable original DB receipt, not a caller boolean.
        const device=await originalOperator.verifyQl357DeviceReceipt();
        if(!isOriginalDeviceProof(device))
          return held('HOLD_GENUINE_QL357_FIRST_DEVICE_RECEIPT_NOT_VERIFIED');
        const got=await originalOperator.runOriginal789(packet);
        if(got?.state!=='ONE_GENUINE_ROSIE_ORIGINAL_GET_WITNESS_CLOSED_STILL_HELD'||
          got.accepted!==true||got.originalWindowsWitnessAccepted!==true||
          got.connected!==false||got.connection!=='DISCONNECTED / HOLD'||
          !SHA.test(got.witnessSha256??'')||
          !SHA.test(got.requestSha256??'')||
          !SHA.test(got.originalBrokerReceiptSha256??'')||
          !UUID.test(got.originalOperationId??''))
          return held('HOLD_ORIGINAL_SIGNED_QL350_ROSIE_GET_NOT_VERIFIED');
        const ledger=await originalOperator.readFirstRosieLedger({
          sourceId:'rosiedazzlers',tenantId:'rosie-dazzlers',
          operationId:got.originalOperationId,
          requestSha256:got.requestSha256,
          brokerReceiptSha256:got.originalBrokerReceiptSha256,
          fieldWitnessSha256:got.witnessSha256});
        if(!exact(ledger,LEDGER)||
          ledger.schema!=='rosie.comms.ql790.original-ledger-first-get.v1'||
          ledger.sourceId!=='rosiedazzlers'||
          ledger.tenantId!=='rosie-dazzlers'||ledger.environment!=='TEST'||
          ledger.method!=='GET'||ledger.path!==HEALTH||
          ledger.operationId!==got.originalOperationId||
          ledger.requestSha256!==got.requestSha256||
          ledger.brokerReceiptSha256!==got.originalBrokerReceiptSha256||
          ledger.fieldWitnessSha256!==got.witnessSha256||
          ledger.sourceTestCount!==1||ledger.customerBytes!==0||
          ledger.sourceConnected!==false||
          ledger.connectionState!=='DISCONNECTED / HOLD')
          return held('HOLD_INDEPENDENT_ORIGINAL_ROSIE_LEDGER_FIRST_RECEIPT_MISSING');
        return {...held('ONE_GENUINE_ROSIE_BROKER_GET_AND_INDEPENDENT_FIRST_RECEIPT_ACCEPTED_STILL_HELD'),
          accepted:true,firstGenuineRosieGetAccepted:true,
          originalOperationId:got.originalOperationId,
          requestSha256:got.requestSha256,
          brokerReceiptSha256:got.originalBrokerReceiptSha256,
          signedFieldWitnessSha256:got.witnessSha256};
      }catch{return held('HOLD_ORIGINAL_PRIVATE_QL357_QL350_FIELD_EXECUTION_FAILED');}
      finally{active=false;}
    }
  });
}

export function ql790Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--status')
    return held('HOLD_ORIGINAL_REE_JACK_QL357_SIGNED_AUTHORITY_NOT_AVAILABLE_IN_REPOSITORY');
  throw Error('DENY_PUBLIC_OR_UNSUPERVISED_ORIGINAL_ROSIE_GET');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{process.stdout.write(JSON.stringify(ql790Cli())+'\n');}
  catch{process.stderr.write('DENY_UNSUPERVISED_ORIGINAL_ROSIE_GET\n');process.exitCode=1;}
}
