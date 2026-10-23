import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {syncR2IntoLibrary} from '../functions/api/_lib/photo-library.js';
import {isPhotoStudioPublicRow,isPhotoStudioReviewableRow} from '../functions/api/_lib/photo-studio-safety.js';
import {buildPublicWebsiteImageManifest} from '../functions/api/_lib/public-website-images.js';
import {onRequestPost as saveMetadata} from '../functions/api/admin/photo_library_save.js';

const REV='2026-10-23T10:11:12.000Z';
const env={SUPABASE_URL:'https://db.invalid',SUPABASE_SERVICE_ROLE_KEY:'not-a-real-key',PUBLIC_ASSET_BASE_URL:'https://assets.rosiedazzlers.ca/',ALLOW_LEGACY_ADMIN_FALLBACK:'true',ADMIN_PASSWORD:'test-only'};
const photo={key:'gallery/review-this.jpg',etag:'r2-new',size:224,uploaded:new Date('2026-10-22T10:00:00Z')};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
const originalFetch=globalThis.fetch;
let calls=[];
const setup=(bucket,handler)=>{calls=[];env.ROSIE_PUBLIC_ASSETS_BUCKET={list:async(opts)=>{assert.equal(opts.prefix,'gallery/');assert.ok(opts.limit<=20,'single R2 list page must be bounded');return bucket(opts);}};globalThis.fetch=async(url,options={})=>{calls.push({url:String(url),options});return handler(String(url),options);};};

try{
  assert.equal(isPhotoStudioPublicRow({r2_key:'gallery/held.jpg',source_status:'needs_review',media_type:'image'}),false);
  assert.equal(isPhotoStudioReviewableRow({r2_key:'gallery/held.jpg',source_status:'needs_review',media_type:'image'}),true);
  assert.equal(isPhotoStudioPublicRow({r2_key:'gallery/live.jpg',source_status:'active',media_type:'image'}),true);
  assert.equal(isPhotoStudioPublicRow({r2_key:'private/customer.jpg',source_status:'active',media_type:'image'}),false);
  assert.equal(isPhotoStudioReviewableRow({r2_key:'jobs/customer.jpg',source_status:'active',media_type:'image'}),false);

  // Initial registration must be insert-only. Public activation is a separate owner decision.
  setup(()=>({objects:[photo,{key:'jobs/private.jpg',etag:'private',size:9}],truncated:true,cursor:'next-page'}),(url,options)=>{
    if(options.method==='POST'){
      assert.match(options.headers.Prefer,/resolution=ignore-duplicates/);
      assert.doesNotMatch(options.headers.Prefer,/merge-duplicates/);
      const rows=JSON.parse(options.body);
      assert.equal(rows.length,1);
      assert.equal(rows[0].source_status,'needs_review');
      assert.equal(rows[0].alt_text,null);
      assert.equal(rows[0].license_notes,null);
      return json([{media_key:rows[0].media_key}]);
    }
    assert.match(url,/r2_key=in/);return json([]);
  });
  let r=await syncR2IntoLibrary(env,'owner@invalid',{prefixes:['gallery/']});
  assert.equal(r.db_ready,true);assert.equal(r.inserted,1);assert.equal(r.refreshed,0);
  assert.equal(r.next_cursor,'next-page');assert.equal(r.has_more,true);
  assert.equal(r.publications_activated,0);assert.equal(r.consent_inferred,false);
  assert.equal(calls.length,2,'one database lookup and one batch insert for one R2 page');

  // An existing photo may have changed in the staff editor since sync read it.
  // The conditional asset-only update must never write the stale staff fields.
  const existing={id:'media-1',r2_key:photo.key,media_url:'https://assets.rosiedazzlers.ca/'+photo.key,media_key:'r2:'+photo.key,source_status:'active',label:'staff edited',alt_text:'Fresh safe alt',license_notes:'verified consent',updated_at:REV,r2_etag:'r2-old',byte_size:115};
  setup(()=>({objects:[photo],truncated:false}),(url,options)=>{
    if(options.method==='PATCH'){
      const params=new URL(url).searchParams;
      assert.equal(params.get('id'),'eq.media-1');
      assert.equal(params.get('updated_at'),`eq.${REV}`);
      assert.equal(params.get('r2_etag'),'eq.r2-old');
      const payload=JSON.parse(options.body);
      for(const key of ['label','alt_text','caption','source_status','license_notes','tags','usage_contexts','decorative'])assert.equal(Object.hasOwn(payload,key),false,`sync must not write staff-owned field ${key}`);
      assert.equal(payload.r2_etag,'r2-new');
      return json([{id:existing.id}]);
    }
    return json([existing]);
  });
  r=await syncR2IntoLibrary(env,'owner@invalid',{prefixes:['gallery/']});
  assert.equal(r.refreshed,1);assert.equal(r.conflicts,0);assert.equal(r.reconciliation_complete,true);
  assert.equal(calls.length,2);

  setup(()=>({objects:[photo],truncated:false}),(url,options)=>options.method==='PATCH'?json([]):json([existing]));
  r=await syncR2IntoLibrary(env,'owner@invalid',{prefixes:['gallery/'],cursor:'review-page'});
  assert.equal(r.conflicts,1);assert.equal(r.reconciliation_complete,false);assert.equal(r.review_required,true);
  assert.equal(r.retry_cursor,'review-page');
  assert.equal(calls.length,2,'a zero-row CAS never retries itself');

  setup(()=>({objects:[photo],truncated:false}),(url,options)=>options.method==='POST'?json([]):json([]));
  r=await syncR2IntoLibrary(env,'owner@invalid',{prefixes:['gallery/']});
  assert.equal(r.inserted,0);assert.equal(r.conflicts,1,'duplicate insert must be disclosed, not overwritten');

  setup(()=>({objects:[photo],truncated:false}),(url,options)=>options.method==='POST'?json({error:'unavailable'},503):json([]));
  r=await syncR2IntoLibrary(env,'owner@invalid',{prefixes:['gallery/'],cursor:'same-page'});
  assert.equal(r.db_ready,false);assert.equal(r.retry_cursor,'same-page');
  assert.equal(calls.length,2,'uncertain writes must not be automatically repeated');

  // All four ordinary public-feed queries are read-only, and held images / assignments
  // cannot escape into public manifests even if an old active assignment points at them.
  delete env.ROSIE_PUBLIC_ASSETS_BUCKET;
  calls=[];
  globalThis.fetch=async(url,options={})=>{
    calls.push({url:String(url),options});
    if(String(url).includes('app_media_assignments'))return json([{target_key:'gallery:slot',target_type:'gallery_evidence',media_id:'hold-1',is_active:true}]);
    if(String(url).includes('id=in.'))return json([{id:'hold-1',r2_key:photo.key,media_url:existing.media_url,source_status:'needs_review'}]);
    return json([{id:'hold-1',r2_key:photo.key,media_url:existing.media_url,source_status:'needs_review'}]);
  };
  const manifest=await buildPublicWebsiteImageManifest(env);
  assert.equal(manifest.images.length,0);
  assert.equal(manifest.assignments.length,0);
  assert.ok(calls.every((call)=>!call.options.method),'public manifest must never mutate or scan R2');

  const headers={'x-admin-password':'test-only','content-type':'application/json'};
  const approve=(body)=>saveMetadata({request:new Request('https://rosiedazzlers.ca/api/admin/photo_library_save',{method:'POST',headers,body:JSON.stringify(body)}),env});
  const input={id:'hold-1',expected_updated_at:REV,expected_source_status:'needs_review',source_status:'active',label:'Reviewed',alt_text:'Detailed photo',license_notes:'Rights confirmed'};
  calls=[];globalThis.fetch=async()=>{throw new Error('Approval absent must not reach database');};
  const denied=await approve(input);assert.equal(denied.status,409);assert.equal((await denied.json()).code,'public_use_approval_required');
  assert.equal(calls.length,0);
  globalThis.fetch=async(url,options={})=>{
    assert.equal(new URL(url).searchParams.get('source_status'),'eq.needs_review');
    return json([{...existing,source_status:'active',updated_at:'2026-10-23T10:11:13.000Z'}]);
  };
  const approved=await approve({...input,publication_approval:true});assert.equal(approved.status,200);

  const page=fs.readFileSync('admin-photo-studio.html','utf8');
  assert.equal(page,fs.readFileSync('admin-photo-studio/index.html','utf8'));
  for(const needle of ['id="resumeR2"','id="syncReconciliation"','id="approvePublicUse"','state.syncCheckpoint','manual','expected_source_status'])assert.ok(page.includes(needle),`Missing operator safeguard ${needle}`);
  const script=page.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];assert.ok(script);
  const syntax=spawnSync(process.execPath,['--check','--input-type=module'],{input:script,encoding:'utf8'});
  assert.equal(syntax.status,0,syntax.stderr||'Photo Studio syntax error');
  console.log('BUILD 617 R2 SYNC & PUBLICATION RECONCILIATION: PASS (CAS, privacy, explicit consent, partial recovery, no auto-retry)');
}finally{globalThis.fetch=originalFetch;}
