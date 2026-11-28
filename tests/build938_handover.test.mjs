import assert from 'node:assert/strict';
import test from 'node:test';
import {validateReport} from '../functions/api/_lib/handover938.js';
import {onRequestPost} from '../functions/api/progress/handover938.js';

const before={id:'a',stage:'arrival',hash:'1'},after={id:'b',stage:'final',hash:'2'};
const pair={mode:'pair',before:'a',after:'b',note:'Salt removed',care:'Allow carpet to dry'};
const skip={mode:'skip',note:'Customer requested no photo'};
test('three views require stage-correct distinct originals or an explicit reason',()=>{
  assert.equal(validateReport([pair,skip,skip],[before,after]).length,3);
  for(const input of [[pair],[pair,pair,skip],[{...pair,care:''},skip,skip],[{mode:'skip',note:''},skip,skip]])
    assert.equal(validateReport(input,[before,after]),null);
  assert.equal(validateReport([pair,skip,skip],[before,{...after,hash:'1'}]),null);
  assert.equal(validateReport([pair,skip,skip],[before,{...after,stage:'arrival'}]),null);
});
test('private link, revision and independent choices govern access',async t=>{
  let active=true,report={id:'r',payload:{views:[skip,skip,skip]}},saved=null;
  t.mock.method(globalThis,'fetch',async(input,opts)=>{
    const url=new URL(input);
    if(url.pathname.endsWith('/bookings')){
      assert.equal(url.searchParams.get('progress_enabled'),'eq.true');
      assert.equal(url.searchParams.get('progress_token'),'eq.token');
      return Response.json(active?[{id:'job'}]:[]);
    }
    assert.ok(url.pathname.endsWith('booking_events'));
    if(opts.method==='POST'){saved=JSON.parse(opts.body);return Response.json({});}
    return Response.json(url.searchParams.get('event_type').includes('report')?[report]:saved?[saved]:[]);
  });
  const send=(fields)=>onRequestPost({env:{SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'test'},request:new Request('https://shop.test/api/progress/handover938',{method:'POST',headers:{Origin:'https://shop.test'},body:JSON.stringify({token:'token',...fields})})});
  assert.equal((await (await send({action:'read'})).json()).views,null);
  const choices={action:'save',report:'r',viewPhotos:false,maintenance:true,reminders:false,promotionContact:false};
  assert.equal((await send({...choices,report:'old'})).status,409);
  assert.equal((await send({...choices,reminders:undefined})).status,409);
  assert.equal((await send(choices)).status,200);
  assert.deepEqual(saved.payload,{report:'r',viewPhotos:false,maintenance:true,reminders:false,promotionContact:false});
  report={id:'withdrawn',payload:{withdrawn:true}};
  assert.equal((await (await send({action:'read'})).json()).available,false);
  active=false;assert.equal((await send(choices)).status,404);
});
test('only clear originals with current consent are signed for private viewing',async t=>{
  const {customerReport}=await import('../functions/api/_lib/handover938.js');
  const media=[before,after].map(m=>({...m,storage_path:'jobs/job/v747/'+m.stage+'/'+m.id,storage_bucket:'private',created_at:'2026-01-01'}));
  let sensitive=false,signs=0;
  t.mock.method(globalThis,'fetch',async(input,opts)=>{
    const url=new URL(input);
    if(url.pathname.includes('/object/sign/')){signs++;assert.equal(JSON.parse(opts.body).expiresIn,60);return Response.json({signedURL:'/example'});}
    assert.equal(url.searchParams.get('booking_id'),'eq.job');
    if(url.pathname.endsWith('jobsite_intake')) return Response.json([{updated_at:'rev'}]);
    if(url.pathname.endsWith('job_media')) return Response.json(media);
    if(url.searchParams.get('event_type')==='eq.detailer_onsite_setup_v746') return Response.json([{id:'permission',event_type:'detailer_onsite_setup_v746',payload:{intake_revision:'rev',photo_consent:'internal_job_evidence'}}]);
    return Response.json(media.map(m=>({payload:{job_media_id:m.id,privacy_review:{finding:sensitive?'sensitive_private':'clear',faces_plates_addresses_checked:true},original_sha256:m.hash.repeat(64),original_storage_path:m.storage_path,original_storage_bucket:'private',authentic_stage:m.stage,consent_receipt_id:'permission',consent_intake_revision:'rev'}})));
  });
  const show=()=>customerReport({SUPABASE_URL:'https://db.test',SUPABASE_SERVICE_ROLE_KEY:'test'},'job',{payload:{views:[pair,skip,skip]}});
  const result=await show();assert.equal(result[0].view,'Driver’s footwell');assert.equal(result[0].care,pair.care);assert.equal(result[1].skipped,skip.note);assert.equal(signs,2);
  sensitive=true;assert.equal(await show(),null);assert.equal(signs,2);
});
