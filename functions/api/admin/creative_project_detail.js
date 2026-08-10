import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {serviceReady,rest} from '../_lib/creative-projects.js';

const uuid=value=>/^[0-9a-f-]{36}$/i.test(String(value||''));

export async function onRequest(c){
  if(c.request.method==='OPTIONS')return cors(new Response('',{status:204}));
  if(c.request.method!=='GET')return cors(json({ok:false,error:'Method not allowed.'},405));
  const auth=await requireStaffAccess({request:c.request,env:c.env,capability:'manage_staff',allowLegacyAdminFallback:true});
  if(!auth.ok)return cors(auth.response);
  if(!serviceReady(c.env))return cors(json({ok:false,error:'Supabase service configuration is missing.'},503));
  const id=new URL(c.request.url).searchParams.get('id');
  if(!uuid(id))return cors(json({ok:false,error:'Valid project id is required.'},400));
  try{
    const q=path=>rest(c.env,path);
    const [p,s,o,au,m,l,cost,drafts,templates,daip,reservations,shots,learning,exports]=await Promise.all([
      q(`creative_projects?select=*&id=eq.${encodeURIComponent(id)}&limit=1`),
      q(`creative_project_sessions?select=*&project_id=eq.${encodeURIComponent(id)}&order=started_at.desc`),
      q(`creative_project_outputs?select=*&project_id=eq.${encodeURIComponent(id)}&order=output_type.asc`),
      q(`creative_project_audit?select=*&project_id=eq.${encodeURIComponent(id)}&order=created_at.desc&limit=80`),
      q(`creative_project_material_lines?select=*&project_id=eq.${encodeURIComponent(id)}&order=created_at.desc`),
      q(`creative_project_labour_lines?select=*&project_id=eq.${encodeURIComponent(id)}&order=created_at.desc`),
      q(`creative_project_cost_lines?select=*&project_id=eq.${encodeURIComponent(id)}&order=created_at.desc`),
      q(`creative_project_output_drafts?select=*&project_id=eq.${encodeURIComponent(id)}&order=output_type.asc,draft_kind.asc`),
      q('creative_project_templates?select=*&active=eq.true&order=name.asc'),
      q(`creative_project_daip_associations?select=*&project_id=eq.${encodeURIComponent(id)}&order=created_at.desc`),
      q(`creative_project_inventory_reservations?select=*&project_id=eq.${encodeURIComponent(id)}&order=created_at.desc`),
      q(`creative_project_shot_plan_items?select=*&project_id=eq.${encodeURIComponent(id)}&order=created_at.asc`),
      q(`creative_project_learning_items?select=*&project_id=eq.${encodeURIComponent(id)}&order=item_type.asc,score.desc.nullslast,created_at.desc`),
      q(`creative_project_archive_exports?select=id,export_status,created_at,contains_media_bytes,public_destination_enabled&project_id=eq.${encodeURIComponent(id)}&order=created_at.desc&limit=20`)
    ]);
    if(!p?.[0])return cors(json({ok:false,error:'Project not found.'},404));

    const activeMaterials=(m||[]).filter(r=>!r.is_deleted);
    const activeLabour=(l||[]).filter(r=>!r.is_deleted);
    const activeCosts=(cost||[]).filter(r=>!r.is_deleted);
    const materialTotal=activeMaterials.reduce((n,r)=>n+(Number(r.quantity)+Number(r.waste_quantity||0))*Number(r.unit_cost_cad||0),0);
    const labourTotal=activeLabour.reduce((n,r)=>n+(Number(r.minutes||0)/60)*Number(r.hourly_rate_cad||0),0);
    const otherTotal=activeCosts.reduce((n,r)=>n+Number(r.amount_cad||0),0);
    const grand=materialTotal+labourTotal+otherTotal;
    const revenue=Number(p[0].actual_revenue_cad||0);
    const expectedRevenue=Number(p[0].expected_revenue_cad||0);
    const budget=Number(p[0].project_budget_cad||0);
    const targetMargin=Math.max(0,Math.min(95,Number(p[0].target_margin_percent||30)));
    const targetRevenue=targetMargin<100?grand/(1-targetMargin/100):grand;

    let bookingComparison=null;
    if(p[0].source_booking_id){
      try{bookingComparison=(await q(`bookings?select=id,service_date,package_code,vehicle_size,total_price,price_total_cents,deposit_amount,deposit_cents,status,job_status&id=eq.${encodeURIComponent(p[0].source_booking_id)}&limit=1`))?.[0]||null}catch{bookingComparison=null}
    }

    let storyAssets=[];
    let processingJobs=[];
    let build248MigrationReady=true;
    try{
      [storyAssets,processingJobs]=await Promise.all([
        q(`daip_project_media_assets?select=id,media_kind,capture_stage,consent_status,upload_status,story_review_status,story_sort_order,story_note,story_reviewed_at&project_id=eq.${encodeURIComponent(id)}&order=story_sort_order.asc.nullslast,created_at.asc`),
        q(`daip_media_processing_jobs?select=id,asset_id,job_type,status,attempt_count,max_attempts,next_retry_at,dead_lettered_at,last_error,review_note,created_at,updated_at&project_id=eq.${encodeURIComponent(id)}&order=created_at.desc&limit=300`)
      ]);
    }catch{
      build248MigrationReady=false;
      try{
        storyAssets=await q(`daip_project_media_assets?select=id,media_kind,capture_stage,consent_status,upload_status&project_id=eq.${encodeURIComponent(id)}&order=created_at.asc`);
        processingJobs=await q(`daip_media_processing_jobs?select=id,asset_id,job_type,status,attempt_count,last_error,created_at,updated_at&project_id=eq.${encodeURIComponent(id)}&order=created_at.desc&limit=300`);
      }catch{storyAssets=[];processingJobs=[]}
    }

    const selected=(storyAssets||[]).filter(r=>r.story_review_status==='selected');
    const approvedSessions=(s||[]).filter(r=>r.approved_for_story);
    const stages=new Set(selected.map(r=>r.capture_stage));
    const selectedPublicConsent=selected.filter(r=>r.consent_status==='approved_public').length;
    const openJobs=(processingJobs||[]).filter(r=>!['completed','cancelled'].includes(r.status));
    const failedJobs=(processingJobs||[]).filter(r=>['failed','blocked'].includes(r.status));
    const deadJobs=(processingJobs||[]).filter(r=>r.dead_lettered_at);
    const projectConsentAllowsPublic=p[0].consent_status==='approved_public'&&Boolean(p[0].public_publish_allowed);
    const readinessBlockers=[];
    if(!build248MigrationReady)readinessBlockers.push('Apply the Build 248 migration to enable reviewed media selection and retry controls.');
    if(!approvedSessions.length)readinessBlockers.push('Approve at least one project session for story planning.');
    if(!selected.length)readinessBlockers.push('Select at least one private DAIP media item as story evidence.');
    if(p[0].before_after_applicability!=='not_applicable'&&selected.length&&!(stages.has('before')&&stages.has('after')))readinessBlockers.push('Add selected before and after evidence for a transformation story.');
    if(failedJobs.length||deadJobs.length)readinessBlockers.push('Review failed, blocked, or dead-lettered media processing jobs.');
    if(!projectConsentAllowsPublic)readinessBlockers.push('Public publishing remains blocked until project consent and publish approval are both explicit.');

    return cors(json({
      ok:true,
      build:248,
      project:p[0],sessions:s||[],outputs:o||[],audit:au||[],materials:m||[],labour:l||[],costs:cost||[],drafts:drafts||[],templates:templates||[],daip_associations:daip||[],reservations:reservations||[],shot_plan:shots||[],learning:learning||[],archive_exports:exports||[],booking_comparison:bookingComparison,
      daip_story_assets:storyAssets||[],
      daip_processing_jobs:processingJobs||[],
      content_package_readiness:{
        build248_migration_ready:build248MigrationReady,
        approved_session_count:approvedSessions.length,
        selected_private_asset_count:selected.length,
        selected_public_consent_count:selectedPublicConsent,
        selected_stages:[...stages],
        before_after_ready:p[0].before_after_applicability==='not_applicable'||(stages.has('before')&&stages.has('after')),
        processing_open_count:openJobs.length,
        processing_problem_count:failedJobs.length+deadJobs.length,
        draft_count:(drafts||[]).length,
        public_publish_allowed:projectConsentAllowsPublic,
        private_story_plan_ready:build248MigrationReady&&approvedSessions.length>0&&selected.length>0&&(!failedJobs.length&&!deadJobs.length),
        blockers:readinessBlockers
      },
      totals:{materials:materialTotal,labour:labourTotal,other:otherTotal,grand,expected_revenue:expectedRevenue,actual_revenue:revenue,expected_profit:expectedRevenue-grand,actual_profit:revenue-grand,margin_percent:revenue>0?((revenue-grand)/revenue)*100:null,budget,budget_variance:budget-grand,break_even_revenue:grand,target_margin_percent:targetMargin,target_revenue:targetRevenue}
    }));
  }catch(e){
    return cors(json({ok:false,error:e.message||'Could not load creative project detail.'},500));
  }
}

function cors(r){
  const h=new Headers(r.headers);
  h.set('Access-Control-Allow-Origin','*');
  h.set('Access-Control-Allow-Methods','GET,OPTIONS');
  h.set('Access-Control-Allow-Headers','Content-Type,x-admin-password,x-staff-email,x-staff-user-id');
  h.set('Cache-Control','no-store');
  return new Response(r.body,{status:r.status,headers:h});
}
