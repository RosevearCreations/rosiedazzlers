// Build 744: staff-only, read-only review queue. No contact, booking or revenue side effects.
import { requireStaffAccess, serviceHeaders, json } from '../_lib/staff-auth.js';
import { requireActionAccess } from '../_lib/action-permissions.js';
import { currentMarketingConsent744 } from '../../../assets/customer-followup-v744.mjs';

export async function onRequestOptions() { return json({error:'Method not allowed.'},405); }
export async function onRequestGet({request,env}) {
  const access=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
  if (!access.ok) return access.response;
  const permission=requireActionAccess(access.actor,'it.notifications.view');
  if (!permission.ok) return permission.response;
  try {
    const interests=await rows(env,'customer_followup_interests_v744?select=id,customer_profile_id,source_booking_id,interest_kind,cycle_hint,interest_month,submitted_at,review_status,consent_preference_version_id,consent_eligible_snapshot&order=submitted_at.desc&limit=70');
    const ids=[...new Set(interests.map(item=>item.customer_profile_id).filter(uuid))];
    if (!ids.length) return json({ok:true,read_only:true,no_dispatch:true,interests:[],counts:{interest:0,confirmed_revenue_from_interest_cents:0}});
    const query=`in.(${ids.join(',')})`;
    const [profiles,versions]=await Promise.all([
      rows(env,`customer_profiles?select=id,email,phone,sms_phone,is_active,notification_opt_in,notification_channel&id=${query}`),
      rows(env,`customer_communication_preference_versions?select=id,customer_profile_id,recorded_at,service_email,service_sms,service_phone,marketing_email,marketing_sms,marketing_phone&customer_profile_id=${query}&order=recorded_at.desc,id.desc&limit=300`)
    ]);
    const byProfile=new Map(profiles.map(p=>[p.id,p]));
    const latest=new Map();
    for(const version of versions) if(!latest.has(version.customer_profile_id)) latest.set(version.customer_profile_id,version);
    return json({ok:true,read_only:true,no_dispatch:true,
      interests:interests.map(item=>{
        const profile=byProfile.get(item.customer_profile_id);
        const consent=currentMarketingConsent744({profile,preference:latest.get(item.customer_profile_id)||null});
        return {id:item.id,customer_profile_id:item.customer_profile_id,customer_label:mask(profile?.email),
          source_booking_id:item.source_booking_id,interest_kind:item.interest_kind,cycle_hint:item.cycle_hint,
          submitted_at:item.submitted_at,interest_month:item.interest_month,review_status:item.review_status,
          consent_fresh:consent.fresh,currently_allowed_channels:Object.keys(consent.channels).filter(key=>consent.channels[key].allowed),
          consent_changed_since_submission:item.consent_preference_version_id!==(latest.get(item.customer_profile_id)?.id||null),
          next_action:'Review the actual completed service and local availability. Recheck consent at contact time. Do not auto-send, reserve, enroll or count as revenue.',
          contacted:false,appointment_created:false,confirmed_revenue_cents:0};
      }),counts:{interest:interests.length,confirmed_revenue_from_interest_cents:0},
      authority:{current_consent_not_a_send_authorization:true,source_booking_must_be_reviewed:true,
        provider_delivery_verified:false,automated_outreach:false}});
  } catch {return json({ok:false,error:'Follow-up review unavailable. No contact has been made.'},503);}
}
function mask(value) {const email=String(value||'').toLowerCase();const at=email.indexOf('@');return at>0?`${email[0]}***${email.slice(at)}`:'Customer account';}
function uuid(value) {return /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(String(value||''));}
async function rows(env,path) {
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});
  if(!response.ok) throw new Error('Source unavailable');
  const data=await response.json();if(!Array.isArray(data)) throw new Error('Unexpected data');return data;
}
