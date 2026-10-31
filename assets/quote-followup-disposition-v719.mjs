// Production evidence decisions require original sources. None of these helpers
// certifies external legal identity, a physical device, or cross-app Proof-B.
const clean=value=>String(value??'').trim();
const hash=async(input,provider=globalThis.crypto)=>[...new Uint8Array(await provider.subtle.digest(
  'SHA-256',new TextEncoder().encode(input)))].map(v=>v.toString(16).padStart(2,'0')).join('');

export async function providerBindingDecision719(env,shift,availability,trial,provider=globalThis.crypto,now=new Date()){
  const base={kind:'rosie_shift_provider_production_binding_readback',build:719,
    checked_at:now.toISOString(),status:'HOLD',live_source_bound:false,
    source_get_completed:trial?.provider_response_received===true,
    shift_source_approved:shift?.shift_schedule_verified===true,
    absence_blocks_clear:availability?.hard_hold===false&&availability?.requires_manager_override!==true,
    source_revision:shift?.source_revision||null,
    source_payload_sha256:trial?.provider_payload_sha256||null,
    origin_pin_match:false,account_pin_match:false,
    independently_certified_provider:false,authorizes_reassignment:false,
    customer_notified:false,proof_b_authorized:false};
  if(!env?.ROSIE_STAFF_SHIFT_ROSTER_URL)return {...base,status:'PROVIDER_NOT_CONFIGURED'};
  let url,pinned;
  try{
    url=new URL(env.ROSIE_STAFF_SHIFT_ROSTER_URL);
    pinned=new URL(env.ROSIE_STAFF_SHIFT_ROSTER_PINNED_ORIGIN);
    if(url.protocol!=='https:'||pinned.protocol!=='https:'||pinned.origin!==clean(env.ROSIE_STAFF_SHIFT_ROSTER_PINNED_ORIGIN)||
      pinned.username||pinned.password||pinned.search||pinned.hash||pinned.pathname!=='/'||
      url.username||url.password||url.hash||url.origin!==pinned.origin)
      return {...base,status:'PINNED_ORIGIN_INVALID_OR_MISMATCHED'};
  }catch{return {...base,status:'PINNED_ORIGIN_NOT_CONFIGURED_OR_INVALID'};}
  const originHash=await hash(pinned.origin,provider),account=clean(env.ROSIE_STAFF_SHIFT_ROSTER_ACCOUNT_REF);
  const originResult={...base,origin_pin_match:true,pinned_origin_sha256:originHash};
  if(!/^[A-Za-z0-9][A-Za-z0-9._:-]{2,99}$/.test(account))
    return {...originResult,status:'PROVIDER_ACCOUNT_PIN_NOT_CONFIGURED'};
  if(!trial?.provider_get_attempted||!trial.provider_response_received)
    return {...originResult,status:'LIVE_PROVIDER_GET_NOT_COMPLETE'};
  const accountMatches=clean(shift?.provider_source_account_ref)===account;
  if(!accountMatches)return {...originResult,status:'PROVIDER_ACCOUNT_MISMATCH'};
  if(!shift?.shift_schedule_verified||availability?.hard_hold!==false||
    availability?.requires_manager_override===true||
    !/^[a-f0-9]{64}$/.test(trial?.provider_payload_sha256||'')||!clean(shift?.source_revision))
    return {...originResult,account_pin_match:true,status:'SOURCE_APPROVAL_OR_ABSENCE_HOLD'};
  return {...originResult,status:'LIVE_PINNED_ORIGIN_AND_ACCOUNT_MATCHED',live_source_bound:true,
    account_pin_match:true,source_account_ref_sha256:await hash(account,provider)};
}

const noContactDetails=text=>!/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)&&
  !/\+?\d[\d().\-\s]{7,}\d/.test(text);

export function custodyDispositionDecision719(input,witness,actor,env,now=new Date()){
  const deny=reason=>({ok:false,status:'HELD',reason,build:719,proof_b_authorized:false});
  if(!witness?.ok||witness.signature_verified_against_pinned_key!==true)
    return deny('The original witness signature does not verify against the currently pinned key.');
  const reviewer=clean(env?.ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID),
    signer=clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID),
    actorId=clean(actor?.id);
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if(!uuid.test(reviewer)||!uuid.test(signer)||reviewer===signer||
    reviewer===clean(env?.ROSIE_EXPORT_CUSTODY_WITNESS_ID)||signer===clean(env?.ROSIE_EXPORT_CUSTODY_WITNESS_ID))
    return deny('Independent reviewer and originating export-signer staff IDs must be separately configured and distinct.');
  if(actor?.role_code!=='admin'||actorId!==reviewer)
    return deny('Only the separately pinned, signed-in reviewer can disposition this witness.');
  const decision=clean(input?.custody_decision),reference=clean(input?.independent_evidence_reference),
    note=clean(input?.review_note);
  if(!['accept_for_internal_export_only','return_for_independent_followup'].includes(decision)||
    reference.length<8||reference.length>120||note.length<20||note.length>300||
    !noContactDetails(reference)||!noContactDetails(note)||
    input?.acknowledge_not_proof_b!==true)
    return deny('Select a scope-limited decision, genuine reference, non-private review note and explicit Proof-B exclusion.');
  return {ok:true,kind:'rosie_internal_export_custody_review_disposition',build:719,
    status:decision==='accept_for_internal_export_only'?'INTERNAL_EXPORT_REVIEW_ACCEPTED':'INDEPENDENT_FOLLOWUP_REQUIRED',
    decided_at:now.toISOString(),reviewer_staff_user_id:actorId,
    subject_signer_id:witness.subject_signer_id,subject_public_key_sha256:witness.subject_public_key_sha256,
    witness_id:witness.witness_id,witness_signed_payload_sha256:witness.signed_payload_sha256,
    independent_evidence_reference:reference,decision,review_note:note,
    reviewer_distinct_from_configured_originating_signer:true,
    witness_signature_verified:true,independent_human_identity_technically_verified:false,
    independently_signed_disposition:false,receipt_saved_on_server:false,
    grants_consent:false,proof_b_authorized:false,authorizes_gateway_get:false};
}

export function ownerPersistenceDecision719(review,actor,choice,acknowledge,now=new Date()){
  if(!review?.server_receipt_structure_checked||!actor?.id||actor.role_code!=='admin'||acknowledge!==true)
    return null;
  const known=['download_only','request_protected_hash_ledger'];
  if(!known.includes(choice))return null;
  const requested=choice==='request_protected_hash_ledger';
  return {kind:'rosie_owner_device_evidence_retention_decision',build:719,
    decision_at:now.toISOString(),owner_admin_staff_user_id:actor.id,
    source_feedback_sha256:review.original_unresolved_feedback_sha256,
    desktop_feedback_sha256:review.source_receipts?.[0]?.sha256,
    mobile_feedback_sha256:review.source_receipts?.[1]?.sha256,
    decision:requested?'PROTECTED_HASH_LEDGER_REQUEST_HELD':'DOWNLOAD_ONLY_NO_SERVER_RETENTION',
    approved_persistence_mode:'download_only',requested_mode:choice,
    reason:requested?'No approved private, append-only retention table, retention period and second-person review were configured.':
      'Only a locally downloadable hash-based disposition is authorized; raw owner device files remain owner-held.',
    raw_file_contents_persisted:false,hashes_persisted:false,server_owner_acceptance_recorded:false,
    device_origin_independently_verified:false,owner_witnessed_by_app:false,
    no_booking_mutation:true,grants_consent:false,proof_b_authorized:false};
}
