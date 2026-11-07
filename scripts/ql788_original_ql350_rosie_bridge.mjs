/** Rosie Build 788. Server-side companion for the EXISTING Comms QL-350
 * private operator, never a public Vercel/Pages route or a CLI activator.
 * No credential, network origin, signer, DB connection or privilege is created.
 */
import {performSupervisedRosieGet787} from './ql787_supervised_source_get.mjs';
import {pathToFileURL} from 'node:url';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA=/^[a-f0-9]{64}$/;
const HEALTH='/api/integration/v1/shell/health';
const required=['verifyOriginalIssuer','verifyIndependentWitness',
  'verifyOriginalDeviceReceipt','verifyOriginalSourceEnrollment',
  'verifySourceOwnerDecision','verifyMasterOwnerDecision',
  'verifySourceSignature','verifyPrivateOperator','verifyPrivateTransport',
  'claimNonceOnce','reserveQl350Operation','readOriginalSignedGet',
  'verifyOriginalBrokerReceipt'];
const validObject=v=>v&&typeof v==='object'&&!Array.isArray(v);
const held=(state,extra={})=>({schema:'rosie.comms.ql788.private-ql350-bridge.v1',
  state,accepted:false,connected:false,connection:'DISCONNECTED / HOLD',
  customerCommunications:0,customerDataAccess:false,deviceActions:0,
  retryAutomatically:false,...extra});

/** Authenticated original private Windows operator supplies both capabilities.
 * QL-350 must come from the independently deployed Comms Hub server library.
 * `trust` must resolve real private signers, owner receipts and append-only
 * DB records; JSON `approved:true` from a request has no role here. */
export function createOriginalQl350RosieBridge788({ql350,operatorSession,
  originalTrust,now=()=>Date.now()}={}){
  if(!validObject(ql350)||typeof ql350.inspect!=='function'||
    typeof ql350.runOne!=='function'||!validObject(operatorSession)||
    !validObject(originalTrust)||required.some(k=>typeof originalTrust[k]!=='function')||
    typeof now!=='function')
    throw Error('HOLD_GENUINE_ORIGINAL_QL350_OPERATOR_AND_SOURCE_ADAPTER_REQUIRED');
  let inProgress=false,used=false;

  return Object.freeze({
    inspect(){return held('ORIGINAL_PRIVATE_OPERATOR_INJECTION_REQUIRED_NO_PUBLIC_ACTIVATION',
      {attempted:used,active:inProgress});},
    async runOne(packet){
      if(used||inProgress)return held('DENY_REPLAY_OR_PARALLEL_OPERATOR_INTENT');
      // QL-350 has exactly one fixed source GET path. Capabilities require a
      // separately reviewed endpoint; do not silently rewrite the path.
      if(packet?.envelope?.source!=='rosiedazzlers'||
        packet?.envelope?.tenant!=='rosie-dazzlers'||
        packet?.envelope?.path!==HEALTH||packet?.envelope?.method!=='GET')
        return held('DENY_NON_QL350_ROSIE_HEALTH_SCOPE');
      used=true;inProgress=true;
      let confirmedReceiptSha256=null,confirmedOperationId=null;
      try{
        const deps={};
        for(const k of required.slice(0,7))deps[k]=(...a)=>originalTrust[k](...a);
        deps.verifyPrivateOperator=async()=>{
          const [operator,snapshot]=await Promise.all([
            originalTrust.verifyPrivateOperator(),ql350.inspect(operatorSession)]);
          if(snapshot?.state!==
            'ORIGINAL_TEST_RECEIPT_VERIFIED_PER_SOURCE_AUTHORITY_PENDING'||
            snapshot.authenticatedPrivateOperator!==true||
            snapshot.originalEnrollmentCount!==1||
            snapshot.originalReceiptVerified!==true||
            snapshot.readyForOneSourceTest!==true||snapshot.connectedCount!==0)
            return {state:'HOLD_QL350_ORIGINAL_SIGNED_DEVICE_RECEIPT_MISSING'};
          return operator;
        };
        deps.verifyPrivateTransport=(...a)=>originalTrust.verifyPrivateTransport(...a);
        deps.claimNonceOnce=(...a)=>originalTrust.claimNonceOnce(...a);
        deps.performPrivateGet=async({fixedPath,method,source,tenant,packet,
          requestSha256,nonceSha256})=>{
          if(fixedPath!==HEALTH||method!=='GET'||source!=='rosiedazzlers'||
            tenant!=='rosie-dazzlers'||!SHA.test(requestSha256)||
            !SHA.test(nonceSha256)||
            Date.parse(packet?.envelope?.expiresAt)<=now())
            throw Error('DENY_UNSCOPED_OR_EXPIRED_QL350_INTENT');
          // A durable, original private ledger reserves a UNIQUE operation ID
          // bound to the already atomically claimed nonce and exact request.
          const reserved=await originalTrust.reserveQl350Operation({
            sourceId:'rosiedazzlers',requestSha256,nonceSha256,
            authorizationSha256:packet.envelope.authorizationSha256});
          if(reserved?.state!=='PERSISTENT_SINGLE_USE_OPERATION_RESERVED'||
            !UUID.test(reserved.operationId??'')||
            reserved.sourceId!=='rosiedazzlers'||
            reserved.requestSha256!==requestSha256||
            reserved.nonceSha256!==nonceSha256||
            reserved.authorizationSha256!==packet.envelope.authorizationSha256||
            Date.parse(packet.envelope.expiresAt)<=now())
            throw Error('DENY_NONPERSISTENT_OR_UNBOUND_OPERATION');
          const result=await ql350.runOne(operatorSession,{sourceId:'rosiedazzlers',
            operationId:reserved.operationId});
          if(result?.state!=='ONE_SOURCE_SIGNED_TEST_WITNESS_VERIFIED_STILL_HELD'||
            result.authenticatedTest!==true||result.sourceId!=='rosiedazzlers'||
            result.operationId!==reserved.operationId||
            !SHA.test(result.receiptSha256??'')||result.connectedCount!==0)
            throw Error('HOLD_QL350_ORIGINAL_BROKER_GET_OR_APPEND_ONLY_WITNESS');
          // Independently read back the original *signed* source receipt. The
          // QL-350 success label alone cannot prove source/request binding.
          const original=await originalTrust.readOriginalSignedGet({
            sourceId:'rosiedazzlers',operationId:reserved.operationId,
            requestSha256,nonceSha256,receiptSha256:result.receiptSha256});
          if(original?.receiptSha256!==result.receiptSha256||
            !validObject(original.signedReceipt)||
            original.requestSha256!==requestSha256||
            original.nonceSha256!==nonceSha256||
            original.method!=='GET'||original.path!==HEALTH||
            original.httpStatus!==200||original.customerBytes!==0)
            throw Error('DENY_NONORIGINAL_OR_UNBOUND_SIGNED_BROKER_RECEIPT');
          confirmedReceiptSha256=result.receiptSha256;
          confirmedOperationId=reserved.operationId;
          return {method:'GET',httpStatus:200,path:HEALTH,customerBytes:0,
            requestSha256,receipt:original.signedReceipt};
        };
        deps.verifyOriginalBrokerReceipt=async args=>{
          if(!confirmedReceiptSha256)return {verified:false};
          const result=await originalTrust.verifyOriginalBrokerReceipt(args);
          return result?.receiptSha256===confirmedReceiptSha256?result:{verified:false};
        };
        const outcome=await performSupervisedRosieGet787({packet,
          privateDependencies:deps,now:now()});
        return held(outcome.state,{accepted:outcome.accepted===true,
          originalIssuerVerified:outcome.originalIssuerVerified===true,
          originalSourceEnrollmentVerified:outcome.originalSourceEnrollmentVerified===true,
          genuineOwnerAuthorizationVerified:outcome.genuineOwnerAuthorizationVerified===true,
          independentBrokerReceiptAccepted:outcome.independentBrokerReceiptAccepted===true,
          privateGetAttempts:outcome.privateGetAttempts,
          ...(outcome.accepted===true?{
            requestSha256:outcome.signedGetRequestSha256,
            originalBrokerReceiptSha256:outcome.brokerReceiptSha256,
            originalOperationId:confirmedOperationId}:{})});
      }catch{return held('HOLD_ORIGINAL_QL350_OPERATOR_OR_RECEIPT_READBACK_FAILURE');}
      finally{inProgress=false;}
    }
  });
}

export function ql788Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--status')return held(
    'HOLD_ORIGINAL_WINDOWS_OPERATOR_NOT_INSTALLED_IN_PUBLIC_CHECKOUT');
  throw Error('DENY_UNSUPERVISED_PRIVATE_GET');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{process.stdout.write(JSON.stringify(ql788Cli())+'\n');}
  catch{process.stderr.write('DENY_UNSUPERVISED_PRIVATE_GET\n');process.exitCode=1;}
}
