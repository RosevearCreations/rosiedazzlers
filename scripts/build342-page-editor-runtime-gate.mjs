import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { console.error(`BUILD342 FAIL: ${message}`); process.exit(1); };
const need = (condition, message) => { if (!condition) fail(message); };

const middleware = read('functions/_middleware.js');
const bootstrap = read('assets/universal-page-editor-bootstrap.js');
const adapter = read('assets/universal-page-editor-build342.js');
const editor = read('assets/universal-page-editor.js');
const adminApi = read('functions/api/admin/page_editor.js');
const home = read('index.html');

need(middleware.includes('/assets/universal-page-editor-bootstrap.js?v=20260906build342'), 'HTML middleware does not inject the cache-busted Build 342 bootstrap');
need(middleware.includes('if (applyLegacyClarity || applyPageEditor) headers.set("cache-control", "no-cache")'), 'editor-eligible HTML is not forced to revalidate');
need(bootstrap.includes("import('/assets/universal-page-editor-build342.js?v=20260906build342')"), 'bootstrap does not load the Build 342 compatibility adapter');
need(adapter.includes("import { initUniversalPageEditor as initBuild341Editor } from '/assets/universal-page-editor.js?v=20260906build341'"), 'Build 342 adapter does not preserve the proven Build 341 editor implementation');
need(adapter.includes("root.querySelector?.('main')"), 'semantic main remains unsupported');
need(adapter.includes("root.querySelector?.('body > .container')"), 'container-based mature public pages remain unsupported');
need(adapter.includes("root.querySelector?.('[data-page-editor-root]')"), 'explicit page-editor root override is missing');
need(!adapter.includes("return document.body") && !adapter.includes("return root.body"), 'adapter must not fall back to editing the entire body/chrome');
need(home.includes('<div class="container">'), 'homepage no longer exposes the established container shell used by the compatibility proof');
need(!/<main\b/i.test(home), 'homepage unexpectedly gained a main element; this gate must continue proving the container-only compatibility case');
need(adapter.includes("#rosieStickyCtaBar"), 'editor toggle is not aware of the sticky conversion CTA');
need(adapter.includes('getBoundingClientRect'), 'editor toggle does not dynamically clear the sticky CTA height');
need(adapter.includes('MutationObserver'), 'editor toggle does not respond when shared chrome mounts after the editor');
need(editor.includes("const BLOCKED_ANCESTOR = 'form,button,input,select,textarea,option"), 'form/interactive-control protection regressed');
need(adminApi.includes('capability: "manage_settings"'), 'canonical settings capability guard regressed');
need(adminApi.includes('Page editing is restricted to administrators.'), 'Admin-only page-editor guard regressed');
need(adminApi.includes('access.actor?.is_admin'), 'Admin role resolution no longer uses canonical staff actor');

for (const protectedPath of ['/admin', '/api', '/client', '/detailer', '/app/detailer', '/login', '/checkout', '/quote-payment', '/final-balance-payment']) {
  need(middleware.includes(`"${protectedPath}"`), `protected route ${protectedPath} is not retained in the editor exclusion authority`);
}

console.log('BUILD342 PASS: public-page editor runtime compatibility and sticky-CTA clearance verified.');
