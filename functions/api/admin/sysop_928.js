// Rosie 928: authenticated private receiver closure and approved runtime pin readiness. No new evidence writes.
import {requireStaffAccess,serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {receiverSettings} from './sysop_921.js';
import {checkReceiverCompatibility922} from '../../../assets/build922-original-application-authority-contract.mjs';
import {validateRoster926,UUID} from '../../../assets/build926-runtime-certification.mjs';
import {receiverClosure928,verifyRuntimeDraft928} from '../../../assets/build928-original-correlation.mjs';
import {receiverPlan927,RECEIVERS927} from '../../../assets/build927-guided-readiness.mjs';
const reply=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow'}});
const E=encodeURIComponent,deny=()=>reply({ok:false,error:'READ_ONLY_METHOD_REQUIRED'},405);
const json=(env,k)=>{try{return JSON.parse(env[k]||'null')}catch{return null}};
async function db(env,path){
 const base=String(env.SUPABASE_URL||'').replace(/\/+$/,'');
 if(!/^https:\/\/[A-Za-z0-9.-]+$/.test(base)||!env.SUPABASE_SERVICE_ROLE_KEY)throw Error('PRIVATE_DATABASE_REQUIRED');
 const r=await fetch(base+'/rest/v1/'+path,{headers:serviceHeaders(env),redirect:'error',cache:'no-store',signal:AbortSignal.timeout(6000)});
 if(!r.ok)throw Error('PRIVATE_DATABASE_UNAVAILABLE');
 const t=await r.text();if(t.length>30000)throw Error('PRIVATE_RESULT_UNBOUNDED');
 const data=JSON.parse(t);if(!Array.isArray(data)||data.length>1)throw Error('PRIVATE_RESULT_SHAPE');return data[0]||null
}
const latest=(env,table,select,filter='')=>db(env,table+'?select='+select+(filter?'&'+filter:'')+'&order=created_at.desc&limit=1');
function pinStatus(env){
 const list=['ROSEVEAR_ROSIE919_HOST_WITNESS_PIN_JSON','ROSEVEAR_ROSIE920_OWNER_PINS_JSON','ROSEVEAR_ROSIE921_WINDOWS_HEALTH_PIN_JSON','ROSEVEAR_ROSIE923_APP_SIGNER_PIN_JSON','ROSEVEAR_ROSIE924_INSPECTOR_PIN_JSON','ROSEVEAR_ROSIE925_ROLE_PINS_JSON','ROSEVEAR_ROSIE925_EXPECTED_WINDOWS_IDENTITIES_JSON','ROSEVEAR_ROSIE926_RUNTIME_PIN_JSON','ROSEVEAR_ROSIE926_CERTIFICATION_PIN_JSON','ROSEVEAR_ROSIE926_EXPECTED_RUNTIME_JSON'];
 let rosterValid=false;try{validateRoster926(json(env,list[5]),json(env,list[3])?.fingerprintSha256,json(env,list[7]),json(env,list[8]));rosterValid=true}catch{}
 return {presenceOnly:list.map(name=>({name,configured:!!json(env,name)})),rosterStructurallyValid:rosterValid,productionShaPresent:/^[a-f0-9]{40}$/.test(env.ROSEVEAR_ROSIE925_EXPECTED_PRODUCTION_SHA||'')};
}
async function receiver(env,id){
 let cfg=null,manifestReady=false;try{cfg=receiverSettings(env,id)}catch{}
 if(cfg)try{checkReceiverCompatibility922(json(env,'ROSEVEAR_ROSIE924_RECEIVER_MANIFESTS_JSON')?.[id],{expectedCommit:cfg.pin.expectedCommit,expectedFingerprint:cfg.pin.fingerprintSha256});manifestReady=true}catch{}
 const ledger=await latest(env,'rosie_sysop_receiver_readbacks_v920','id,receiver_id,ack_review_id,ledger_entry_id,ledger_entry_sha256,ledger_head_sha256','receiver_id=eq.'+E(id));
 const ack=UUID.test(ledger?.ack_review_id||'')?await latest(env,'rosie_sysop_receiver_acks_v919','id,receiver_id,receiver_commit','id=eq.'+E(ledger.ack_review_id)):null;
 const native=UUID.test(ledger?.id||'')?await latest(env,'rosie_sysop_native_api_witness_v921','id,receiver_id,ledger_review_id,api_signer_commit,api_signer_fingerprint_sha256,api_observed_at_ms','receiver_id=eq.'+E(id)+'&ledger_review_id=eq.'+E(ledger.id)):null;
 return receiverPlan927({id,configurationReady:!!cfg,manifestReady,ledger,ack,expectedCommit:cfg?.pin.expectedCommit,native:native?.api_signer_fingerprint_sha256===cfg?.pin.fingerprintSha256?native:null});
}
export async function onRequestGet({request,env}){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});if(!a.ok)return a.response;
 if(a.auth_mode!=='session'||!a.actor?.is_active||!UUID.test(a.actor.id)||!hasActionAccess(a.actor,'admin.settings.manage'))return reply({ok:false,error:'ORIGINAL_ADMIN_SESSION_REQUIRED'},403);
 try{
 const receivers=await Promise.all(RECEIVERS927.map(id=>receiver(env,id)));
 const evidence=[];for(const [name,table] of [
 ['source','rosie_sysop_receipts_v918'],['ack','rosie_sysop_receiver_acks_v919'],['host','rosie_sysop_host_recovery_v919'],['preflight','rosie_sysop_preflight_v920'],['health','rosie_sysop_windows_health_v921'],['application','rosie_sysop_app_attestations_v923'],['ownerReview','rosie_sysop_field_reviews_v925'],['witnessEnrollment','rosie_sysop_witness_enrollment_v926'],['certification','rosie_sysop_operational_certifications_v926']
 ])evidence.push({name,recordPresent:!!await latest(env,table,'id')});
 return reply({ok:true,build:928,actorStaffId:a.actor.id,pins:pinStatus(env),receivers:receivers.map(x=>({...x,closure:receiverClosure928(x)})),runtimePinShape:verifyRuntimeDraft928({draft:json(env,'ROSEVEAR_ROSIE926_EXPECTED_RUNTIME_JSON'),expected:json(env,'ROSEVEAR_ROSIE926_EXPECTED_RUNTIME_JSON')}).matched?'SERVER_PIN_SHAPE_PRESENT_NOT_VERIFIED_RUNTIME':'SERVER_PIN_CONFIGURATION_INCOMPLETE',evidence,fieldCertified:false,sevenSourceConnected:false,authorizesAction:false})
 }catch{return reply({ok:false,state:'HOLD',error:'PRIVATE_ORIGINAL_READINESS_UNAVAILABLE'},503)}
}
export const onRequestPost=deny,onRequestPut=deny,onRequestPatch=deny,onRequestDelete=deny,onRequestOptions=deny;
