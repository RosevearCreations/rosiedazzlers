/** Build 789 — original private Windows receipt closure after ONE genuine
 * QL-350/788 Rosie GET. Private Node operator ONLY. No public network path,
 * owner signing, enrollment, database credential or receiver activation here.
 */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {pathToFileURL} from 'node:url';

const HEX=/^[a-f0-9]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SIG=/^[A-Za-z0-9_-]{86}$/;
const KEYS=['schema','sourceId','tenantId','originalComputer','environment',
  'operationId','requestSha256','receiptSha256','authorizationSha256',
  'originalDeviceEnrollmentSha256','originalSourceEnrollmentSha256',
  'sourceOwnerDecisionSha256','masterOwnerDecisionSha256','result',
  'observedAt','expiresAt','customerBytes'];
const strict=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const digest=v=>createHash('sha256').update(canonical(v)).digest('hex');
const time=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)?Date.parse(v):NaN;
const held=(state,extra={})=>({schema:'rosie.comms.ql789.original-windows-get-witness.v1',
  state,accepted:false,originalWindowsWitnessAccepted:false,
  connected:false,connection:'DISCONNECTED / HOLD',sourceGrants:0,
  customerCommunications:0,deviceActions:0,retryAutomatically:false,...extra});

const rolePins=['sourceOwnerSpkiSha256','masterOwnerSpkiSha256',
  'originalIssuerSpkiSha256','sourceSignerSpkiSha256','brokerSignerSpkiSha256'];
const fieldReady=field=>field?.state===
  'ORIGINAL_FIELD_ENROLLMENT_AND_OWNER_SIGNATURES_VERIFIED'&&
  field.originalComputer==='DESKTOP-AE894KC'&&
  field.source==='rosiedazzlers'&&field.tenant==='rosie-dazzlers'&&
  field.firstOriginalDeviceReceiptCount===1&&
  ['originalDeviceEnrollmentSha256','originalSourceEnrollmentSha256',
    'sourceOwnerDecisionSha256','masterOwnerDecisionSha256',...rolePins]
    .every(k=>HEX.test(field[k]??''))&&
  field.sourceOwnerDecisionSha256!==field.masterOwnerDecisionSha256&&
  new Set(rolePins.map(k=>field[k])).size===rolePins.length;

function inspectFieldWitness({witness,pinnedOriginalWitness,field,got,
  packet,now}){
  const e=witness?.envelope,p=pinnedOriginalWitness;
  if(!strict(witness,['envelope','signature'])||!strict(e,KEYS)||
    !strict(p,['publicSpkiPem','spkiSha256'])||
    !HEX.test(p.spkiSha256??'')||typeof p.publicSpkiPem!=='string'||
    p.publicSpkiPem.length>600||!p.publicSpkiPem.startsWith('-----BEGIN PUBLIC KEY-----')||
    !SIG.test(witness.signature??''))
    return held('DENY_MISSING_OR_UNPINNED_ORIGINAL_SIGNED_WITNESS');
  let publicKey;
  try{
    publicKey=createPublicKey(p.publicSpkiPem);
    if(publicKey.asymmetricKeyType!=='ed25519'||
      createHash('sha256').update(publicKey.export({format:'der',type:'spki'}))
        .digest('hex')!==p.spkiSha256||
      !verify(null,Buffer.from(canonical(e)),publicKey,
        Buffer.from(witness.signature,'base64url')))
      throw Error('DENY_ORIGINAL_INDEPENDENT_WITNESS_SIGNATURE');
  }catch{return held('DENY_ORIGINAL_INDEPENDENT_WITNESS_SIGNATURE');}

  const body=packet.envelope;
  if(!fieldReady(field)||
    new Set([...rolePins.map(k=>field[k]),p.spkiSha256]).size!==6)
    return held('HOLD_ORIGINAL_FIELD_AND_SEPARATE_OWNER_READBACK_REQUIRED');
  const signedAt=time(e.observedAt),expires=time(e.expiresAt);
  if(e.schema!=='rosie.comms.ql789.original-signed-test-get-witness.v1'||
    e.sourceId!=='rosiedazzlers'||e.tenantId!=='rosie-dazzlers'||
    e.originalComputer!=='DESKTOP-AE894KC'||e.environment!=='TEST'||
    !UUID.test(e.operationId??'')||e.operationId!==got.originalOperationId||
    e.requestSha256!==got.requestSha256||
    e.receiptSha256!==got.originalBrokerReceiptSha256||
    e.authorizationSha256!==body.authorizationSha256||
    e.originalDeviceEnrollmentSha256!==field.originalDeviceEnrollmentSha256||
    e.originalSourceEnrollmentSha256!==field.originalSourceEnrollmentSha256||
    e.sourceOwnerDecisionSha256!==field.sourceOwnerDecisionSha256||
    e.masterOwnerDecisionSha256!==field.masterOwnerDecisionSha256||
    e.result!=='ONE_AUTHENTICATED_ROSIE_TEST_GET_STILL_HELD'||
    e.customerBytes!==0||!Number.isFinite(signedAt)||
    signedAt<time(body.issuedAt)||signedAt>now||
    signedAt>=time(body.expiresAt)||
    expires!==time(body.expiresAt))
    return held('DENY_ORIGINAL_SIGNED_WITNESS_PROVENANCE_SCOPE_OR_EXPIRY');
  return {...held('ONE_GENUINE_ROSIE_ORIGINAL_GET_WITNESS_CLOSED_STILL_HELD'),
    accepted:true,originalWindowsWitnessAccepted:true,
    witnessSha256:digest(witness),requestSha256:got.requestSha256,
    originalBrokerReceiptSha256:got.originalBrokerReceiptSha256,
    originalOperationId:got.originalOperationId};
}

/** A trusted, original private operator provides the Build 788 bridge,
 * independent DB readback and pinned field-witness public key from an
 * authenticated channel outside this request/checkout. No UI may supply them.
 * Only real original observations can justify the accepted state. */
export function createOriginalWindowsGetWitness789({bridge,originalOperator,
  now=()=>Date.now()}={}){
  if(typeof bridge?.runOne!=='function'||
    typeof originalOperator?.readOriginalField!=='function'||
    typeof originalOperator?.readAppendOnlyWitness!=='function'||
    typeof originalOperator?.resolvePinnedFieldWitness!=='function'||
    typeof now!=='function')
    throw Error('HOLD_ORIGINAL_QL350_WINDOWS_OPERATOR_NOT_INJECTED');
  let used=false,inProgress=false;
  return Object.freeze({
    inspect(){return held('ORIGINAL_PRIVATE_WINDOWS_FIELD_EXECUTION_REQUIRED',
      {attempted:used,active:inProgress});},
    async runOne(packet){
      if(used||inProgress)return held('DENY_REPLAYED_OR_PARALLEL_FIELD_CLOSURE');
      if(packet?.envelope?.source!=='rosiedazzlers'||
        packet?.envelope?.tenant!=='rosie-dazzlers'||
        packet?.envelope?.path!=='/api/integration/v1/shell/health'||
        packet?.envelope?.method!=='GET')return held('DENY_NON_ROSIE_TEST_GET');
      used=true;inProgress=true;
      try{
        // Read original DB/source/owner evidence BEFORE dispatch; QL-788 and
        // QL-350 independently re-evaluate it before the single outbound GET.
        const field=await originalOperator.readOriginalField();
        if(!fieldReady(field))
          return held('HOLD_ORIGINAL_WINDOWS_ISSUER_ENROLLMENT_AND_OWNER_CEREMONY');
        const result=await bridge.runOne(packet);
        if(result?.accepted!==true||
          result.state!=='ONE_SUPERVISED_ROSIE_TEST_GET_ACCEPTED_SOURCE_STILL_HELD'||
          result.connected!==false||!HEX.test(result.requestSha256??'')||
          !HEX.test(result.originalBrokerReceiptSha256??'')||
          !UUID.test(result.originalOperationId??''))
          return held('HOLD_GENUINE_QL350_ROSIE_GET_NOT_ACCEPTED');
        const [witness,pin]=await Promise.all([
          originalOperator.readAppendOnlyWitness({
            sourceId:'rosiedazzlers',operationId:result.originalOperationId,
            requestSha256:result.requestSha256,
            receiptSha256:result.originalBrokerReceiptSha256}),
          originalOperator.resolvePinnedFieldWitness()]);
        return inspectFieldWitness({witness,pinnedOriginalWitness:pin,
          field,got:result,packet,now:now()});
      }catch{return held('HOLD_ORIGINAL_WINDOWS_WITNESS_READBACK_FAILED');}
      finally{inProgress=false;}
    }
  });
}

export function ql789Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--status')
    return held('HOLD_ORIGINAL_WINDOWS_AUTHENTICATED_OPERATOR_NOT_IN_PUBLIC_REPO');
  throw Error('DENY_PUBLIC_OR_UNSUPERVISED_ORIGINAL_WINDOWS_GET');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{process.stdout.write(JSON.stringify(ql789Cli())+'\n');}
  catch{process.stderr.write('DENY_PUBLIC_OR_UNSUPERVISED_ORIGINAL_WINDOWS_GET\n');process.exitCode=1;}
}
