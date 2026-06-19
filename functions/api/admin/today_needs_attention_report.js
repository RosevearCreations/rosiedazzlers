import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";

export async function onRequestGet(context){return handle(context);}
export async function onRequestPost(context){return handle(context);}
async function handle({request,env}){
  try{
    const body=request.method==="GET"?{}:await request.json().catch(()=>({}));
    const access=await requireStaffAccess({request,env,body,capability:"manage_bookings",allowLegacyAdminFallback:true});
    if(!access.ok)return withCors(access.response);
    const now=new Date(); const today=now.toISOString().slice(0,10);
    const queries={
      bookings:`bookings?select=id,customer_name,service_date,start_slot,job_status,status,progress_token,progress_enabled,progress_last_customer_message_at,progress_last_staff_viewed_at,completed_summary_status,review_request_blocked_reason&or=(service_date.eq.${today},job_status.eq.in_progress,job_status.eq.completed)&order=service_date.asc,start_slot.asc&limit=150`,
      updates:`job_updates?select=id,booking_id,created_at,stage,review_status,requires_admin_review,source_channel,customer_action_required,recommendation_status,customer_decision,note&or=(review_status.eq.pending,requires_admin_review.eq.true,source_channel.eq.customer,recommendation_status.eq.customer_approved,recommendation_status.eq.discussion_requested)&order=created_at.desc&limit=250`,
      media:`job_media?select=id,booking_id,created_at,stage,review_status,requires_admin_review,upload_status,gallery_reuse_status,vehicle_history_reuse_status,caption&or=(review_status.eq.pending,requires_admin_review.eq.true,upload_status.neq.complete,gallery_reuse_status.eq.queued)&order=created_at.desc&limit=250`,
      incidents:`incident_reports?select=id,booking_id,title,status,decision_status,severity,updated_at&order=updated_at.desc&limit=150`,
      quotes:`quote_pipeline_items?select=id,customer_name,status,quoted_amount_cents,next_follow_up_at,updated_at&order=next_follow_up_at.asc&limit=150`,
      notifications:`notification_events?select=id,event_type,status,last_error,next_attempt_at,created_at,booking_id&or=(status.eq.failed,status.eq.retry,status.eq.queued)&order=created_at.desc&limit=150`,
      balances:`final_balance_payment_requests?select=id,booking_id,customer_name,status,amount_cents,payment_url,checkout_url,created_at&order=created_at.desc&limit=150`,
      reviews:`review_request_queue?select=id,booking_id,status,send_after,created_at&order=created_at.desc&limit=150`,
      maintenance:`customer_maintenance_plans?select=id,customer_id,vehicle_id,plan_name,status,next_reminder_at&order=next_reminder_at.asc&limit=150`,
      uploads:`live_upload_sessions?select=id,booking_id,filename,status,progress_percent,retry_count,last_error,updated_at&or=(status.eq.failed,status.eq.cancelled,status.eq.uploading)&order=updated_at.desc&limit=150`,
      retention_media:`job_media?select=id,booking_id,kind,stage,retention_policy,retention_expires_at,retention_status&retention_expires_at=lte.${encodeURIComponent(now.toISOString())}&order=retention_expires_at.asc&limit=150`
    };
    const loaded={}; const warnings=[];
    await Promise.all(Object.entries(queries).map(async([key,path])=>{const out=await read(env,path);loaded[key]=out.rows;if(out.warning)warnings.push(`${key}: ${out.warning}`);}));
    const items=[];
    for(const row of loaded.updates||[]){
      if(row.review_status==="pending"||row.requires_admin_review===true)items.push(item("urgent","Approve live update",`A ${row.stage||"general"} update is waiting for review.`,`/admin-progress.html?booking_id=${row.booking_id}`,row.booking_id));
      if(row.source_channel==="customer")items.push(item("urgent","Customer reply",String(row.note||"Customer sent a progress message.").slice(0,160),`/admin-progress.html?booking_id=${row.booking_id}`,row.booking_id));
      if(["customer_approved","discussion_requested"].includes(String(row.recommendation_status||"")))items.push(item("high","Recommendation decision",`Customer decision: ${row.recommendation_status.replaceAll("_"," ")}.`,`/admin-progress.html?booking_id=${row.booking_id}`,row.booking_id));
    }
    for(const row of loaded.media||[]){
      if(row.review_status==="pending"||row.requires_admin_review===true)items.push(item("urgent","Approve live media",row.caption||"Photo/video awaiting review.",`/admin-progress.html?booking_id=${row.booking_id}`,row.booking_id));
      if(row.upload_status&&row.upload_status!=="complete")items.push(item("high","Upload recovery",`${row.caption||"Media"} status: ${row.upload_status}.`,`/detailer-jobs.html`,row.booking_id));
    }
    for(const row of loaded.incidents||[]){if(!["resolved","closed","customer_visible"].includes(clean(row.status))&&!["resolved","no_fault","customer_resolved"].includes(clean(row.decision_status)))items.push(item("urgent","Unresolved incident",row.title||"Incident needs a decision.",`/admin-incident-reports.html?booking_id=${row.booking_id}`,row.booking_id));}
    for(const row of loaded.quotes||[]){if(row.next_follow_up_at&&new Date(row.next_follow_up_at)<=now&&!["accepted","declined","closed"].includes(clean(row.status)))items.push(item("high","Quote follow-up due",`${row.customer_name||"Customer"} · ${money(row.quoted_amount_cents)}`,`/admin-quotes.html`,null));}
    for(const row of loaded.notifications||[]){if(["failed","retry"].includes(clean(row.status)))items.push(item("high","Notification failed",`${row.event_type||"notification"}: ${row.last_error||"retry needed"}`,`/admin-production.html#notifications`,row.booking_id));}
    if((loaded.notifications||[]).some((row)=>clean(row.status)==="queued") && !(env.NOTIFICATIONS_EMAIL_WEBHOOK_URL || env.RECOVERY_EMAIL_WEBHOOK_URL)) items.push(item("high","Notification provider setup","Queued notification events exist but the email provider webhook is not configured.",`/admin-production.html#notifications`,null));
    for(const row of loaded.balances||[]){if(!/paid|cancel/i.test(String(row.status||""))){const target=(!row.payment_url&&!row.checkout_url)?`/admin-production.html#payments`:`/admin-payments.html`;items.push(item((!row.payment_url&&!row.checkout_url)?"high":"normal",(!row.payment_url&&!row.checkout_url)?"Create payment link":"Balance request open",`${row.customer_name||"Customer"} · ${money(row.amount_cents)} · ${row.status||"draft"}`,target,row.booking_id));}}
    for(const row of loaded.retention_media||[]){if(!["permanent_proof","legal_hold"].includes(clean(row.retention_policy)) && !["archived","deleted","legal_hold"].includes(clean(row.retention_status)))items.push(item("normal","Storage retention review",`${row.kind||"Media"} ${row.stage||""} is due for retention review.`,`/admin-production.html#retention`,row.booking_id));}
    for(const row of loaded.reviews||[]){if(clean(row.status)==="blocked")items.push(item("normal","Review request blocked","Resolve payment/incident/summary blockers before requesting a review.",`/admin-workflow.html`,row.booking_id));}
    for(const row of loaded.maintenance||[]){if(row.next_reminder_at&&new Date(row.next_reminder_at)<=now&&!["paused","cancelled"].includes(clean(row.status)))items.push(item("normal","Maintenance reminder due",row.plan_name||"Maintenance plan follow-up.",`/admin-growth.html`,null));}
    for(const row of loaded.uploads||[]){items.push(item("high","Weak-network upload",`${row.filename||"Upload"} · ${row.status} · retry ${Number(row.retry_count||0)}`,`/detailer-jobs.html`,row.booking_id));}
    for(const row of loaded.bookings||[]){if(row.job_status==="completed"&&row.completed_summary_status!=="published")items.push(item("high","Generate job summary",`${row.customer_name||"Customer"} needs a completed-job summary.`,`/admin-progress.html?booking_id=${row.id}`,row.id));}
    const dedup=[];const seen=new Set();for(const row of items){const key=`${row.title}|${row.booking_id||""}|${row.detail}`;if(!seen.has(key)){seen.add(key);dedup.push(row);}}
    const rank={urgent:0,high:1,normal:2,low:3};dedup.sort((a,b)=>(rank[a.urgency]-rank[b.urgency]));
    return withCors(json({ok:true,generated_at:now.toISOString(),today,counts:{total:dedup.length,urgent:dedup.filter(i=>i.urgency==="urgent").length,high:dedup.filter(i=>i.urgency==="high").length,normal:dedup.filter(i=>i.urgency==="normal").length},items:dedup.slice(0,250),warnings,migrations_ready:warnings.length===0}));
  }catch(err){return withCors(json({ok:false,error:err?.message||"Could not build Today Needs Attention report."},500));}
}
async function read(env,path){try{const res=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});if(!res.ok)return{rows:[],warning:(await res.text()).slice(0,220)};return{rows:await res.json().catch(()=>[]),warning:null};}catch(err){return{rows:[],warning:String(err)}}}
function item(urgency,title,detail,target,booking_id){return{urgency,title,detail,target,booking_id:booking_id||null};}
function clean(v){return String(v||"").toLowerCase();}function money(c){return new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD"}).format(Number(c||0)/100);}
export async function onRequestOptions(){return new Response("",{status:204,headers:corsHeaders()});}
function corsHeaders(){return{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-email,x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){const h=new Headers(response.headers||{});for(const[k,v]of Object.entries(corsHeaders()))h.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
