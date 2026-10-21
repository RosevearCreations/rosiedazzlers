import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCatalog,asMarkdown} from './build_application_static_image_catalog.mjs';
import {reviewMatrix} from './accept_rendered_visual_audit_matrix.mjs';

const catalog=await buildCatalog();
assert.equal(catalog.entries.length,116);
assert.equal(catalog.entries.filter(x=>x.key.startsWith('theme:town_')).length,8);
assert.equal(catalog.entries.filter(x=>x.key.startsWith('theme:proof_')).length,0);
assert.equal(catalog.policy.dynamicTargetsExcluded,617);
assert.equal(catalog.policy.reservedThemeProofExcluded,49);
assert.ok(catalog.entries.every((x,i)=>x.number===i+1&&x.id===`IMG-${String(i+1).padStart(3,'0')}`));
assert.ok(catalog.entries.every(x=>x.pages.length&&x.size.basis&&x.ownership!=='employee'));
assert.ok(catalog.entries.some(x=>x.key==='static:assets/vehicles/outline_front.svg'&&x.format==='svg'));
assert.ok(catalog.entries.some(x=>x.key==='static:assets/brand/CarSizeChart.PNG'&&x.size.width===1700));
assert.ok(catalog.entries.some(x=>x.key==='static:assets/app-icons/rosie-192.png'&&x.size.width===192));
assert.ok(catalog.entries.some(x=>x.key==='static:favicon.ico'&&x.size.sizes.length>0));
const text=asMarkdown(catalog).join('\n');
assert.ok(text.includes('town tillsonburg'));
assert.equal(JSON.stringify(catalog)+'\n',JSON.stringify(JSON.parse(fs.readFileSync('data/application_static_image_catalog.json','utf8')))+'\n');

const slots=JSON.parse(fs.readFileSync('data/standard_theme_image_slots.json'));
const admin=JSON.parse(fs.readFileSync('data/standard_admin_visual_source_inventory.json'));
const req=JSON.parse(fs.readFileSync('data/media_requirements.json'));
const report={schema:'rosie.rendered-visual-audit.v1',page:'/admin-media-health',access:'protected-admin-screen',
  browserViewport:{width:1280,height:800},flags:{brokenImages:0,pendingImages:0,placeholders:0,imagesWithoutAlt:0,labelledSvgNeeded:0},
  truncated:false,visuals:[]};
const decision={page:'/admin-media-health',viewportWidth:1280,viewportHeight:800,
  operatorRole:'owner',decision:'accept-rendered-sample',reasonCode:'visual-approved'};
const original={schema:'rosie.operator-visual-review.v1',decisions:[decision]};
const accepted=reviewMatrix([report],original,slots,admin,req,catalog);
assert.equal(accepted.acceptedSamples,1);
assert.ok(accepted.missingProtectedAdminCaptures.length>0);
assert.equal(accepted.samples[0].status,'operator-accepted-rendered-sample');
assert.throws(()=>reviewMatrix([{...report,flags:{...report.flags,pendingImages:1}}],original,slots,admin,req,catalog),/Cannot accept/);
assert.throws(()=>reviewMatrix([],original,slots,admin,req,catalog),/unobserved/);
assert.throws(()=>reviewMatrix([report],{...original,decisions:[{...decision,customerUrl:'secret'}]},slots,admin,req,catalog),/Unsafe/);
assert.throws(()=>reviewMatrix([report,report],original,slots,admin,req,catalog),/Duplicate/);
const held=reviewMatrix([report],{...original,decisions:[{...decision,decision:'hold',reasonCode:'pending-evidence'}]},slots,admin,req,catalog);
assert.equal(held.samples[0].status,'operator-hold');
assert.equal(JSON.stringify(held).includes('secret'),false);
console.log('Build 611 catalog, staff boundary, measurements and redacted operator visual acceptance PASS');
