import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { console.error(`BUILD341 FAIL: ${message}`); process.exit(1); };
const need = (condition, message) => { if (!condition) fail(message); };

const middleware = read('functions/_middleware.js');
const publicApi = read('functions/api/public_page_editor.js');
const adminApi = read('functions/api/admin/page_editor.js');
const bootstrap = read('assets/universal-page-editor-bootstrap.js');
const editor = read('assets/universal-page-editor.js');

need(middleware.includes('/assets/universal-page-editor-bootstrap.js?v=20260906build341'), 'public HTML middleware does not inject the Build 341 editor bootstrap');
need(middleware.includes('isEditorEligiblePath'), 'public HTML middleware does not scope editor eligibility');
for (const protectedPath of ['/admin', '/api', '/client', '/detailer', '/app/detailer']) {
  need(middleware.includes(`"${protectedPath}"`), `protected prefix ${protectedPath} is not excluded from editor injection`);
}
for (const protectedPath of ['/login', '/my-account', '/checkout', '/complete', '/invoice', '/quote-payment', '/final-balance-payment', '/booking-confirmed']) {
  need(middleware.includes(`"${protectedPath}"`), `transactional path ${protectedPath} is not excluded from editor injection`);
}

need(bootstrap.includes("import('/assets/universal-page-editor.js?v=20260906build341')"), 'bootstrap does not load the exact Build 341 editor module');
need(bootstrap.includes('initUniversalPageEditor'), 'bootstrap does not initialize the universal page editor');

need(publicApi.includes('const SETTING_KEY = "public_page_editor"'), 'public override API does not use the canonical setting key');
need(publicApi.includes('app_management_settings'), 'public override API is not DB-backed');
need(publicApi.includes('pages[page]'), 'public override API is not exact-page scoped');
need(publicApi.includes('page.startsWith("/api")') && publicApi.includes('page.startsWith("/admin")'), 'public override API does not reject protected namespaces');

need(adminApi.includes('requireStaffAccess'), 'admin editor API does not use canonical staff authorization');
need(adminApi.includes('capability: "manage_settings"'), 'admin editor API does not require settings authority');
need(adminApi.includes('Page editing is restricted to administrators.'), 'admin editor API is not explicitly Admin-only');
need(adminApi.includes('onRequestGet') && adminApi.includes('onRequestPost') && adminApi.includes('onRequestDelete'), 'admin editor API must support load, save and reset');
need(adminApi.includes('app_media_library'), 'admin editor API does not load the approved media library');
need(adminApi.includes('key=eq.media_library'), 'admin editor API lacks the existing media-library fallback');
need(adminApi.includes('That image is not in the approved RosieDazzlers media library.'), 'image saves do not fail closed against approved media');
need(adminApi.includes('isSafeHref'), 'link editing lacks safe-destination validation');
need(adminApi.includes('app_management_setting_history'), 'page edits do not preserve setting-history evidence');
need(!/updated_by:\s*actor\?/.test(adminApi), 'page editor attempts to write an unproven top-level updated_by database column');

need(editor.includes("const BLOCKED_ANCESTOR = 'form,button,input,select,textarea,option"), 'editor does not exclude form and interactive controls');
need(editor.includes("node.textContent = String(override.text"), 'text overrides are not applied as textContent');
need(!editor.includes('override.innerHTML'), 'persisted overrides must never be applied through innerHTML');
need(editor.includes('findApprovedMedia') === false, 'browser editor must not pretend to authorize media client-side');
need(editor.includes('MutationObserver'), 'dynamic public content is not re-registered safely');
need(editor.includes('Reset to source') && editor.includes('restoreOriginal'), 'reset-to-source contract is missing');
need(editor.includes('Edit page') && editor.includes('Finish editing'), 'toggle edit-mode control is missing');
need(editor.includes('rosie-page-editor-media-grid'), 'approved image chooser UI is missing');
need(editor.includes('@media(max-width:640px)'), 'editor panel lacks mobile responsiveness');
for (const unsafe of ['cloneNode(', '.outerHTML', 'replaceWith(']) {
  need(!editor.includes(unsafe), `editor contains unsafe live-control replacement pattern ${unsafe}`);
}

console.log('BUILD341 PASS: universal page editor authority verified.');
