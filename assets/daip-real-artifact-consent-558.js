// Authenticated raw-object evidence is distinct from customer permission or an inspected render.
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(x);
const ref=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{2,100}$/.test(x.trim())?x.trim():null;
export function build558PrivateArtifactConsentReview({project_id='',asset_id='',artifact=null,review={},now=new Date().toISOString()}={}){
 const gaps=[],scope=artifact?.ok===true&&artifact?.build===558&&uuid(project_id)&&uuid(asset_id)&&artifact.project_id===project_id&&artifact.asset_id===asset_id;
 const raw=!!scope&&artifact.private_raw_object_head_checked===true&&artifact.private_raw_object_exists===true&&artifact.private_raw_size_matches===true&&artifact.private_raw_etag_matches===true&&artifact.upload_status==='uploaded';
 if(!scope)gaps.push('authenticated_project_asset_head_required');
 if(!artifact?.private_raw_object_exists)gaps.push('actual_private_raw_object_not_observed');
 if(!artifact?.private_raw_size_matches||!artifact?.private_raw_etag_matches)gaps.push('private_object_integrity_mismatch');
 if(['declined','expired'].includes(artifact?.asset_consent_status)||['declined','expired'].includes(artifact?.project_consent_status))gaps.push('declined_or_expired_consent');
 if(artifact?.asset_consent_status!=='approved_public'||artifact?.project_consent_status!=='approved_public'||artifact?.project_public_publish_allowed!==true)gaps.push('source_recorded_public_consent_not_approved');
 const consent=ref(review.customer_consent_reference),inspector=ref(review.privacy_inspector_reference);
 const when=Date.parse(review.inspected_at||''),clock=Date.parse(now);
 if(!consent)gaps.push('customer_signed_consent_source_reference_required');
 if(!inspector||!Number.isFinite(when)||!Number.isFinite(clock)||when>clock+300000||when<0||review.faces_plates_addresses_reviewed!==true||review.audio_rights_reviewed!==true)gaps.push('dated_human_privacy_and_audio_review_required');
 gaps.push('real_rendered_derivative_not_verified','independent_media_inspection_not_verified','customer_consent_document_not_independently_verified');
 return Object.freeze({build:558,authority:'private_raw_artifact_and_consent_review',project_id:uuid(project_id)?project_id:null,asset_id:uuid(asset_id)?asset_id:null,
  status:raw?'private_raw_verified_consent_and_render_hold':'private_artifact_hold',
  private_raw_verified:raw,private_raw_size_bytes:scope?artifact.private_raw_size_bytes:null,
  project_consent_status:scope?artifact.project_consent_status:null,asset_consent_status:scope?artifact.asset_consent_status:null,
  operator_review:{customer_consent_reference:consent,privacy_inspector_reference:inspector,inspected_at:Number.isFinite(when)?new Date(when).toISOString():null,faces_plates_addresses_reviewed:review.faces_plates_addresses_reviewed===true,audio_rights_reviewed:review.audio_rights_reviewed===true},
  gaps:[...new Set(gaps)],signed_customer_consent_independently_verified:false,rendered_media_verified:false,
  public_release_allowed:false,worker_dispatched:false,db_or_storage_written:false,canonical_hold_closed:false});
}
