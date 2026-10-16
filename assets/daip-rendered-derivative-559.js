// Build 559: strictly private, source-bound rendered derivative evidence.
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const FORMATS=Object.freeze({mp4:'video/mp4',webm:'video/webm',webp:'image/webp',jpg:'image/jpeg',png:'image/png'});
export function privateDerivativeKey(projectId,assetId,derivativeId,format){
 if(![projectId,assetId,derivativeId].every(v=>typeof v==='string'&&UUID.test(v))||!Object.hasOwn(FORMATS,format))return null;
 return `projects/${projectId}/derivatives/${assetId}/${derivativeId}.${format}`;
}
export function verifyPrivateDerivative({projectId,assetId,derivativeId,format,rawVerified=false,head=null}={}){
 const key=privateDerivativeKey(projectId,assetId,derivativeId,format);
 const bytes=Number(head?.size);
 const observedType=String(head?.httpMetadata?.contentType||'').toLowerCase().split(';')[0].trim();
 const contentTypeExpected=FORMATS[format]||null;
 const present=!!head&&Number.isSafeInteger(bytes)&&bytes>0&&observedType===contentTypeExpected;
 const gaps=[];
 if(!key)gaps.push('valid_scoped_derivative_identity_required');
 if(!rawVerified)gaps.push('source_raw_artifact_not_verified');
 if(!head)gaps.push('private_derivative_object_not_found');
 else if(!present)gaps.push('derivative_size_or_media_type_invalid');
 gaps.push('render_provenance_and_content_inspection_not_verified','independent_consent_and_privacy_acceptance_required');
 return Object.freeze({build:559,scope_valid:!!key,private_derivative_present:!!key&&present,source_raw_verified:rawVerified===true,
  verified_presence_only:!!key&&present&&rawVerified===true,
  private_size_bytes:present?bytes:null,media_type:present?observedType:null,
  status:key&&present&&rawVerified?'private_derivative_present_release_hold':'private_derivative_hold',
  gaps,rendered_media_independently_verified:false,render_provenance_verified:false,
  public_release_allowed:false,worker_dispatched:false,storage_written:false,canonical_hold_closed:false});
}
