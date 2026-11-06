/** Build 781: browser-local validation of the QL-341 NONSECRET HOLD readback.
 * This validates format and negative claims, not private issuer authenticity.
 * Nothing in this module performs network requests or writes to storage. */
export const COMMS781_CONTRACT='rosevear.shell.nonproduction.v1';
export const COMMS781_PATHS=Object.freeze([
  '/api/integration/v1/shell/health',
  '/api/integration/v1/shell/capabilities'
]);
const REPOS=Object.freeze({rosiedazzlers:['business','rosiedazzlers'],
  devilndove:['business','devilndove-site'],icamp:['business','iCamp'],
  yw:['business','yw'],'ai-data-platform':['support','ai-data-platform'],
  'rosevear-ai-hub':['support','rosevear-ai-hub']});
const ALLOWED=new Set(['schema','exportedAt','source','peerCount','connectedCount',
  'customerCommunications','deviceActions','authorizedExternalGets',
  'heldDeviceReceiptCount','peers','witness']);
const PEER_FIELDS=new Set(['peerId','kind','repository','connection',
  'sourceTestAuthorized','customerDataAllowed']);
const WITNESS_FIELDS=new Set(['state','verified','connected','deviceId',
  'receivedAt','freshness','customerCommunications','deviceActions']);
const HOLD_STATES=new Set(['NOT_OBSERVED_NO_ORIGINAL_SIGNED_TEST_PACKET',
  'HOLD_NO_UNIQUE_POSTGRES_RECEIPT','DENY_POSTGRES_RECEIPT_CONTENT_MISMATCH',
  'HOLD_ORIGINAL_OWNER_ENROLLMENT_MISSING_OR_REVOKED',
  'DENY_ORIGINAL_DEVICE_SIGNATURE_OR_SCOPE',
  'HOLD_UNEXPECTED_OR_MISSING_ORIGINAL_DEVICE_PACKET']);
const HEX=/^[a-f0-9]{40}$/;
const exact=(value,allowed)=>value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).every(key=>allowed.has(key));
const rejected=reason=>({ok:false,formatValid:false,localOnly:true,
  connection:'DISCONNECTED / HOLD',authenticated:false,reason,
  networkRequests:0,customerBytes:0});

export function inspectCommsReadback781(value,{now=Date.now()}={}){
  if(!exact(value,ALLOWED)||value.schema!=='rosevear.hub.ql341.private-peer-readback.v1'||
    value.source!=='PRIVATE_POSTGRES_OWNER_READBACK'||value.peerCount!==6||
    value.connectedCount!==0||value.customerCommunications!==0||
    value.deviceActions!==0||value.authorizedExternalGets!==0||
    !Number.isSafeInteger(value.heldDeviceReceiptCount)||value.heldDeviceReceiptCount<0||
    typeof value.exportedAt!=='string'||!Number.isFinite(Date.parse(value.exportedAt))||
    Date.parse(value.exportedAt)>now+60_000||!Array.isArray(value.peers)||
    value.peers.length!==6)return rejected('DENY_ELEVATED_OR_MALFORMED_PRIVATE_READBACK');
  const seen=new Set();
  for(const peer of value.peers){
    const expected=REPOS[peer?.peerId];
    if(!exact(peer,PEER_FIELDS)||!expected||seen.has(peer.peerId)||
      peer.kind!==expected[0]||peer.repository!==expected[1]||
      peer.connection!=='DISCONNECTED / HOLD'||peer.sourceTestAuthorized!==false||
      peer.customerDataAllowed!==false)return rejected('DENY_PEER_IDENTITY_OR_CONNECTED_CLAIM');
    seen.add(peer.peerId);
  }
  const witness=value.witness;
  if(seen.size!==6||!exact(witness,WITNESS_FIELDS)||
    witness.connected!==false||typeof witness.verified!=='boolean'||
    typeof witness.state!=='string')return rejected('DENY_UNREVIEWED_WITNESS');
  if(witness.verified){
    if(witness.state!=='ORIGINAL_SIGNED_TEST_HEARTBEAT_AND_DB_RECEIPT_VERIFIED'||
      value.heldDeviceReceiptCount<1||
      !['RECENT_TEST_ONLY','HISTORICAL_TEST_ONLY'].includes(witness.freshness)||
      !Number.isFinite(Date.parse(witness.receivedAt||'')))
      return rejected('DENY_WITNESS_SIGNATURE_CLAIM');
  }else if(!HOLD_STATES.has(witness.state))return rejected('DENY_UNKNOWN_WITNESS_STATE');
  return {ok:true,formatValid:true,localOnly:true,
    reportSchema:value.schema,peerCount:6,rosiePeerStatus:'DISCONNECTED / HOLD',
    witnessClaim:witness.state,originalIssuerIndependentlyVerified:false,
    masterSignedReceiptIndependentlyVerified:false,
    authenticated:false,connection:'DISCONNECTED / HOLD',networkRequests:0,
    customerBytes:0,reason:'FORMAT_ONLY_NOT_ORIGINAL_ISSUER_AUTHENTICATION'};
}

export function buildUnsignedCommsHandoff781({sourceRevision=null,now=Date.now(),
  importedReadback=null}={}){
  if(!Number.isFinite(now))throw Error('Server-independent finite time required.');
  const readback=importedReadback?.ok===true&&importedReadback.localOnly===true?
    'NONSECRET_HOLD_FORMAT_REVIEWED_LOCAL_ONLY':'NOT_REVIEWED';
  return {schema:'rosie.comms.ql781.unsigned-test-authorization-handoff.v1',
    source_app_id:'rosiedazzlers',shell_id:'rosiedazzlers',first_child:'rosie-dazzlers',
    contract:COMMS781_CONTRACT,environment:'nonproduction',method:'GET',
    proposed_paths:[...COMMS781_PATHS],proposed_max_window_minutes:15,
    proposed_max_positive_gets:2,proposed_negative_denials:7,
    production_source_revision_reference:HEX.test(sourceRevision||'')?sourceRevision:null,
    local_private_readback_format_state:readback,
    original_source_proof_b:'NOT_VERIFIED',
    independently_pinned_source_signer:'NOT_VERIFIED',
    independently_pinned_broker_signer:'NOT_VERIFIED',
    source_child_isolation_and_backup:'NOT_VERIFIED',
    original_owner_test_authorization:'NOT_GIVEN',
    source_owner_test_authorization:'NOT_GIVEN',
    independently_verified_receiver_off:'NOT_VERIFIED',
    signed_broker_challenge:'NOT_AVAILABLE',
    signed_source_receipts:'NOT_AVAILABLE',
    independent_broker_receipt_verification:'NOT_AVAILABLE',
    seven_original_denial_traces:'NOT_RUN',
    source_test_approved:false,owner_test_approved:false,
    receiver_activated:false,nonce_claimed:false,connected:false,
    networkRequests:0,customerCommunications:false,bookingWrites:false,
    paymentActions:false,deviceActions:false,productionWrites:false,
    unsigned:true,notAnAuthorization:true,created_at:new Date(now).toISOString(),
    connection_state:'DISCONNECTED / HOLD'};
}
