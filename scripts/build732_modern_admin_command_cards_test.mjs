import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { CARDS, cardAllowed, sourceState } = require('../assets/admin-command-centre-v732.js');
const html = readFileSync('admin.html', 'utf8');
const route = readFileSync('admin/index.html', 'utf8');
const css = readFileSync('assets/admin-command-centre-v732.css', 'utf8');
const script = readFileSync('assets/admin-command-centre-v732.js', 'utf8');
const testDate = '2026-10-31T14:00:00.000Z';
const assertCount = (source, payload, expected, status) => {
  const result = sourceState(source, payload, testDate);
  assert.equal(result.value, expected, `${source} must not invent a value`);
  assert.equal(result.status, status, `${source} must declare completeness`);
  assert.equal(result.checked, testDate);
};

assert.equal(html, route, 'Root and /admin/ dashboard routes must stay identical');
assert.equal(CARDS.length, 6, 'Exactly six named command-centre domains');
assert.deepEqual(CARDS.map(x=>x.id), ['bookings','operations','finance','staff','marketing','it']);
assert.equal(new Set(CARDS.map(x=>x.source)).size, 6);
for (const card of CARDS) {
  assert.ok(card.title && card.description && card.metric && card.sourceLabel);
  assert.ok(card.href.startsWith('/') && !card.href.startsWith('//'));
  assert.ok(existsSync('.' + card.href.replace(/\/$/, '/index.html')) || existsSync('.' + card.href.replace(/\/$/, '') + '.html') || existsSync('.' + card.href));
}
for (const marker of ['adminCommandCards732','adminCommandFilter732','adminCommandRefresh732','adminCommandStatus732','admin-command-centre-v732.js','admin-command-centre-v732.css','RosieAdminCommand732.mount','publishCommandSource','guardedCommandSource']) assert.ok(html.includes(marker), marker);
assert.equal((html.match(/rosie:dashboard-source-732/g) || []).length, 1, 'Single producer for report events');

const allowedModules = {
  admin: ['admin','operations','finance','socials','it'],
  senior_detailer: ['detailer','operations'],
  detailer: ['detailer'],
  accountant: ['finance'],
  promoter: ['socials'],
  it_specialist: ['it']
};
const policy = (module, actor) => allowedModules[actor.role_code]?.includes(module) === true;
const visible = role => CARDS.filter(card => cardAllowed(card,{role_code:role},policy)).map(card => card.id);
assert.deepEqual(visible('admin'), ['bookings','operations','finance','staff','marketing','it']);
assert.deepEqual(visible('senior_detailer'), ['bookings','operations']);
assert.deepEqual(visible('detailer'), [], 'Detailer receives no unauthorized admin links, even if dashboard is reused');
assert.deepEqual(visible('accountant'), ['finance']);
assert.deepEqual(visible('promoter'), ['marketing']);
assert.deepEqual(visible('it_specialist'), ['it']);
assert.deepEqual(visible('unknown_role'), []);
assert.deepEqual(CARDS.filter(card => cardAllowed(card,{role_code:'admin'},()=>false)), []);
assert.deepEqual(CARDS.filter(card => cardAllowed(card,{role_code:'admin'})), [], 'Missing permission provider fails closed');
assert.deepEqual(CARDS.filter(card => cardAllowed(card,null,policy)), [], 'Missing actor fails closed');
assert.ok(html.includes("pageKey: 'admin'"), 'Admin page itself stays protected');

assertCount('today', {ok:true,counts:{total:12},warnings:[]},12,'attention');
assertCount('today', {ok:true,counts:{total:0},warnings:[]},0,'clear');
assertCount('today', {ok:true,counts:{total:3},warnings:['missing migration']},3,'partial');
assertCount('workflow', {ok:true,metrics:{quote_followups_due:5},fallback_active:false},5,'attention');
assertCount('workflow', {ok:true,metrics:{quote_followups_due:0},fallback_active:true},0,'partial');
assertCount('payments', {ok:true,table_ready:true,warning_count:0},0,'clear');
assertCount('payments', {ok:true,table_ready:true,warning_count:3},3,'attention');
assertCount('payments', {ok:true,table_ready:false,warning_count:0},null,'unverified');
assertCount('analytics', {ok:true,summary:{unique_visitors:138},generated_at:testDate},138,'attention');
assertCount('analytics', {ok:true,summary:{unique_visitors:0}},0,'clear');
assertCount('reliability', {ok:true,counts:{notification_failed:1,payment_links_missing:2,upload_sessions_needing_review:3,retention_due:4,unresolved_incidents:5},warnings:[]},15,'attention');
assertCount('reliability', {ok:true,counts:{notification_failed:0,payment_links_missing:0,upload_sessions_needing_review:0,retention_due:0,unresolved_incidents:0},warnings:[]},0,'clear');
assertCount('reliability', {ok:true,counts:{notification_failed:0,payment_links_missing:0,upload_sessions_needing_review:0,retention_due:0},warnings:[]},null,'unverified');
for (const source of ['today','workflow','payments','analytics','reliability']) {
  assertCount(source, null,null,'unverified');
  assertCount(source, {ok:false},null,'unverified');
}
for (const invalid of [-1,NaN,Infinity,'',null,2.5,'bogus']) assert.equal(sourceState('analytics',{ok:true,summary:{unique_visitors:invalid}},testDate).value,null);
assert.equal(sourceState('reliability',{ok:true,counts:{notification_failed:0,payment_links_missing:0,upload_sessions_needing_review:0,retention_due:0,unresolved_incidents:0},warnings:['table missing']},testDate).status,'partial');

assert.match(css, /@media\(max-width:1020px\)/);
assert.match(css, /@media\(max-width:640px\)/);
assert.match(css, /focus-visible/);
assert.match(css, /min-height:44px/);
assert.match(css, /\[hidden\]/);
assert.ok(!/setInterval|setTimeout|localStorage|sessionStorage|fetch\(/.test(script), 'Cards introduce no polling, storage, or duplicate reads');
assert.match(script, /createElement/);
assert.match(script, /textContent/);
assert.match(script, /hasModuleAccess/);

console.log('Build 732 PASS — six role-gated source-backed cards, honest freshness, failed/partial sources, responsive/touch/keyboard contracts, mirrored routes.');
