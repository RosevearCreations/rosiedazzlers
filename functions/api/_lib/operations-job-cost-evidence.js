const VALID_STATUSES = new Set(["ready", "review", "unavailable"]);

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function roundedQuantity(value) {
  const number = finiteNumber(value);
  return number == null ? null : Math.round(number * 1000) / 1000;
}

function movementIdentity(row, index) {
  if (row?.id) return `id:${row.id}`;
  if (row?.source_reference_id) {
    return `source:${row.source_kind || "unknown"}:${row.source_reference_id}:${row.item_id || row.item_key || "unknown"}:${row.movement_type || "unknown"}:${row.qty_delta ?? ""}`;
  }
  return `row:${index}:${row?.item_id || row?.item_key || "unknown"}:${row?.movement_type || "unknown"}:${row?.qty_delta ?? ""}:${row?.previous_qty ?? ""}:${row?.new_qty ?? ""}`;
}

function indexItems(items = []) {
  const byId = new Map();
  const byKey = new Map();
  for (const item of items || []) {
    if (item?.id) byId.set(String(item.id), item);
    if (item?.item_key) byKey.set(String(item.item_key), item);
  }
  return { byId, byKey };
}

function indexPurchaseOrders(rows = []) {
  const byKey = new Map();
  for (const row of rows || []) {
    const key = String(row?.item_key || "").trim();
    if (!key) continue;
    const status = String(row?.status || "").trim().toLowerCase();
    if (!new Set(["draft", "requested", "ordered"]).has(status)) continue;
    const list = byKey.get(key) || [];
    list.push(row);
    byKey.set(key, list);
  }
  return byKey;
}

function normalizeSubstitution(row) {
  const substitutedFor = String(row?.substituted_for_item_key || row?.substitution_for_item_key || "").trim();
  if (!substitutedFor) return null;
  return {
    item_key: row?.item_key || null,
    substituted_for_item_key: substitutedFor,
    reason: String(row?.substitution_reason || "").trim() || null,
    movement_id: row?.id || null,
    source_reference_id: row?.source_reference_id || null
  };
}

export function buildOperationsJobCostEvidence({ booking_id, movements = [], items = [], purchase_orders = [] } = {}) {
  const bookingId = String(booking_id || "").trim() || null;
  const { byId, byKey } = indexItems(items);
  const purchaseOrdersByKey = indexPurchaseOrders(purchase_orders);
  const seen = new Set();
  const uniqueMovements = [];
  let duplicateEvidenceRows = 0;

  (movements || []).forEach((row, index) => {
    if (bookingId && row?.booking_id && String(row.booking_id) !== bookingId) return;
    const identity = movementIdentity(row, index);
    if (seen.has(identity)) {
      duplicateEvidenceRows += 1;
      return;
    }
    seen.add(identity);
    uniqueMovements.push(row);
  });

  const grouped = new Map();
  const substitutions = [];
  for (const row of uniqueMovements) {
    const key = String(row?.item_id || row?.item_key || "unknown");
    const group = grouped.get(key) || { rows: [], net_delta: 0 };
    const delta = roundedQuantity(row?.qty_delta);
    group.rows.push(row);
    if (delta != null) group.net_delta = roundedQuantity(group.net_delta + delta) || 0;
    grouped.set(key, group);
    const substitution = normalizeSubstitution(row);
    if (substitution) substitutions.push(substitution);
  }

  const usage = [];
  const reorderEvidence = [];
  const reasons = [];
  let materialCostCents = 0;
  let costComplete = true;

  for (const group of grouped.values()) {
    const exemplar = group.rows[group.rows.length - 1] || {};
    const item = (exemplar.item_id && byId.get(String(exemplar.item_id))) ||
      (exemplar.item_key && byKey.get(String(exemplar.item_key))) || null;
    const netDelta = roundedQuantity(group.net_delta) || 0;
    const consumedQty = roundedQuantity(Math.max(0, -netDelta)) || 0;
    const itemKey = item?.item_key || exemplar.item_key || null;
    const unitCostCents = finiteNumber(item?.cost_cents);
    const costCents = consumedQty > 0 && unitCostCents != null
      ? Math.round(consumedQty * unitCostCents)
      : consumedQty > 0 ? null : 0;

    if (consumedQty > 0 && !item) {
      reasons.push(`Inventory authority is missing for movement item ${itemKey || exemplar.item_id || "unknown"}.`);
      costComplete = false;
    }
    if (consumedQty > 0 && unitCostCents == null) {
      reasons.push(`Recorded cost is unavailable for ${item?.name || itemKey || "an inventory item"}.`);
      costComplete = false;
    }
    if (costCents != null) materialCostCents += costCents;

    const evidenceRows = group.rows.map((row) => ({
      movement_id: row?.id || null,
      movement_type: row?.movement_type || null,
      qty_delta: roundedQuantity(row?.qty_delta),
      previous_qty: roundedQuantity(row?.previous_qty),
      new_qty: roundedQuantity(row?.new_qty),
      source_kind: row?.source_kind || null,
      source_reference_id: row?.source_reference_id || null,
      note: row?.note || null,
      updated_at: row?.updated_at || row?.created_at || null
    }));

    if (consumedQty > 0 || netDelta !== 0) {
      usage.push({
        item_id: item?.id || exemplar.item_id || null,
        item_key: itemKey,
        name: item?.name || null,
        unit_label: item?.unit_label || exemplar.unit_label || null,
        net_qty_delta: netDelta,
        consumed_qty: consumedQty,
        unit_cost_cents: unitCostCents,
        material_cost_cents: costCents,
        movement_evidence: evidenceRows
      });
    }

    if (item) {
      const qtyOnHand = finiteNumber(item.qty_on_hand);
      const reorderPoint = finiteNumber(item.reorder_point);
      const lowStock = qtyOnHand != null && reorderPoint != null && qtyOnHand <= reorderPoint;
      const activeOrders = itemKey ? (purchaseOrdersByKey.get(String(itemKey)) || []) : [];
      if (lowStock || activeOrders.length) {
        reorderEvidence.push({
          item_id: item.id || null,
          item_key: itemKey,
          name: item.name || null,
          qty_on_hand: qtyOnHand,
          reorder_point: reorderPoint,
          reorder_qty: finiteNumber(item.reorder_qty),
          low_stock: lowStock,
          active_purchase_orders: activeOrders.map((order) => ({
            id: order?.id || null,
            status: order?.status || null,
            qty_ordered: finiteNumber(order?.qty_ordered),
            unit_cost_cents: finiteNumber(order?.unit_cost_cents),
            vendor_name: order?.vendor_name || null,
            ordered_at: order?.ordered_at || null
          }))
        });
        if (lowStock && activeOrders.length === 0) {
          reasons.push(`${item.name || itemKey || "Inventory item"} is at or below its reorder point with no active purchase order evidence.`);
        }
      }
    }
  }

  for (const substitution of substitutions) {
    if (!substitution.reason) reasons.push(`Substitution ${substitution.item_key || "unknown"} lacks recorded reason provenance.`);
  }

  let status = "ready";
  if (!bookingId || uniqueMovements.length === 0) status = "unavailable";
  else if (reasons.length || !costComplete) status = "review";
  if (!VALID_STATUSES.has(status)) status = "review";

  if (!bookingId) reasons.unshift("A booking identifier is required for job-scoped evidence.");
  else if (uniqueMovements.length === 0) reasons.unshift("No canonical inventory movements are recorded for this job.");

  return {
    build: 393,
    booking_id: bookingId,
    status,
    readiness: {
      status,
      reasons: [...new Set(reasons)]
    },
    usage,
    substitutions,
    reorder_evidence: reorderEvidence,
    material_cost_cents: costComplete ? materialCostCents : null,
    material_cost_complete: costComplete,
    evidence: {
      canonical_movement_rows: uniqueMovements.length,
      duplicate_rows_ignored: duplicateEvidenceRows,
      source_authority: "catalog_inventory_movements",
      inventory_authority: "catalog_inventory_items",
      reorder_authority: "catalog_purchase_orders"
    },
    boundaries: {
      read_only: true,
      mutation_authority: false,
      second_inventory_ledger_created: false,
      recorded_costs_only: true,
      replay_safe_projection: true,
      reversal_aware_projection: true
    }
  };
}
