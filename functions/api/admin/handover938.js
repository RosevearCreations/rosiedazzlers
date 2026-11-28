import {requireStaffAccess,isUuid} from '../_lib/staff-auth.js';
import {reply,originals,validateReport,record,latest,reportType,choiceType} from '../_lib/handover938.js';
export async function onRequestPost({request,env}) {
  try {
    const body=await request.json(), booking=body.booking_id;
    if (!isUuid(booking)) return reply({error:'Select a booking.'},400);
    const access=await requireStaffAccess({request,env,body,bookingId:booking,capability:'manage_progress',allowLegacyAdminFallback:false});
    if (!access.ok) return access.response;
    if(request.headers.get('origin')!==new URL(request.url).origin) return reply({error:'Use the staff workspace.'},403);
    if(body.action==='withdraw') {
      await record(env,booking,reportType,{withdrawn:true},access.actor?.full_name||'Staff');
      return reply({ok:true});
    }
    const media=await originals(env,booking);
    if(body.action==='read') {
      const report=await latest(env,booking,reportType),choices=await latest(env,booking,choiceType);
      return reply({media:media.map(({id,stage,caption,created_at})=>({id,stage,caption,created_at})),views:report?.payload.views,choices:report && choices?.payload.report===report.id?choices.payload:null});
    }
    const views=validateReport(body.views,media);
    if (body.action!=='save' || !views) return reply({error:'For each view choose distinct verified originals and enter a note and care advice, or skip with a reason.'},400);
    await record(env,booking,reportType,{views},access.actor?.full_name||'Staff');
    return reply({ok:true});
  } catch { return reply({error:'Private handover unavailable. Reload before retrying.'},503); }
}
