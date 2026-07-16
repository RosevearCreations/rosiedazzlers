import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {serviceReady,rest,clean,jsonBody} from '../_lib/creative-projects.js';
const MAP={material:'creative_project_material_lines',labour:'creative_project_labour_lines',cost:'creative_project_cost_lines'};
export async function onRequest(c){
  if(c.request.method==='OPTIONS')return cors(new Response('',{status:204}));
  if(c.request.method!=='POST')return cors(json({ok:false,error:'Method not allowed.'},405));
  const a=await requireStaffAccess({request:c.request,env:c.env,capability:'manage_staff',allowLegacyAdminFallback:true});if(!a.ok)return cors(a.response);
  if(!serviceReady(c.env))return cors(json({ok:false,error:'Supabase service configuration is missing.'},503));
  const b=await jsonBody(c.request),kind=clean(b.kind,20),table=MAP[kind],id=clean(b.id,80),projectId=clean(b.project_id,80),action=clean(b.action,30),email=clean(a.actor?.email,200)||null;
  if(!table||!/^[0-9a-f-]{36}$/i.test(id)||!/^[0-9a-f-]{36}$/i.test(projectId))return cors(json({ok:false,error:'Valid project line is required.'},400));
  let patch={updated_at:new Date().toISOString()};
  if(action==='soft_delete')patch={...patch,is_deleted:true,deleted_at:new Date().toISOString(),deleted_by_staff_email:email};
  else if(action==='restore')patch={...patch,is_deleted:false,deleted_at:null,deleted_by_staff_email:null};
  else if(action==='edit'){
    if(kind==='material')patch={...patch,material_name:clean(b.material_name,180),quantity:Number(b.quantity||0),unit:clean(b.unit,40)||'item',unit_cost_cad:Number(b.unit_cost_cad||0),waste_quantity:Number(b.waste_quantity||0),safe_note:clean(b.safe_note,1200)||null};
    if(kind==='labour')patch={...patch,labour_type:clean(b.labour_type,40)||'creative_work',minutes:Number(b.minutes||0),hourly_rate_cad:Number(b.hourly_rate_cad||0),safe_note:clean(b.safe_note,1200)||null};
    if(kind==='cost')patch={...patch,cost_type:clean(b.cost_type,40)||'other',description:clean(b.description,240),amount_cad:Number(b.amount_cad||0),safe_note:clean(b.safe_note,1200)||null};
  } else return cors(json({ok:false,error:'Unknown line action.'},400));
  try{
    await rest(c.env,`${table}?id=eq.${encodeURIComponent(id)}&project_id=eq.${encodeURIComponent(projectId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(patch)});
    await rest(c.env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({project_id:projectId,event_type:action==='soft_delete'?'line_soft_deleted':'line_updated',actor_staff_email:email,safe_note:`${kind} line ${action.replaceAll('_',' ')}.`})});
    return cors(json({ok:true}));
  }catch(e){return cors(json({ok:false,error:e.message},500))}
}
function cors(r){const h=new Headers(r.headers);h.set('Access-Control-Allow-Origin','*');h.set('Access-Control-Allow-Methods','POST,OPTIONS');h.set('Access-Control-Allow-Headers','Content-Type,x-admin-password,x-staff-email,x-staff-user-id');h.set('Cache-Control','no-store');return new Response(r.body,{status:r.status,headers:h})}
