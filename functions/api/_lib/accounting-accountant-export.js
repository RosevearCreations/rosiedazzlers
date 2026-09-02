const EVIDENCE_TYPES = new Set([
  "tax_general",
  "tax_vehicle",
  "tax_home_office",
  "tax_cca",
  "tax_inventory"
]);

const INTERNAL_EXPORT_KEYS = new Set([
  "created_by_staff_user_id",
  "updated_by_staff_user_id",
  "reviewed_by_staff_user_id",
  "last_recorded_by_staff_user_id",
  "created_by_name",
  "last_recorded_by_name",
  "storage_path",
  "file_url",
  "upload_url",
  "signed_url",
  "internal_notes"
]);

function text(value, max = 500) {
  const valueText = String(value ?? "").trim();
  return valueText ? valueText.slice(0, max) : null;
}

function id(value) {
  return text(value, 120);
}

function cleanYear(value) {
  const current = new Date().getFullYear();
  const n = Number(value || current);
  return Math.max(2020, Math.min(2100, Number.isFinite(n) ? Math.trunc(n) : current));
}

export function safeAccountantFilename(value, fallback = "document") {
  const original = String(value ?? "");
  const basename = original.split(/[\\/]/).pop() || "";
  let safe = basename
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .replace(/[. ]+$/g, "")
    .slice(0, 180);
  if (!safe) safe = fallback;
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(safe)) safe = `file-${safe}`;
  return safe;
}

export function accountantPackageFilename(year) {
  return `rosie-accountant-package-${cleanYear(year)}.json`;
}

export function safeCsvFilenameToken(value, fallback = "all") {
  const safe = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return safe || fallback;
}

function stripInternalMetadata(value) {
  if (Array.isArray(value)) return value.map(stripInternalMetadata);
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (INTERNAL_EXPORT_KEYS.has(key)) continue;
    out[key] = stripInternalMetadata(child);
  }
  return out;
}

function sanitizeProfile(profile) {
  if (!profile || typeof profile !== "object") return null;
  return {
    schema_version: profile.schema_version ?? 1,
    jurisdiction_country: text(profile.jurisdiction_country, 2),
    jurisdiction_province: text(profile.jurisdiction_province, 2),
    tax_workpaper: text(profile.tax_workpaper, 40),
    entity_type: text(profile.entity_type, 40),
    primary_business_activity: text(profile.primary_business_activity, 160),
    gst_hst_registered: typeof profile.gst_hst_registered === "boolean" ? profile.gst_hst_registered : null,
    business_number_masked: text(profile.business_number_masked, 40),
    gst_hst_number_masked: text(profile.gst_hst_number_masked, 40),
    fiscal_year_end_month: profile.fiscal_year_end_month ?? null,
    fiscal_year_end_day: profile.fiscal_year_end_day ?? null,
    accounting_method: text(profile.accounting_method, 40),
    identifiers_policy: "masked_only"
  };
}

function sanitizeMileageSummary(summary) {
  if (!summary || typeof summary !== "object") return null;
  return {
    combined_total_km: summary.combined_total_km ?? null,
    combined_business_km: summary.combined_business_km ?? null,
    combined_business_use_pct: summary.combined_business_use_pct ?? null,
    review_required: summary.review_required === true,
    vehicles: (Array.isArray(summary.vehicles) ? summary.vehicles : []).map((row) => ({
      vehicle: row?.vehicle ? {
        id: id(row.vehicle.id),
        label: text(row.vehicle.label, 120),
        vehicle_year: row.vehicle.vehicle_year ?? null,
        make: text(row.vehicle.make, 80),
        model: text(row.vehicle.model, 80),
        ownership_type: text(row.vehicle.ownership_type, 40)
      } : null,
      annual: row?.annual ? {
        id: id(row.annual.id),
        tax_year: row.annual.tax_year ?? null,
        opening_odometer_km: row.annual.opening_odometer_km ?? null,
        closing_odometer_km: row.annual.closing_odometer_km ?? null,
        total_km: row.annual.total_km ?? null,
        business_km: row.annual.business_km ?? null,
        business_use_pct: row.annual.business_use_pct ?? null,
        status: text(row.annual.status, 40)
      } : null,
      log_count: Number(row?.log_count || 0),
      unreviewed_log_count: Number(row?.unreviewed_log_count || 0),
      logged_business_km: row?.logged_business_km ?? null,
      reconciled_business_km: row?.reconciled_business_km ?? null,
      total_km: row?.total_km ?? null,
      business_use_pct: row?.business_use_pct ?? null,
      ready_for_allocation: row?.ready_for_allocation === true
    }))
  };
}

function sanitizeTaxYearSupport(row) {
  if (!row || typeof row !== "object") return null;
  return {
    id: id(row.id),
    tax_year: row.tax_year ?? null,
    opening_inventory_cad: row.opening_inventory_cad ?? null,
    closing_inventory_cad: row.closing_inventory_cad ?? null,
    inventory_valuation_method: text(row.inventory_valuation_method, 120),
    direct_cost_adjustment_cad: row.direct_cost_adjustment_cad ?? null,
    filing_status: text(row.filing_status, 40),
    accountant_notes: text(row.accountant_notes, 2000)
  };
}

function addIds(set, rows, keys = ["id"]) {
  for (const row of Array.isArray(rows) ? rows : []) {
    for (const key of keys) {
      const value = id(row?.[key]);
      if (value) set.add(value);
    }
  }
}

function buildReferenceIndex(support = {}) {
  const vehicle = new Set();
  addIds(vehicle, support.vehicles);
  addIds(vehicle, support.vehicle_tax_years, ["id", "vehicle_id"]);
  addIds(vehicle, support.mileage_logs, ["id", "vehicle_id"]);

  const home = new Set();
  addIds(home, support.home_office ? [support.home_office] : []);

  const cca = new Set();
  addIds(cca, support.capital_assets);

  const inventory = new Set();
  addIds(inventory, support.tax_year_support ? [support.tax_year_support] : []);

  return {
    tax_vehicle: vehicle,
    tax_home_office: home,
    tax_cca: cca,
    tax_inventory: inventory
  };
}

function referenceStatus(document, referenceIndex) {
  const relatedType = text(document?.related_type, 80);
  const relatedId = id(document?.related_id);
  if (!relatedType || !EVIDENCE_TYPES.has(relatedType)) return "unsupported_type";
  if (relatedType === "tax_general") return "general";
  if (!relatedId) return "missing_related_id";
  const candidates = referenceIndex[relatedType];
  if (!candidates || candidates.size === 0) return "unverified";
  return candidates.has(relatedId) ? "verified" : "unresolved";
}

export function buildEvidenceManifest(documents = [], support = {}) {
  const referenceIndex = buildReferenceIndex(support);
  const manifest = (Array.isArray(documents) ? documents : []).map((document, index) => {
    const documentId = id(document?.id);
    const relatedType = text(document?.related_type, 80);
    const relatedId = id(document?.related_id);
    const hasStoredFile = !!(text(document?.file_name, 500) || text(document?.storage_path, 1000) || text(document?.file_url, 1000));
    return {
      document_id: documentId,
      reference_key: `${relatedType || "unknown"}:${relatedId || documentId || index + 1}`,
      related_type: relatedType,
      related_id: relatedId,
      reference_status: referenceStatus(document, referenceIndex),
      document_kind: text(document?.document_kind, 80),
      title: text(document?.title, 240),
      document_date: text(document?.document_date, 10),
      file_name: safeAccountantFilename(document?.file_name, `document-${documentId || index + 1}`),
      file_attached: hasStoredFile
    };
  });

  const counts = manifest.reduce((out, row) => {
    out[row.reference_status] = (out[row.reference_status] || 0) + 1;
    return out;
  }, {});

  return {
    manifest,
    integrity: {
      document_count: manifest.length,
      verified_reference_count: Number(counts.verified || 0),
      general_reference_count: Number(counts.general || 0),
      unverified_reference_count: Number(counts.unverified || 0),
      unresolved_reference_count: Number(counts.unresolved || 0),
      missing_related_id_count: Number(counts.missing_related_id || 0),
      unsupported_type_count: Number(counts.unsupported_type || 0),
      review_required: Number(counts.unresolved || 0) > 0 || Number(counts.missing_related_id || 0) > 0 || Number(counts.unsupported_type || 0) > 0
    }
  };
}

export function buildAccountantExportPackage({
  year,
  generatedAt,
  readiness,
  businessTaxProfile,
  yearEndReport,
  balanceSheet,
  t2125Workpaper,
  support,
  inventoryCostCompleteness
} = {}) {
  const taxYear = cleanYear(year);
  const safeSupport = support && typeof support === "object" ? support : {};
  const evidence = buildEvidenceManifest(safeSupport.documents || [], safeSupport);

  return {
    download_filename: accountantPackageFilename(taxYear),
    package: {
      schema_version: 2,
      export_contract: "rosie_accountant_workpaper_json",
      package_type: "Rosie Dazzlers accountant year-end package",
      format: {
        media_type: "application/json",
        extension: "json",
        encoding: "utf-8"
      },
      tax_year: taxYear,
      generated_at: generatedAt || new Date().toISOString(),
      generated_by: "authorized_finance_user",
      disclaimer: "Accounting workpaper package only. Review filing eligibility, elections, CCA classes/rates, GST/HST treatment and source evidence before filing.",
      privacy_boundary: {
        masked_identifiers_only: true,
        storage_locators_exported: false,
        staff_identity_exported: false,
        internal_document_notes_exported: false
      },
      readiness: stripInternalMetadata(readiness || {}),
      business_tax_profile: sanitizeProfile(businessTaxProfile),
      year_end_report: stripInternalMetadata(yearEndReport || {}),
      balance_sheet: stripInternalMetadata(balanceSheet || {}),
      t2125_workpaper: stripInternalMetadata(t2125Workpaper || {}),
      tax_support: {
        readiness: stripInternalMetadata(safeSupport.readiness || []),
        mileage_summary: sanitizeMileageSummary(safeSupport.mileage_summary),
        home_office_calculation: stripInternalMetadata(safeSupport.home_office_calculation || null),
        capital_asset_summary: stripInternalMetadata(safeSupport.capital_asset_summary || null),
        tax_year_support: sanitizeTaxYearSupport(safeSupport.tax_year_support)
      },
      inventory_cost_completeness: stripInternalMetadata(inventoryCostCompleteness || {}),
      evidence_integrity: evidence.integrity,
      evidence_manifest: evidence.manifest
    }
  };
}
