/** Rosie Build 784 — offline source-owned TEST GET / broker receipt verifier.
 * Verifies cryptographic mechanics against separately supplied pinned public keys.
 * It cannot establish original custody, independent human authority, or connectivity.
 * NO network calls, database mutations, private-key operations or customer data. */
import {createHash,createPublicKey,verify} from 'node:crypto';

const HEX=/^[a-f0-9]{64}$/;
const B64URL=/^[A-Za-z0-9_-]{86}$/;
const PATHS=['/api/integration/v1/shell/health',
  '/api/integration/v1/shell/capabilities'];
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const sha=v=>createHash('sha256').update(canonical(v)).digest('hex');
const time=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)?Date.parse(v):NaN;
const hold=(state)=>({ok:false,state,sourceSignedGetMechanicsVerified:false,
  brokerReceiptMechanicsVerified:false,ownerRenewalMechanicsVerified:false,
  originalSignerCustodyVerified:false,independentOwnerAuthorityVerified:false,
  originalBrokerReceiptIndependentlyVerified:false,sourceTestAuthorized:false,
  connected:false,connection:'DISCONNECTED / HOLD',networkRequests:0,
  databaseMutations:0,customerCommunications:0});

function pinnedVerifier(candidate,pin){
  if(!exact(candidate,['publicSpkiPem'])||!HEX.test(pin??'')||
    typeof candidate.publicSpkiPem!=='string'||candidate.publicSpkiPem.length>512||
    !candidate.publicSpkiPem.startsWith('-----BEGIN PUBLIC KEY-----'))throw Error('Invalid public key');
  const key=createPublicKey(candidate.publicSpkiPem);
  if(key.asymmetricKeyType!=='ed25519'||
    createHash('sha256').update(key.export({format:'der',type:'spki'})).digest('hex')!==pin)
    throw Error('Independent pin mismatch');
  return (body,signature)=>typeof signature==='string'&&B64URL.test(signature)&&
    verify(null,Buffer.from(canonical(body)),key,Buffer.from(signature,'base64url'));
}

/** Proposed source protocol v1; QL-354 device receipts are NOT source receipts.
 * pins must come from an independent trusted channel, not from this packet. */
export function inspectSourceGetTest784({packet,pins,now=Date.now()}={}){
  if(!Number.isFinite(now)||!Number.isInteger(now)||
    !exact(pins,['sourceGet','broker','sourceOwner','masterOwner'])||
    !exact(packet,['publicKeys','authorization','sourceRequest','brokerReceipt'])||
    !exact(packet.publicKeys,['sourceGet','broker','sourceOwner','masterOwner']))
    return hold('HOLD_MISSING_INDEPENDENT_PINS_OR_EXACT_PACKET');
  let sourceVerify,brokerVerify,sourceOwnerVerify,masterOwnerVerify;
  try{
    sourceVerify=pinnedVerifier(packet.publicKeys.sourceGet,pins.sourceGet);
    brokerVerify=pinnedVerifier(packet.publicKeys.broker,pins.broker);
    sourceOwnerVerify=pinnedVerifier(packet.publicKeys.sourceOwner,pins.sourceOwner);
    masterOwnerVerify=pinnedVerifier(packet.publicKeys.masterOwner,pins.masterOwner);
    if(new Set(Object.values(pins)).size!==4)throw Error('Signer roles not separated');
  }catch{return hold('DENY_ORIGINAL_PUBLIC_KEY_PIN_OR_ROLE_CONFLICT');}

  const auth=packet.authorization;
  const ap=auth?.payload;
  if(!exact(auth,['payload','sourceDecision','masterDecision'])||
    !exact(ap,['schema','source','tenant','audience','environment','methods',
      'paths','maxRequests','issuedAt','expiresAt','sourceKeyPin','brokerKeyPin'])||
    ap.schema!=='rosie.comms.source-test-authorization.v1'||
    ap.source!=='rosiedazzlers'||ap.tenant!=='rosie-dazzlers'||
    ap.audience!=='rosevear-comms-hub:nonproduction'||ap.environment!=='TEST'||
    !Array.isArray(ap.methods)||ap.methods.length!==1||ap.methods[0]!=='GET'||
    !Array.isArray(ap.paths)||ap.paths.length!==2||
    ap.paths.some((v,i)=>v!==PATHS[i])||ap.maxRequests!==9||
    ap.sourceKeyPin!==pins.sourceGet||ap.brokerKeyPin!==pins.broker||
    !Number.isFinite(time(ap.issuedAt))||!Number.isFinite(time(ap.expiresAt))||
    time(ap.expiresAt)-time(ap.issuedAt)>900_000||
    time(ap.expiresAt)<=time(ap.issuedAt)||now<time(ap.issuedAt)||
    now>=time(ap.expiresAt))return hold('HOLD_EXPIRED_OR_ELEVATED_OWNER_TEST_WINDOW');
  const decisionKeys=['decision','authorizationSha256','signedAt','signature'];
  const digest=sha(ap);
  for(const [v,checker] of [[auth.sourceDecision,sourceOwnerVerify],
    [auth.masterDecision,masterOwnerVerify]]){
    if(!exact(v,decisionKeys)||v.decision!=='APPROVE_TEST_ONLY'||
      v.authorizationSha256!==digest||!Number.isFinite(time(v.signedAt))||
      time(v.signedAt)<time(ap.issuedAt)||time(v.signedAt)>now||
      !checker({decision:v.decision,authorizationSha256:digest,signedAt:v.signedAt},
        v.signature))return hold('DENY_MISSING_EXPIRED_OR_MISMATCHED_INDEPENDENT_OWNER_RENEWAL');
  }
  const source=packet.sourceRequest,req=source?.envelope;
  if(!exact(source,['envelope','signature'])||
    !exact(req,['schema','source','tenant','audience','environment','method',
      'path','nonce','issuedAt','expiresAt','authorizationSha256'])||
    req.schema!=='rosie.comms.source-signed-get.v1'||
    req.source!==ap.source||req.tenant!==ap.tenant||
    req.audience!==ap.audience||req.environment!=='TEST'||req.method!=='GET'||
    !PATHS.includes(req.path)||!(/^[a-zA-Z0-9_-]{24,96}$/).test(req.nonce??'')||
    req.authorizationSha256!==digest||!Number.isFinite(time(req.issuedAt))||
    !Number.isFinite(time(req.expiresAt))||now<time(req.issuedAt)||
    now>=time(req.expiresAt)||time(req.issuedAt)<time(ap.issuedAt)||
    time(req.expiresAt)>time(ap.expiresAt)||
    time(req.expiresAt)-time(req.issuedAt)>90_000||
    !sourceVerify(req,source.signature))
    return hold('DENY_INVALID_OR_OUT_OF_SCOPE_SOURCE_SIGNED_GET');

  const broker=packet.brokerReceipt,br=broker?.envelope;
  if(!exact(broker,['envelope','signature'])||
    !exact(br,['schema','source','tenant','audience','environment','method',
      'path','requestSha256','authorizationSha256','nonceSha256','decision',
      'httpStatus','observedAt','expiresAt','customerBytes'])||
    br.schema!=='rosie.comms.broker-test-get-receipt.v1'||
    br.source!==ap.source||br.tenant!==ap.tenant||
    br.audience!==ap.audience||br.environment!=='TEST'||br.method!=='GET'||
    br.path!==req.path||br.requestSha256!==sha(source)||
    br.authorizationSha256!==digest||br.nonceSha256!==sha(req.nonce)||
    br.decision!=='ACCEPTED_TEST_GET'||br.httpStatus!==200||
    br.customerBytes!==0||!Number.isFinite(time(br.observedAt))||
    time(br.observedAt)<time(req.issuedAt)||time(br.observedAt)>now||
    time(br.observedAt)>=time(req.expiresAt)||
    time(br.expiresAt)!==time(req.expiresAt)||
    !brokerVerify(br,broker.signature))
    return hold('DENY_BROKER_RECEIPT_SIGNATURE_SCOPE_OR_PROVENANCE');

  // This is only verification of a locally supplied candidate's cryptographic
  // format. Independent original-custody checks need private operator evidence.
  return {...hold('OFFLINE_SOURCE_GET_CRYPTO_MECHANICS_VALID_ORIGINAL_AUTHORITY_HOLD'),
    ok:true,sourceSignedGetMechanicsVerified:true,
    brokerReceiptMechanicsVerified:true,ownerRenewalMechanicsVerified:true,
    sourceRequestSha256:sha(source),brokerReceiptSha256:sha(broker),
    authorizationSha256:digest,sourcePath:req.path,
    ownerTestWindowExpiresAt:ap.expiresAt};
}

export const SOURCE_GET_PATHS_784=Object.freeze([...PATHS]);

// The verifier is library-only. It intentionally exposes no execute, issue,
// enroll, start-receiver, or private network command.
