const QUANTITY_SCALE = 1000;

export function roundInventoryQuantity(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return NaN;
  return Math.round(number * QUANTITY_SCALE) / QUANTITY_SCALE;
}

export function planInventoryAdjustment(previousValue, quantityValue, sign) {
  const previous = roundInventoryQuantity(previousValue);
  const quantity = roundInventoryQuantity(quantityValue);
  if (!Number.isFinite(previous) || previous < 0) return { ok: false, error: 'Current inventory quantity is invalid.' };
  if (!Number.isFinite(quantity) || !(quantity > 0)) return { ok: false, error: 'Quantity must be greater than zero.' };
  if (sign !== 1 && sign !== -1) return { ok: false, error: 'Inventory adjustment direction is invalid.' };
  if (sign < 0 && quantity > previous) return { ok: false, error: `Quantity exceeds stock on hand (${previous}).` };
  const delta = roundInventoryQuantity(sign * quantity);
  const next = roundInventoryQuantity(previous + delta);
  if (!Number.isFinite(next) || next < 0) return { ok: false, error: 'Inventory adjustment would create invalid stock.' };
  return { ok: true, previous_qty: previous, quantity, qty_delta: delta, new_qty: next };
}

export function validateInventoryPayloadNumbers(payload = {}) {
  const errors = [];
  for (const [field, label] of [
    ['qty_on_hand', 'qty_on_hand'],
    ['reorder_point', 'reorder_point'],
    ['reorder_qty', 'reorder_qty'],
    ['cost_cents', 'cost'],
    ['rating_count', 'rating_count'],
    ['estimated_jobs_per_unit', 'estimated_jobs_per_unit']
  ]) {
    const value = payload[field];
    if (value === null || value === undefined || value === '') continue;
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) errors.push(`${label} must be a finite non-negative number.`);
  }
  if (payload.rating_value !== null && payload.rating_value !== undefined && payload.rating_value !== '') {
    const rating = Number(payload.rating_value);
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) errors.push('rating_value must be between 0 and 5.');
  }
  return errors;
}

export function isPurchaseOrderReceiptReplay(current = {}, requestedStatus = '') {
  return String(requestedStatus || '').trim() === 'received' && (
    String(current?.status || '').trim() === 'received' || Boolean(current?.received_at)
  );
}
