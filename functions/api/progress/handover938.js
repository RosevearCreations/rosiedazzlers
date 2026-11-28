import {reply,rows,latest,record,customerReport,reportType,choiceType} from '../_lib/handover938.js';
export async function onRequestPost({request,env}) {
  try {
    if(request.headers.get('origin')!==new URL(request.url).origin) return reply({error:'Open your private progress page.'},403);
    const body=await request.json();
    if (typeof body.token!=='string' || !body.token.trim() || body.token.length>300) return reply({error:'Invalid progress link.'},400);
    const [booking]=await rows(env,'bookings',{select:'id',progress_enabled:'eq.true',progress_token:'eq.'+body.token,limit:'1'});
    if(!booking) return reply({error:'Private link unavailable.'},404);
    const report=await latest(env,booking.id,reportType);
    if (!report || report.payload.withdrawn) return reply({available:false});
    const fields=['viewPhotos','maintenance','reminders','promotionContact'];
    if (body.action==='save') {
      if(body.report!==report.id || !fields.every(k=>typeof body[k]==='boolean')) return reply({error:'Refresh the report and review each choice.'},409);
      await record(env,booking.id,choiceType,{report:report.id,...Object.fromEntries(fields.map(k=>[k,body[k]]))},'Private booking link holder');
    } else if(body.action!=='read') return reply({error:'Unknown action.'},400);
    const event=await latest(env,booking.id,choiceType);
    const choices=event?.payload.report===report.id?event.payload:{};
    return reply({available:true,report:report.id,choices,views:choices.viewPhotos?await customerReport(env,booking.id,report):null});
  } catch { return reply({error:'Private report unavailable. Reload before retrying.'},503); }
}
