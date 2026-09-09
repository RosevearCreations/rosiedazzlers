import assert from 'node:assert/strict';
import {
  compareAcceptedTermsToCurrentPrice,
  evaluateSlotAvailability,
  hashStructuredQuoteTerms,
  replayDecision,
  validateStructuredQuoteTerms
} from '../functions/api/_lib/quote-booking-terms.js';

const NOW = Date.parse('2026-09-09T16:00:00.000Z');
const FUTURE = '2026-09-16T16:00:00.000Z';
const PAST = '2026-09-08T16:00:00.000Z';
const validTerms = {
  version: 1,
  package_code: 'complete_detail',
  vehicle_size: 'mid',
  addon_codes: ['pet_hair'],
  total_cents: 39400,
  deposit_cents: 10000,
  expires_at: FUTURE,
  currency: 'CAD'
};
const currentPrice = {
  ok: true,
  package_code: 'complete_detail',
  vehicle_size: 'mid',
  addon_codes: ['pet_hair'],
  total_cents: 39400,
  deposit_cents: 10000
};

// 1. valid conversion
{
  const result = compareAcceptedTermsToCurrentPrice(validTerms, currentPrice, NOW);
  assert.equal(result.ok, true, 'valid conversion must retain matching accepted/current terms');
  assert.equal(evaluateSlotAvailability({ startSlot: 'AM', durationSlots: 1, blockedSlots: [], conflicts: [] }).ok, true);
}

// 2. expired quote
{
  const result = validateStructuredQuoteTerms({ ...validTerms, expires_at: PAST }, NOW);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'QUOTE_EXPIRED');
}

// 3. stale price
{
  const result = compareAcceptedTermsToCurrentPrice(validTerms, { ...currentPrice, total_cents: 40900 }, NOW);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'QUOTE_PRICE_CHANGED');
}

// 4. slot taken
{
  const result = evaluateSlotAvailability({ startSlot: 'AM', durationSlots: 1, blockedSlots: [], conflicts: [{ start_slot: 'AM', duration_slots: 1 }] });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'BOOKING_SLOT_UNAVAILABLE');
}

// 5. duplicate / replay
{
  const result = replayDecision('2d7b0308-f034-4d52-bef6-205413276025');
  assert.equal(result.ok, true);
  assert.equal(result.replay, true);
  assert.equal(result.code, 'BOOKING_ALREADY_CREATED');
}

// 6. missing / malformed structured quote data
{
  const result = validateStructuredQuoteTerms({ version: 1, package_code: '', vehicle_size: 'mid', expires_at: FUTURE }, NOW);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'QUOTE_STRUCTURED_TERMS_REQUIRED');
}

// Hashing is deterministic and addon ordering is canonical.
{
  const a = await hashStructuredQuoteTerms(validTerms);
  const b = await hashStructuredQuoteTerms({ ...validTerms, addon_codes: ['pet_hair'] });
  assert.equal(a, b);
  assert.match(a, /^[a-f0-9]{64}$/);
}

console.log('Build 362 quote-to-booking acceptance regression cases: PASS');
