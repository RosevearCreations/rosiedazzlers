import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {onRequest} from '../functions/api/admin/social_job_sources.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const booking='11111111-1111-4111-8111-111111111111',media='22222222-2222-4222-8222-222222222222',project='33333333-3333-4333-8333-333333333333';
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only-secret',ADMIN_PASSWORD:'test',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
const originalFetch=globalThis.fetch;
let writes=[];let hasTag=false;let crossJob=false;
function request(method='GET',path='/api/admin/social_job_sources',body,authorized=true){return {request:new Request('https://rosie.test'+path,{method,headers:{...(authorized?{'x-admin-password':'test'}:{}),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})}),env};}
function respond(rows,status=200){return new Response(JSON.stringify(rows),{status,headers:{'Content-Type':'application/json'}});}
globalThis.fetch=async(url,options={})=>{
  const u=new URL(url);const table=u.pathname.split('/').pop();
  if(options.method==='POST'){
    const body=JSON.parse(options.body);writes.push({table,body});
    if(table==='creative_project_audit'){hasTag=true;return respond([{id:'44444444-4444-4444-8444-444444444444'}]);}
    if(table==='social_post_queue')return respond(body.map((row,i)=>({id:`55555555-5555-4555-8555-55555555555${i}`,platform:row.platform,status:row.status})));
  }
  if(table==='bookings')return respond([{id:booking,service_date:'2026-11-10',package_code:'complete_detail',job_status:'in_progress',customer_name:'DO NOT LEAK',progress_token:'private-token'}]);
  if(table==='job_media')return respond(crossJob?[]:[{id:media,booking_id:booking,stage:'during',kind:'image',caption:'Polishing in progress',media_url:'https://private.example/signed?token=SECRET',storage_path:'private/key',visibility:'internal',review_status:'pending'}]);
  if(table==='creative_projects')return respond([{id:project,source_booking_id:booking,public_publish_allowed:false,consent_reviewed:false}]);
  if(table==='creative_project_audit')return respond(hasTag?[{id:'44444444-4444-4444-8444-444444444444'}]:[]);
  return respond([],404);
};
try{
  const denied=await onRequest(request('GET','/api/admin/social_job_sources',null,false));assert.equal(denied.status,401);assert.equal(writes.length,0);
  const index=await onRequest(request('GET','/api/admin/social_job_sources',null,true));assert.equal(index.status,200);
  const list=await index.json();assert.equal(list.bookings.length,1);assert.equal(list.bookings[0].customer_name,undefined);
  const selected=await onRequest(request('GET','/api/admin/social_job_sources?booking_id='+booking));
  const source=await selected.json();assert.equal(source.media.length,1);assert.equal(source.media[0].media_url,undefined);assert.equal(source.media[0].storage_path,undefined);assert.equal(JSON.stringify(source).includes('SECRET'),false);
  const form={booking_id:booking,media_id:media,project_id:project};
  const premature=await onRequest(request('POST','/api/admin/social_job_sources',{...form,action:'draft',caption:'A clean finish',platforms:['facebook']}));assert.equal(premature.status,409);assert.equal(writes.length,0);
  crossJob=true;const mismatch=await onRequest(request('POST','/api/admin/social_job_sources',{...form,action:'tag'}));assert.equal(mismatch.status,404);assert.equal(writes.length,0);crossJob=false;
  const tagged=await onRequest(request('POST','/api/admin/social_job_sources',{...form,action:'tag'}));assert.equal(tagged.status,200);assert.equal((await tagged.json()).copy_performed,false);
  const saved=await onRequest(request('POST','/api/admin/social_job_sources',{...form,action:'draft',caption:'A freshly detailed finish in Southern Ontario.',platforms:['facebook','instagram']}));
  assert.equal(saved.status,200,JSON.stringify(await saved.clone().json()));const out=await saved.json();assert.equal(out.count,2);assert.equal(out.media_attached,false);assert.equal(out.approved_for_publication,false);
  const postWrite=writes.find(w=>w.table==='social_post_queue');assert.equal(postWrite.body.length,2);
  for(const p of postWrite.body){assert.equal(p.status,'draft');assert.equal(p.review_status,'needs_review');assert.equal(p.public_url,null);assert.deepEqual(p.media_urls,[]);assert.equal(p.source_id,media);assert.equal(p.customer_consent_confirmed,false);assert.equal(p.no_private_info_confirmed,false);}
}finally{globalThis.fetch=originalFetch;}

for(const image of ['jobday-field-841.webp','social-creator-841.webp','daip-editor-841.webp'])assert(existsSync(new URL('../assets/themes/standard/images/'+image,import.meta.url)));
for(const page of ['app/detailer/index.html','progress.html']){const h=read(page);assert.match(h,/data-jobday-841/);assert.match(h,/jobday-recovery-841\.js/);}
const helper=read('assets/jobday-recovery-841.js');assert.doesNotMatch(helper,/localStorage|setInterval|serviceWorker/);assert.match(helper,/click\(\)/);assert.match(helper,/aria-live|data-jobday-state/);
const nav=read('assets/app-core/module-navigation.js');assert.match(nav,/module-link-card__photo/);assert.match(nav,/Create from Job/);
const launcher=read('apps/launcher/app-launcher.js');assert.match(launcher,/module-link-card__photo/);assert.match(read('app/index.html'),/app-launcher\.js\?v=20261110build841/);
assert.equal((read('app/customer/index.html').match(/module-link-card__photo/g)||[]).length,6);
const landing=read('assets/landing-page-build388.js');assert.match(landing,/illustrationImages/);assert.doesNotMatch(landing,/Photo needed<\/h3>/);
const social=read('admin-social.html');assert.match(social,/id="jobMedia841"/);assert.match(social,/social-job-tagging-841\.js/);
console.log('Build 841 source tests passed: private job media never exposed, tagged metadata only, review-only drafts, and accessible mobile/manual recovery.');
