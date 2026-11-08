import {requireStaffAccess,serviceHeaders,json,isUuid,cleanText} from '../_lib/staff-auth.js';
import {canWorkMobileBooking745} from '../_lib/detailer-mobile-scope-v745.js';
import {loadOnsiteGate746,assessOnsite746,ONSITE_EVENT746,BAG_OPTIONS746} from '../_lib/onsite-setup-v746.js';
import {mobileStage745} from '../../../assets/detailer-mobile-dayboard-v745.mjs';

const limited=(value,max=1500)=>String(cleanText(value)||'').slice(0,max);
const nullableBool=value=>value===true?true:value===false?false:null;
const isSameOrigin=request=>request.headers.get('origin')===new URL(request.url).origin;

export async function onRequestPost({request,env}){
  try{
    const body=await request.json().catch(()=>({}));
    const bookingId=String(body.booking_id||'').trim();
    if(!isUuid(bookingId))return json({ok:false,error:'Valid booking_id required.'},400);
    const access=await requireStaffAccess({request,env,body,capability:'work_booking',bookingId,allowLegacyAdminFallback:false});
    if(!access.ok)return access.response;
    if(access.auth_mode!=='session')return json({ok:false,error:'A signed-in staff session is required.'},401);
    if(!isSameOrigin(request))return json({ok:false,error:'Onsite edits must originate from the Rosie staff app.'},403);
    if(!['load','save'].includes(body.action))return json({ok:false,error:'Choose load or save.'},400);

    const bookingRes=await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,updated_at,current_workflow_stage,job_status,status,assigned_staff_user_id,assigned_staff_email&id=eq.${encodeURIComponent(bookingId)}&limit=1`,{headers:serviceHeaders(env)});
    if(!bookingRes.ok)return json({ok:false,error:'Could not verify current job assignment.'},503);
    const bookings=await bookingRes.json().catch(()=>[]),booking=Array.isArray(bookings)?bookings[0]:null;
    if(!booking)return json({ok:false,error:'Job unavailable.'},404);
    if(!await canWorkMobileBooking745({env,actor:access.actor,booking}))return json({ok:false,error:'Job is not currently assigned to this staff member.'},403);
    const stage=mobileStage745(booking);
    // Build 805: staff must be able to reread the original private-photo consent
    // after Start or Pause. Editing still requires the exact arrived revision below.
    if(body.action==='save'&&stage!=='arrived')return json({ok:false,error:'Onsite setup can only be edited after recorded arrival and before Start.'},409);
    if(body.action==='load'&&!['arrived','detailing','paused'].includes(stage))return json({ok:false,error:'Onsite review is available only for an open assigned job.'},409);

    const current=await loadOnsiteGate746(env,bookingId);
    if(body.action==='load')return json({ok:true,intake:current.intake,receipt:current.receipt?{
      id:current.receipt.id,created_at:current.receipt.created_at,photo_consent:current.receipt.payload?.photo_consent||'not_recorded',
      extra_bag_fee_acknowledged:current.receipt.payload?.extra_bag_fee_acknowledged===true
    }:null,assessment:current.assessment,booking_revision:booking.updated_at});

    if(String(body.expected_booking_updated_at||'')!==String(booking.updated_at||'') ||
       String(body.expected_stage||'')!=='arrived' ||
       (body.expected_intake_updated_at??null)!==(current.intake?.updated_at??null))
      return json({ok:false,error:'The job or intake changed. Reload and review before saving; nothing was replayed.',code:'stale_onsite_revision'},409);
    const count=Number(body.extra_bag_count);
    if(!Number.isInteger(count)||count<0||count>25||body.extra_bag_count==null)
      return json({ok:false,error:'Extra bag count must be a whole number from 0 to 25.'},400);
    const consent=String(body.photo_consent||'not_recorded');
    if(!['internal_job_evidence','declined','not_recorded'].includes(consent))return json({ok:false,error:'Photo consent selection is invalid.'},400);
    if(body.garbage_bag_estimate && !BAG_OPTIONS746.includes(body.garbage_bag_estimate))return json({ok:false,error:'Bag review option is invalid.'},400);

    const now=new Date().toISOString(),patch={
      detailer_name:limited(access.actor.full_name||access.actor.email,180),
      vehicle_accessible_and_safe:body.vehicle_accessible_and_safe===true,
      keys_collected:body.keys_collected===true,
      water_hookup_located:body.water_hookup_located===true,
      water_tested:body.water_tested===true,
      power_hookup_located:body.power_hookup_located===true,
      power_tested:body.power_tested===true,
      owner_present_for_visual_inspection:body.owner_present_for_visual_inspection===true,
      existing_damage_notes:limited(body.existing_damage_notes),
      valuables_present:nullableBool(body.valuables_present),
      valuables_notes:limited(body.valuables_notes),
      garbage_bag_estimate:body.garbage_bag_estimate||'',
      extra_bag_count:count,
      extra_debris_charge_possible:count>0,
      extra_charge_notes:limited(body.extra_charge_notes),
      inspection_acknowledged:nullableBool(body.inspection_acknowledged),
      existing_condition_acknowledged:nullableBool(body.existing_condition_acknowledged),
      keys_handed_over_acknowledged:nullableBool(body.keys_handed_over_acknowledged),
      owner_notes:limited(body.owner_notes),
      site_weather_notes:limited(body.site_weather_notes),
      updated_at:now
    };
    const receiptPayload={event_type:ONSITE_EVENT746,payload:{intake_revision:now,photo_consent:consent,
      extra_bag_fee_acknowledged:body.extra_bag_fee_acknowledged===true}};
    const preliminary=assessOnsite746({...current.intake,...patch,intake_complete:'Yes - ready to begin'},receiptPayload);
    patch.intake_complete=preliminary.ready?'Yes - ready to begin':'No - waiting on customer / site issue';
    const changed=Object.keys(patch).filter(key=>key!=='updated_at'&&JSON.stringify(current.intake?.[key]??null)!==JSON.stringify(patch[key]??null));
    let writeRes;
    if(current.intake){
      writeRes=await fetch(`${env.SUPABASE_URL}/rest/v1/jobsite_intake?id=eq.${encodeURIComponent(current.intake.id)}&updated_at=eq.${encodeURIComponent(current.intake.updated_at)}`,
        {method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify(patch)});
    }else{
      writeRes=await fetch(`${env.SUPABASE_URL}/rest/v1/jobsite_intake`,
        {method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([{booking_id:bookingId,...patch,created_at:now}])});
    }
    if(!writeRes.ok)return json({ok:false,error:'Could not save onsite intake. Reload before retrying.'},writeRes.status===409?409:503);
    const written=await writeRes.json().catch(()=>[]),saved=Array.isArray(written)?written[0]:null;
    if(!saved)return json({ok:false,error:'Concurrent intake update detected. Reload before retrying.',code:'onsite_race_lost'},409);
    receiptPayload.payload.intake_revision=saved.updated_at;
    // A booking-scoped event is the audit receipt. Never silently claim readiness when this append fails.
    const event={booking_id:bookingId,event_type:ONSITE_EVENT746,created_at:now,
      actor_name:limited(access.actor.full_name||access.actor.email||'Staff',180),
      event_note:`Onsite setup ${patch.intake_complete==='Yes - ready to begin'?'ready':'held'}; ${changed.length} intake fields updated. No extra-bag charge made.`,
      payload:{...receiptPayload.payload,actor_id:access.actor.id||null,changed_fields:changed,
        prior_intake_revision:current.intake?.updated_at||null,readiness:preliminary.ready?'ready':'held',
        missing:preliminary.missing,potential_extra_cents:count*500,charge_created:false,photo_publication_authorized:false}};
    const eventRes=await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`,{method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify(event)}).catch(()=>null);
    if(!eventRes?.ok)return json({ok:false,error:'Intake may have saved but the audit receipt was not confirmed. Reload and seek owner review before retrying.',ambiguous_mutation:true},503);
    const verified=await loadOnsiteGate746(env,bookingId);
    return json({ok:true,intake:verified.intake,assessment:verified.assessment,
      receipt:{created_at:now,photo_consent:consent,extra_bag_fee_acknowledged:body.extra_bag_fee_acknowledged===true},
      message:verified.assessment.ready?'Onsite evidence recorded. Before photo and service checklist are still required before Start.':'Draft recorded. Resolve the listed checks before Start.'});
  }catch(error){return json({ok:false,error:error?.message||'Onsite setup unavailable. Reload before retrying.'},503);}
}
