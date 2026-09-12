import assert from 'node:assert/strict';
import fs from 'node:fs';
import { beforeAfterPlacement, isPrivateMediaKey, isPhotoStudioPublicRow, PHOTO_STUDIO_BUILD } from '../functions/api/_lib/photo-studio-safety.js';

assert.equal(PHOTO_STUDIO_BUILD,391);
assert.equal(isPrivateMediaKey('daip/customer-1/evidence.jpg'),true);
assert.equal(isPrivateMediaKey('jobs/42/before.jpg'),true);
assert.equal(isPrivateMediaKey('gallery/public-proof.jpg'),false);
assert.equal(isPhotoStudioPublicRow({r2_key:'gallery/public-proof.jpg',source_status:'active',media_type:'image'}),true);
assert.equal(isPhotoStudioPublicRow({r2_key:'daip/private-proof.jpg',source_status:'active',media_type:'image'}),false);
assert.equal(isPhotoStudioPublicRow({r2_key:'gallery/archived.jpg',source_status:'archived',media_type:'image'}),false);
assert.deepEqual(beforeAfterPlacement('gallery:hood:before','before_after_pair'),{pair_group_key:'gallery:hood',pair_side:'before'});
assert.deepEqual(beforeAfterPlacement('gallery:hood:after','before_after_pair'),{pair_group_key:'gallery:hood',pair_side:'after'});

const assignment=fs.readFileSync('functions/api/admin/photo_assignment_save.js','utf8');
assert.match(assignment,/loadAssignablePublicPhoto/);
assert.match(assignment,/action==='remove'\|\|action==='reset'\|\|action==='unassign'/);
assert.match(assignment,/asset_deleted:false/);
assert.match(assignment,/multi_placement_supported:true/);
assert.match(assignment,/Before and After must use two different photos/);

const list=fs.readFileSync('functions/api/admin/photo_library_list.js','utf8');
assert.match(list,/filter\(isPhotoStudioPublicRow\)/);
assert.match(list,/private_media_isolated:true/);
assert.match(list,/before_after_pairs:Object\.values\(beforeAfterPairs\)/);
assert.match(list,/r2_scan_per_load:false/);

const sync=fs.readFileSync('functions/api/admin/photo_library_sync.js','utf8');
assert.match(sync,/requires one approved R2 prefix per request/);
assert.match(sync,/prefixes:\[requested\]/);
assert.match(sync,/cursor/);

const deletion=fs.readFileSync('functions/api/admin/photo_library_delete.js','utf8');
assert.match(deletion,/isApprovedImageKey\(r2Key\)/);
assert.match(deletion,/currently assigned and cannot be deleted/);
assert.match(deletion,/Gallery Before\/After row and cannot be deleted/);
assert.match(deletion,/Public R2 bucket binding is not configured for deletion/);

const manifest=fs.readFileSync('functions/api/_lib/public-website-images.js','utf8');
assert.match(manifest,/filter\(isPhotoStudioPublicRow\)/);
assert.match(manifest,/r2_scan_per_request:false/);
assert.match(manifest,/r2_mutation_per_request:false/);
assert.match(manifest,/private_media_isolated:true/);

const alias=fs.readFileSync('functions/api/public/website_images.js','utf8');
assert.match(alias,/public_website_images\.js/);

console.log('Build 391 Photo Studio & R2 Media Reliability authority: PASS');
