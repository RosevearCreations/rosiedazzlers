import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const js=readFileSync('assets/build648-admin-operator.js','utf8');
const css=readFileSync('assets/build648-admin-operator.css','utf8');
const manifest=JSON.parse(readFileSync('data/build917_admin_card_art_manifest.json','utf8'));
assert.equal(manifest.images.length,40,'All 40 Admin shortcut cards must have original artwork');
assert.equal(new Set(manifest.images.map(x=>x.path)).size,40,'No duplicated artwork paths');
for(const {title,path} of manifest.images){
 assert.ok(existsSync(path),'Artwork missing: '+title);
 const image=readFileSync(path,'utf8');
 assert.match(image,/viewBox="0 0 640 360"/);
 assert.match(image,/Rosie Dazzlers original admin artwork/);
 assert.ok(image.startsWith('<svg '));
 assert.doesNotMatch(image,/(?:\b(?:href|src)\s*=\s*["']https?:\/\/|<script|<image\b|<foreignObject\b)/i,'Static art must not reference remote images or scripts');
 assert.ok(js.includes(JSON.stringify(title)),'Card missing from client art map: '+title);
 assert.ok(js.includes('/'+path),'File missing from client art map: '+path);
}
assert.match(js,/card\.insertBefore\(img,card\.firstChild\)/);
assert.match(js,/img\.alt=''/);
assert.match(js,/img\.loading='lazy'/);
assert.match(css,/admin-workspace-art-917/);
console.log('Rosie Build 917 Admin artwork: 40 distinct approved decorative assets and injection PASS');

for(const entry of ['admin.html','admin/index.html']){
 const html=readFileSync(entry,'utf8');
 assert.ok(html.includes('/assets/build648-admin-operator.css?v=build917'),'CSS cache-key not promoted: '+entry);
 assert.ok(html.includes('/assets/build648-admin-operator.js?v=build917'),'JS cache-key not promoted: '+entry);
 assert.ok(!html.includes('/assets/build648-admin-operator.css?v=build648'),'Stale CSS reference: '+entry);
 assert.ok(!html.includes('/assets/build648-admin-operator.js?v=build648'),'Stale JS reference: '+entry);
}
