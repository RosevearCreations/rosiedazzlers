import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeCustody914,assessPublication914,normalizeAttribution914} from '../assets/build914-supplier-publication-contract.mjs';
const id='11111111-1111-4111-8111-111111111111', other='22222222-2222-4222-8222-222222222222', asset='33333333-3333-4333-8333-333333333333';
const review={id,daip_project_id:other},custody={id:other,supplier_review_id:id,custody_kind:'review_sample'};
const project={id:other},workflow={project_id:other,public_handoff_ready:true,handoff_manifest:{selected_private_asset_ids:[asset]}};
const decision={approved:true,approver_id:id,channel:'youtube',supplier_review_id:id,project_id:other,consent_record_id:asset,disclosure_confirmed:true,creative_reviewed_at:new Date().toISOString()};
test('914: custody requires actual receipt evidence, verified date and meaningful note',()=>{
 assert.throws(()=>normalizeCustody914({supplier_review_id:id,custody_kind:'not_received'}));
 assert.throws(()=>normalizeCustody914({supplier_review_id:id,custody_kind:'gifted',evidence_reference:'invoice 123456',received_at:'2040-01-01',custody_note:'verified receipt'}));
 const v=normalizeCustody914({supplier_review_id:id,custody_kind:'gifted',evidence_reference:'receipt 123456',received_at:new Date().toISOString(),custody_note:'Received sample in original workshop'});
 assert.equal(v.custody_kind,'gifted');
});
test('914: a complete private approval manifest can be marked ready, never auto-published',()=>{
 const v=assessPublication914({review,custody,project,workflow,decision,assetIds:[asset]});
 assert.equal(v.ready,true);assert.equal(v.auto_publish,false);assert.equal(v.raw_media_public,false);
});
test('914: missing project consent, selected asset, human approval or disclosure stays HOLD',()=>{
 for(const changes of [
  {workflow:{...workflow,public_handoff_ready:false}},
  {assetIds:['44444444-4444-4444-8444-444444444444']},
  {decision:{...decision,approved:false}},
  {decision:{...decision,channel:'tiktok'}},
  {decision:{...decision,disclosure_confirmed:false}},
  {decision:{...decision,consent_record_id:null}},
  {project:{id:asset}}]){
  const v=assessPublication914({review,custody,project,workflow,decision,assetIds:[asset],...changes});
  assert.equal(v.ready,false);assert.ok(v.blockers.length>0);
 }
});
test('914: first-party attribution only accepts fixed event/source with UUID campaign',()=>{
 assert.deepEqual(normalizeAttribution914({campaign_id:id,event_kind:'landing',source:'youtube'}),{campaign_id:id,event_kind:'landing',source:'youtube'});
 assert.throws(()=>normalizeAttribution914({campaign_id:id,event_kind:'purchase',source:'youtube'}));
 assert.throws(()=>normalizeAttribution914({campaign_id:id,event_kind:'landing',source:'youtube',customer_email:'secret'}));
});
test('914: original database refuses anon/auth and contains no public raw media columns',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261120100000_build914_supplier_custody_publication_attribution.sql',import.meta.url),'utf8');
 for(const name of ['rosie_supplier_custody_v914','rosie_supplier_publication_v914','rosie_supplier_attribution_v914']){
  assert.match(sql,new RegExp('alter table public\\.'+name+' enable row level security'));
  assert.match(sql,new RegExp('revoke all on table public\\.'+name+' from public, anon, authenticated'));
 }
 assert.doesNotMatch(sql,/raw_media_url|customer_email|auth_token/i);
});
