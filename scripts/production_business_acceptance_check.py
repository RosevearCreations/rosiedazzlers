#!/usr/bin/env python3
"""Fail-closed source authority for durable Production business acceptance."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "production-business-acceptance-authority.yml"
PRODUCTION_HELPER = ROOT / "scripts" / "cloudflare_pages_production_acceptance.sh"
CONTRACT = ROOT / "PRODUCTION_BUSINESS_ACCEPTANCE.md"
errors = []


def require(path: Path, needles, label):
    if not path.exists():
        errors.append(f"missing {label}: {path.relative_to(ROOT)}")
        return ""
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing required contract: {needle!r}")
    return text


required_authorities = {
    "acquisition": ["scripts/seo_h1_check.py", "scripts/seo_metadata_check.py"],
    "booking": [
        "scripts/booking_funnel_device_check.py",
        "scripts/booking_wizard_responsive_ux_check.py",
        "scripts/build362_quote_booking_acceptance_check.py",
    ],
    "payment": [
        "scripts/payment_provider_readiness_check.py",
        "scripts/payment_acceptance_evidence_check.py",
        "scripts/payment_recovery_customer_handoff_check.py",
        "scripts/payment_reconciliation_check.py",
        "scripts/payment_reconciliation_month_end_closure_check.py",
        "scripts/final_balance_readiness_check.py",
    ],
    "customer_vehicle": ["scripts/checkout_customer_vehicle_identity_test.mjs"],
    "staff_work": ["scripts/build369_mobile_job_readiness_check.py"],
    "completion_proof": ["scripts/booking_completion_retention_check.py"],
    "review": [
        "scripts/build363_review_request_eligibility_check.py",
        "scripts/build364_review_request_dispatch_check.py",
        "scripts/build365_review_proof_local_seo_check.py",
    ],
    "rebook_retention": [
        "scripts/booking_rebooking_funnel_check.py",
        "scripts/maintenance_retention_check.py",
    ],
    "communication_consent": [
        "scripts/customer_communication_consent_delivery_check.py",
        "scripts/customer_communication_consent_delivery_test.mjs",
    ],
    "maintenance_fleet": [
        "scripts/maintenance_plan_business_rulebook_check.py",
        "scripts/maintenance_plan_pilot_activation_check.py",
        "scripts/fleet_business_rulebook_check.py",
        "scripts/fleet_account_operations_check.py",
        "scripts/fleet_maintenance_planning_check.py",
    ],
    "commercial_growth": [
        "scripts/service_commercial_accuracy_check.py",
        "scripts/service_commercial_accuracy_test.mjs",
        "scripts/build389_local_seo_service_landing_proof_check.py",
        "scripts/build389_local_seo_service_landing_proof_test.mjs",
        "scripts/build390_booking_quote_estimate_hardening_test.mjs",
        "scripts/build391_photo_studio_r2_reliability_test.mjs",
        "scripts/build392_retention_maintenance_fleet_activation_check.py",
        "scripts/build392_retention_maintenance_fleet_activation_test.mjs",
    ],
    "operations_finance": [
        "scripts/build393_operations_inventory_job_cost_evidence_check.py",
        "scripts/build393_operations_inventory_job_cost_evidence_test.mjs",
        "scripts/build394_finance_close_reconciliation_accountant_export_check.py",
        "scripts/build394_finance_close_reconciliation_accountant_export_test.mjs",
    ],
    "it_observability": [
        "scripts/it_readiness_release_control_audit.py",
        "scripts/production_observability_self_diagnostics_check.py",
        "scripts/production_support_diagnostics_check.py",
        "scripts/production_support_diagnostics_test.mjs",
    ],
    "workflow_accessibility": [
        "scripts/workflow_efficiency_accessibility_check.py",
    ],
    "local_search_measurement": [
        "scripts/local_search_measurement_authority_check.py",
    ],
    "local_search_snapshot_continuity": [
        "scripts/local_search_provider_snapshot_continuity_descriptive_review_check.py",
        "scripts/local_search_provider_snapshot_continuity_descriptive_review_test.mjs",
    ],
    "booking_quote_experiment_approval_measurement_lock": [
        "scripts/booking_quote_experiment_approval_measurement_lock_check.py",
        "scripts/booking_quote_experiment_approval_measurement_lock_test.mjs",
    ],
    "staff_mobile_remediation_execution_evidence_readiness": [
        "scripts/staff_mobile_remediation_execution_evidence_readiness_check.py",
        "scripts/staff_mobile_remediation_execution_evidence_readiness_test.mjs",
    ],
    "staff_mobile_remediation_outcome_evidence": [
        "scripts/staff_mobile_remediation_outcome_evidence_check.py",
        "scripts/staff_mobile_remediation_outcome_evidence_test.mjs",
    ],
    "staff_mobile_remediation_outcome_interpretation_follow_up": [
        "scripts/staff_mobile_remediation_outcome_interpretation_follow_up_check.py",
        "scripts/staff_mobile_remediation_outcome_interpretation_follow_up_test.mjs",
    ],
    "service_economics_seasonal_operations_reliability_review": [
        "scripts/service_economics_seasonal_operations_reliability_review_check.py",
        "scripts/service_economics_seasonal_operations_reliability_review_test.mjs",
    ],
    "service_economics_seasonal_capacity_reliability_trend_continuity": [
        "scripts/service_economics_seasonal_capacity_reliability_trend_continuity_check.py",
        "scripts/service_economics_seasonal_capacity_reliability_trend_continuity_test.mjs",
    ],
    "launch_readiness": [
        "scripts/launch_readiness_consolidation_check.py",
        "scripts/launch_readiness_consolidation_test.mjs",
    ],
    "controlled_soft_launch": [
        "scripts/controlled_soft_launch_acceptance_check.py",
        "scripts/controlled_soft_launch_acceptance_test.mjs",
    ],
    "provider_evidence_closure": [
        "scripts/provider_evidence_closure_check.py",
        "scripts/provider_evidence_closure_test.mjs",
    ],
    "provider_hold_decision_traceability_closure_review": [
        "scripts/provider_hold_decision_traceability_closure_review_check.py",
        "scripts/provider_hold_decision_traceability_closure_review_test.mjs",
    ],
    "recovery_drill_evidence_refresh_closure_review": [
        "scripts/recovery_drill_evidence_refresh_closure_review_check.py",
        "scripts/recovery_drill_evidence_refresh_closure_review_test.mjs",
    ],
    "authenticated_device_observation_refresh_regression_triage": [
        "scripts/authenticated_device_observation_refresh_regression_triage_check.py",
        "scripts/authenticated_device_observation_refresh_regression_triage_test.mjs",
    ],
    "recovery_authenticated_device_observation_execution_evidence": [
        "scripts/recovery_authenticated_device_observation_execution_evidence_check.py",
        "scripts/recovery_authenticated_device_observation_execution_evidence_test.mjs",
    ],
    "recovery_export_operational_proof": [
        "scripts/recovery_export_operational_proof_check.py",
        "scripts/recovery_export_operational_proof_test.mjs",
    ],
    "production_workflow_evidence": [
        "scripts/production_workflow_evidence_check.py",
        "scripts/production_workflow_evidence_test.mjs",
    ],
    "local_acquisition_evidence_closure": [
        "scripts/local_acquisition_evidence_closure_check.py",
        "scripts/local_acquisition_evidence_closure_test.mjs",
    ],
    "retention_maintenance_fleet_operational_pilot": [
        "scripts/retention_maintenance_fleet_operational_pilot_check.py",
        "scripts/retention_maintenance_fleet_operational_pilot_test.mjs",
    ],
    "media_photo_studio_proof_operations": [
        "scripts/media_photo_studio_proof_operations_check.py",
        "scripts/media_photo_studio_proof_operations_test.mjs",
    ],
    "reliability_performance_cost_capacity": [
        "scripts/reliability_performance_cost_capacity_check.py",
        "scripts/reliability_performance_cost_capacity_test.mjs",
    ],
    "security_privacy_recovery_drill": [
        "scripts/security_privacy_recovery_drill_check.py",
        "scripts/security_privacy_recovery_drill_test.mjs",
    ],
    "current_reliability_security_cost_reassessment": [
        "scripts/current_reliability_security_cost_reassessment_check.py",
    ],
    "reliability_cost_resilience_operational_guardrails": [
        "scripts/reliability_cost_resilience_operational_guardrails_check.py",
        "scripts/reliability_cost_resilience_operational_guardrails_test.mjs",
    ],
    "production_learning_roadmap_renewal": [
        "scripts/production_learning_roadmap_renewal_check.py",
    ],
    "seasonal_capability_owner_review_public_claim_decision": [
        "scripts/seasonal_capability_owner_review_public_claim_decision_check.py",
        "scripts/seasonal_capability_owner_review_public_claim_decision_test.mjs",
    ],
    "seasonal_capability_public_claim_activation_decision": [
        "scripts/seasonal_capability_public_claim_activation_decision_check.py",
        "scripts/seasonal_capability_public_claim_activation_decision_test.mjs",
    ],
    "winter_booking_quote_rule_activation_readiness": [
        "scripts/winter_booking_quote_rule_activation_readiness_check.py",
        "scripts/winter_booking_quote_rule_activation_readiness_test.mjs",
    ],
    "controlled_environment_site_qualification_service_routing_evidence": [
        "scripts/controlled_environment_site_qualification_service_routing_evidence_check.py",
        "scripts/controlled_environment_site_qualification_service_routing_evidence_test.mjs",
    ],
    "booking_conversion_quote_clarity": [
        "scripts/build427_booking_conversion_quote_clarity_check.py",
    ],
    "service_economics_job_profitability": [
        "scripts/build428_service_economics_job_profitability_check.py",
        "scripts/build428_service_economics_job_profitability_test.mjs",
    ],
    "retention_rebooking_learning": [
        "scripts/retention_rebooking_learning_check.py",
        "scripts/retention_rebooking_learning_test.mjs",
    ],
    "fleet_commercial_operations_learning": [
        "scripts/fleet_commercial_operations_learning_check.py",
        "scripts/fleet_commercial_operations_learning_test.mjs",
    ],
    "local_acquisition_content_proof": [
        "scripts/local_acquisition_content_proof_check.py",
        "scripts/local_acquisition_content_proof_test.mjs",
    ],
    "hold_inventory_authority_cleanup": [
        "scripts/hold_inventory_authority_cleanup_check.py",
    ],
    "recovery_security": [
        "scripts/release_rollback_recovery_check.py",
        "scripts/performance_accessibility_security_check.py",
        "scripts/release_hygiene_check.py",
    ],
}

for stage, paths in required_authorities.items():
    for rel in paths:
        if not (ROOT / rel).exists():
            errors.append(f"{stage} authority is missing: {rel}")

contract = require(CONTRACT, [
    "Acquisition",
    "Booking",
    "Payment",
    "Customer + vehicle",
    "Staff work",
    "Completion + proof",
    "Final finance",
    "Genuine review",
    "Rebook + retention",
    "Maintenance + fleet",
    "Commercial + local proof",
    "Condition-aware quote + media",
    "Operations + job cost",
    "Admin/I.T. + observability",
    "Growth readiness",
    "Recovery",
    "Cloudflare Production exact-SHA acceptance",
    "does not fabricate a real customer journey",
], "Production business acceptance contract")

helper = require(PRODUCTION_HELPER, [
    "read-only Cloudflare Pages Production exact-SHA acceptance",
    'CF_PRODUCTION_BRANCH="${CF_PRODUCTION_BRANCH:-main}"',
    'CF_PRODUCTION_URL="${CF_PRODUCTION_URL:-https://rosiedazzlers.ca}"',
    '(.deployment_trigger.metadata.commit_hash // "") == $sha',
    '(.deployment_trigger.metadata.branch // "") == $branch',
    '[[ "$EXACT_ENVIRONMENT" == "production" ]]',
    '[[ "$EXACT_USES_FUNCTIONS" == "true" ]]',
    'SMOKE_SCOPE=static bash scripts/development_http_smoke.sh',
    'SMOKE_SCOPE=full bash scripts/development_http_smoke.sh',
    "PRODUCTION EXACT-SHA ACCEPTANCE: PASS",
    "mutation performed: none",
], "Production exact-SHA helper")

workflow = require(WORKFLOW, [
    "name: Production Business Acceptance & Exact-SHA Authority",
    "- 'build*'",
    "Validate Production business acceptance source contract",
    "python scripts/production_business_acceptance_check.py",
    "Validate acquisition and booking authorities",
    "Validate payment and final-finance authorities",
    "Validate customer, staff, completion and proof authorities",
    "Validate genuine-review and rebook authorities",
    "Validate customer communication consent and delivery evidence authorities",
    "Validate maintenance and fleet authorities",
    "Validate commercial, local SEO, condition-quote and media convergence authorities",
    "Validate retention, operations and finance convergence authorities",
    "Validate admin I.T. diagnostics and observability authorities",
    "Validate workflow efficiency and accessibility authorities",
    "Validate local-search measurement authorities",
    "Validate local search provider snapshot continuity & descriptive review authority",
    "python scripts/local_search_provider_snapshot_continuity_descriptive_review_check.py",
    "node scripts/local_search_provider_snapshot_continuity_descriptive_review_test.mjs",
    "Validate booking & quote experiment approval & measurement lock authority",
    "python scripts/booking_quote_experiment_approval_measurement_lock_check.py",
    "node scripts/booking_quote_experiment_approval_measurement_lock_test.mjs",
    "Validate staff & mobile remediation execution evidence readiness authority",
    "python scripts/staff_mobile_remediation_execution_evidence_readiness_check.py",
    "node scripts/staff_mobile_remediation_execution_evidence_readiness_test.mjs",
    "Validate staff & mobile remediation outcome evidence authority",
    "python scripts/staff_mobile_remediation_outcome_evidence_check.py",
    "node scripts/staff_mobile_remediation_outcome_evidence_test.mjs",
    "Validate staff & mobile remediation outcome interpretation & follow-up authority",
    "python scripts/staff_mobile_remediation_outcome_interpretation_follow_up_check.py",
    "node scripts/staff_mobile_remediation_outcome_interpretation_follow_up_test.mjs",
    "Validate service economics, seasonal operations & reliability review authority",
    "python scripts/service_economics_seasonal_operations_reliability_review_check.py",
    "node scripts/service_economics_seasonal_operations_reliability_review_test.mjs",
    "Validate service economics, seasonal capacity & reliability trend continuity authority",
    "python scripts/service_economics_seasonal_capacity_reliability_trend_continuity_check.py",
    "node scripts/service_economics_seasonal_capacity_reliability_trend_continuity_test.mjs",
    "Validate launch readiness consolidation authorities",
    "Validate controlled soft launch acceptance authority",
    "Validate provider evidence closure authority",
    "Validate provider HOLD decision traceability & closure review authority",
    "python scripts/provider_hold_decision_traceability_closure_review_check.py",
    "node scripts/provider_hold_decision_traceability_closure_review_test.mjs",
    "Validate recovery drill evidence refresh & closure review authority",
    "python scripts/recovery_drill_evidence_refresh_closure_review_check.py",
    "node scripts/recovery_drill_evidence_refresh_closure_review_test.mjs",
    "Validate authenticated device observation refresh & regression triage authority",
    "python scripts/authenticated_device_observation_refresh_regression_triage_check.py",
    "node scripts/authenticated_device_observation_refresh_regression_triage_test.mjs",
    "Validate recovery export operational proof authority",
    "Validate customer & staff Production workflow evidence authority",
    "Validate local acquisition evidence closure authority",
    "Validate retention, maintenance & fleet operational pilot authority",
    "Validate media, Photo Studio & proof operations authority",
    "Validate reliability, performance & cost capacity authority",
    "Validate security, privacy & recovery drill authority",
    "Validate Production learning & roadmap renewal authority",
    "Validate seasonal capability owner review & public claim decision authority",
    "python scripts/seasonal_capability_owner_review_public_claim_decision_check.py",
    "node scripts/seasonal_capability_owner_review_public_claim_decision_test.mjs",
    "Validate seasonal capability & public claim activation decision authority",
    "python scripts/seasonal_capability_public_claim_activation_decision_check.py",
    "node scripts/seasonal_capability_public_claim_activation_decision_test.mjs",
    "Validate winter booking & quote rule activation readiness authority",
    "python scripts/winter_booking_quote_rule_activation_readiness_check.py",
    "node scripts/winter_booking_quote_rule_activation_readiness_test.mjs",
    "Validate controlled-environment site qualification & service routing evidence authority",
    "python scripts/controlled_environment_site_qualification_service_routing_evidence_check.py",
    "node scripts/controlled_environment_site_qualification_service_routing_evidence_test.mjs",
    "Validate provider & local search outcome evidence refresh authority",
    "python scripts/provider_local_search_outcome_evidence_refresh_check.py",
    "node scripts/provider_local_search_outcome_evidence_refresh_test.mjs",
    "provider_local_search_outcome_evidence_refresh",
    "Validate recovery drill & authenticated device observation execution evidence authority",
    "python scripts/recovery_authenticated_device_observation_execution_evidence_check.py",
    "node scripts/recovery_authenticated_device_observation_execution_evidence_test.mjs",
    "recovery_authenticated_device_observation_execution_evidence",
    "Validate current-cycle reliability, security & cost reassessment",
    "python scripts/current_reliability_security_cost_reassessment_check.py",
    "Validate reliability, cost & resilience operational guardrails authority",
    "python scripts/reliability_cost_resilience_operational_guardrails_check.py",
    "node scripts/reliability_cost_resilience_operational_guardrails_test.mjs",
    "Validate booking conversion & quote clarity authority",
    "Validate service economics & job profitability authority",
    "Validate retention & rebooking learning authority",
    "Validate fleet & commercial operations learning authority",
    "Validate local acquisition & content proof authority",
    "Validate HOLD inventory & authority cleanup",
    "Validate rollback and hardening authorities",
    "production-exact-sha:",
    "if: github.event_name == 'push' && github.ref == 'refs/heads/main'",
    "bash scripts/cloudflare_pages_production_acceptance.sh",
    "ROSIEDAZZLERS_TOKEN",
    "CLOUDFLARE_ACCOUNT_ID",
], "Production business acceptance workflow")

for needle in [
    "git push", "git update-ref", "git reset --hard", "wrangler pages deploy",
    "wrangler pages deployment", "--request POST", "-X POST", "--request DELETE",
    "-X DELETE", "--request PATCH", "-X PATCH", "/rollback", "/retry",
]:
    if needle in helper:
        errors.append(f"Production acceptance helper contains mutation primitive: {needle}")

for match in re.finditer(r'https://api\.cloudflare\.com/client/v4/[^"\s]+', helper):
    url = match.group(0)
    allowed = ["user/tokens/verify", "/accounts?", "/pages/projects/"]
    if not any(part in url for part in allowed):
        errors.append(f"Production helper contains unexpected Cloudflare endpoint: {url}")

if re.search(r"\b(contents|deployments|actions):\s*write\b", workflow):
    errors.append("Production workflow grants write permissions")
if re.search(r"(?i)\bbuild\s+\d{3}\b", workflow):
    errors.append("Production workflow names a historical numbered release")
for needle in [
    "git push", "update-ref", "wrangler pages deploy", "stripe trigger", "paypal",
    "curl -x post", "curl -x delete", "curl -x patch",
]:
    if needle in workflow.lower():
        errors.append(f"Production workflow contains mutation/provider primitive: {needle}")

for phrase in [
    "real card charge", "real PayPal transaction", "real review", "real month-end close",
    "Missing Production identity", "non-force fast-forward",
]:
    if phrase not in contract:
        errors.append(f"acceptance contract lost fail-closed evidence boundary: {phrase!r}")

if errors:
    print("PRODUCTION BUSINESS ACCEPTANCE: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("PRODUCTION BUSINESS ACCEPTANCE: PASS")
print("- acquisition through booking, payment, account/vehicle, staff work and completion authorities are present")
print("- final finance, genuine review, rebook, maintenance and fleet authorities are present")
print("- whole-platform growth readiness authorities are present across commercial/SEO/media, operations, finance and I.T./observability")
print("- controlled soft-launch real-world evidence authority remains fail-closed and identity-safe")
print("- provider payment/refund/delivery evidence closure remains read-only, aggregate and fail-closed")
print("- provider HOLD decision traceability requires current dated evidence plus a matching explicit operator review before any manual closure update candidate")
print("- recovery refresh/drill closure review requires explicit owner traceability, recorded prerequisites and post-observation evidence without executing a Production restore")
print("- authenticated device observation refresh keeps current negative evidence distinct from historical acceptance and prepares bounded triage without browser-farm or automatic remediation")
print("- recovery/device execution evidence counts only explicit bounded non-Production drill observations and current direct authenticated role/device/browser observations; populations remain separate")
print("- backup/restore/accountant-export operational proof remains read-only and artifact-truthful")
print("- customer/staff Production workflow evidence remains aggregate, role-bounded and fail-closed")
print("- local acquisition evidence closure remains source-attributed, read-only and fail-closed")
print("- local-search provider snapshot continuity remains descriptive, identity/window-bounded and does not infer Southern Ontario weather or winter service capability")
print("- booking/quote experiment approval requires an explicit immutable measurement lock and excludes weather-ineligible sessions without authorizing execution")
print("- staff/mobile remediation effectiveness requires separately authorized execution evidence and materially comparable before/after observations; weather/site limits remain separate")
print("- service economics, seasonal operations and reliability reconciliation keeps allocation, cold-weather capability, observed capacity, provider cost and recovery evidence independently sourced")
print("- local acquisition/content proof remains bounded, heuristic, read-only and non-publishing")
print("- retention/maintenance/fleet operational pilot remains manual, capacity-aware and owner-action gated")
print("- media/Photo Studio/proof operations remain read-only and evidence-truthful")
print("- reliability/performance/cost capacity remains bounded, first-party and non-mutating")
print("- production learning/roadmap renewal keeps stale authority closure evidence-based and unresolved HOLDs explicit")
print("- winter booking/quote activation readiness remains owner-reviewed, availability-authoritative and non-activating")
print("- seasonal public-claim activation decisions remain service-specific, owner-reviewed and manual-publication-only")
print("- controlled-environment site qualification requires attributable site/workflow/equipment/product evidence and never moves appointments automatically")
print("- Build 444 reliability/security/cost reassessment reuses retained read-only authority and keeps provider/recovery evidence fail-closed")
print("- booking conversion / quote clarity retains server-authoritative pricing/availability and anonymous evidence boundaries")
print("- service economics / job profitability keeps missing cost, labour and cash evidence fail-closed and read-only")
print("- retention / rebooking learning remains exact-profile, aggregate, consent-safe and read-only")
print("- fleet / commercial operations learning keeps inquiry demand, commercial rules, completed-work evidence and capacity boundaries distinct")
print("- canonical Production HOLD inventory remains fail-closed across provider, owner and unavailable evidence")
print("- rollback and hardening authorities remain part of launch readiness")
print("- Production exact-SHA evidence is Cloudflare read-only and fail-closed")
print("- workflow is durable across sequential releases and does not carry a numbered-release dependency")
print("- real customer/provider/review/accounting evidence is never fabricated")
