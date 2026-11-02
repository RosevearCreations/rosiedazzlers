// Per-tab gift draft recovery. No payment card, Stripe secret or gift code is
// persisted. Same intent + same payload returns the same Stripe idempotency key.
const STORE_KEY = 'rosie_gift_checkout_draft_741';
const MAX_AGE_MS = 60 * 60 * 1000;

export function readGiftCheckoutDraft(storage, now = Date.now()) {
  try {
    const row = JSON.parse(storage.getItem(STORE_KEY) || 'null');
    if (!row || !['dollar', 'service'].includes(row.kind) ||
        !row.payload || typeof row.payload !== 'object' ||
        !Number.isFinite(row.saved_at) || now < row.saved_at || now - row.saved_at > MAX_AGE_MS ||
        !/^[0-9a-f-]{36}$/i.test(row.checkout_request_id)) return null;
    return row;
  } catch { return null; }
}

export function prepareGiftCheckoutIntent(storage, kind, payload, uuid, now = Date.now()) {
  if (!['dollar', 'service'].includes(kind)) throw new Error('Unknown gift type');
  const previous = readGiftCheckoutDraft(storage, now);
  const same = previous && previous.kind === kind && JSON.stringify(previous.payload) === JSON.stringify(payload);
  const checkout_request_id = same ? previous.checkout_request_id : uuid();
  const next = { kind, payload, checkout_request_id, saved_at: now };
  storage.setItem(STORE_KEY, JSON.stringify(next));
  return { ...payload, checkout_request_id };
}

export function clearGiftCheckoutDraft(storage) {
  try { storage.removeItem(STORE_KEY); } catch {}
}
