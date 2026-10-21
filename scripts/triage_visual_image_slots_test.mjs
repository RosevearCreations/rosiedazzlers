import assert from 'node:assert/strict';
import fs from 'node:fs';
import {triage} from './triage_visual_image_slots.mjs';
const load=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const slots=load('data/standard_theme_image_slots.json');
const admin=load('data/standard_admin_visual_source_inventory.json');
const req=load('data/media_requirements.json');
const flags={brokenImages:0,pendingImages:1,placeholders:0,imagesWithoutAlt:0,labelledSvgNeeded:0};
const report={schema:'rosie.rendered-visual-audit.v1',page:'/admin-media-health',access:'protected-admin-screen',
 browserViewport:{width:390,height:844},flags,truncated:false,visuals:[]};
const image={kind:'image',status:'loaded',source:{kind:'public-static',value:'/assets/themes/standard/images/brand-banner.webp'},
 naturalWidth:800,naturalHeight:800};
const r=triage([{...report,visuals:[image,{...image,source:{kind:'external-or-r2',value:'PRIVATE'}}]}],slots,admin,req);
assert.equal(r.observed.length,1);
assert.equal(r.observed[0].belowRecommendation,true);
assert.equal(r.observed[0].aspectReview,true);
assert.equal(r.observed[0].disposition,'manual-artwork-review');
assert.equal(r.adminScreens.find(x=>x.route==='/admin-media-health').capturedViewports,1);
assert.equal(r.artworkRequests.length,5);
assert.equal(JSON.stringify(r).includes('PRIVATE'),false);
assert.equal(r.requiredR2Status.startsWith('not-verified'),true);
assert.throws(()=>triage([{...report,page:'/?secret=1'}],slots,admin,req),/unsafe/);
console.log('Build 610 image size/aspect advisory and Admin exception privacy PASS');
