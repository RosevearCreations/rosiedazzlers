/** Build 785 — reconcile nine locally presented candidate broker receipts.
 * NEVER initiates traffic, enrollment, signing or original owner approval.
 * Cryptographic parity is not independent original-device custody proof. */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {inspectSourceGetTest784,SOURCE_GET_PATHS_784}
  from './ql784_source_get_test_offline.mjs';

export const DENIAL_CASES_785=Object.freeze([
  ['missing_authentication',401],['invalid_credential',401],
  ['expired_credential',401],['wrong_tenant',403],
  ['wrong_audience',403],['replayed_nonce',409],
  ['untrusted_source_signer',403]]);
const SHA=/^[a-f0-9]{64}$/;
const SIG=/^[A-Za-z0-9_-]{86}$/;
const strict=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&
  Object.keys(x).length===keys.length&&Object.keys(x).every(k=>keys.includes(k));
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const sha=x=>createHash('sha256').update(canonical(x)).digest('hex');
const stamp=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s)?Date.parse(s):NaN;
const held=(state)=>({ok:false,state,positiveReceiptMechanicsVerified:0,
  negativeReceiptMechanicsVerified:0,originalSourceSignerCustodyVerified:false,
  independentlyAuthenticatedIssuer:false,genuineOwnerTestAuthorityVerified:false,
  originalPrivateOperatorVerified:false,sourceEnrollmentVerified:false,
  genuineBrokerChallengeObserved:false,liveTrialExecuted:false,
  connected:false,connection:'DISCONNECTED / HOLD',networkRequests:0,
  databaseMutations:0,customerCommunications:0});

/** Verify two positive QL784 packets and seven signed negative observation
 * candidates against a PIN from an independently trusted channel.
 * `ok` means OFFLINE FORMAT/SIGNATURE MECHANICS ONLY, never a live trial. */
export function inspectBrokerTrial785({positivePackets,negativeReceipts,pins,
  now=Date.now()}={}){
  if(!Number.isInteger(now)||!Array.isArray(positivePackets)||
    positivePackets.length!==2||!Array.isArray(negativeReceipts)||
    negativeReceipts.length!==7||!strict(pins,['sourceGet','broker',
      'sourceOwner','masterOwner']))return held('HOLD_EXACT_NINE_SLOT_TRIAL_MISSING');
  const positives=positivePackets.map(p=>inspectSourceGetTest784({packet:p,pins,now}));
  if(positives.some(p=>!p.ok)||
    positives.some((p,i)=>p.sourcePath!==SOURCE_GET_PATHS_784[i])||
    positives[0].authorizationSha256!==positives[1].authorizationSha256||
    positives[0].sourceRequestSha256===positives[1].sourceRequestSha256||
    positivePackets[0].sourceRequest.envelope.nonce===
      positivePackets[1].sourceRequest.envelope.nonce)
    return held('DENY_MISSING_DISTINCT_SIGNED_POSITIVE_GET_CANDIDATES');
  const base=positivePackets[0];
  if(positivePackets[1].publicKeys.broker.publicSpkiPem!==base.publicKeys.broker.publicSpkiPem||
    positivePackets[1].publicKeys.sourceGet.publicSpkiPem!==base.publicKeys.sourceGet.publicSpkiPem||
    positivePackets[1].publicKeys.sourceOwner.publicSpkiPem!==base.publicKeys.sourceOwner.publicSpkiPem||
    positivePackets[1].publicKeys.masterOwner.publicSpkiPem!==base.publicKeys.masterOwner.publicSpkiPem||
    canonical(positivePackets[1].authorization)!==canonical(base.authorization))
    return held('DENY_DIFFERENT_SIGNER_OR_OWNER_RENEWAL_BETWEEN_GETS');
  let broker;
  try{
    broker=createPublicKey(base.publicKeys.broker.publicSpkiPem);
    if(broker.asymmetricKeyType!=='ed25519'||
      createHash('sha256').update(broker.export({type:'spki',format:'der'})).digest('hex')!==pins.broker)
      throw Error('pin mismatch');
  }catch{return held('DENY_INDEPENDENT_BROKER_PIN_MISSING');}
  const observed=new Set(positivePackets.map(p=>sha(p.sourceRequest.envelope.nonce)));
  const requests=new Set(positivePackets.map(p=>sha(p.sourceRequest)));
  const deadline=stamp(base.authorization.payload.expiresAt);
  for(let i=0;i<DENIAL_CASES_785.length;i++){
    const r=negativeReceipts[i],e=r?.envelope;
    const [slot,status]=DENIAL_CASES_785[i];
    if(!strict(r,['envelope','signature'])||!strict(e,[
      'schema','slot','source','tenant','audience','environment','method',
      'path','requestSha256','nonceSha256','authorizationSha256','decision',
      'httpStatus','observedAt','expiresAt','customerBytes'])||
      e.schema!=='rosie.comms.broker-denial-receipt.v1'||
      e.slot!==slot||e.source!=='rosiedazzlers'||e.tenant!=='rosie-dazzlers'||
      e.audience!=='rosevear-comms-hub:nonproduction'||e.environment!=='TEST'||
      e.method!=='GET'||!SOURCE_GET_PATHS_784.includes(e.path)||
      e.authorizationSha256!==positives[0].authorizationSha256||
      !SHA.test(e.requestSha256??'')||!SHA.test(e.nonceSha256??'')||
      e.decision!=='DENIED_TEST_GET'||e.httpStatus!==status||e.customerBytes!==0||
      !Number.isFinite(stamp(e.observedAt))||
      stamp(e.observedAt)<stamp(base.authorization.payload.issuedAt)||
      stamp(e.observedAt)>now||stamp(e.observedAt)>=deadline||
      stamp(e.expiresAt)!==deadline||
      !SIG.test(r.signature??'')||
      !verify(null,Buffer.from(canonical(e)),broker,Buffer.from(r.signature,'base64url')))
      return held('DENY_UNAUTHENTIC_OR_UNSCOPED_BROKER_DENIAL_'+slot.toUpperCase());
    // A genuine replay rejection reuses exactly one successful request nonce.
    if(slot==='replayed_nonce'){
      if(e.nonceSha256!==sha(positivePackets[0].sourceRequest.envelope.nonce))
        return held('DENY_REPLAY_TEST_NOT_BOUND_TO_FIRST_NONCE');
    }else{
      if(observed.has(e.nonceSha256))return held('DENY_NONCE_REUSE_ACROSS_TRIAL_CASES');
      observed.add(e.nonceSha256);
    }
    if(requests.has(e.requestSha256))return held('DENY_REUSED_REQUEST_DIGEST');
    requests.add(e.requestSha256);
  }
  return {...held('OFFLINE_NINE_RECEIPT_SIGNATURE_MECHANICS_VALID_ORIGINAL_CUSTODY_HOLD'),
    ok:true,positiveReceiptMechanicsVerified:2,negativeReceiptMechanicsVerified:7,
    authorizationSha256:positives[0].authorizationSha256,
    receiptCandidateDigests:[...positivePackets.map(p=>sha(p.brokerReceipt)),
      ...negativeReceipts.map(r=>sha(r))],
    ownerRenewalExpiresAt:base.authorization.payload.expiresAt};
}
