import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const faq = readFileSync('faq.html','utf8');
const faqFolder = readFileSync('faq/index.html','utf8');
const theme = readFileSync('assets/themes/standard.css','utf8');
const styleEntry = readFileSync('assets/site.css','utf8');
const visual = readFileSync('assets/build734-standard-visual-repair.css','utf8');
const chrome = readFileSync('assets/chrome.js','utf8');
const login = readFileSync('login.html','utf8');
const loginFolder = readFileSync('login/index.html','utf8');
const admin = readFileSync('admin.html','utf8');
const owner = readFileSync('docs/audits/BUILD734_STANDARD_OWNER_DEVICE_REVIEW.md','utf8');

function pngDimensions(path) {
  const data = readFileSync(path);
  assert.equal(data.toString('hex',0,8),'89504e470d0a1a0a');
  return [data.readUInt32BE(16),data.readUInt32BE(20)];
}
function webpDimensions(path) {
  const data = readFileSync(path);
  assert.equal(data.toString('ascii',0,4),'RIFF');
  assert.equal(data.toString('ascii',8,12),'WEBP');
  assert.equal(data.toString('ascii',12,16),'VP8 ','Build 734 audited actual VP8 files only');
  return [data.readUInt16LE(26)&0x3fff,data.readUInt16LE(28)&0x3fff];
}

assert.equal(faq,faqFolder,'FAQ root/folder parity');
assert.equal(login,loginFolder,'Login route parity retained');
assert.deepEqual(pngDimensions('assets/themes/standard/images/cropgold.png'),[945,476]);
assert.ok(chrome.includes('/assets/themes/standard/images/cropgold.png'));
assert.match(theme,/\.brand img\[data-logo\]/);
assert.match(theme,/aspect-ratio: 945 \/ 476/);
assert.match(theme,/object-fit: contain/);
assert.match(theme,/\.brand strong\s*\{\s*display:\s*none/);

const matchImg = [...faq.matchAll(/<img\b[^>]*class="faq-theme-card-photo"[^>]*>/g)].map(match => match[0]);
assert.equal(matchImg.length,4,'FAQ must have four distinct guide images');
const seen = new Set();
for(const tag of matchImg) {
  const src=tag.match(/src="([^"]+)"/)?.[1];
  const width=Number(tag.match(/\bwidth="(\d+)"/)?.[1]);
  const height=Number(tag.match(/\bheight="(\d+)"/)?.[1]);
  assert.ok(src?.startsWith('/assets/themes/standard/images/'));
  assert.ok(!seen.has(src),'Each guide card must show its assigned art');
  seen.add(src);
  assert.ok(existsSync('.'+src));
  assert.deepEqual([width,height],webpDimensions('.'+src),`Actual intrinsic dimensions must match ${src}`);
  assert.match(tag,/alt="[^"]+"/);
}
assert.equal(seen.has('/assets/themes/standard/images/workflow-tablet.webp'),true);
assert.equal(seen.has('/assets/themes/standard/images/package-complete.webp'),true);
assert.equal(seen.has('/assets/themes/standard/images/workflow-photo.webp'),true);
assert.equal(seen.has('/assets/themes/standard/images/local-proof-photo.webp'),true);

const importIndex=styleEntry.indexOf('build734-standard-visual-repair.css');
assert.ok(importIndex>styleEntry.indexOf('/assets/themes/standard.css'),'Visual repairs must layer after base Standard');
assert.ok(styleEntry.includes('build647-public-responsive.css'));
assert.match(visual,/\.brand img\[data-logo\]/);
assert.ok(visual.includes('url("/assets/themes/standard/images/cropgold.png")'),'First-paint fallback must use approved logo');
assert.match(visual,/\.nav \.nav-toggle\s*\{\s*display:\s*none/);
assert.match(visual,/@media \(min-width: 881px\)/);
assert.match(visual,/@media \(max-width: 880px\)/);
assert.match(visual,/display: inline-flex !important/);
assert.match(visual,/min-height: 44px/);
assert.match(visual,/white-space: nowrap/);
assert.match(visual,/\.faq-access-paths \.faq-theme-card-photo/);
assert.match(visual,/object-fit: contain/);
assert.match(visual,/\.actorcard/);
assert.match(visual,/overflow-wrap: anywhere/);
assert.match(visual,/@media \(max-width: 480px\)/);
assert.ok(!visual.includes('object-fit: cover'),'Build 734 guide art must not crop');
assert.ok(!/url\(\s*['"]?https?:/.test(visual),'No new external artwork URLs');
assert.ok(!/display:\s*none\s*!important/.test(visual),'Do not permanently hide mobile navigation');
assert.match(login,/loginForm/);
assert.match(login,/signupForm/);
assert.match(admin,/pageKey: 'admin'/);
assert.match(admin,/RosieAdminCommand732\.mount/);
assert.match(admin,/RosieAdminNavigation733\.mount/);

assert.match(owner,/Owner physical-device sign-off: PENDING/);
for(const w of ['320/375/390px','768px','1363px','FAQ','Login','Admin','gallery','Cloudflare']) assert.ok(owner.toLowerCase().includes(w.toLowerCase()),w);
assert.ok(owner.includes('No before/after'));
console.log('Build 734 PASS — approved logo ratio, intrinsic FAQ image parity, no-crop guide frames, desktop/mobile menu, login/Admin overflow, route mirrors, owner device review PENDING.');
