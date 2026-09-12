from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / "functions/api/_lib/commercial-accuracy.js"
PUBLIC = ROOT / "functions/api/pricing_catalog_public.js"
WORKFLOW = ROOT / ".github/workflows/development-source-gate.yml"

helper = HELPER.read_text(encoding="utf-8")
public = PUBLIC.read_text(encoding="utf-8")
source_gate = WORKFLOW.read_text(encoding="utf-8")

required_package_rows = {
    "premium_wash": "small: 85, mid: 105, oversize: 125",
    "basic_detail": "small: 229, mid: 269, oversize: 309",
    "complete_detail": "small: 319, mid: 369, oversize: 419",
    "interior_detail": "small: 195, mid: 220, oversize: 245",
    "exterior_detail": "small: 195, mid: 220, oversize: 245",
}
for code, matrix in required_package_rows.items():
    assert code in helper and matrix in helper, f"missing canonical package matrix for {code}"

for token in (
    "headlight_restoration_addon",
    "carpet_shampoo",
    "seat_shampoo",
    "odor_treatment",
    "pet_hair_removal",
    "two_stage_polish",
    "external_ceramic_coating",
    "external_graphene_fine_finish",
    "full_clay_treatment",
    "engine_cleaning",
    "de_badging",
    "vinyl_wrapping",
    "window_tinting",
    "quote_triggers",
    "scope_includes",
    "scope_excludes",
    "customer_prep",
    "aftercare",
    "escalation_rule",
    "condition_assessed",
    "inspection_quote",
):
    assert token in helper, f"missing commercial accuracy authority: {token}"

assert 'import { applyCommercialAccuracy } from "./_lib/commercial-accuracy.js";' in public
assert "applyCommercialAccuracy(await loadPricingCatalog(env))" in public
assert "commercial_accuracy" in public

# Keep the protected-main ruleset contract aligned with the workflow check context.
assert "name: source checks" in source_gate, "Current Source Gate must publish required check context 'source checks'"

# This source overlay must remain transformation-only. It may read catalog input but must not
# contain network/database/provider mutation calls.
for forbidden in ("fetch(", ".insert(", ".update(", ".delete(", "SUPABASE_SERVICE_ROLE_KEY", "STRIPE_SECRET_KEY", "R2.put"):
    assert forbidden not in helper, f"commercial overlay must remain mutation-free: {forbidden}"

print("Build 388 commercial accuracy source authority: PASS")
