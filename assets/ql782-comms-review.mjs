/** Build 782 — offline, browser-local QL-345 PUBLIC review-only signature checks.
 * A valid Ed25519 review disposition is NEVER TEST enrollment consent, original
 * issuer authentication, a broker grant, or a signed source GET receipt.
 * No remote request, private key, database, or local storage is used. */
const CHALLENGE='rosevear.hub.ql345.issuer-owner-review-challenge.v1';
const DECISION='rosevear.hub.ql345.independent-owner-review-decision.v1';
const SHA=/^[0-9a-f]{64}$/;
const ID=/^[a-z0-9][a-z0-9._:-]{1,63}$/;
const B64=/^[A-Za-z0-9_-]{86}$/;
const EVIDENCE=['windowsWitnessSha256','privateTlsWitnessSha256',
  'tailnetAclWitnessSha256','rollbackWitnessSha256'];
const CHALLENGE_FIELDS=['schema','state','issuedAt','expiresAt','environment',
  'audience','observationSha256','evidenceDigests','tlsCertificateFileSha256',
  'ownerAuthorityPins','deviceKeyId','rollbackKind',
  'originalIssuerIndependentlyConfirmed','sourceOwnerEnrollmentApproved',
  'masterOwnerEnrollmentApproved','requestMayBeSigned','receiverActivated',
  'databaseEnrollmentCreated','connected'];
const DECISION_FIELDS=['schema','role','keyId','decision','challengeSha256',
  'signedAt','signature','enrollmentAuthorized'];
const CHOICES=['HOLD','REJECT','REVIEW_ACKNOWLEDGED_NO_ENROLLMENT'];
const DENIALS=Object.freeze(['missing_authentication','invalid_credential',
  'expired_credential','wrong_tenant','wrong_app_audience',
  'replayed_nonce','wrong_independently_pinned_signer']);
const PATHS=Object.freeze(['/api/integration/v1/shell/health',
  '/api/integration/v1/shell/capabilities']);
const own=(v,fields)=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(v).length===fields.length&&Object.keys(v).every(x=>fields.includes(x));
const held=(reason,more={})=>({ok:false,state:reason,
  signatureMechanicsVerified:false,originalIssuerAuthenticated:false,
  independentOwnerIdentityAuthenticated:false,enrollmentAuthorized:false,
  brokerChallengeAuthorized:false,sourceSignedReceiptsVerified:false,
  connection:'DISCONNECTED / HOLD',networkRequests:0,...more});
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':
  v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
const bytes=v=>new TextEncoder().encode(v);
function unbase64(v){
  if(!/^[A-Za-z0-9_-]+$/.test(v))throw Error('DENY_BAD_BASE64URL');
  const raw=atob(v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4));
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function publicSpki(pem){
  if(typeof pem!=='string'||pem.length>2048||
    !/^-----BEGIN PUBLIC KEY-----\r?\n(?:[A-Za-z0-9+/=]+\r?\n)+-----END PUBLIC KEY-----\r?\n?$/.test(pem))
    throw Error('DENY_NONPUBLIC_OR_UNRECOGNIZED_KEY');
  const payload=pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g,'');
  const raw=atob(payload);
  const value=Uint8Array.from(raw,c=>c.charCodeAt(0));
  if(value.length!==44)throw Error('DENY_NOT_ED25519_PUBLIC_SPKI');
  return value;
}
async function cryptoKey(value,subtle){
  const raw=publicSpki(value);
  const key=await subtle.importKey('spki',raw,{name:'Ed25519'},false,['verify']);
  if(key.algorithm.name!=='Ed25519')throw Error('DENY_NON_ED25519');
  return {key,fingerprint:hex(await subtle.digest('SHA-256',raw))};
}

export async function inspectOwnerReview782({challenge,sourceDecision,
  masterDecision,pinnedSourceSpki,pinnedMasterSpki,now=Date.now(),
  subtle=globalThis.crypto?.subtle}={}){
  if(!subtle||!Number.isFinite(now))return held('HOLD_LOCAL_CRYPTO_UNAVAILABLE');
  try{
    const c=challenge;
    if(!own(c,CHALLENGE_FIELDS)||c.schema!==CHALLENGE||
      c.state!=='ORIGINAL_ISSUER_AND_OWNER_REVIEW_ONLY_NOT_SIGNABLE'||
      c.environment!=='TEST'||c.audience!=='rosevear-comms-hub:nonproduction'||
      c.rollbackKind!=='INERT_ONLY_NOT_ACTIVE_RECEIVER_STOP'||
      !SHA.test(c.observationSha256)||!SHA.test(c.tlsCertificateFileSha256)||
      !own(c.evidenceDigests,EVIDENCE)||!EVIDENCE.every(k=>SHA.test(c.evidenceDigests[k]))||
      new Set(EVIDENCE.map(k=>c.evidenceDigests[k])).size!==4||
      !ID.test(c.deviceKeyId)||c.originalIssuerIndependentlyConfirmed!==false||
      c.sourceOwnerEnrollmentApproved!==false||c.masterOwnerEnrollmentApproved!==false||
      c.requestMayBeSigned!==false||c.receiverActivated!==false||
      c.databaseEnrollmentCreated!==false||c.connected!==false||
      !own(c.ownerAuthorityPins,['schema','source','master'])||
      c.ownerAuthorityPins.schema!=='rosevear.hub.ql339b.owner-authorities.v1')
      return held('DENY_CHANGED_OR_PRIVILEGED_QL345_CHALLENGE');
    const issued=Date.parse(c.issuedAt),expiry=Date.parse(c.expiresAt);
    if(!Number.isFinite(issued)||!Number.isFinite(expiry)||
      issued>now+60_000||expiry-issued!==1_200_000||now>=expiry)
      return held('HOLD_EXPIRED_OR_FUTURE_20_MINUTE_CHALLENGE');
    if(!SHA.test(pinnedSourceSpki||'')||!SHA.test(pinnedMasterSpki||'')||
      pinnedSourceSpki===pinnedMasterSpki)
      return held('HOLD_TWO_DISTINCT_OUT_OF_BAND_PUBLIC_PINS_REQUIRED');
    const pins={};
    for(const role of ['source','master']){
      const p=c.ownerAuthorityPins[role];
      if(!own(p,['keyId','publicKeyPem'])||!ID.test(p.keyId))
        return held('DENY_OWNER_PUBLIC_PIN_SHAPE');
      pins[role]=await cryptoKey(p.publicKeyPem,subtle);
      if(pins[role].fingerprint!==(role==='source'?pinnedSourceSpki:pinnedMasterSpki))
        return held('DENY_OUT_OF_BAND_OWNER_PUBLIC_PIN_MISMATCH');
    }
    if(pins.source.fingerprint===pins.master.fingerprint||
      c.ownerAuthorityPins.source.keyId===c.ownerAuthorityPins.master.keyId)
      return held('DENY_REUSED_OWNER_AUTHORITY');
    const digest=hex(await subtle.digest('SHA-256',bytes(canonical(c))));
    const reviewed={};
    for(const [role,d] of [['source',sourceDecision],['master',masterDecision]]){
      if(!own(d,DECISION_FIELDS)||d.schema!==DECISION||d.role!==role||
        d.keyId!==c.ownerAuthorityPins[role].keyId||
        d.challengeSha256!==digest||!CHOICES.includes(d.decision)||
        d.enrollmentAuthorized!==false||!B64.test(d.signature))
        return held('DENY_MISSING_OR_CHANGED_'+role.toUpperCase()+'_REVIEW');
      const when=Date.parse(d.signedAt);
      if(!Number.isFinite(when)||when<issued||when>expiry||when>now+60_000)
        return held('DENY_'+role.toUpperCase()+'_REVIEW_TIMESTAMP');
      const signed=bytes(`${role}:${d.decision}:${digest}:${d.signedAt}`);
      if(!await subtle.verify({name:'Ed25519'},pins[role].key,unbase64(d.signature),signed))
        return held('DENY_'+role.toUpperCase()+'_REVIEW_SIGNATURE');
      reviewed[role]=d.decision;
    }
    return {ok:true,state:reviewed.source==='REVIEW_ACKNOWLEDGED_NO_ENROLLMENT'&&
      reviewed.master==='REVIEW_ACKNOWLEDGED_NO_ENROLLMENT'?
      'DUAL_REVIEW_SIGNATURES_CRYPTOGRAPHICALLY_VALID_ISSUER_AND_TEST_HELD':
      'ORIGINAL_OWNER_HOLD_OR_REJECT_REVIEWED_TEST_STOP',
      signatureMechanicsVerified:true,enteredPinsMatchPublicKeys:true,
      publicChallengeDigest:digest,sourceDecision:reviewed.source,
      masterDecision:reviewed.master,originalIssuerAuthenticated:false,
      independentOwnerIdentityAuthenticated:false,enrollmentAuthorized:false,
      brokerChallengeAuthorized:false,sourceSignedReceiptsVerified:false,
      connection:'DISCONNECTED / HOLD',networkRequests:0};
  }catch{return held('DENY_BAD_PUBLIC_EVIDENCE_OR_CRYPTOGRAPHIC_REVIEW');}
}

/** A non-authorizing plan and nine empty receipt slots; no nonce, host, or
 * credential can be emitted to a public source application. */
export function brokerReceiptReview782({sourceRevision=null,
  publicReview=null,now=Date.now()}={}){
  if(!Number.isFinite(now))throw Error('HOLD_FINITE_REVIEW_TIME_REQUIRED');
  return {schema:'rosie.comms.ql782.offline-broker-receipt-review.v1',
    generated_at:new Date(now).toISOString(),source_app_id:'rosiedazzlers',
    shell_id:'rosiedazzlers',contract:'rosevear.shell.nonproduction.v1',
    environment:'TEST_ONLY_NOT_AUTHORIZED',
    source_revision_reference:/^[0-9a-f]{40}$/.test(sourceRevision||'')?sourceRevision:null,
    owner_review_signature_mechanics_checked:publicReview?.ok===true&&
      publicReview.signatureMechanicsVerified===true,
    original_issuer_authenticated:false,independent_owner_identity_authenticated:false,
    test_enrollment_authorized:false,broker_pins_trusted:false,
    nonce_store_ready:false,isolated_test_tenant_verified:false,
    original_source_proof_b_verified:false,
    max_future_window_minutes:15,max_future_gets:9,
    expected_positive:PATHS.map(path=>({method:'GET',path,
      original_signed_source_receipt:'NOT_RECEIVED',broker_signature_verified:false,
      source_signature_verified:false,immutable_witness_receipt:'NOT_RECEIVED'})),
    expected_denials:DENIALS.map(reason=>({reason,original_denial_trace:'NOT_RUN',
      independently_verified:false})),
    receipt_provenance:'NO_SIGNED_ORIGINAL_RECEIPTS_OBSERVED',
    comparison_state:'INDEPENDENT_RECEIPT_REVIEW_HOLD_NO_ORIGINAL_SIGNED_TEST',
    owner_authorization:'NOT_GIVEN',connected:false,receiver_activated:false,
    networkRequests:0,customerBytes:0,bookingWrites:0,paymentActions:0,
    outboundProviderActions:0,unsigned:true,notAnAuthorization:true};
}
