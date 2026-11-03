import { calculateInventoryUsage } from './inventory-usage-units.js';

const encoder = new TextEncoder();
const MAX_PREVIEW_AGE_MS = 10 * 60 * 1000;

function b64(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unb64(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw Error('Invalid preview receipt.');
  const input = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4));
  return Uint8Array.from(input, (char) => char.charCodeAt(0));
}

async function hmac(secret, payload) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, payload));
}

export async function signUsagePreview750(payload, secret) {
  if (!secret) throw Error('Inventory preview signing is not configured.');
  const encoded = b64(encoder.encode(JSON.stringify(payload)));
  return `${encoded}.${b64(await hmac(secret, encoder.encode(encoded)))}`;
}

export async function verifyUsagePreview750(token, secret, { now = Date.now(), actorId, bookingId } = {}) {
  if (!secret) throw Error('Inventory preview signing is not configured.');
  const [data, signature, extra] = String(token || '').split('.');
  if (!data || !signature || extra || data.length > 12000) throw Error('A valid inventory preview is required before any stock deduction.');
  const expected = await hmac(secret, encoder.encode(data));
  const actual = unb64(signature);
  if (expected.length !== actual.length || expected.some((byte, i) => byte !== actual[i])) throw Error('Inventory preview was altered; load a fresh preview.');
  const receipt = JSON.parse(new TextDecoder().decode(unb64(data)));
  if (receipt.build !== 750 || !Number.isFinite(receipt.issued_at) || receipt.issued_at > now + 30000 || now - receipt.issued_at > MAX_PREVIEW_AGE_MS) throw Error('Inventory preview expired; refresh before posting.');
  if (receipt.actor_id !== actorId || receipt.booking_id !== bookingId) throw Error('Inventory preview belongs to another staff member or booking.');
  return receipt;
}

export function buildUsagePreview750(item, used, postingLine) {
  if (String(item?.item_type || '').toLowerCase() !== 'consumable') throw Error('Only active consumables can be used in this workflow.');
  const usage = calculateInventoryUsage(item, used);
  if (Number(postingLine?.quantity) !== usage.stockQuantity || Number(postingLine?.previous_qty) !== Number(item.qty_on_hand)) throw Error('Inventory changed during preview; reload and try again.');
  if (postingLine?.unit_cost_cents != null && Number(postingLine.unit_cost_cents) !== Number(item.cost_cents)) throw Error('Inventory unit cost changed during preview; reload and try again.');
  return {
    ...usage, estimatedCostCad: item.cost_cents == null ? null : usage.estimatedCostCad,
    item_key: item.item_key, item_name: item.name,
    stock_before: Number(postingLine.previous_qty), stock_after: Number(postingLine.new_qty),
    unit_cost_cents: item.cost_cents == null ? null : Number(item.cost_cents),
    costing_status: item.cost_cents == null || !Number.isFinite(Number(item.cost_cents)) ? 'review' : 'ready'
  };
}

export function usagePreviewChanged750(preview, item) {
  return preview.item_key !== item.item_key ||
    preview.stock_before !== Number(item.qty_on_hand) ||
    preview.unit_cost_cents !== (item.cost_cents == null ? null : Number(item.cost_cents)) ||
    preview.conversion !== Number(item.usage_units_per_stock_unit ?? 1) ||
    preview.stockUnit !== (item.stock_unit || item.unit_label || 'stock unit') ||
    preview.usageUnit !== (item.usage_unit || item.stock_unit || item.unit_label || 'stock unit') ||
    item.is_active === false || String(item.item_type || '').toLowerCase() !== 'consumable';
}

export function buildConsumableCostTrace750(batches = [], postingRows = []) {
  const byBatch = new Map();
  for (const row of postingRows) {
    const key = String(row.batch_id || '');
    if (!byBatch.has(key)) byBatch.set(key, []);
    byBatch.get(key).push(row);
  }
  let netCostCents = 0, missingCostLines = 0, pendingAccounting = 0;
  const entries = batches.map((batch) => {
    const reversed = batch.status === 'reversed';
    const lines = (byBatch.get(String(batch.id)) || []).map((row) => {
      const qty = Number(row.quantity), cost = row.unit_cost_cents == null ? null : Number(row.unit_cost_cents);
      const valid = Number.isFinite(qty) && qty > 0 && Number.isInteger(cost) && cost >= 0;
      const gross = valid ? Math.round(qty * cost) : null;
      if (!valid) missingCostLines++;
      if (!reversed && gross != null) netCostCents += gross;
      return { id: row.id, movement_id: row.movement_id, item_key: row.item_key, item_name: row.item_name,
        stock_quantity: qty, stock_unit: row.unit_label, cost_per_stock_unit_cents: valid ? cost : null,
        recorded_cost_cents: gross, net_cost_cents: reversed ? 0 : gross,
        stock_before: Number(row.previous_qty), stock_after: Number(row.new_qty), status: row.status };
    });
    if (!reversed && batch.accounting_status !== 'posted') pendingAccounting++;
    return {batch_id: batch.id, posted_at: batch.created_at, status: batch.status,
      accounting_status: batch.accounting_status, accounting_note: batch.accounting_note || null,
      actor_email: batch.actor_staff_email, reason: batch.reason, reversed_at: batch.reversed_at || null,
      reversal_reason: batch.reversal_reason || null, lines,
      recorded_cost_cents: lines.some(x => x.recorded_cost_cents == null) ? null : lines.reduce((a, x) => a + x.recorded_cost_cents, 0),
      net_cost_cents: lines.some(x => x.net_cost_cents == null) ? null : lines.reduce((a, x) => a + x.net_cost_cents, 0) };
  });
  return {entries, net_material_cost_cents: missingCostLines ? null : netCostCents,
    known_cost_cents: netCostCents, cost_status: missingCostLines ? 'review' : 'ready',
    missing_cost_lines: missingCostLines, accounting_review_batches: pendingAccounting,
    method: 'Recorded quantity and unit cost from immutable posting rows; reversed batches net to zero. No price or profit inferred.'};
}
