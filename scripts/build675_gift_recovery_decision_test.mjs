import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequestGet, onRequestPost } from '../functions/api/admin/gift_issuance_recovery_decisions.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const sessionId = 'cs_test_verified_675_something';
const env = { SUPABASE_URL: 'https://database.example.test', SUPABASE_SERVICE_ROLE_KEY: 'service-test',
  STRIPE_SECRET_KEY: 'sk_test_675', ADMIN_PASSWORD: 'authorized-admin', ALLOW_LEGACY_ADMIN_FALLBACK: 'true' };
const base = 'https://rosiedazzlers.ca/api/admin/gift_issuance_recovery_decisions';
const originalFetch = globalThis.fetch;
const provider = { id: sessionId, status: 'complete', payment_status: 'paid', payment_intent: 'pi_test_675',
  amount_total: 22000, currency: 'cad', mode: 'payment', livemode: false,
  metadata: { purpose: 'gift', cart: 'GIFT-100:2:', purchaser_email: 'buyer@example.test' } };
let providerUnavailable = false;
let held = false;
let rpcCalls = 0;
let stripeCalls = 0;
let lastRPC = null;
let actions = [];
globalThis.fetch = async (url, init = {}) => {
  const parsed = new URL(url);
  if (parsed.hostname === 'api.stripe.com') {
    stripeCalls++;
    assert.equal(init.method, 'GET', 'Stripe calls MUST be read-only');
    if (providerUnavailable) return Response.json({ error: { message: 'provider unavailable' } }, { status: 503 });
    if (parsed.pathname.endsWith('/line_items')) {
      return Response.json({ data: [{ quantity: 2 }], has_more: false });
    }
    return Response.json(provider);
  }
  if (parsed.hostname === 'database.example.test') {
    if (parsed.pathname.endsWith('/staff_users')) {
      return Response.json([{ id: '00000000-0000-4000-8000-000000000675', role_code: 'admin', is_active: true, can_manage_staff: true }]);
    }
    if (parsed.pathname.endsWith('/gift_issuance_recovery_decisions')) {
      assert.equal(init.method, 'GET');
      return Response.json(actions);
    }
    if (parsed.pathname.endsWith('/rpc/record_gift_issuance_recovery_decision')) {
      assert.equal(init.method, 'POST');
      rpcCalls++;
      lastRPC = JSON.parse(init.body);
      if (lastRPC.p_action === 'close_verified_no_action' && held) {
        return Response.json({ code: 'P0001' }, { status: 400 });
      }
      actions.unshift({ id: lastRPC.p_id, action: lastRPC.p_action, provider_check: lastRPC.p_provider_check });
      return Response.json({ id: lastRPC.p_id, action: lastRPC.p_action, idempotent: false,
        owner_hold_continues: lastRPC.p_action !== 'close_verified_no_action' });
    }
  }
  throw new Error(`Unexpected remote request ${init.method || 'GET'} ${url}`);
};

const makeRequest = (method, data, headers = {}) => new Request(method === 'GET' ? `${base}?session_id=${sessionId}` : base, {
  method,
  headers: { 'x-admin-password': 'authorized-admin', ...(method === 'POST' ? { 'Content-Type': 'application/json', origin: 'https://rosiedazzlers.ca' } : {}), ...headers },
  ...(method === 'POST' ? { body: JSON.stringify(data) } : {})
});
const call = async (method, data, headers) => {
  const response = await (method === 'GET' ? onRequestGet : onRequestPost)({ request: makeRequest(method, data, headers), env });
  return { status: response.status, body: await response.json() };
};
const uuid = () => crypto.randomUUID();
const decision = (action = 'close_verified_no_action', reason = 'verified_no_duplicate') => ({
  session_id: sessionId, decision_id: uuid(), action, reason_code: reason,
  confirm_no_customer_action: true
});

try {
  const overview = await call('GET');
  assert.equal(overview.status, 200);
  assert.equal(overview.body.provider.check, 'paid_verified');
  assert.equal(overview.body.provider.expected_count, 2);
  assert.equal(overview.body.provider.line_count_matched, true);
  assert.equal(JSON.stringify(overview.body).includes('buyer@example.test'), false, 'Provider customer data must remain private');
  assert.equal(JSON.stringify(overview.body).includes('pi_test_675'), false, 'Payment intent must not be exposed to the browser');

  const close = await call('POST', decision());
  assert.equal(close.status, 200);
  assert.equal(close.body.customer_contact, 'none');
  assert.equal(close.body.certificate_mutations, 0);
  assert.equal(lastRPC.p_provider_check, 'paid_verified');
  assert.equal(lastRPC.p_provider_payment_intent, 'pi_test_675');
  assert.equal(lastRPC.p_provider_expected_count, 2);
  assert.match(lastRPC.p_evidence_sha256, /^[a-f0-9]{64}$/);

  held = true;
  const conflict = await call('POST', decision());
  assert.equal(conflict.status, 409, 'SQL evidence gate rejects closeout when a webhook is held');
  assert.equal(conflict.body.owner_recovery_hold, true);
  held = false;

  provider.payment_status = 'unpaid';
  const previousRpc = rpcCalls;
  const unpaidClose = await call('POST', decision());
  assert.equal(unpaidClose.status, 409);
  assert.equal(rpcCalls, previousRpc, 'Unpaid Stripe must never reach a closeout RPC');
  const hold = await call('POST', decision('maintain_hold', 'provider_pending'));
  assert.equal(hold.status, 200);
  assert.equal(lastRPC.p_provider_check, 'unpaid');

  providerUnavailable = true;
  const noStripe = await call('GET');
  assert.equal(noStripe.body.provider.check, 'unavailable');
  const escalation = await call('POST', decision('escalate_review', 'provider_unavailable'));
  assert.equal(escalation.status, 200);
  assert.equal(lastRPC.p_provider_check, 'unavailable');
  const failedClose = await call('POST', decision());
  assert.equal(failedClose.status, 409);
  providerUnavailable = false;

  const crossOrigin = await call('POST', decision(), { origin: 'https://attacker.example.test' });
  assert.equal(crossOrigin.status, 403);
  const noOwner = await onRequestGet({ request: new Request(`${base}?session_id=${sessionId}`, {
    headers: { 'x-staff-email': 'admin@example.test' }
  }), env });
  assert.equal(noOwner.status, 403, 'Unsigned bridge identity is never sufficient for Stripe financial evidence');
  assert.ok(stripeCalls >= 7);
} finally {
  globalThis.fetch = originalFetch;
}

const sql = read('supabase/migrations/20261027000929_build675_gift_issuance_owner_decision_ledger.sql');
const appendOnly = read('supabase/migrations/20261027001739_build675_gift_recovery_append_only_guard.sql');
const canary = read('supabase/migrations/20261027002249_build675_decision_rollback_canary.sql');
assert.match(sql, /create table if not exists public\.gift_issuance_recovery_decisions/i);
assert.match(sql, /alter table public\.gift_issuance_recovery_decisions enable row level security/i);
assert.match(sql, /grant select, insert on public\.gift_issuance_recovery_decisions to service_role/i);
assert.doesNotMatch(sql, /grant (?:update|delete).*gift_issuance_recovery_decisions/i);
assert.match(appendOnly, /revoke all on public\.gift_issuance_recovery_decisions from service_role/i);
assert.match(appendOnly, /before update or delete on public\.gift_issuance_recovery_decisions/i);
assert.match(canary, /BUILD675_CANARY_EXPECTED_ROLLBACK/);
assert.match(canary, /HOLD_NOT_BLOCKED/);
assert.match(sql, /pg_advisory_xact_lock/);
assert.match(sql, /v_held <> 0 or v_delivery_review <> 0/);
assert.match(sql, /p_provider_payment_status <> 'paid'/);
assert.match(sql, /p_provider_expected_count/);
assert.match(sql, /revoke all on function public\.record_gift_issuance_recovery_decision/i);
assert.match(read('admin-site-settings.html'), /giftDecisionSaveBtn/);
assert.match(read('assets/admin-gift-issuance-decisions-v675.js'), /crypto\.randomUUID/);
assert.equal(read('admin-site-settings.html'), read('admin-site-settings/index.html'));
console.log('Build 675 owner authorization, live paid checkout/line count, no provider PII, SQL hold gates, provider outage, CSRF and append-only decision contract: PASS');
