import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildFinanceAcceptance911} from '../assets/build911-finance-acceptance.mjs';
import {normalizeSupplierReview911,normalizeSupplierVideo911} from '../assets/build911-supplier-review.mjs';
import {workflowFor} from '../functions/api/admin/daip_media_workflow.js';
import {onRequestPost} from '../functions/api/admin/supplier_reviews_v911.js';
const fields=['payments','refunds','events','applications','accounting','finalBalances'];
const report=(values={})=>({schema:'rosie.finance-reconciliation.local.v898',
 windows:Object.fromEntries(fields.map(name=>[name,{count:values[name]||0,limit:60,possibly_truncated:false}])),
 totals:{source_reported_paid_cents:values.paid||0,source_reported_refunded_cents:values.refunded||0,
  source_reported_processor_fee_cents:0,recorded_hst_cents:values.hst||0,
  source_reported_final_balance_paid_cents:0},issue_counts:{},source_revision:'a'.repeat(40)});
test('911: zero provider/refund/invoice rows are HOLD, never certified GREEN',()=>{
 const result=buildFinanceAcceptance911(report());
 assert.equal(result.states.live_business_acceptance,'HOLD');
 assert.equal(result.states.local_source_review,'NO_ORIGINAL_TRANSACTIONS');
 assert.equal(result.counts.payments,0);
 assert.equal(result.authority.refund,false);
 assert.equal(result.authority.accountant_close,false);
 assert.equal(result.blockers.includes('NO_ORIGINAL_REFUND_LIFECYCLE_SAMPLE'),true);
});
test('911: original paid + callback alone do not certify bank settlement, invoice or HST',()=>{
 const result=buildFinanceAcceptance911(report({payments:2,events:2,accounting:1,refunds:1,paid:12000,hst:1300}));
 assert.equal(result.source_reported_cents.source_reported_paid_cents,12000);
 assert.equal(result.states.stripe_settlement,'HOLD_EXTERNAL_PROVIDER');
 assert.equal(result.states.paypal_settlement,'HOLD_EXTERNAL_PROVIDER');
 assert.equal(result.states.invoice_hst,'HOLD_ISSUED_INVOICE_ACCOUNTANT');
 assert.equal(result.authority.ledger_post,false);
});
test('911: incomplete sample and invalid cents fail closed',()=>{
 const bad=report();bad.windows.refunds.possibly_truncated=true;
 assert.throws(()=>buildFinanceAcceptance911(bad),/incomplete/);
 const invalid=report();invalid.totals.recorded_hst_cents=1.13;
 assert.throws(()=>buildFinanceAcceptance911(invalid),/monetary/);
});
const base={supplier:'VEVOR',product_name:'Example VEVOR tool for workshop review',
 product_url:'https://www.vevor.ca/example-equipment-p_0101010101',
 acquisition_kind:'not_received',video_platform:'none',video_url:'',daip_project_id:'',review_notes:'Not purchased or received'};
test('911: VEVOR review draft is private, not received, and never auto-published',()=>{
 const r=normalizeSupplierReview911(base);
 assert.equal(r.supplier,'VEVOR');
 assert.equal(r.publication_status,'draft');
 assert.equal(r.received_verified,false);
 assert.equal(r.disclosure_required,false);
 assert.equal(r.video_embed_url,null);
 assert.equal(r.daip_project_id,null);
});
test('911: donated and loaned review sample requires disclosure',()=>{
 for(const kind of ['gifted','loaned','review_sample'])
  assert.equal(normalizeSupplierReview911({...base,acquisition_kind:kind}).disclosure_required,true);
});
test('911: strict supplier URL and social video host allowlists prevent lookalike or injection',()=>{
 for(const url of ['https://www.vevor.ca.evil.example/item','http://www.vevor.ca/item',
  'https://other.invalid/item','https://www.vevor.ca/'])assert.throws(()=>normalizeSupplierReview911({...base,product_url:url}));
 assert.throws(()=>normalizeSupplierReview911({...base,unexpected_secret:'x'}),/Unsupported/);
 assert.throws(()=>normalizeSupplierVideo911('youtube','https://youtube.com.evil.example/watch?v=abcdefghijk'));
 assert.throws(()=>normalizeSupplierVideo911('instagram','https://www.instagram.com/accounts/login/'));
});
test('911: YouTube/Instagram/Facebook video cards are opt-in embed-only, no autoplay',()=>{
 const yt=normalizeSupplierVideo911('youtube','https://youtu.be/abcdefghijk?utm_source=test');
 assert.equal(yt.embed_url,'https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0');
 assert.equal(yt.url,'https://www.youtube.com/watch?v=abcdefghijk');
 const ig=normalizeSupplierVideo911('instagram','https://www.instagram.com/reel/ABCDEF12345/');
 assert.equal(ig.embed_url,'https://www.instagram.com/reel/ABCDEF12345/embed/');
 const fb=normalizeSupplierVideo911('facebook','https://www.facebook.com/watch/?v=123456');
 assert.match(fb.embed_url,/facebook\.com\/plugins\/video\.php\?href=/);
});
test('911: DAIP existing media workflow requires consent, processing health and project approval',()=>{
 const project={id:'123',project_code:'SAMPLE',title:'Sample',before_after_applicability:'required',
  content_package_status:'draft',consent_status:'private',public_publish_allowed:false};
 const x=workflowFor({project,assets:[],jobs:[],sessions:[],drafts:[]});
 assert.equal(x.public_handoff_ready,false);assert.equal(x.boundaries.auto_publish,false);
 assert.ok(x.blockers.some(s=>/Upload at least one private DAIP/.test(s)));
});
test('911: supplier source write fails before auth for cross-site requests',async()=>{
 const r=await onRequestPost({request:new Request('https://rosiedazzlers.ca/api/admin/supplier_reviews_v911',{
  method:'POST',headers:{origin:'https://untrusted.example','content-type':'application/json'},
  body:'{}'}),env:{}});
 assert.equal(r.status,403);
});
test('911: dark internal control desk links finance/DAIP and never autoloads external players',()=>{
 const html=readFileSync(new URL('../admin-finance-supplier-911.html',import.meta.url),'utf8');
 const client=readFileSync(new URL('../assets/build911-operator-workbench.mjs',import.meta.url),'utf8');
 const sql=readFileSync(new URL('../supabase/migrations/20261119113000_build911_supplier_review_drafts.sql',import.meta.url),'utf8');
 assert.match(html,/Supplier.*VEVOR|VEVOR.*Supplier/s);
 assert.match(html,/admin-daip-media/);
 assert.match(html,/remote-location|Remote-location/);
 assert.match(client,/Load third-party video preview/);
 assert.match(client,/third-party|third_party|thirdParty/);
 assert.match(sql,/row level security/);
 assert.match(sql,/revoke all .*anon, authenticated/);
});
