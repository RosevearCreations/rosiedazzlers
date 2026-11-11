import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {onRequest as evidenceRoute} from '../functions/api/admin/jobday_social_evidence_842.js';
import {onRequestPost as dispatchRoute} from '../functions/api/admin/social_post_dispatch.js';
import {sourceGate842} from '../functions/api/_lib/jobday-social-842.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const booking='11111111-1111-4111-8111-111111111111',source='22222222-2222-4222-8222-222222222222',project='33333333-3333-4333-8333-333333333333';
const postId='44444444-4444-4444-8444-444444444444',photoId='55555555-5555-4555-8555-555555555555';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-service-role',ADMIN_PASSWORD:'test',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
let approved=false,tagged=true,posts=[{id:postId,booking_id:booking,source_type:'daip_job_media_tag',source_id:source,platform:'facebook',status:'draft',review_status:'needs_review',media_urls:[]}],attempts=[],writes=[];
const originalFetch=globalThis.fetch;
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
function ctx(method='GET',body,auth=true){return {env,request:new Request('https://rosie.example/api/admin/jobday_social_evidence_842'+(method==='GET'?'?booking_id='+booking:''),{method,headers:{...(auth?{'x-admin-password':'test'}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify({booking_id:booking,...body})}:{})})};}
function dispatch(method='POST',body){return {env,request:new Request('https://rosie.example/api/admin/social_post_dispatch',{method,headers:{'x-admin-password':'test','Content-Type':'application/json'},body:JSON.stringify({id:postId,...body})})};}
globalThis.fetch=async(url,opts={})=>{
  const u=new URL(url),table=u.pathname.split('/').pop(),method=opts.method||'GET',body=opts.body?JSON.parse(opts.body):null;
  if(method==='POST'){writes.push({table,body});if(table==='social_dispatch_attempts'){const row={...body,id:crypto.randomUUID(),created_at:new Date().toISOString()};attempts.unshift(row);return respond([row]);}if(table==='creative_project_audit')return respond([{id:crypto.randomUUID()}]);}
  if(method==='PATCH'&&table==='social_post_queue'){posts=posts.map(p=>({...p,...body}));return respond(posts);}
  if(table==='bookings')return respond([{id:booking,service_date:'2026-11-10',package_code:'complete_detail',status:'confirmed',job_status:'in_progress',customer_name:'PRIVATE NAME'}]);
  if(table==='social_post_queue')return respond(posts);
  if(table==='social_dispatch_attempts')return respond(attempts);
  if(table==='creative_projects')return respond([{id:project,source_booking_id:booking,project_code:'SAFE',title:'Safe',consent_status:approved?'approved_public':'not_reviewed',public_publish_allowed:approved,content_package_status:approved?'approved':'draft',before_after_applicability:'not_applicable',consent_expires_at:null}]);
  if(table==='creative_project_audit')return respond(u.search.includes('safe_note=like.')?[]:tagged?[{id:crypto.randomUUID(),event_type:'updated',safe_note:`Build 841 job media source tag: ${source}; metadata only, no media copied or published.`}]:[]);
  if(table==='job_media')return respond([{id:source,booking_id:booking,kind:'image',media_url:'https://private.example/token=SECRET'}]);
  if(table==='daip_project_media_assets')return respond(approved?[{id:'555',upload_status:'uploaded',story_review_status:'selected',consent_status:'approved_public',capture_stage:'during'}]:[]);
  if(table==='daip_media_processing_jobs')return respond([]);
  if(table==='creative_project_sessions')return respond(approved?[{id:'777',approved_for_story:true}]:[]);
  if(table==='app_media_library')return respond([{id:photoId,media_type:'image',mime_type:'image/webp',source_status:'active',r2_key:'gallery/approved-job-derivative.webp',label:'Approved edited derivative',filename:'approved-job-derivative.webp'}]);
  return respond([],404);
};
try{
  const denied=await evidenceRoute(ctx('GET',null,false));assert.equal(denied.status,401);
  const early=await evidenceRoute(ctx('POST',{action:'attach_public_derivative',post_id:postId,photo_id:photoId,lineage_reference:'EXPORT-1',lineage_attested:true,privacy_review_attested:true}));assert.equal(early.status,409);assert.equal(writes.length,0);
  const premature=await dispatchRoute(dispatch('POST',{action:'approve_ready',confirmed_build842_owner_review:true,customer_consent_confirmed:true,plate_privacy_confirmed:true,no_private_info_confirmed:true}));assert.equal(premature.status,409);
  approved=true;const ready=await sourceGate842(env,posts[0]);assert.equal(ready.ok,true,ready.reason);
  const attach=await evidenceRoute(ctx('POST',{action:'attach_public_derivative',post_id:postId,photo_id:photoId,lineage_reference:'EXPORT-1',lineage_attested:true,privacy_review_attested:true}));assert.equal(attach.status,200,JSON.stringify(await attach.clone().json()));const attached=await attach.json();assert.equal(attached.post_status,'draft');assert.equal(attached.publication_happened,false);assert.equal(posts[0].media_urls.length,1);assert.match(posts[0].media_urls[0],/^https:\/\/assets\.rosiedazzlers\.ca\/gallery\//);assert.equal(JSON.stringify(attached).includes('SECRET'),false);
  const autoApproval=await dispatchRoute(dispatch('POST',{action:'approve_ready'}));assert.equal(autoApproval.status,403,'no silent default-true compliance checks');
  const shortcut=await dispatchRoute(dispatch('POST',{action:'mark_ready'}));assert.equal(shortcut.status,409,'legacy status shortcut cannot bypass explicit owner approval');
  const publishedBeforeReview=await dispatchRoute(dispatch('POST',{action:'publish_api'}));assert.equal(publishedBeforeReview.status,400);
  const listing=await evidenceRoute(ctx());assert.equal(listing.status,200);const data=await listing.json();assert.equal(JSON.stringify(data).includes('PRIVATE NAME'),false);assert.equal(data.posts[0].evidence,'NOT_DELIVERED');assert.equal(data.handoff.independent_lineage_proof,false);
  const observation=await evidenceRoute(ctx('POST',{action:'record_device_observation',device_type:'iphone',result:'blocked',evidence_reference:'OWNER-DEVICE-1',accessibility_checked:true,recovery_checked:true}));assert.equal(observation.status,200);assert.equal((await observation.json()).independently_verified,false);
}finally{globalThis.fetch=originalFetch;}

// Every separately rendered card has an individual checked-in SVG filename.
const scope={window:{}};runInNewContext(read('assets/app-core/module-navigation.js'),scope);
const modules=scope.window.RosieAppCore.ModuleNavigation.CATALOG.modules;
const cards=Object.entries(modules).flatMap(([scope,mod])=>mod.categories.flatMap(cat=>cat.cards.map(card=>({scope,label:card.label}))));
const launch=['Detailer','Operations / Supervisor','Business Administration','I.T. & Reliability','Finance','DAIP','Socials'].map(label=>({scope:'launcher',label}));
const customer=['Book','My account','Live progress & messages','Quote response','Gift cards','Website'].map(label=>({scope:'customer',label}));
const slug=({scope,label})=>(scope+'-'+label).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,84).replace(/-$/,'');
const paths=[...cards,...launch,...customer].map(card=>'assets/card-art-842/'+slug(card)+'.svg');
assert.equal(new Set(paths).size,paths.length);assert.equal(paths.length,85);
for(const file of paths){assert(existsSync(new URL('../'+file,import.meta.url)),file);const svg=read(file);assert.match(svg,/<svg /);assert.match(svg,/viewBox=/);assert.doesNotMatch(svg,/https?:\/\/(?!www\.w3\.org\/2000\/svg)|<script|<image /i);}
assert.equal(readdirSync(new URL('../assets/card-art-842/',import.meta.url)).filter(x=>x.endsWith('.svg')).length,85);
assert.match(read('assets/app-core/module-navigation.js'),/card-art-842/);assert.match(read('apps/launcher/app-launcher.js'),/card-art-842/);
assert.equal((read('app/customer/index.html').match(/card-art-842\/customer-/g)||[]).length,6);
for(const file of ['admin-social.html','admin-social/index.html']){assert.match(read(file),/jobday842/);assert.match(read(file),/jobday-social-evidence-842\.js/);assert.match(read(file),/confirmed_build842_owner_review/);}
console.log('Build 842 tests passed: original-device owner HOLD, fail-closed DAIP consent/derivative handoff, explicit owner social approval, delivery classification and 85 distinct card SVGs.');
