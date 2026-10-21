import assert from 'node:assert/strict';
import {reconcile} from './reconcile_rendered_visual_audits.mjs';
const make=(page='/services')=>({schema:'rosie.rendered-visual-audit.v1',page,
 access:'public-or-other',browserViewport:{width:390,height:844},truncated:false,
 flags:{brokenImages:1,pendingImages:2,placeholders:1,imagesWithoutAlt:1,labelledSvgNeeded:1},
 visuals:[{kind:'image',status:'broken',source:{kind:'public-static',value:'/assets/missing.webp'},hasAlt:false},
 {kind:'image',status:'broken',source:{kind:'external-or-r2',value:'SECRET'},hasAlt:true},
 {kind:'inline-svg',decorative:false,accessibleNameProvided:false}]});
const summary=reconcile([make(),make()]);
assert.equal(summary.reportCount,2);
assert.equal(summary.duplicatedViewportScreens,1);
assert.deepEqual(summary.brokenPublicStaticFiles,['/assets/missing.webp']);
assert.equal(summary.reports[0].missingAltCount,1);
assert.equal(JSON.stringify(summary).includes('SECRET'),false);
assert.throws(()=>reconcile([{...make(),page:'/?customer=secret'}]),/unsafe/);
assert.throws(()=>reconcile([{...make(),flags:{}}]),/counts/);
assert.throws(()=>reconcile(Array.from({length:251},make)),/limit/);
console.log('Build 609 rendered visual evidence reconciliation privacy and boundaries PASS');
