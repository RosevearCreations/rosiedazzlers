import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {FOLLOWUP_EVENT711} from '../../../assets/quote-followup-aging-v711.mjs';
import {EXCEPTION_REVIEW_EVENT713,EXCEPTION_CODES713} from '../../../assets/quote-followup-workload-v713.mjs';
import {RESOLUTION_EVIDENCE_EVENT714,resolutionProof714,evidenceCurrent714} from
  '../../../assets/quote-followup-rebalance-v714.mjs';
import {capacitySnapshot715,capacityDecision715,CAPACITY_POLICY715} from
  '../../../assets/quote-followup-capacity-v715.mjs';
import {plannedWindow716,availabilityDecision716,AVAILABILITY_BLOCK_LIMIT716} from
  '../../../assets/quote-followup-availability-v716.mjs';
import {signEvidenceReceipt716} from
  '../../../assets/quote-followup-signature-v716.mjs';
import {shiftRosterDecision717,shiftRosterUnconfigured717} from
  '../../../assets/quote-followup-roster-v717.mjs';
import {signerCustodyAudit717} from '../../../assets/quote-followup-custody-v717.mjs';
import {shiftConnectionTrial718,verifyCustodyWitness718,evaluateOwnerDevices718} from
  '../../../assets/quote-followup-intake-v718.mjs';
import {providerBindingDecision719,custodyDispositionDecision719,ownerPersistenceDecision719} from
  '../../../assets/quote-followup-disposition-v719.mjs';
import {verifySignedEvidence720,providerDriftComparison720,recoverCustodyDisposition720,
  ownerLedgerApprovalGate720} from '../../../assets/quote-followup-recovery-v720.mjs';
import {sourceHistoryDesign721,rotatedCustodyException721,ownerLedgerSecurityReview721} from
  '../../../assets/quote-followup-governance-v721.mjs';
import {selectedDetail,publicDetail} from './quote_followup_workload.js';

const clean=value=>String(value??'').trim();
const isManager=actor=>['admin','senior_detailer'].includes(clean(actor?.role_code));
const authorize=(request,env,body,bookingId)=>requireStaffAccess({request,env,body,
  capability:'manage_bookings',bookingId,allowLegacyAdminFallback:true});
const sourceIds=['expected_latest_outcome_event_id','expected_latest_resolution_event_id',
  'expected_latest_assignment_event_id','expected_latest_consent_recheck_event_id',
  'expected_latest_escalation_event_id','expected_latest_exception_review_event_id',
  'expected_latest_resolution_evidence_event_id'];
async function rows(env,path){
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});
  if(!response.ok)throw Error('Staff source unavailable.');
  const data=await response.json().catch(()=>null);
  if(!Array.isArray(data))throw Error('Invalid staff source.');
  return data;
}
async function capacityRead715(env){
  const [quotes,events]=await Promise.all([
    rows(env,`quote_pipeline_items?select=${encodeURIComponent('id,booking_id,quote_number,status,next_follow_up_at,created_at,updated_at')}`+
      '&status=not.in.(declined,expired)&order=next_follow_up_at.asc.nullslast,updated_at.asc&limit=150'),
    rows(env,`booking_events?select=${encodeURIComponent('id,created_at,event_type,payload')}`+
      `&event_type=eq.${FOLLOWUP_EVENT711}&order=created_at.desc,id.desc&limit=800`)
  ]);
  return capacitySnapshot715(quotes,events);
}
async function availabilityRead716(env,staffId,plannedAt){
  const window=plannedWindow716(plannedAt);
  if(!window)return null;
  const blocks=await rows(env,`staff_availability_blocks?select=${encodeURIComponent('id,staff_user_id,start_at,end_at,availability_type,updated_at')}`+
    `&staff_user_id=eq.${staffId}&start_at=lt.${encodeURIComponent(window.end_at)}`+
    `&end_at=gt.${encodeURIComponent(window.start_at)}&order=start_at.asc&limit=${AVAILABILITY_BLOCK_LIMIT716}`);
  return availabilityDecision716(blocks,staffId,window,
    {truncated:blocks.length>=AVAILABILITY_BLOCK_LIMIT716});
}
async function shiftRosterRead717(env,staffId,window){
  if(!env.ROSIE_STAFF_SHIFT_ROSTER_URL)return shiftRosterUnconfigured717(staffId,window);
  // This source is set by the operator, NEVER by a browser request. Avoid
  // internal network targets and do not forward the private bearer to a redirect.
  const endpoint=new URL(env.ROSIE_STAFF_SHIFT_ROSTER_URL);
  if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.hash||
    /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[|0\.0\.0\.0)/i.test(endpoint.hostname))
    throw Error('Invalid roster source configuration');
  endpoint.searchParams.set('staff_user_id',staffId);
  endpoint.searchParams.set('start_at',window.start_at);
  endpoint.searchParams.set('end_at',window.end_at);
  const headers={'Accept':'application/json'};
  if(env.ROSIE_STAFF_SHIFT_ROSTER_BEARER)
    headers.Authorization=`Bearer ${env.ROSIE_STAFF_SHIFT_ROSTER_BEARER}`;
  const response=await fetch(endpoint,{method:'GET',headers,redirect:'error',
    signal:AbortSignal.timeout(7000)});
  if(!response.ok)throw Error('Shift roster source unavailable');
  const payload=await response.json().catch(()=>null);
  const decision=shiftRosterDecision717(payload,staffId,window);
  const encoded=new TextEncoder().encode(JSON.stringify(payload));
  if(encoded.length>100000)throw Error('Oversized roster response');
  const digest=await crypto.subtle.digest('SHA-256',encoded);
  return {...decision,provider_fetch_completed:true,
    provider_source_account_ref:typeof payload?.source_account_ref==='string'&&
      payload.source_account_ref.length<=100?payload.source_account_ref:null,
    provider_payload_sha256:[...new Uint8Array(digest)]
      .map(v=>v.toString(16).padStart(2,'0')).join('')};
}
async function providerBindingRead720(env,staffId,plannedAt){
  const eligible=await rows(env,`staff_users?select=${encodeURIComponent('id,role_code,is_active,can_manage_bookings')}`+
    `&id=eq.${staffId}&is_active=eq.true&limit=1`),staff=eligible[0];
  if(!staff||!['admin','senior_detailer','detailer'].includes(staff.role_code)||
    (staff.role_code!=='admin'&&staff.can_manage_bookings!==true))
    throw Error('STAFF_NOT_ELIGIBLE');
  const availability=await availabilityRead716(env,staffId,plannedAt);
  const shift=await shiftRosterRead717(env,staffId,availability.window);
  const trial=shiftConnectionTrial718(shift,availability,staffId,
    availability.window,Boolean(env.ROSIE_STAFF_SHIFT_ROSTER_URL));
  const binding=await providerBindingDecision719(env,shift,availability,trial);
  const {provider_source_account_ref:_privateProviderAccount,...publicShiftRoster}=shift;
  return {availability,shift_roster:publicShiftRoster,trial,provider_binding:binding};
}
function evidenceEvents(record){
  return record.events714||[];
}
async function liveDetail(env,id){
  const record=await selectedDetail(env,id);
  if(!record)return null;
  // Read back the dedicated evidence events separately by exact booking, since
  // the prior review helper intentionally exposes only the older event types.
  const bookingId=record.state.source.booking?.id;
  const events=isUuid(bookingId)?await rows(env,
    `booking_events?select=${encodeURIComponent('id,created_at,event_type,actor_name,payload')}`+
    `&booking_id=eq.${bookingId}&event_type=eq.${RESOLUTION_EVIDENCE_EVENT714}`+
    `&order=created_at.desc,id.desc&limit=100`):[];
  return {...record,events714:events.filter(e=>e.payload?.quote_id===id&&
    e.payload?.booking_id===bookingId),evidenceLimitReached:events.length===100};
}
function latestReview(record,code){
  return record.reviewEvents.find(e=>e.event_type===EXCEPTION_REVIEW_EVENT713&&
    e.payload?.action==='review_exception'&&e.payload.exception_code===code)||null;
}
function publicDetail714(record,actor){
  const base=publicDetail(record,actor),f=record.review.followup;
  const readiness=EXCEPTION_CODES713.map(code=>{
    const original=latestReview(record,code),proof=resolutionProof714(code,record.review,original);
    return original&&proof?{exception_code:code,proof_kind:proof.kind,proof_event_id:proof.event_id,
      original_exception_review_event_id:original.id,
      verified:evidenceCurrent714(evidenceEvents(record),code,record.review,original)}:null;
  }).filter(Boolean);
  return {...base,assigned_staff_user_id:f.assigned?.payload.assigned_staff_user_id||null,
    can_rebalance:f.can_assign,assignment_current:f.assignment_current,
    recheck_current:f.recheck_current,owner_review_current:record.review.owner_review_current,
    resolution_readiness:readiness,latest_resolution_evidence_event_id:record.events714[0]?.id||null,
    evidence_history:record.events714.slice(0,20).map(e=>({id:e.id,
      created_at:e.created_at,actor_name:e.actor_name,
      exception_code:e.payload.exception_code,proof_kind:e.payload.proof_kind,
      note:e.payload.note})),
    event_history_may_be_truncated:record.eventLimitReached||record.evidenceLimitReached,
    owner_acceptance_recorded_on_server:false,owner_acceptance_pending:true,build:720};
}
function fresh(record,body){
  const f=record.review.followup,marker=f.resolution.marker;
  return Object.keys(marker).every(k=>body.expected_marker[k]===marker[k])&&
    clean(body.expected_latest_outcome_event_id)===clean(f.resolution.latest_outcome_event_id)&&
    clean(body.expected_latest_resolution_event_id)===clean(f.resolution.latest_resolution_event_id)&&
    clean(body.expected_latest_assignment_event_id)===clean(f.assignment?.id)&&
    clean(body.expected_latest_consent_recheck_event_id)===clean(f.latest_check?.id)&&
    clean(body.expected_latest_escalation_event_id)===clean(record.review.latest?.id)&&
    clean(body.expected_latest_exception_review_event_id)===clean(record.reviewEvents[0]?.id)&&
    clean(body.expected_latest_resolution_evidence_event_id)===clean(record.events714[0]?.id);
}
async function appendEvent(env,event){
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`,{method:'POST',
    headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([event])});
  if(!response.ok)return null;
  const saved=await response.json().catch(()=>null);
  return Array.isArray(saved)?saved[0]||null:null;
}
export async function onRequestGet({request,env}){
  const search=new URL(request.url).searchParams,id=search.get('quote_id')||'',
    exporting=search.get('export')==='evidence',staffId=search.get('staff_user_id')||'',
    plannedAt=search.get('planned_followup_at')||'',signed=search.get('receipt')==='signed',
    signerAudit=search.get('audit')==='signer',shiftTrial=search.get('trial')==='shift',
    bindingAudit=search.get('audit')==='provider_binding';
  if(exporting&&!id)return json({ok:false,error:'Select a saved quote before exporting internal evidence.'},400);
  if(id&&!isUuid(id))return json({ok:false,error:'A valid saved quote ID is required.'},400);
  if(staffId&&(!isUuid(staffId)||!plannedWindow716(plannedAt)))
    return json({ok:false,error:'Select an eligible staff member and a future follow-up time within 30 days.'},400);
  if((shiftTrial||bindingAudit)&&!staffId)return json({ok:false,error:'Choose a staff member and planned time for a real shift source trial.'},400);
  const access=await authorize(request,env,{});
  if(!access.ok)return access.response;
  if(!isManager(access.actor))return json({ok:false,error:'Management access required.'},403);
  try{
    if(signerAudit)return json({ok:true,build:717,audit:await signerCustodyAudit717(env)});
    if(id){const record=await liveDetail(env,id);
      if(!record)return json({ok:false,error:'Saved quote not found.'},404);
      if(exporting){
        if(record.eventLimitReached||record.evidenceLimitReached)
          return json({ok:false,error:'Evidence history reached its safe read limit; export refused.'},409);
        const detail=publicDetail714(record,access.actor),receipt={
          type:'rosie_internal_followup_resolution_evidence',schema:1,build:720,
          exported_at:new Date().toISOString(),quote_id:detail.quote_id,
          booking_id:detail.booking_id,quote_number:detail.quote_number,
          source_marker:detail.marker,latest_evidence_event_id:detail.latest_resolution_evidence_event_id,
          current_resolution_readiness:detail.resolution_readiness,
          evidence_events:detail.evidence_history,
          metadata:{role_restricted:true,readback_limit:100,
            customer_contacted:false,grants_consent:false,closes_audit:false,
            cryptographically_signed:signed,live_consent_grant_verified:false,
            source_data_only:true}};
        if(signed&&!(await signerCustodyAudit717(env)).signing_available)return json({ok:false,
          error:'Signed export option is unavailable: a real server Ed25519 signing key and signer ID must be configured.'},503);
        let exportBody=receipt;
        if(signed){try{exportBody=await signEvidenceReceipt716(receipt,env);}
          catch{return json({ok:false,error:'Server export signing failed; no signed receipt was produced.'},503);}}
        return new Response(JSON.stringify(exportBody,null,2),{status:200,headers:{
          'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
          'Content-Disposition':`attachment; filename="rosie-evidence-${id.slice(0,8)}-build720-${signed?'signed':'unsigned'}.json"`,
          'X-Content-Type-Options':'nosniff'}});
      }
      return json(publicDetail714(record,access.actor));}
    if(staffId){
      let source;
      try{source=await providerBindingRead720(env,staffId,plannedAt);}
      catch(error){return json({ok:false,error:error.message==='STAFF_NOT_ELIGIBLE'?
        'Selected staff member is no longer eligible.':'Configured source is unavailable; no successful provider binding claimed.',
        trial_status:'SOURCE_UNAVAILABLE',binding_status:'SOURCE_UNAVAILABLE',build:720},
        error.message==='STAFF_NOT_ELIGIBLE'?409:503);}
      if(bindingAudit&&signed){
        if(access.auth_mode!=='session'||access.actor?.role_code!=='admin'||!isUuid(access.actor?.id))
          return json({ok:false,error:'A signed-in administrator is required to issue a signed source baseline.',build:720},403);
        if(!source.provider_binding.live_source_bound)
          return json({ok:false,error:'A live fully bound shift source is required before signing any baseline.',
            provider_binding:source.provider_binding,build:720},409);
        try{return json({ok:true,...source,
          signed_provider_binding:await signEvidenceReceipt716(source.provider_binding,env),build:720});}
        catch{return json({ok:false,error:'The configured export signer could not sign the real provider baseline.',build:720},503);}
      }
      return json({ok:true,availability:source.availability,shift_roster:source.shift_roster,
        ...(shiftTrial?{trial:source.trial}:{}),
        ...(shiftTrial||bindingAudit?{provider_binding:source.provider_binding}:{}),build:720});
    }
    const roster=await rows(env,`staff_users?select=${encodeURIComponent('id,full_name,role_code,is_active,can_manage_bookings')}`+
      `&is_active=eq.true&order=full_name.asc&limit=100`);
    const capacity=await capacityRead715(env);
    const signerAuditResult=await signerCustodyAudit717(env);
    return json({ok:true,eligible_staff:roster.filter(s=>
      ['admin','senior_detailer','detailer'].includes(s.role_code)&&
      (s.role_code==='admin'||s.can_manage_bookings===true)).map(s=>({id:s.id,
        full_name:clean(s.full_name).slice(0,120),role_code:s.role_code,
        is_active:s.is_active,can_manage_bookings:s.can_manage_bookings})),
      roster_may_be_truncated:roster.length===100,availability_verified:false,
      capacity_verified:false,capacity_policy:CAPACITY_POLICY715,
      capacity_source_truncated:capacity.source_truncated||roster.length===100,
      capacity_by_staff:capacity.by_staff,
      export_signing_available:signerAuditResult.signing_available,
      signer_custody_status:signerAuditResult.status,
      shift_roster_source_configured:Boolean(env.ROSIE_STAFF_SHIFT_ROSTER_URL),
      availability_source:'staff_availability_blocks',availability_is_shift_roster:false,
      requires_selected_live_review:true,build:720});
  }catch{return json({ok:false,error:'Active staff source unavailable. No reassignment offered.'},503);}
}
export async function onRequestPost({request,env}){
  if(Number(request.headers.get('content-length')||0)>130000)
    return json({ok:false,error:'Evidence request exceeds the protected 130 KB limit.'},413);
  const body=await request.json().catch(()=>({}));
  const quoteId=clean(body.quote_id),bookingId=clean(body.booking_id),note=clean(body.note),
    action=clean(body.action),code=clean(body.exception_code);
  if(['verify_export_custody_witness','review_owner_devices','review_export_custody_disposition',
    'decide_owner_device_retention','compare_provider_binding','recover_custody_disposition',
    'review_owner_ledger_gate','review_source_history_design',
    'recover_rotated_custody_exception','review_owner_ledger_security'].includes(action)){
    const access=await authorize(request,env,body);
    if(!access.ok)return access.response;
    if(access.actor?.role_code!=='admin')return json({ok:false,error:'Owner administrator access is required to review witness or device evidence.'},403);
    if(access.auth_mode!=='session'||!isUuid(access.actor?.id))return json({ok:false,
      error:'A signed-in administrator with a verified staff identity is required for evidence intake. Legacy password and bridge identity cannot record owner acceptance.'},403);
    if(action==='recover_rotated_custody_exception'){
      if(body.acknowledge_not_approval!==true)return json({ok:false,
        error:'Confirm this old-key exception is not a new custody, witness, owner or Proof-B approval.',build:721},409);
      const audit=await signerCustodyAudit717(env);
      const exception=await rotatedCustodyException721(body.previous_signed_evidence,
        body.rotation_witness_envelope,access.actor,env,audit);
      if(!exception.ok)return json({ok:false,error:exception.reason,status:exception.status,build:721},409);
      try{return json({ok:true,receipt:exception,
        signed_receipt:await signEvidenceReceipt716(exception,env),build:721});}
      catch{return json({ok:false,error:'Current signer could not sign the bounded rotation-exception receipt.',build:721},503);}
    }
    if(['review_source_history_design','review_owner_ledger_security'].includes(action)){
      const audit=await signerCustodyAudit717(env),expectedKind=action==='review_source_history_design'?
        'rosie_shift_provider_production_binding_readback':'rosie_owner_evidence_ledger_approval_gate';
      const verified=await verifySignedEvidence720(body.signed_evidence,expectedKind,env,audit);
      if(!verified.ok)return json({ok:false,error:verified.reason,status:'HOLD',build:721},409);
      let receipt;
      if(action==='review_source_history_design'){
        if(!isUuid(body.staff_user_id)||!plannedWindow716(body.planned_followup_at))
          return json({ok:false,error:'Select actual staff and an eligible planned hour for a fresh provider comparison.',build:721},400);
        let current;
        try{current=await providerBindingRead720(env,body.staff_user_id,body.planned_followup_at);}
        catch{return json({ok:false,error:'Cannot review history design without a real current provider source GET.',build:721},503);}
        const comparison=providerDriftComparison720(verified.receipt,current.provider_binding);
        receipt=sourceHistoryDesign721(verified,comparison,access.actor,body);
      }else receipt=ownerLedgerSecurityReview721(verified,access.actor,env,body);
      if(!receipt)return json({ok:false,error:'A genuine scoped source receipt, distinct authorized review role and explicit no-storage decision are required.',build:721},409);
      try{return json({ok:true,receipt,signed_receipt:await signEvidenceReceipt716(receipt,env),build:721});}
      catch{return json({ok:false,error:'Current signer cannot issue the protected design-review receipt.',build:721},503);}
    }
    if(['compare_provider_binding','recover_custody_disposition','review_owner_ledger_gate'].includes(action)){
      const audit=await signerCustodyAudit717(env);
      const expectedKind=action==='compare_provider_binding'?'rosie_shift_provider_production_binding_readback':
        action==='recover_custody_disposition'?'rosie_internal_export_custody_review_disposition':
        'rosie_owner_device_evidence_retention_decision';
      const original=await verifySignedEvidence720(body.signed_evidence,expectedKind,env,audit);
      if(!original.ok)return json({ok:false,error:original.reason,status:'HOLD',build:720},409);
      if(action==='compare_provider_binding'){
        if(!isUuid(body.staff_user_id)||!plannedWindow716(body.planned_followup_at))
          return json({ok:false,error:'Select a valid staff member and future time for a new actual source GET.',build:720},400);
        let current;
        try{current=await providerBindingRead720(env,body.staff_user_id,body.planned_followup_at);}
        catch{return json({ok:false,error:'Fresh provider or staff source unavailable. Baseline was not compared to a successful live GET.',
          drift_status:'CURRENT_PROVIDER_SOURCE_UNAVAILABLE',build:720},503);}
        const comparison=providerDriftComparison720(original.receipt,current.provider_binding);
        return json({ok:true,receipt:comparison,build:720});
      }
      if(action==='recover_custody_disposition'){
        const recovered=recoverCustodyDisposition720(original,access.actor,env);
        return recovered?json({ok:true,receipt:recovered,build:720}):
          json({ok:false,error:'The original signed receipt does not match the separately designated current reviewer or current custody scope.',build:720},409);
      }
      const review=ownerLedgerApprovalGate720(original,access.actor,env,body);
      if(!review)return json({ok:false,error:'A genuine signed ledger request, a distinct pinned reviewer, bounded retention and explicit inactive-ledger acknowledgement are required.',build:720},409);
      try{return json({ok:true,receipt:review,
        signed_receipt:await signEvidenceReceipt716(review,env),build:720});}
      catch{return json({ok:false,error:'The live server signer could not sign the ledger approval-gate receipt.',build:720},503);}
    }
    if(action==='verify_export_custody_witness'){
      const audit=await signerCustodyAudit717(env);
      const result=await verifyCustodyWitness718(body.witness_envelope,env,audit);
      return result.ok?json({ok:true,receipt:result,build:719}):
        json({ok:false,error:result.reason,receipt:result,build:719},409);
    }
    if(action==='review_export_custody_disposition'){
      const audit=await signerCustodyAudit717(env);
      const verified=await verifyCustodyWitness718(body.witness_envelope,env,audit);
      const result=custodyDispositionDecision719(body,verified,access.actor,env);
      if(!result.ok)return json({ok:false,error:result.reason,receipt:result,build:719},409);
      try{return json({ok:true,receipt:result,signed_receipt:await signEvidenceReceipt716(result,env),build:719});}
      catch{return json({ok:false,error:'Live internal signer could not sign the scoped disposition; no verified export created.',build:719},503);}
    }
    if(action==='decide_owner_device_retention'){
      const review=await evaluateOwnerDevices718(body,access.actor);
      const result=ownerPersistenceDecision719(review,access.actor,clean(body.retention_choice),
        body.acknowledge_data_minimization);
      if(!result)return json({ok:false,error:'Actual files, administrator identity, explicit data-minimization approval and a recognized retention choice are required.',build:719},409);
      const audit=await signerCustodyAudit717(env);
      if(!audit.signing_available)return json({ok:true,receipt:result,signed_receipt:null,
        signature_status:'SIGNER_NOT_CONFIGURED',build:719});
      try{return json({ok:true,receipt:result,signed_receipt:await signEvidenceReceipt716(result,env),
        signature_status:'INTERNAL_SIGNER_ONLY',build:719});}
      catch{return json({ok:false,error:'Internal receipt signing failed; no evidence export created.',build:719},503);}
    }
    const result=await evaluateOwnerDevices718(body,access.actor);
    return result?json({ok:true,receipt:result,build:719}):
      json({ok:false,error:'Both actual owner device receipts and the linked unresolved issue must pass source, time and identity checks. No closure recorded.',build:719},409);
  }
  if(!isUuid(quoteId)||!isUuid(bookingId)||
    !['rebalance_owner','verify_exception_resolution'].includes(action)||
    !body.expected_marker||typeof body.expected_marker!=='object'||Array.isArray(body.expected_marker)||
    !sourceIds.every(key=>Object.hasOwn(body,key))||
    body.acknowledge_manager_review!==true||note.length<12||note.length>300||
    (action==='rebalance_owner'&&(!isUuid(body.target_staff_user_id)||
      !plannedWindow716(body.planned_followup_at)))||
    (action==='verify_exception_resolution'&&!EXCEPTION_CODES713.includes(code)))
    return json({ok:false,error:'Valid quote, booking, manager acknowledgement, note and exact live source markers are required.'},400);
  if(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(note)||/\+?\d[\d().\-\s]{7,}\d/.test(note))
    return json({ok:false,error:'Remove customer contact information from the internal note.'},400);
  const access=await authorize(request,env,body,bookingId);
  if(!access.ok)return access.response;
  if(!isManager(access.actor))return json({ok:false,error:'Only management can rebalance staff or verify exception evidence.'},403);
  try{
    const record=await liveDetail(env,quoteId);
    if(!record||record.state.source.quote.booking_id!==bookingId||
      record.state.source.booking?.id!==bookingId)
      return json({ok:false,error:'Saved quote and booking no longer match.'},409);
    if(record.eventLimitReached||record.evidenceLimitReached)
      return json({ok:false,error:'Protected audit history reached its safe read limit; independent review required.'},409);
    if(!fresh(record,body))return json({ok:false,error:'Assignment, consent, exception or evidence source changed. Refresh first.'},409);
    const f=record.review.followup,marker=f.resolution.marker,
      actor=clean(access.actor?.full_name||access.actor?.email||'Authorized manager').slice(0,120);
    let event;
    if(action==='rebalance_owner'){
      if(!f.can_assign)return json({ok:false,error:'Closed or non-actionable quotes cannot be reassigned.'},409);
      const staff=await rows(env,`staff_users?select=${encodeURIComponent('id,full_name,role_code,is_active,can_manage_bookings')}`+
        `&id=eq.${body.target_staff_user_id}&is_active=eq.true&limit=1`),target=staff[0];
      if(!target||!['admin','senior_detailer','detailer'].includes(target.role_code)||
        (target.role_code!=='admin'&&target.can_manage_bookings!==true))
        return json({ok:false,error:'Target must be a currently active staff member authorized for booking follow-ups.'},409);
      if(f.assignment_current&&f.assigned?.payload.assigned_staff_user_id===target.id)
        return json({...publicDetail714(record,access.actor),already_current:true});
      const capacity=await capacityRead715(env),bucket=record.review.overdue?
        (record.review.overdue_days>=3?'critical':'overdue'):'scheduled';
      const decision=capacityDecision715(capacity,target.id,bucket);
      if(decision.hard_hold)return json({ok:false,error:'Queue capacity source reached its safe limit; reassignment blocked pending an independent full review.',capacity:decision},409);
      const availability=await availabilityRead716(env,target.id,body.planned_followup_at);
      if(!availability||availability.hard_hold)return json({ok:false,
        error:'A recorded staff absence or an incomplete availability source blocks this planned follow-up window.',availability},409);
      const shift_roster=await shiftRosterRead717(env,target.id,availability.window);
      if(shift_roster.hard_hold)return json({ok:false,
        error:'The configured roster did not verify an approved working shift covering this hour.',shift_roster},409);
      if(shift_roster.requires_manual_shift_acknowledgement&&
        !(body.acknowledge_unverified_shift===true&&note.length>=20))
        return json({ok:false,error:'No shift source is configured. Manager must explicitly acknowledge unverified hours with a detailed note.',shift_roster},409);
      if((decision.requires_manager_override||availability.requires_manager_override)&&
        !(body.acknowledge_capacity_override===true&&note.length>=20))
        return json({ok:false,error:'Queue threshold or a light-duty staff block requires explicit management override and a detailed note.',capacity:decision,availability},409);
      event={booking_id:bookingId,event_type:FOLLOWUP_EVENT711,actor_name:actor,
        event_note:'Manager staff workload rebalance only; consent recheck is required after reassignment.',
        payload:{quote_id:quoteId,booking_id:bookingId,action:'assign',marker,
          assigned_staff_user_id:target.id,assigned_staff_name:clean(target.full_name).slice(0,120),
          previous_assignment_event_id:f.assignment?.id||null,
          outcome_event_id:f.resolution.latest_outcome_event_id,
          resolution_event_id:f.resolution.latest_resolution_event_id,
          rebalance_note:note,rebalance_by_manager:true,staff_only:true,
          queue_capacity_projected:decision.projected,
          queue_capacity_exceeded:decision.exceeded,
          queue_capacity_override:decision.requires_manager_override||availability.requires_manager_override,
          planned_followup_at:availability.window.start_at,
          availability_source:'staff_availability_blocks',
          availability_block_check_completed:availability.recorded_block_check_completed,
          availability_light_duty_count:availability.light_duty_count,
          availability_conflicting_absence_count:availability.conflicting_absence_count,
          hours_or_shift_verified:shift_roster.shift_schedule_verified,
          shift_roster_source:shift_roster.source,
          shift_roster_revision:shift_roster.source_revision||null,
          verified_shift_ids:shift_roster.verified_shift_ids,
          unverified_shift_manager_acknowledged:shift_roster.requires_manual_shift_acknowledgement&&
            body.acknowledge_unverified_shift===true,
          customer_notified_by_this_action:false,provider_delivery_verified:false,
          grants_consent:false,build:718}};
    }else{
      const original=latestReview(record,code),proof=resolutionProof714(code,record.review,original);
      if(!original||!proof)return json({ok:false,error:'No original manager review and actual subsequent live remedy found for this exception.'},409);
      if(evidenceCurrent714(evidenceEvents(record),code,record.review,original))
        return json({...publicDetail714(record,access.actor),already_current:true});
      event={booking_id:bookingId,event_type:RESOLUTION_EVIDENCE_EVENT714,actor_name:actor,
        event_note:'Internal evidence review: one former exception signal is no longer active. No audit closure.',
        payload:{quote_id:quoteId,booking_id:bookingId,action:'verify_resolution',
          exception_code:code,note,marker,proof_kind:proof.kind,proof_event_id:proof.event_id,
          exception_review_event_id:original.id,assignment_event_id:f.assignment?.id||null,
          consent_recheck_event_id:f.latest_check?.id||null,
          escalation_event_id:record.review.latest?.id||null,
          outcome_event_id:f.resolution.latest_outcome_event_id,
          resolution_event_id:f.resolution.latest_resolution_event_id,
          previous_resolution_evidence_event_id:record.events714[0]?.id||null,
          staff_only:true,customer_contacted:false,grants_consent:false,
          closes_audit:false,build:714}};
    }
    const saved=await appendEvent(env,event);
    if(!saved?.id)return json({ok:false,error:'Internal evidence save did not confirm a receipt. Check history before retrying.'},502);
    const after=await liveDetail(env,quoteId);
    return after?json({...publicDetail714(after,access.actor),recorded:true,
      recorded_event_id:saved.id,requires_consent_recheck:action==='rebalance_owner'}):
      json({ok:false,error:'Event saved but the latest source is unavailable. Recheck manually.'},409);
  }catch{return json({ok:false,error:'Live review or staff source unavailable. No customer message sent.'},503);}
}
