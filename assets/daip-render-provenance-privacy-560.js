// Build 560: assess scoped operator evidence without asserting unverified provider or customer authority.
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{2,100}$/;
const goodId=v=>typeof v==='string'&&ID.test(v);
const goodTime=(v,now)=>{const t=Date.parse(v||'');return Number.isFinite(t)&&t>0&&t<=now+300000};
export function reviewDerivativeAcceptance560({project_id,asset_id,derivative_id,derivativeEvidence=null,provenance={},inspection={},consent={},now=new Date().toISOString()}={}){
 const gaps=[],clock=Date.parse(now);
 const scoped=[project_id,asset_id,derivative_id].every(x=>typeof x==='string'&&UUID.test(x));
 const present=scoped&&derivativeEvidence?.build===559&&derivativeEvidence?.verified_presence_only===true
  &&derivativeEvidence?.project_id===project_id&&derivativeEvidence?.asset_id===asset_id&&derivativeEvidence?.derivative_id===derivative_id;
 if(!present)gaps.push('authenticated_scoped_private_derivative_evidence_required');
 if(!Number.isFinite(clock))gaps.push('valid_review_clock_required');
 const proof=goodId(provenance.worker_job_reference)&&goodId(provenance.output_checksum_reference)
  &&goodId(provenance.source_checksum_reference)&&provenance.project_id===project_id
  &&provenance.asset_id===asset_id&&provenance.derivative_id===derivative_id
  &&goodTime(provenance.rendered_at,clock);
 if(!proof)gaps.push('dated_source_bound_render_provenance_required');
 const reviewed=goodId(inspection.inspector_reference)&&goodId(inspection.inspection_record_reference)
  &&goodTime(inspection.inspected_at,clock)&&inspection.faces_plates_addresses_checked===true
  &&inspection.audio_rights_checked===true&&inspection.output_playback_checked===true
  &&inspection.redactions_verified===true&&inspection.result==='pass';
 if(!reviewed)gaps.push('human_content_and_privacy_inspection_required');
 const approved=goodId(consent.document_reference)&&goodId(consent.reviewer_reference)
  &&goodTime(consent.reviewed_at,clock)&&consent.scope==='specific_derivative'
  &&consent.project_id===project_id&&consent.asset_id===asset_id&&consent.derivative_id===derivative_id
  &&consent.decision==='approved'&&consent.expired!==true;
 if(!approved)gaps.push('current_derivative_scoped_customer_consent_required');
 if(inspection.inspector_reference&&inspection.inspector_reference===provenance.worker_job_reference)gaps.push('inspection_independence_not_demonstrated');
 // Operator-supplied references are not independently verified receipts or signed consent.
 gaps.push('provider_provenance_not_independently_attested','signed_customer_consent_not_independently_verified');
 return Object.freeze({build:560,private_derivative_present:!!present,operator_provenance_complete:!!proof,
  operator_privacy_review_complete:!!reviewed,operator_consent_review_complete:!!approved,
  status:present&&proof&&reviewed&&approved?'operator_evidence_complete_independent_acceptance_hold':'derivative_acceptance_hold',
  gaps:[...new Set(gaps)],independent_render_provenance_verified:false,independent_consent_verified:false,
  public_release_allowed:false,private_export_allowed:false,storage_written:false,worker_dispatched:false,canonical_hold_closed:false});
}
