/** Build 783 — local-only original QL-346 heartbeat signature mechanics.
 * Nonsecret report ONLY; no signed packet/nonce/session exported or logged.
 * This is not independent issuer custody, enrollment, or an app handshake. */
import {createHash,createPublicKey,verify} from 'node:crypto';
import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const SCHEMA='rosevear.hub.ql346.offline-test-readiness.v1';
const SHA=/^[0-9a-f]{64}$/;
const SIG=/^[A-Za-z0-9_-]{86}$/;
const FIELDS=['schemaVersion','issuer','audience','deviceId','workloadId',
  'environment','sequence','nonce','sessionId','issuedAt','expiresAt',
  'capabilities','queueDepth','relayMode'];
const exact=(v,fields)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).length===fields.length&&Object.keys(v).every(k=>fields.includes(k));
const hash=v=>createHash('sha256').update(v).digest('hex');
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const held=(state,extra={})=>({schema:SCHEMA,state,
  issuerSignatureCryptographicallyValid:false,devicePinMatches:false,
  originalIssuerIndependentlyAuthenticated:false,
  originalIssuerOutOfBandCustodyApproved:false,
  sourceOwnerTestSignatureValid:false,masterOwnerTestSignatureValid:false,
  readyForDatabaseEnrollment:false,independentHumanReviewRequired:true,
  originalReceiverStopped:false,receiverActivated:false,
  databaseEnrollmentCreated:false,connected:false,
  networkRequests:0,customerCommunications:false,deviceActions:false,...extra});

export function verifyLocalOriginalIssuer783({packet,deviceCandidate,
  outOfBandDeviceSpki,now=Date.now()}={}){
  const e=packet?.envelope;
  if(!exact(packet,['envelope','keyId','signature'])||!exact(e,FIELDS)||
    !exact(deviceCandidate,['schema','deviceId','workloadId','keyId',
      'devicePublicKeyPem','deviceSpkiSha256','enrollmentState'])||
    deviceCandidate.schema!=='rosevear.hub.ql339b.public-candidate.v1'||
    deviceCandidate.enrollmentState!=='HELD_ORIGINAL_OWNER_SIGNATURES_REQUIRED'||
    e.schemaVersion!=='rosevear.hub.relay.heartbeat.v1'||
    e.issuer!=='rosevear-ai-hub'||e.audience!=='rosevear-comms-hub:nonproduction'||
    e.environment!=='TEST'||e.deviceId!=='rosevear-windows-hub'||
    e.workloadId!=='hub-probe'||e.deviceId!==deviceCandidate.deviceId||
    e.workloadId!==deviceCandidate.workloadId||
    packet.keyId!=='hub-ql339b'||packet.keyId!==deviceCandidate.keyId||
    e.relayMode!=='OUTBOUND_ONLY'||
    JSON.stringify(e.capabilities)!=='["health.read","capabilities.read"]'||
    !Number.isSafeInteger(e.sequence)||e.sequence!==1||e.queueDepth!==0||
    !/^[A-Za-z0-9_-]{22,64}$/.test(e.nonce??'')||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(e.sessionId??'')||
    !SIG.test(packet.signature??''))return held('DENY_QL346_ORIGINAL_SCOPE_OR_EXTRA_FIELD');
  const issued=Date.parse(e.issuedAt??''),expires=Date.parse(e.expiresAt??'');
  if(!Number.isFinite(now)||!Number.isFinite(issued)||!Number.isFinite(expires)||
    new Date(issued).toISOString()!==e.issuedAt||
    new Date(expires).toISOString()!==e.expiresAt||
    issued>now+30_000||now>=expires||expires-issued!==90_000)
    return held('HOLD_EXPIRED_OR_NONSTANDARD_90_SECOND_ORIGINAL_HEARTBEAT');
  try{
    if(!SHA.test(outOfBandDeviceSpki??'')||
      deviceCandidate.deviceSpkiSha256!==outOfBandDeviceSpki)
      return held('HOLD_INDEPENDENT_DEVICE_PUBLIC_PIN_MISMATCH');
    const key=createPublicKey(deviceCandidate.devicePublicKeyPem);
    if(key.asymmetricKeyType!=='ed25519'||
      hash(key.export({type:'spki',format:'der'}))!==outOfBandDeviceSpki||
      !verify(null,Buffer.from(canonical(e)),key,Buffer.from(packet.signature,'base64url')))
      return held('DENY_ORIGINAL_DEVICE_SPKI_OR_SIGNATURE');
    return held('ORIGINAL_DEVICE_SIGNATURE_AND_PIN_MATCH_FIELD_CUSTODY_HOLD',{
      issuerSignatureCryptographicallyValid:true,devicePinMatches:true,
      signedEnvelopeSha256:hash(canonical(e)),
      devicePublicSpkiSha256:outOfBandDeviceSpki,
      originalIssuerIndependentCustodyProofRequired:true,
      checkedAt:new Date(now).toISOString()});
  }catch{return held('DENY_UNREADABLE_ORIGINAL_DEVICE_PUBLIC_KEY_OR_SIGNATURE');}
}

function readJsonFile(path){
  const bytes=statSync(resolve(path)).size;
  if(bytes<2||bytes>65_536)throw Error('HOLD_QL783_INPUT_SIZE');
  return JSON.parse(readFileSync(resolve(path),'utf8'));
}
export function ql783Cli(args=process.argv.slice(2)){
  if(args.length===1&&args[0]==='--help')
    return held('OFFLINE_NONSECRET_QL783_HELP',{command:'--verify-local ORIGINAL_QL346_HEARTBEAT.json ORIGINAL_DEVICE_PUBLIC.json INDEPENDENTLY_OBSERVED_DEVICE_SPKI_SHA256',
      networkRequests:0,privateKeysRead:false,sourceTestAuthorized:false});
  if(args.length!==4||args[0]!=='--verify-local')throw Error('DENY_UNKNOWN_OR_LIVE_QL783_ACTION');
  return verifyLocalOriginalIssuer783({packet:readJsonFile(args[1]),
    deviceCandidate:readJsonFile(args[2]),outOfBandDeviceSpki:args[3]});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(ql783Cli())+'\n');}
  catch{process.stderr.write('HOLD_QL783_LOCAL_ORIGINAL_ISSUER_REVIEW_REQUIRED\n');process.exitCode=1;}
}
