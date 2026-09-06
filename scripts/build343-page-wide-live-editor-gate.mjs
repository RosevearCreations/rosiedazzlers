import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { console.error(`BUILD343 FAIL: ${message}`); process.exit(1); };
const need = (condition, message) => { if (!condition) fail(message); };

const middleware = read('functions/_middleware.js');
const bootstrap = read('assets/universal-page-editor-bootstrap.js');
const runtime = read('assets/universal-page-editor-build343.js');
const core = read('assets/universal-page-editor.js');
const adminApi = read('functions/api/admin/page_editor.js');
const home = read('index.html');
const about = read('about.html');
const help = read('blog.html');

need(middleware.includes('/assets/universal-page-editor-bootstrap.js?v=20260906build343'), 'public HTML middleware is not cache-busted to Build 343');
need(bootstrap.includes("import('/assets/universal-page-editor-build343.js?v=20260906build343')"), 'bootstrap does not load Build 343 runtime');
need(runtime.includes("/assets/universal-page-editor.js?v=20260906build343-core"), 'Build 343 runtime does not cache-bust the editor core');
need(runtime.includes("'[data-page-editor-root]'"), 'explicit page-wide content root is unsupported');
need(runtime.includes("'[role=\"main\"]'"), 'role=main compatibility is missing');
need(runtime.includes("'#main-content'"), '#main-content compatibility is missing');
need(runtime.includes("'body > .container'"), 'mature container-only public pages are unsupported');
need(!runtime.includes('return document.body') && !runtime.includes('return root.body'), 'runtime must not fall back to editing the whole body/shared chrome');

for (const [label, html] of [['homepage', home], ['About page', about], ['Help page', help]]) {
  need(html.includes('data-page-editor-root'), `${label} has no explicit page-wide editor root`);
  need(html.includes('/assets/universal-page-editor-bootstrap.js?v=20260906build343'), `${label} does not directly load the Build 343 editor bootstrap`);
  need(html.includes('/assets/chrome.js'), `${label} no longer loads shared public chrome`);
}

need(runtime.includes("'Edit this page'"), 'Admin control is not labelled Edit this page');
need(runtime.includes('Edit text and images directly on this page'), 'page-wide editing purpose is not exposed to Admin');
need(runtime.includes('rosie-page-edit-mode [data-page-editor-editable="true"]'), 'editable page text/images are not visibly outlined in edit mode');
need(runtime.includes("'.nav'"), 'shared navigation is not protected from page-specific editing');
need(runtime.includes("'[data-footer]'"), 'shared footer is not protected from page-specific editing');
need(runtime.includes("'#rosieStickyCtaBar'"), 'sticky booking CTA is not protected/cleared');
need(runtime.includes('getBoundingClientRect'), 'editor toggle does not dynamically clear sticky booking CTA height');
need(runtime.includes('MutationObserver'), 'runtime does not respond to dynamic page/chrome changes');

need(core.includes("main.querySelectorAll('img')"), 'image targets are no longer registered');
need(core.includes('renderTextEditor'), 'text editing UI regressed');
need(core.includes('renderImageEditor'), 'image editing UI regressed');
need(core.includes("fetch('/api/admin/page_editor'"), 'page edits no longer save through Admin authority');
need(core.includes('/api/public_page_editor?page='), 'saved public page overrides are no longer loaded');
need(core.includes('data-page-editor-ignore'), 'page-specific ignore protection regressed');
need(core.includes("const BLOCKED_ANCESTOR = 'form,button,input,select,textarea,option"), 'forms and interactive controls are no longer protected');

need(adminApi.includes('capability: "manage_settings"'), 'canonical settings capability guard regressed');
need(adminApi.includes('Page editing is restricted to administrators.'), 'Admin-only page-editor guard regressed');
need(adminApi.includes('access.actor?.is_admin'), 'Admin role resolution no longer uses canonical staff actor');
need(adminApi.includes('findApprovedMedia'), 'image saves no longer require approved media');

for (const protectedPath of ['/admin', '/api', '/client', '/detailer', '/app/detailer', '/login', '/checkout', '/quote-payment', '/final-balance-payment']) {
  need(middleware.includes(`"${protectedPath}"`), `protected route ${protectedPath} is not retained in editor exclusion authority`);
}

console.log('BUILD343 PASS: Admin page-wide live text/image editor is directly wired on Home, About and Help, with shared chrome and operational controls protected.');