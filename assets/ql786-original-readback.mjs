/** Rosie Build 786 — strict local, public-only QL355/device/source/owner parity.
 * A copied status JSON cannot authenticate its original issuer or private DB.
 * This checker never establishes a source connection, signs, fetches or writes. */
const SHA=/^[a-f0-9]{64}$/;
const own=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).length===keys.length&&Object.keys(v).every(k=>keys.includes(k));
const time=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)?Date.parse(v):NaN;
const h=(state)=>({ok:false,state,reportParityVerified:false,
  originalIssuerIndependentlyAuthenticated:false,
  privateDatabaseEnrollmentIndependentlyVerified:false,
  originalOwnerTestCeremonyVerified:false,
  originalBrokerGetIndependentlyAccepted:false,
  originalPrivateOperatorAuthenticated:false,sourceTestAuthorized:false,
  connected:false,connection:'DISCONNECTED / HOLD',networkRequests:0,
  databaseMutations:0,customerCommunications:0});
const dkeys=['schema','state','deviceId','authenticatedPrivateOperator',
  'originalTestReceiptVerified','firstPrivateTestAccepted',
  'sourceTestAuthorized','connected','connectedCount','connectionState',
  'receiptCount','receiverActivated'];
const skeys=['schema','source','tenant','audience','environment','sourceKeyPin',
  'authorizationSha256','originalSourceEnrollmentCount','sourceRevocationCount',
  'originalBrokerReceiptCount','sourceState','connected','customerBytes',
  'readbackAt'];
const okeys=['schema','authorizationSha256','sourceDecision','masterDecision',
  'sourceDecisionDigest','masterDecisionDigest','expiresAt',
  'independentOriginalOwnerAuthorityVerified'];
const decisions=['HOLD','REVIEW_ONLY','TEST_APPROVAL_CANDIDATE'];

/** Inputs are independently obtained SANITIZED summaries, not proof of origin.
 * They must never contain PEMs, signatures, credentials, nonces, URLs or PII. */
export function inspectOriginalReadback786({device,source,owners,
  now=Date.now()}={}){
  if(!Number.isInteger(now))return h('HOLD_CLOCK_UNAVAILABLE');
  if(!own(device,dkeys)||device.schema!==
    'rosevear.hub.ql355.original-authority-test-acceptance.v1'||
    !['HOLD_GENUINE_ORIGINAL_AUTHORITY_REQUIRED',
      'FIRST_PRIVATE_ORIGINAL_DEVICE_TEST_ACCEPTED_SIX_SOURCES_STILL_HELD'].includes(device.state)||
    device.deviceId!=='rosevear-windows-hub'||
    device.connected!==false||device.connectedCount!==0||
    device.connectionState!=='DISCONNECTED / HOLD'||
    device.sourceTestAuthorized!==false||device.receiverActivated!==false||
    ![0,1].includes(device.receiptCount))
    return h('DENY_ELEVATED_OR_UNSAFE_QL355_DEVICE_SUMMARY');
  const hasDeviceReceipt=device.receiptCount===1;
  if(hasDeviceReceipt!==device.firstPrivateTestAccepted||
    hasDeviceReceipt!==device.originalTestReceiptVerified||
    hasDeviceReceipt!==device.authenticatedPrivateOperator||
    hasDeviceReceipt!==(device.state===
      'FIRST_PRIVATE_ORIGINAL_DEVICE_TEST_ACCEPTED_SIX_SOURCES_STILL_HELD'))
    return h('DENY_INCONSISTENT_QL355_DEVICE_RECEIPT_CLAIM');

  if(!own(source,skeys)||source.schema!==
    'rosie.comms.ql786.source-public-summary.v1'||
    source.source!=='rosiedazzlers'||source.tenant!=='rosie-dazzlers'||
    source.audience!=='rosevear-comms-hub:nonproduction'||
    source.environment!=='TEST'||!SHA.test(source.sourceKeyPin??'')||
    !SHA.test(source.authorizationSha256??'')||
    ![0,1].includes(source.originalSourceEnrollmentCount)||
    source.sourceRevocationCount!==0||
    ![0,2,9].includes(source.originalBrokerReceiptCount)||
    !['HOLD','PRIVATE_OPERATOR_REVIEW_CANDIDATE'].includes(source.sourceState)||
    source.connected!==false||source.customerBytes!==0||
    !Number.isFinite(time(source.readbackAt))||
    time(source.readbackAt)>now||now-time(source.readbackAt)>300_000)
    return h('DENY_OLD_UNSCOPED_OR_ELEVATED_ROSIE_SOURCE_SUMMARY');
  if(!hasDeviceReceipt&&(source.originalSourceEnrollmentCount>0||
    source.originalBrokerReceiptCount>0))
    return h('DENY_SOURCE_CLAIM_WITHOUT_PRIOR_ORIGINAL_DEVICE_RECEIPT');
  if(source.originalSourceEnrollmentCount===0&&
    source.originalBrokerReceiptCount!==0)
    return h('DENY_BROKER_RECEIPT_WITHOUT_ROSIE_SOURCE_ENROLLMENT');
  if(source.sourceState==='HOLD'&&source.originalBrokerReceiptCount>0)
    return h('DENY_BROKER_RECEIPT_WHILE_SOURCE_DECLARED_HELD');

  if(!own(owners,okeys)||owners.schema!==
    'rosie.comms.ql786.owner-public-continuity.v1'||
    owners.authorizationSha256!==source.authorizationSha256||
    !SHA.test(owners.sourceDecisionDigest??'')||
    !SHA.test(owners.masterDecisionDigest??'')||
    owners.sourceDecisionDigest===owners.masterDecisionDigest||
    !decisions.includes(owners.sourceDecision)||
    !decisions.includes(owners.masterDecision)||
    owners.independentOriginalOwnerAuthorityVerified!==false||
    !Number.isFinite(time(owners.expiresAt)))
    return h('DENY_OWNER_DIGEST_ROLE_OR_UNTRUSTED_APPROVAL_CLAIM');
  if(now>=time(owners.expiresAt))
    return h('HOLD_ORIGINAL_TEST_OWNER_DECISIONS_EXPIRED');
  if(source.originalBrokerReceiptCount>0&&
    (owners.sourceDecision!=='TEST_APPROVAL_CANDIDATE'||
      owners.masterDecision!=='TEST_APPROVAL_CANDIDATE'))
    return h('DENY_BROKER_TEST_CLAIM_WITHOUT_BOTH_OWNER_CANDIDATES');

  // Sanitized metadata parity cannot verify the original DB, trusted host,
  // independently enrolled source, signatures, or physical human consent.
  return {...h('PUBLIC_READBACK_PARITY_MATCHES_GENUINE_ORIGINAL_AUTHORITY_STILL_HOLD'),
    ok:true,reportParityVerified:true,
    claimedDeviceReceiptCount:device.receiptCount,
    claimedRosieSourceEnrollmentCount:source.originalSourceEnrollmentCount,
    claimedBrokerReceiptCount:source.originalBrokerReceiptCount,
    ownerReviewExpiresAt:owners.expiresAt,
    authorizationSha256:source.authorizationSha256,
    sourcePublicPinSha256:source.sourceKeyPin};
}
