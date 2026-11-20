import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readOriginalProvider915} from '../functions/api/_lib/supplier-provider915.js';
const Y='UC'+'z'.repeat(22),VID='abcdefghijk';
const json=(data)=>new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
test('915 owner-authenticated YouTube videos.list: public processed matching video only',async()=>{
 const urls=[];
 const fetcher=async url=>{urls.push(url);return json(url.includes('/channels?')?{items:[{id:Y}]}:{items:[{id:VID,snippet:{channelId:Y},status:{privacyStatus:'public',uploadStatus:'processed'}}]});};
 const v=await readOriginalProvider915({YOUTUBE_OAUTH_ACCESS_TOKEN:'test-token',YOUTUBE_CHANNEL_ID:Y},'youtube',VID,fetcher);
 assert.equal(v.ok,true);assert.equal(v.provider.id,VID);assert.equal(v.provider.public,true);
 assert.equal(urls.length,2);assert(urls.every(u=>u.startsWith('https://www.googleapis.com/youtube/v3/')));
});
test('915 YouTube blocks missing original OAuth, another channel, unlisted video',async()=>{
 assert.equal((await readOriginalProvider915({YOUTUBE_CHANNEL_ID:Y},'youtube',VID,async()=>json({}))).ok,false);
 const other=await readOriginalProvider915({YOUTUBE_CHANNEL_ID:Y,YOUTUBE_OAUTH_ACCESS_TOKEN:'token'},'youtube',VID,async url=>json(url.includes('channels?')?{items:[{id:Y}]}:{items:[{id:VID,snippet:{channelId:'different'},status:{privacyStatus:'unlisted',uploadStatus:'processed'}}]}));
 assert.equal(other.ok,false);
});
test('915 Instagram authenticates configured owner and rejects wrong owner or host',async()=>{
 const env={INSTAGRAM_BUSINESS_ACCOUNT_ID:'1234567890123456',INSTAGRAM_ACCESS_TOKEN:'a'.repeat(30),META_GRAPH_VERSION:'v27.0'};
 const object='555555555555555555';
 const fetcher=async url=>json(url.includes('1234567890123456')?{id:'1234567890123456'}:{id:object,owner:{id:'1234567890123456'},media_type:'VIDEO',permalink:'https://www.instagram.com/reel/valid/'});
 assert.equal((await readOriginalProvider915(env,'instagram',object,fetcher)).ok,true);
 const fake=async url=>json(url.includes('1234567890123456')?{id:'1234567890123456'}:{id:object,owner:{id:'hijacked'},media_type:'VIDEO',permalink:'https://evil.example/video'});
 assert.equal((await readOriginalProvider915(env,'instagram',object,fake)).ok,false);
});
test('915 Facebook requires original owner, a published video and canonical host',async()=>{
 const env={FACEBOOK_PAGE_ID:'1234567890123456',FACEBOOK_PAGE_ACCESS_TOKEN:'a'.repeat(30),META_GRAPH_VERSION:'v27.0'};
 const object='1234567890123456_7890123456789012';
 const fetcher=async url=>json(url.includes('/'+env.FACEBOOK_PAGE_ID+'?fields=id')?{id:env.FACEBOOK_PAGE_ID}:{id:object,from:{id:env.FACEBOOK_PAGE_ID},published:true,length:31,permalink_url:'https://www.facebook.com/watch/?v=7890123456789012'});
 assert.equal((await readOriginalProvider915(env,'facebook',object,fetcher)).ok,true);
 const unpublished=async url=>json(url.includes('/'+env.FACEBOOK_PAGE_ID+'?fields=id')?{id:env.FACEBOOK_PAGE_ID}:{id:object,from:{id:env.FACEBOOK_PAGE_ID},published:false,length:31,permalink_url:'https://www.facebook.com/watch/?v=7890123456789012'});
 assert.equal((await readOriginalProvider915(env,'facebook',object,unpublished)).ok,false);
});
test('915 original DB: private receipt, atomic state change, unique event nonce, private rollup',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261120214000_build915_provider_receipts_attribution.sql',import.meta.url),'utf8');
 assert.match(sql,/enable row level security/);assert.match(sql,/revoke all on table public\.rosie_supplier_provider_receipts_v915 from public, anon, authenticated/);
 assert.match(sql,/create unique index.*rosie_supplier_attribution_event_nonce_v915/i);
 assert.match(sql,/security invoker/);assert.match(sql,/having count\(\*\)>=5/);assert.match(sql,/for update/);
 assert.match(sql,/CURRENT_ORIGINAL_PROJECT_CONSENT_HOLD/);assert.match(sql,/PHYSICAL_SUPPLIER_RECEIPT_HOLD/);
});
test('915 public ingestion never trusts campaign source and does not accept raw personal data',()=>{
 const source=readFileSync(new URL('../functions/api/public/supplier_attribution_v915.js',import.meta.url),'utf8');
 assert.match(source,/Object\.keys\(data\)\.sort\(\)\.join\(','\)!=='event_kind,event_uuid,publication_id'/);
 assert.match(source,/pub\.publication_state!=='provider_verified'/);
 assert.match(source,/ROSIE_ATTRIBUTION_ENABLED/);
 assert.doesNotMatch(source,/request\.headers\.get\('cf-connecting-ip'\)/);
 assert.match(source,/consent_status!=='approved_public'/);
});
