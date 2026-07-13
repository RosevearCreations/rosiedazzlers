import {requireStaffAccess,json} from "../_lib/staff-auth.js";
import {serviceReady,rest,clean,code,seedOutputs,jsonBody} from "../_lib/creative-projects.js";

function cors(response){const h=new Headers(response.headers);h.set('Access-Control-Allow-Origin','*');h.set('Access-Control-Allow-Methods','GET,POST,OPTIONS');h.set('Access-Control-Allow-Headers','Content-Type');h.set('Cache-Control','no-store');return new Response(response.body,{status:response.status,headers:h})}

export async function onRequest(context){
  if(context.request.method==='OPTIONS') return cors(new Response('',{status:204}));
  if(!['GET','POST'].includes(context.request.method)) return cors(json({ok:false,error:'Method not allowed.'},405));
  const access=await requireStaffAccess({request:context.request,env:context.env,capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok) return cors(access.response);
  if(!serviceReady(context.env)) return cors(json({ok:false,error:'Supabase service configuration is missing.'},503));
  try{
    const url=new URL(context.request.url);
    const body=context.request.method==='POST'?await jsonBody(context.request):{};
    const bookingId=clean(body.booking_id||url.searchParams.get('booking_id'),80);
    if(!/^[0-9a-f-]{36}$/i.test(bookingId)) return cors(json({ok:false,error:'A valid booking id is required.'},400));
    const existing=await rest(context.env,`creative_projects?select=id,project_code,title,lifecycle_status,source_mode,source_booking_id&source_booking_id=eq.${encodeURIComponent(bookingId)}&limit=1`);
    if(context.request.method==='GET') return cors(json({ok:true,mode:existing?.[0]?'creative_project':'standard_job',project:existing?.[0]||null,standard_job_preserved:!existing?.[0]}));
    if(existing?.[0]) return cors(json({ok:true,created:false,mode:'creative_project',project:existing[0]}));
    const bookings=await rest(context.env,`bookings?select=id,customer_name,package_code,vehicle_year,vehicle_make,vehicle_model,service_date&id=eq.${encodeURIComponent(bookingId)}&limit=1`);
    const booking=bookings?.[0];
    if(!booking) return cors(json({ok:false,error:'Booking not found.'},404));
    const vehicle=[booking.vehicle_year,booking.vehicle_make,booking.vehicle_model].filter(Boolean).join(' ');
    const title=clean(body.title,180)||clean(`${booking.customer_name||'Customer'} — ${booking.package_code||'detailing'}${vehicle?` — ${vehicle}`:''}`,180);
    const actor=clean(access.actor?.email,200)||null;
    const rows=await rest(context.env,'creative_projects',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({project_code:code(),title,project_type:'detailing',lifecycle_status:'planning',source_mode:'booking_opt_in',source_booking_id:bookingId,source_customer_initiated:true,purpose:'Document this selected detailing job as a creative process and prepare governed content outputs. The original booking remains the operational source of truth.',audience:'Rosie Dazzlers customers and local detailing learners',public_publish_allowed:false,consent_reviewed:false,created_by_staff_email:actor,updated_by_staff_email:actor})});
    const project=rows?.[0];
    if(!project) throw new Error('Project could not be created.');
    await seedOutputs(context.env,project.id);
    await rest(context.env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({project_id:project.id,event_type:'created',actor_staff_email:actor,safe_note:'Creative project explicitly opted in from a standard booking. Booking workflow remains unchanged.'})});
    await rest(context.env,'creative_project_booking_audit',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({booking_id:bookingId,project_id:project.id,event_type:'project_opted_in',actor_staff_email:actor,safe_note:'Staff explicitly promoted this booking to a creative project. No automatic conversion occurred.'})});
    return cors(json({ok:true,created:true,mode:'creative_project',project}));
  }catch(error){return cors(json({ok:false,error:error?.message||'Could not manage booking project link.'},500))}
}
