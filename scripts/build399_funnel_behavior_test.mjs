import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Isolate the endpoint's aggregation contract; production auth remains unchanged.
const source = readFileSync(new URL('../functions/api/admin/customer_booking_funnel_quality.js', import.meta.url), 'utf8');
const isolated = source.replace(/^import .*;\n/, `const requireStaffAccess=async()=>globalThis.testAuth;
const json=(body,status=200)=>new Response(JSON.stringify(body),{status});
const serviceHeaders=()=>({}); const methodNotAllowed=()=>json({},405);\n`);
const endpoint = await import('data:text/javascript;base64,' + Buffer.from(isolated).toString('base64'));
const context = { request: new Request('https://example.test/api/admin/customer_booking_funnel_quality?days=invalid'), env: { SUPABASE_URL: 'https://storage.test' } };
globalThis.testAuth = { ok: false, response: new Response('', { status: 403 }) };
globalThis.fetch = () => { throw new Error('Unauthenticated storage request'); };
assert.equal((await endpoint.onRequestGet(context)).status, 403);
globalThis.testAuth = { ok: true };
globalThis.fetch = async url => new Response(JSON.stringify(url.includes('site_activity_events') ? [
  { event_type: 'checkout_started', checkout_state: 'started' },
  { event_type: 'checkout_completed', checkout_state: 'completed' }
] : [{ status: 'completed' }]));
const result = await (await endpoint.onRequestGet(context)).json();
assert.equal(result.window.days, 30);
assert.equal(result.anonymous_event_layer.counts.checkout_started, 1);
assert.equal(result.anonymous_event_layer.counts.checkout_completed, 1);
assert.equal(result.canonical_booking_layer.counts.completed, 1);
assert.equal(result.evidence.layers_joined, false);
globalThis.fetch = async () => new Response('not JSON');
assert.equal((await endpoint.onRequestGet(context)).status, 503);
globalThis.fetch = async () => new Response('{}');
assert.equal((await endpoint.onRequestGet(context)).status, 503);
assert.equal((await endpoint.onRequestPost()).status, 405);
console.log('Build 399 behavioral tests PASS: auth denial, exact event counts, invalid window, malformed evidence, read-only method.');
