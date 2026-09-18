const VALID_STATUSES = new Set(["ready", "review", "unavailable"]);
const ACTIVE_PURCHASE_ORDER_STATUSES = new Set(["draft", "requested", "ordered"]);

function finiteNumber(value) {
  if (value == null || value === "") return null;
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
    if (!ACTIVE_PURCHASE_ORDER_STATUSES.has(status)) continue;
    const list = byKey.get(key) || [];
    list.push(row);
    byKey.set(key, list);
  }
  return byKey;
}

function firstRecorded(row, keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function recordedBoundary(row, config) {
  const state = firstRecorded(row, config.stateKeys);
  const at = firstRecorded(row, config.atKeys);
  const by = firstRecorded(row, config.byKeys);
  const referenceId = firstRecorded(row, config.referenceKeys || []);
  const recorded = [state, at, by, referenceId].some((value) => value !== null);
  return {
    status: recorded ? "recorded" : "unavailable",
    state: state == null ? null : String(state),
    recorded_at: at == null ? null : at,
    recorded_by: by == null ? null : by,
    reference_id: referenceId == null ? null : referenceId,
    inferred: false,
    reason: recorded ? null : config.unavailableReason
  };
}

function quantityBoundary(row) {
  const delta = roundedQuantity(row?.qty_delta);
  const previous = roundedQuantity(row?.previous_qty);
  const next = roundedQuantity(row?.new_qty);
  if (delta == null) {
    return {
      status: "review",
      qty_delta: null,
      previous_qty: previous,
      new_qty: next,
      reason: "Canonical movement quantity delta is unavailable."
    };
  }
  if (previous == null || next == null) {
    return {
      status: "unavailable",
      qty_delta: delta,
      previous_qty: previous,
      new_qty: next,
      reason: "Previous/new quantity evidence is incomplete; quantity continuity is not inferred."
    };
  }
  const expected = roundedQuantity(previous + delta);
  const matches = expected != null && Math.abs(expected - next) <= 0.001;
  return {
    status: matches ? "ready" : "review",
    qty_delta: delta,
    previous_qty: previous,
    new_qty: next,
    expected_new_qty: expected,
    reason: matches ? null : "Recorded previous quantity plus delta does not reconcile to recorded new quantity."
  };
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

export function buildInventoryJobCostOperationalEvidence({
  booking_id,
  movements = [],
  items = [],
  purchase_orders = []
} = {}) {
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

  const reasons = [];
  const rows = [];
  const reorderEvidence = [];
  const substitutions = [];
  let explicitJobUseRows = 0;
  let ambiguousDepletionRowsExcluded = 0;
  let quantityReviewRows = 0;
  let quantityUnavailableRows = 0;
  let missingCostRows = 0;
  let missingApprovalRows = 0;
  let missingPostingRows = 0;
  let materialCostCents = 0;

  for (const row of uniqueMovements) {
    const movementType = String(row?.movement_type || "").trim().toLowerCase();
    const quantity = quantityBoundary(row);
    const delta = quantity.qty_delta;
    const item = (row?.item_id && byId.get(String(row.item_id))) ||
      (row?.item_key && byKey.get(String(row.item_key))) || null;
    const itemKey = item?.item_key || row?.item_key || null;
    const explicitJobUse = movementType === "job_use" && delta != null && delta < 0;
    const ambiguousDepletion = delta != null && delta < 0 && movementType !== "job_use";
    const consumedQty = explicitJobUse ? roundedQuantity(-delta) || 0 : 0;
    const unitCostCents = finiteNumber(item?.cost_cents);
    const rowMaterialCostCents = explicitJobUse && consumedQty > 0 && unitCostCents != null
      ? Math.round(consumedQty * unitCostCents)
      : explicitJobUse && consumedQty > 0 ? null : 0;

    const approval = recordedBoundary(row, {
      stateKeys: ["approval_status", "usage_approval_status", "review_status"],
      atKeys: ["approved_at", "usage_approved_at", "reviewed_at"],
      byKeys: ["approved_by_staff_user_id", "approved_by_name", "reviewed_by_staff_user_id", "reviewed_by_name"],
      referenceKeys: ["approval_id", "usage_approval_id"],
      unavailableReason: "No stable row-level approval evidence is recorded on this movement; approval is not inferred."
    });
    const posting = recordedBoundary(row, {
      stateKeys: ["posting_status", "accounting_status"],
      atKeys: ["posted_at", "accounting_posted_at"],
      byKeys: ["posted_by_staff_user_id", "posted_by_name"],
      referenceKeys: ["journal_entry_id", "accounting_entry_id", "posting_reference_id"],
      unavailableReason: "No stable row-level accounting-posting reference is recorded on this movement; posting is not inferred."
    });

    const rowReasons = [];
    if (quantity.status === "review") {
      quantityReviewRows += 1;
      rowReasons.push(quantity.reason);
    } else if (quantity.status === "unavailable") {
      quantityUnavailableRows += 1;
    }

    if (ambiguousDepletion) {
      ambiguousDepletionRowsExcluded += 1;
      rowReasons.push(`Booking-linked ${movementType || "unknown"} depletion is not explicit job_use and is excluded from job consumption/cost evidence.`);
    }

    if (explicitJobUse) {
      explicitJobUseRows += 1;
      if (!item) {
        missingCostRows += 1;
        rowReasons.push(`Inventory authority is missing for explicit job_use item ${itemKey || row?.item_id || "unknown"}.`);
      } else if (unitCostCents == null) {
        missingCostRows += 1;
        rowReasons.push(`Recorded cost is unavailable for explicit job_use item ${item?.name || itemKey || "unknown"}.`);
      }
      if (approval.status === "unavailable") {
        missingApprovalRows += 1;
        rowReasons.push(approval.reason);
      }
      if (posting.status === "unavailable") {
        missingPostingRows += 1;
        rowReasons.push(posting.reason);
      }
      if (rowMaterialCostCents != null) materialCostCents += rowMaterialCostCents;
    }

    const substitution = normalizeSubstitution(row);
    if (substitution) {
      substitutions.push(substitution);
      if (!substitution.reason) rowReasons.push(`Substitution ${substitution.item_key || "unknown"} lacks recorded reason provenance.`);
    }

    rows.push({
      movement_id: row?.id || null,
      movement_identity: movementIdentity(row, rows.length),
      movement_type: movementType || null,
      item_id: item?.id || row?.item_id || null,
      item_key: itemKey,
      item_name: item?.name || null,
      explicit_job_use: explicitJobUse,
      ambiguous_depletion_excluded: ambiguousDepletion,
      consumed_qty: consumedQty,
      unit_label: item?.unit_label || row?.unit_label || null,
      unit_cost_cents: unitCostCents,
      material_cost_cents: rowMaterialCostCents,
      quantity_evidence: quantity,
      approval_evidence: approval,
      accounting_posting_evidence: posting,
      provenance: {
        source_kind: row?.source_kind || null,
        source_reference_id: row?.source_reference_id || null,
        actor_name: row?.actor_name || null,
        actor_staff_user_id: row?.actor_staff_user_id || null,
        updated_at: row?.updated_at || row?.created_at || null,
        note: row?.note || null
      },
      readiness: {
        status: rowReasons.length ? "review" : "ready",
        reasons: [...new Set(rowReasons.filter(Boolean))]
      }
    });
  }

  const jobUseItemKeys = new Set(
    rows.filter((row) => row.explicit_job_use && row.item_key).map((row) => String(row.item_key))
  );
  for (const itemKey of jobUseItemKeys) {
    const item = byKey.get(itemKey) || rows.find((row) => row.item_key === itemKey);
    const qtyOnHand = finiteNumber(item?.qty_on_hand);
    const reorderPoint = finiteNumber(item?.reorder_point);
    const lowStock = qtyOnHand != null && reorderPoint != null && qtyOnHand <= reorderPoint;
    const activeOrders = purchaseOrdersByKey.get(itemKey) || [];
    if (lowStock || activeOrders.length) {
      reorderEvidence.push({
        item_id: item?.id || null,
        item_key: itemKey,
        name: item?.name || item?.item_name || null,
        qty_on_hand: qtyOnHand,
        reorder_point: reorderPoint,
        reorder_qty: finiteNumber(item?.reorder_qty),
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
        reasons.push(`${item?.name || itemKey} is at or below its reorder point with no active purchase-order evidence; no reorder is inferred or created.`);
      }
    }
  }

  for (const row of rows) {
    reasons.push(...(row.readiness?.reasons || []));
  }

  let status = "ready";
  if (!bookingId || uniqueMovements.length === 0) status = "unavailable";
  else if (explicitJobUseRows === 0 || reasons.length) status = "review";
  if (!VALID_STATUSES.has(status)) status = "review";

  if (!bookingId) {
    reasons.unshift("A booking identifier is required for job-scoped operational evidence.");
  } else if (uniqueMovements.length === 0) {
    reasons.unshift("No canonical inventory movements are recorded for this job.");
  } else if (explicitJobUseRows === 0) {
    reasons.unshift("No explicit canonical job_use movement is recorded; job consumption and job material cost remain unavailable.");
  }

  const materialCostComplete = explicitJobUseRows > 0 && missingCostRows === 0;

  return {
    build: 409,
    booking_id: bookingId,
    status,
    readiness: {
      status,
      reasons: [...new Set(reasons.filter(Boolean))]
    },
    operational_rows: rows,
    substitutions,
    reorder_evidence: reorderEvidence,
    job_material_cost_cents: materialCostComplete ? materialCostCents : null,
    job_material_cost_complete: materialCostComplete,
    evidence: {
      canonical_movement_rows: uniqueMovements.length,
      duplicate_rows_ignored: duplicateEvidenceRows,
      explicit_job_use_rows: explicitJobUseRows,
      ambiguous_depletion_rows_excluded: ambiguousDepletionRowsExcluded,
      quantity_review_rows: quantityReviewRows,
      quantity_unavailable_rows: quantityUnavailableRows,
      missing_recorded_cost_rows: missingCostRows,
      missing_approval_evidence_rows: missingApprovalRows,
      missing_posting_evidence_rows: missingPostingRows,
      source_authority: "catalog_inventory_movements",
      inventory_authority: "catalog_inventory_items",
      reorder_authority: "catalog_purchase_orders"
    },
    boundaries: {
      read_only: true,
      mutation_authority: false,
      schema_authority: false,
      second_inventory_ledger_created: false,
      server_authoritative_quantities: true,
      recorded_costs_only: true,
      explicit_job_use_only: true,
      inferred_consumption: false,
      inferred_purchasing: false,
      inferred_accounting_posting: false,
      row_level_approval_evidence_required_for_ready: true,
      row_level_posting_evidence_required_for_ready: true
    }
  };
}
