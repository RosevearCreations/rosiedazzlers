import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/checkout.js';

// Calls the actual Cloudflare Pages checkout handler, not the catalogue helper.
// Invalid providers must fail before Supabase, provider calls, or booking writes.
test('unsupported payment provider is rejected without touching external services', async () => {
  const originalFetch = globalThis.fetch;
  let networkCalls = 0;
  globalThis.fetch = async () => { networkCalls++; throw new Error('unexpected external call'); };
  try {
    for (const payment_provider of ['unknown', 'crypto', 'stripe-and-paypal', '', 42]) {
      const request = new Request('https://test.invalid/api/checkout', {
        method: 'POST', headers: {'content-type':'application/json'},
        body: JSON.stringify({payment_provider})
      });
      const response = await onRequestPost({request, env:{}});
      assert.equal(response.status, 400, String(payment_provider));
      const body = await response.json();
      assert.match(body.error, /Unsupported payment method/);
      assert.equal(body.booking_created, false);
      assert.equal(body.payment_attempted, false);
    }
    assert.equal(networkCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
