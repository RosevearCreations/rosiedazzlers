import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const staff = read('admin-staff.html');
const staffAlias = read('admin-staff/index.html');
const design = read('assets/admin-design-system.css');
const shell = read('assets/admin-shell.js');
const chrome = read('assets/chrome.js');
const routeSync = read('scripts/sync_route_copies.py');
const placeholders = read('assets/visual-placeholders.js');
const catalog = read('admin-catalog.html');
const catalogAlias = read('admin-catalog/index.html');
const catalogJs = read('assets/admin-catalog-v311.js');

assert.equal(staff, staffAlias, 'Clean Admin Staff route and .html route must render the same matrix and styling');
assert.equal(catalog, catalogAlias, 'Clean Admin Catalog route and .html route must use the same imagery');
assert.match(routeSync, /"admin-staff\.html"/, 'Admin Staff must be included in route-copy parity');
assert.match(staff, /grid-template-columns:minmax\(0,252px\) minmax\(0,1fr\)/, 'Staff content must have a shrinkable second grid track');
assert.match(staff, /\.staff-shell__content>\.section\{margin:0/, 'Prevent cumulative space from child sections');
assert.match(staff, /\.access-matrix-table-wrap\{width:100%;max-width:100%;min-width:0;overflow-x:auto/, 'Wide matrix must scroll inside its own panel');
assert.match(staff, /max-width: 980px/, 'The Staff sidebar must stack at tablet width');
assert.match(staff, /max-width: 600px/, 'The Staff hero must stack at phone width');
for (const id of ['accessMatrixWrap','staffList','staffForm','refreshAccessMatrixBtn','authorityBox']) {
  assert.ok(staff.includes(`id="${id}"`), `Staff action or access evidence lost: ${id}`);
}
assert.match(design, /\.staff-shell__menu,\.app-shell__menu,\.menu-col,\.span-4/,
  'Sidebar Admin modules must force a single menu column in shared styling');
assert.match(design, /\.media-health-layout>\[data-admin-menu-mount\]/,
  'Media Health sidebar must not leak into the adjacent workspace');
assert.match(design, /background:radial-gradient\(/,
  'Admin workspace must have a neutral background instead of legacy promotional photography');
assert.match(shell, /admin-design-system\.css\?v=build612-admin-layout/,
  'Updated shared Admin styling must have a versioned URL for browser cache refresh');
assert.match(chrome, /path\.startsWith\('\/admin'\)/,
  'Public advertising banner must never inject into an Admin screen');
assert.match(chrome, /document\.body\?\.dataset\?\.adminProtected === 'true'/,
  'Authenticated internal workspaces must also skip the public advertising banner');
assert.match(placeholders, /const STANDARD_ADMIN_PHOTOS = Object\.freeze/,
  'Standard Admin guidance cards must use the prepared theme artwork');
assert.match(placeholders, /isAdmin && isStandard/,
  'Do not replace real public/customer proof photography with Admin UI artwork');
assert.match(catalog, /src="\/assets\/themes\/standard\/images\/inventory-tools-photo\.webp"/,
  'Admin inventory picker must use the new Standard placeholder');
assert.doesNotMatch(catalogJs, /\/assets\/placeholders\/inventory-tools-photo\.jpg|\/assets\/addons\/generic_addon\.png/,
  'Admin inventory fallback must not bring back the retired placeholder imagery');

console.log('Build 612 Admin Theme #1 menu confinement, background, routes and matrix contracts PASS');
