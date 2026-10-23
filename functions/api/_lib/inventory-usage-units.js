// Convert a measured amount used on a job to the stock quantity debited by
// the existing atomic posting RPC (which stores three decimal places).
export function calculateInventoryUsage(item, quantity, { checkStock = true } = {}) {
  const used = Number(quantity);
  const conversion = Number(item?.usage_units_per_stock_unit ?? 1);
  if (!Number.isFinite(used) || used <= 0 || !Number.isFinite(conversion) || conversion <= 0) {
    throw new Error('Usage quantity and units per stock unit must be positive finite numbers.');
  }
  const rawStock = used / conversion;
  const stockQuantity = Math.round(rawStock * 1000) / 1000;
  if (!Number.isFinite(rawStock) || stockQuantity <= 0 || Math.abs(rawStock - stockQuantity) > 1e-9) {
    throw new Error('Usage cannot be expressed exactly in the stock ledger’s 0.001-unit precision. Adjust the usage amount or stock-unit conversion.');
  }
  if (checkStock && stockQuantity > Number(item?.qty_on_hand ?? 0) + 1e-9) {
    throw new Error('Insufficient stock for this partial job usage.');
  }
  const stockUnit = String(item?.stock_unit || item?.unit_label || 'stock unit').trim();
  const usageUnit = String(item?.usage_unit || stockUnit).trim();
  const unitCostCents = Number(item?.cost_cents ?? 0);
  return {
    usageQuantity: used, usageUnit, stockQuantity, stockUnit, conversion,
    estimatedCostCad: Number.isFinite(unitCostCents) && unitCostCents >= 0
      ? Math.round(stockQuantity * unitCostCents) / 100 : null
  };
}
