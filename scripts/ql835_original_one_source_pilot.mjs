/** Build 835 original-only, one-attempt Rosie receipt reconciliation.
 * Uses QL-795's independently pinned multi-signer / durable claim verifier.
 * No web route calls this module, no original operator is bundled, and a TEST
 * receipt never grants an ongoing Master/Comms/AI Data connection.
 */
import {pathToFileURL} from 'node:url';
import {createQl795OriginalReceiptClosure} from './ql795_original_source_get_receipt_closure.mjs';

export const PILOT_SCHEMA_835='rosie.master-shell.ql835.one-source-receipt-reconciliation.v1';
const HELD='DISCONNECTED / HOLD',SOURCE='rosiedazzlers';
const HEX=/^[0-9a-f]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const exact=(value,keys)=>value!==null&&typeof value==='object'&&
  !Array.isArray(value)&&Object.keys(value).length===keys.length&&
  Object.keys(value).every(k=>keys.includes(k));
const held=(code,extra={})=>Object.freeze({schema:PILOT_SCHEMA_835,state:code,
  accepted:false,originalReceiptReviewed:false,sourceId:SOURCE,
  operationId:null,requestSha256:null,receiptSha256:null,
  connected:false,connectionState:HELD,sourceTestAuthorized:false,
  customerDataAllowed:false,masterConnectionGranted:false,
  sourceWrites:0,masterEventsSent:0,automaticRetry:false,...extra});
const readbackKeys=['schema','sourceId','operationId','requestSha256',
  'receiptSha256','observedAt','originalOwnerSessionVerified',
  'independentWitnessReadback','receiverStopped','sourceGetCount',
  'otherPeersHeld','connectedCount','sourceTestAuthorized',
  'customerDataAllowed','customerBytes','deviceActions','sourceWrites',
  'commsConnectionState','aiDataConnectionState'];

/** Post-closure reconciliation is *not* a standalone receipt verifier.
 * verifiedClosure MUST originate from QL-795's original signed verification.
 * Never take this data from a browser, HTTP request, or unsigned export.
 */
export function reconcile835OriginalReadback(verifiedClosure,readback,at){
  if(verifiedClosure?.accepted!==true||
     verifiedClosure.state!=='ONE_ORIGINAL_QL362_ROSIE_GET_RECEIPT_CLOSED_SIX_PEERS_HELD'||
     verifiedClosure.verifiedOriginalQl362Get!==true||
     verifiedClosure.verifiedIndependentWitness!==true||
     verifiedClosure.verifiedSixPeersHeld!==true||
     verifiedClosure.verifiedIndependentSignedExport!==true||
     verifiedClosure.sourceId!==SOURCE||!UUID.test(verifiedClosure.operationId??'')||
     !HEX.test(verifiedClosure.requestSha256??'')||
     !HEX.test(verifiedClosure.receiptSha256??'')||
     !HEX.test(verifiedClosure.redactedExportSha256??'')||
     verifiedClosure.connected!==false||verifiedClosure.connectedCount!==0||
     verifiedClosure.sourceTestAuthorized!==false||
     verifiedClosure.customerCommunications!==false||
     verifiedClosure.customerBytes!==0||verifiedClosure.deviceActions!==0||
     verifiedClosure.connectionState!==HELD||verifiedClosure.retryAutomatically!==false)
    return held('HOLD_ORIGINAL_QL795_SIGNED_CLOSURE_INVALID');
  if(!Number.isSafeInteger(at)||!exact(readback,readbackKeys)||
     readback.schema!=='rosie.master-shell.ql835.original-independent-post-test-readback.v1'||
     readback.sourceId!==SOURCE||readback.operationId!==verifiedClosure.operationId||
     readback.requestSha256!==verifiedClosure.requestSha256||
     readback.receiptSha256!==verifiedClosure.receiptSha256||
     readback.originalOwnerSessionVerified!==true||
     readback.independentWitnessReadback!==true||readback.receiverStopped!==true||
     readback.sourceGetCount!==1||readback.otherPeersHeld!==5||
     readback.connectedCount!==0||readback.sourceTestAuthorized!==false||
     readback.customerDataAllowed!==false||readback.customerBytes!==0||
     readback.deviceActions!==0||readback.sourceWrites!==0||
     readback.commsConnectionState!==HELD||readback.aiDataConnectionState!==HELD)
    return held('HOLD_ORIGINAL_POST_TEST_SOURCE_MASTER_READBACK_UNVERIFIED',
      {originalGetMayHaveOccurred:true});
  const observed=Date.parse(readback.observedAt);
  if(!Number.isFinite(observed)||readback.observedAt!==new Date(observed).toISOString()||
     Math.abs(observed-at)>30_000)
    return held('HOLD_ORIGINAL_POST_TEST_READBACK_STALE',
      {originalGetMayHaveOccurred:true});
  return Object.freeze({...held('ONE_ORIGINAL_RECEIPT_RECONCILED_SIX_PEERS_STILL_HELD'),
    accepted:true,originalReceiptReviewed:true,
    operationId:verifiedClosure.operationId,
    requestSha256:verifiedClosure.requestSha256,
    receiptSha256:verifiedClosure.receiptSha256,
    originalGetMayHaveOccurred:true,
    nextAction:'Independent owner review may consider a separate future connection grant; the TEST itself changes no connection state.'});
}

/** Must only be constructed by an authenticated original private operator.
 * It is deliberately not exposed through Cloudflare or a customer endpoint.
 */
export function createRosie835OriginalPilot({originalOperator,now=()=>Date.now()}={}){
  if(typeof originalOperator?.readIndependentQl835PostTestHoldReadback!=='function'||
     typeof now!=='function')
    throw Error('HOLD_ORIGINAL_OWNER_OPERATOR_AND_INDEPENDENT_POST_READBACK_REQUIRED');
  const verifier=createQl795OriginalReceiptClosure({originalOperator,now});
  let spent=false;
  return Object.freeze({
    inspect(){return held('HOLD_ONE_SOURCE_ORIGINAL_OWNER_APPROVAL_AND_RECEIPT_REQUIRED',
      {attempted:spent});},
    async runOne(input){
      if(spent)return held('DENY_DUPLICATE_OR_REPLAYED_QL835_PILOT');
      spent=true;
      const intent=input?.request;
      if(intent?.sourceId!==SOURCE||intent?.repository!==SOURCE||
         intent?.environment!=='TEST'||intent?.method!=='GET'||
         intent?.path!=='/api/integration/v1/shell/health'||
         intent?.customerDataAllowed!==false||
         intent?.deviceActionsAllowed!==false||
         intent?.persistentConnectionAllowed!==false)
        return held('DENY_NONEXACT_ROSIE_ONE_SOURCE_TEST_SCOPE');
      try{
        const closure=await verifier.runOne(input);
        if(closure?.accepted!==true)return held('HOLD_ORIGINAL_QL795_RECEIPT_NOT_ACCEPTED',
          {originalGetMayHaveOccurred:true,priorGateState:closure?.state??'UNKNOWN'});
        const after=await originalOperator.readIndependentQl835PostTestHoldReadback({
          sourceId:SOURCE,operationId:closure.operationId,
          requestSha256:closure.requestSha256,receiptSha256:closure.receiptSha256});
        return reconcile835OriginalReadback(closure,after,now());
      }catch{return held('HOLD_ORIGINAL_PRIVATE_PILOT_AMBIGUOUS_NO_RETRY',
        {originalGetMayHaveOccurred:true});}
    }
  });
}

export function ql835Status(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--status')
    return held('HOLD_ORIGINAL_PRIVATE_OPERATOR_NOT_INSTALLED_IN_REPOSITORY');
  throw Error('DENY_PUBLIC_OR_UNSUPERVISED_Ql835_EXECUTION');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{process.stdout.write(JSON.stringify(ql835Status())+'\n');}
  catch{process.stderr.write('DENY_UNSUPERVISED_SOURCE_PILOT\n');process.exitCode=1;}
}
