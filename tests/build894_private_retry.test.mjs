import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pendingPrivateRetry894 } from '../functions/api/admin/detailing_intake_v868.js';

const draftId='11111111-2222-4333-8444-555555555555';
const assetId='aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const saved=()=>({
 id:assetId,draft_id:draftId,bucket:'rosie-intake-private',
 object_path:`intakes/${draftId}/${assetId}.jpg`,
 content_type:'image/jpeg',expected_bytes:550000,status:'pending_upload'
});
test('only the exact existing original reserved path can be re-signed',()=>{
 assert.equal(pendingPrivateRetry894(saved(),draftId,assetId),true);
 for(const changed of [
  {id:'ffffffff-2222-4333-8444-111111111111'},
  {draft_id:'ffffffff-2222-4333-8444-111111111111'},
  {bucket:'public'},
  {object_path:'intakes/'+draftId+'/../outside.jpg'},
  {object_path:'intakes/'+draftId+'/'+assetId+'.mp4'},
  {content_type:'application/pdf'},
  {expected_bytes:0},
  {expected_bytes:12*1024*1024+1},
  {expected_bytes:2.5},
  {status:'stored_private'}
 ]) assert.equal(pendingPrivateRetry894({...saved(),...changed},draftId,assetId),false,JSON.stringify(changed));
 assert.equal(pendingPrivateRetry894(saved(),'invalid',assetId),false);
 assert.equal(pendingPrivateRetry894(saved(),draftId,'invalid'),false);
});
test('retry is staff-only, consented, quota-preserving and restricted to original Supabase origin',()=>{
 const api=readFileSync(new URL('../functions/api/admin/detailing_intake_v868.js',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../assets/admin-booking-v868.js',import.meta.url),'utf8');
 assert.match(api,/capability:'manage_bookings'/);
 assert.match(api,/allowLegacyAdminFallback:false/);
 assert.match(api,/access.auth_mode!=='session'/);
 assert.match(api,/action==='retry_upload'/);
 assert.match(api,/current.private_photo_permission!==true/);
 assert.match(api,/pendingPrivateRetry894\(a,draftId,assetId\)/);
 assert.match(api,/new URL\(uploadUrl\).origin!==origin/);
 const retry=api.slice(api.indexOf("if(action==='retry_upload')"),api.indexOf("if(action==='preview_private')"));
 assert.doesNotMatch(retry,/rosie869_reserve_media|method:'POST',\s*data:\[|stripe|paypal|bookings/);
 assert.match(ui,/state.retryFiles.set\(signed.asset_id/);
 assert.match(ui,/state.retryFiles.delete\(signed.asset_id\)/);
 assert.match(ui,/checkPending894/);
 assert.match(ui,/retryPending894/);
 assert.match(ui,/await call\('confirm_upload'[\s\S]*?\).catch\(\(\)=>null\)/);
 assert.doesNotMatch(ui,/localStorage\.setItem|sessionStorage\.setItem\([^)]*,\s*(?:file|original|blob)/);
});
