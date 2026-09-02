import fs from 'node:fs';

const source = fs.readFileSync('functions/api/_lib/accounting-accountant-export.js', 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const {
  buildAccountantExportPackage,
  safeAccountantFilename,
  safeCsvFilenameToken
} = await import(moduleUrl);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const support = {
  profile: {
    schema_version: 1,
    jurisdiction_country: 'CA',
    jurisdiction_province: 'ON',
    tax_workpaper: 'T2125',
    entity_type: 'sole_proprietor',
    primary_business_activity: 'Mobile auto detailing',
    gst_hst_registered: true,
    business_number_masked: '•••• 1234',
    gst_hst_number_masked: '•••• 5678',
    fiscal_year_end_month: 12,
    fiscal_year_end_day: 31,
    accounting_method: 'accrual_review',
    identifiers_policy: 'masked_only',
    notes: 'internal-profile-note'
  },
  vehicles: [{ id: 'vehicle-1', label: 'Work van', make: 'Ford', model: 'Transit', notes: 'private-vehicle-note', created_by_staff_user_id: 'staff-1' }],
  vehicle_tax_years: [{ id: 'vehicle-year-1', vehicle_id: 'vehicle-1', tax_year: 2026, total_km: 10000, business_km: 8000 }],
  mileage_logs: [{ id: 'trip-1', vehicle_id: 'vehicle-1', booking_id: 'customer-booking-1', purpose: 'Customer visit' }],
  mileage_summary: {
    combined_total_km: 10000,
    combined_business_km: 8000,
    combined_business_use_pct: 80,
    review_required: false,
    vehicles: [{
      vehicle: { id: 'vehicle-1', label: 'Work van', make: 'Ford', model: 'Transit', notes: 'private-vehicle-note', created_by_staff_user_id: 'staff-1' },
      annual: { id: 'vehicle-year-1', vehicle_id: 'vehicle-1', tax_year: 2026, total_km: 10000, business_km: 8000, notes: 'private-annual-note' },
      log_count: 1,
      unreviewed_log_count: 0,
      reconciled_business_km: 8000,
      total_km: 10000,
      business_use_pct: 80,
      ready_for_allocation: true
    }]
  },
  home_office: { id: 'home-1' },
  home_office_calculation: { eligible_cost_total_cad: 1000, suggested_current_year_deduction_cad: 200 },
  capital_assets: [{ id: 'asset-1', asset_name: 'Extractor' }],
  capital_asset_summary: { asset_count: 1, suggested_cca_claim_cad: 100, review_required: true },
  tax_year_support: {
    id: 'tax-year-1', tax_year: 2026, opening_inventory_cad: 100, closing_inventory_cad: 150,
    inventory_valuation_method: 'cost', filing_status: 'review', notes: 'internal-tax-year-note', accountant_notes: 'Accountant-facing note'
  },
  readiness: [{ key: 'tax_profile', ready: true }],
  documents: [
    {
      id: 'doc-1', related_type: 'tax_vehicle', related_id: 'vehicle-1', document_kind: 'receipt',
      title: 'Fuel receipt', document_date: '2026-04-02', file_name: '../private\\fuel?.pdf',
      storage_path: 'private/accounting/secret-object-key', file_url: 'https://internal.example/private', notes: 'secret-document-note'
    },
    {
      id: 'doc-2', related_type: 'tax_cca', related_id: null, document_kind: 'invoice',
      title: 'Equipment invoice', file_name: 'invoice.pdf', storage_path: 'private/cca/invoice.pdf'
    },
    {
      id: 'doc-3', related_type: 'unknown_private_type', related_id: 'x', document_kind: 'other',
      title: 'Unsupported reference', file_name: 'other.pdf'
    }
  ]
};

const exported = buildAccountantExportPackage({
  year: 2026,
  generatedAt: '2026-09-02T23:00:00.000Z',
  readiness: { status: 'review_required', manual_review_required: true },
  businessTaxProfile: support.profile,
  yearEndReport: { totals: { net_income_cad: 1000 }, created_by_name: 'staff@example.com', created_by_staff_user_id: 'staff-1' },
  balanceSheet: { totals: { balance_delta_cad: 0 }, updated_by_staff_user_id: 'staff-2' },
  t2125Workpaper: { summary: { unresolved_expense_cad: 0 }, internal_notes: 'do-not-export' },
  support,
  inventoryCostCompleteness: { totals: { missing_cost_on_hand_items: 0 }, storage_path: 'internal/path' }
});

assert(exported.download_filename === 'rosie-accountant-package-2026.json', 'accountant package filename is not deterministic');
assert(exported.package.schema_version === 2, 'export schema version must be 2');
assert(exported.package.export_contract === 'rosie_accountant_workpaper_json', 'export contract marker missing');
assert(exported.package.format?.media_type === 'application/json', 'JSON media type missing');
assert(exported.package.generated_by === 'authorized_finance_user', 'staff identity must not be exported');
assert(exported.package.business_tax_profile?.notes === undefined, 'profile notes leaked');
assert(exported.package.tax_support?.tax_year_support?.notes === undefined, 'internal tax-year notes leaked');
assert(exported.package.tax_support?.tax_year_support?.accountant_notes === 'Accountant-facing note', 'accountant-facing notes were lost');
assert(exported.package.evidence_manifest[0].reference_status === 'verified', 'vehicle evidence reference should verify');
assert(exported.package.evidence_manifest[1].reference_status === 'missing_related_id', 'missing CCA reference should be flagged');
assert(exported.package.evidence_manifest[2].reference_status === 'unsupported_type', 'unsupported reference type should be flagged');
assert(exported.package.evidence_integrity.review_required === true, 'evidence integrity should require review');
assert(!/[\\/]/.test(exported.package.evidence_manifest[0].file_name), 'evidence filename retained a path separator');

for (const row of exported.package.evidence_manifest) {
  assert(!Object.hasOwn(row, 'storage_path'), 'storage_path leaked into evidence manifest');
  assert(!Object.hasOwn(row, 'file_url'), 'file_url leaked into evidence manifest');
  assert(!Object.hasOwn(row, 'notes'), 'document notes leaked into evidence manifest');
}

const serialized = JSON.stringify(exported.package);
for (const forbidden of [
  'private/accounting/secret-object-key',
  'https://internal.example/private',
  'secret-document-note',
  'internal-profile-note',
  'private-vehicle-note',
  'private-annual-note',
  'internal-tax-year-note',
  'staff@example.com',
  'customer-booking-1',
  'created_by_staff_user_id',
  'updated_by_staff_user_id',
  'storage_path',
  'file_url'
]) {
  assert(!serialized.includes(forbidden), `private/internal export leak: ${forbidden}`);
}

assert(safeAccountantFilename('../../danger\\receipt?.pdf').startsWith('receipt-'), 'unsafe basename was not normalized');
assert(!/["\r\n/\\]/.test(safeCsvFilenameToken('paid"\r\nX-Bad: 1')), 'CSV filename token retained unsafe characters');

console.log('Build 304 accountant export contract test: PASS');
console.log('- evidence references are explicit and reviewable');
console.log('- storage locators, internal notes, staff metadata and raw mileage rows stay out of the package');
console.log('- JSON/CSV download filenames are deterministic and sanitized');
