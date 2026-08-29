export async function onRequestPost({request,env}){
  try{
    const body=await request.json().catch(()=>({}));
    const token=clean(body.token); const name=clean(body.name).slice(0,160);
    if(!token||!name||name.length<2)return json({ok:false,error:'Enter your name to acknowledge the completed-job summary.'},400);
    if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)return json({ok:false,error:'Server configuration is incomplete.'},500);
    const headers=serviceHeaders(env);
    const bookingRes=await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,progress_enabled,progress_token&progress_token=eq.${encodeURIComponent(token)}&limit=1`,{headers});
    if(!bookingRes.ok)return json({ok:false,error:`Could not resolve booking. ${await bookingRes.text()}`},500);
    const booking=(await bookingRes.json().catch(()=>[]))?.[0]||null;
    if(!booking||booking.progress_enabled===false)return json({ok:false,error:'Progress record not found or is disabled.'},404);
    const summaryRes=await fetch(`${env.SUPABASE_URL}/rest/v1/completed_job_summaries?select=id,customer_visible,status&booking_id=eq.${encodeURIComponent(booking.id)}&customer_visible=eq.true&limit=1`,{headers});
    if(!summaryRes.ok)return json({ok:false,error:`Could not load summary. ${await summaryRes.text()}`},500);
    const summary=(await summaryRes.json().catch(()=>[]))?.[0]||null;
    if(!summary)return json({ok:false,error:'A customer-visible completed-job summary is not available yet.'},404);
    const now=new Date().toISOString();
    const patch={customer_acknowledged_at:now,customer_acknowledged_name:name,customer_acknowledgement_version:'completed_summary_acknowledgement_v1',updated_at:now};
    const save=await fetch(`${env.SUPABASE_URL}/rest/v1/completed_job_summaries?id=eq.${encodeURIComponent(summary.id)}`,{method:'PATCH',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify(patch)});
    if(!save.ok)return json({ok:false,error:`Could not record acknowledgement. Run the Build 213 migration. ${await save.text()}`,migration:'sql/2026-06-22_build213_owner_action_customer_trust.sql'},500);
    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`,{method:'POST',headers,body:JSON.stringify([{booking_id:booking.id,event_type:'customer_completed_summary_acknowledged',actor_name:name,event_note:'Customer acknowledged the completed-job summary.',payload:{summary_id:summary.id,version:patch.customer_acknowledgement_version}}])}).catch(()=>null);
    return json({ok:true,summary:(await save.json().catch(()=>[]))?.[0]||{...summary,...patch}});
  }catch(err){return json({ok:false,error:err?.message||'Could not record acknowledgement.'},500);}
}
export async function onRequestOptions(){return new Response('',{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'}});}
function clean(v){return String(v==null?'':v).trim();}function serviceHeaders(env){return{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'};}function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});}
