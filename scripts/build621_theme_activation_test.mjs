import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clonePreviewTheme,exportReviewReceipt,STANDARD_PALETTE} from '../assets/theme-preview-contract.js';
import {ACTIVATION_SCHEMA,VIEWPORTS,REQUIRED_SURFACES,createActivationRequest,createRollbackPlan,validateActivationRequest} from '../assets/theme-activation-contract.js';

const baseline={id:'standard',label:'Standard',version:1,palette:STANDARD_PALETTE,slots:{static:{},managed:{}}};
const draft=clonePreviewTheme(baseline,'studio-gold','Studio Gold');draft.review.acknowledged=true;
const receipt=exportReviewReceipt(draft,'owner');
const acceptance=Object.fromEntries(VIEWPORTS.map(v=>[v,Object.fromEntries(REQUIRED_SURFACES.map(s=>[s,true]))]));
const prepared={receipt,actorRole:'owner',actorName:'owner',authorized:true,acceptance,mediaAudit:{staticApproved:true,managedApproved:true}};
const {request,errors}=createActivationRequest(prepared);
assert.equal(request.schema,ACTIVATION_SCHEMA);assert.deepEqual(errors,[]);assert.equal(request.publicActivation,false);
assert.equal(request.requiresProtectedMainRelease,true);assert.equal(request.requiresExactMainProductionVerification,true);
assert.ok(validateActivationRequest({...request,actorRole:'admin'}).some(e=>e.includes('verified owner')));
assert.ok(createActivationRequest({...prepared,authorized:false}).errors.length);
assert.ok(createActivationRequest({...prepared,acceptance:{}}).errors.length>=VIEWPORTS.length*REQUIRED_SURFACES.length);
assert.ok(createActivationRequest({...prepared,mediaAudit:{staticApproved:true}}).errors.some(e=>e.includes('media')));
assert.ok(createActivationRequest({...prepared,receipt:{...receipt,theme:{...draft,version:3}}}).errors.length===0); // Identity follows receipt when constructed together.
const rollback=createRollbackPlan({fromThemeId:'studio-gold',reason:'Card contrast failed on mobile',actorRole:'owner'});
assert.equal(rollback.toThemeId,'standard');assert.equal(rollback.publicActivation,false);
assert.throws(()=>createRollbackPlan({fromThemeId:'studio-gold',toThemeId:'other',reason:'Bad typography on mobile',actorRole:'owner'}));
assert.throws(()=>createRollbackPlan({fromThemeId:'studio-gold',reason:'Bad typography on mobile',actorRole:'admin'}));
const html=readFileSync(new URL('../admin-theme-release.html',import.meta.url),'utf8');
assert.match(html,/admin-auth\.js/);assert.match(html,/admin-shell\.js/);assert.match(html,/releaseWorkspace" hidden/);assert.match(html,/Export rollback review request/);
assert.match(readFileSync(new URL('../assets/admin-theme-release.js',import.meta.url),'utf8'),/role_code/);
console.log('Build 621 guarded theme activation and rollback tests passed.');
