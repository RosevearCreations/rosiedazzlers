import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {readReceipt764,verifyArchive764,verifyExecution764,verifyStandby764,
  verifyReconciliation764,verifyOwnerPostchange764}
  from '../_lib/economic-production-outcome-v764.js';
import {readReceipt765,verifyDB765,verifyAudit765,verifyOwner765,reconcileClosure765}
  from '../_lib/economic-database-closure-v765.js';

const fail=(error,status=400)=>json({ok:false,build:765,error,
  closure_readiness_status:'HOLD_INDEPENDENT_DATABASE_AUDIT_OR_OWNER_EVIDENCE',
  direct_production_database_connection:false,production_db_state_verified_by_app:false,
  immutable_enforcement_proven_by_app:false,closure_allowed:false,
  automatic_business_write:false},status);
async function guard(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:fail('Signed-in owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  return json({ok:true,build:765,read_only:true,
    provider_configuration:{
      independent_database_inspector:!!env?.ROSIE_ECONOMIC_PRODUCTION_DB_STATE_INSPECTOR_BASE_URL,
      independent_immutable_audit_inspector:
        !!env?.ROSIE_ECONOMIC_IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR_BASE_URL
    },
    closure_readiness_status:'HOLD_INDEPENDENT_DATABASE_AUDIT_OR_OWNER_EVIDENCE',
    direct_production_database_connection:false,closure_allowed:false});
}
export async function onRequestPost({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)
    return fail('Same-origin owner review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return fail('JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>32000)
    return fail('Evidence exceeds 32 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>32000)throw Error('large');body=JSON.parse(raw);}
  catch{return fail('Submit valid JSON under 32 KB.');}
  const ids=['booking_id','source_record_id','change_ticket_id','execution_request_id'];
  if(!body||typeof body!=='object'||Array.isArray(body)||
    ids.some(k=>typeof body[k]!=='string')||
    !body.owner_postchange_decision||!body.owner_closure_readiness_decision)
    return fail('Exact booking/source/ticket/request plus two authentic owner signed decisions required.');
  const record=Object.fromEntries(ids.map(k=>[k,body[k]]));
  let archive=null,execution=null,standby=null,reconciliation=null,postchangeOwner=null,
    db=null,audit=null,owner=null;
  // Re-authenticate the entire historical execution chain. The browser can supply
  // two signed owner decisions, never unsigned DBA, operator or audit findings.
  archive=await verifyArchive764({env,record,readback:await readReceipt764(env,'archive',record)});
  if(archive.signature_authenticated){
    execution=await verifyExecution764({env,record,archive,
      readback:await readReceipt764(env,'execution',record,archive)});
    if(execution.signature_authenticated){
      standby=await verifyStandby764({env,record,archive,execution,
        readback:await readReceipt764(env,'standby',record,archive,execution)});
      if(standby.signature_authenticated){
        reconciliation=await verifyReconciliation764({env,record,archive,execution,standby,
          readback:await readReceipt764(env,'reconciliation',record,archive,execution,standby)});
        if(reconciliation.signature_authenticated){
          postchangeOwner=await verifyOwnerPostchange764({env,record,archive,execution,standby,
            reconciliation,envelope:body.owner_postchange_decision});
          if(postchangeOwner.signature_authenticated){
            db=await verifyDB765({env,record,archive,execution,standby,reconciliation,
              owner:postchangeOwner,readback:await readReceipt765(env,'db',record,archive,
                execution,standby,reconciliation,postchangeOwner)});
            if(db.signature_authenticated){
              audit=await verifyAudit765({env,record,archive,execution,standby,reconciliation,
                owner:postchangeOwner,db,readback:await readReceipt765(env,'audit',record,
                  archive,execution,standby,reconciliation,postchangeOwner,db)});
              if(audit.signature_authenticated)
                owner=await verifyOwner765({env,record,archive,owner:postchangeOwner,db,audit,
                  envelope:body.owner_closure_readiness_decision});
            }
          }
        }
      }
    }
  }
  return json(await reconcileClosure765({archive,execution,standby,reconciliation,
    postchangeOwner,db,audit,owner}));
}
const readonly=()=>fail('Build 765 is strictly a read-only external evidence review. No SQL, grants, audit mutation, closure or notifications.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,
  headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
