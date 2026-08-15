#!/usr/bin/env python3
"""Rosie Dazzlers release smoke checks.

Build 206 note:
- Adds dedicated Gallery Approvals, Quote Pipeline, and Value-Added Operations dashboards with DB migration destinations for the top sanity-check additions.

Build 205 note:
- Adds a sanity-check/value-added roadmap screen, dashboard card, structured backlog, and competitor-inspired next-step documentation.

Build 204 note:
- Repairs before/after Gallery image loading with field-alias normalization, static fallback data, local asset fallback handling, and dashboard diagnostics.

Build 203 note:
- Adds desktop/mobile visual polish, responsive diagnostics, and professional image/card treatment.

Build 202 note:
- Adds private incident reports with required evidence, admin-approved customer-visible summaries/photos, and a marketing tracker based on attached detailer notes.

Build 201 note:
- Adds inline friendly-editor validation, media URL picker helpers, landing schema previews, save-review summaries, and route-copy synchronization.

Build 200 note:
- Completes the main Admin App pricing JSON retirement by adding friendly package detail fields and chart helpers that use editor state.

Build 199 note:
- Converts remaining high-risk Admin Site Settings JSON helper areas into friendly row/card editors while keeping advanced JSON as emergency fallback.

Build 198 note:
- Converts routine social feed, before/after gallery, and water-rule updates from direct JSON textareas into friendly admin row editors while preserving advanced JSON fallback recovery.

Build 197 note:
- Adds self-healing Admin Dashboard diagnostics for pricing catalog source/repair, route-copy parity, independent card failures, and landing-page SEO readiness warnings.

Build 196 note:
- Fixes live Admin Dashboard local SEO proof 405s, Admin App esc helper crash, and Landing Page Builder add-on fallback hydration.

Build 195 note:
- Adds editable-setting field markers, selected-history diffs, template preview/test payloads, audit/fallback reports, sitemap/schema previews, policy stamping, and override logging.

Build 194 note:
- Adds editable-setting JSON diff/preview tools, analytics registry quick-add, option-library dropdown hydration, and route-copy parity guards.

Build 193 note:
- Fixes /api/admin/social_templates_list null-filter 500s, adds social-template UI fallback handling, and adds editable-setting validation schemas/token/link warnings.

Build 191 note:
- Hardens AdminAuth helpers, Admin Site Settings, policy/template rendering, analytics validation, and stable media requirements.

Build 190 note:
- Adds live rendering for editable site settings, validation, sync controls, and setting history.

Build 186 note:
- Corrects Oxford/Tillsonburg and Norfolk water-restriction rules across data, booking/Admin App fallbacks, and local landing content.

Build 183 note:
- Adds direct provider refunds, payment reconciliation export, webhook warnings, and image requirements refresh.

Build 182 note:
- Adds webhook event history, verified replay controls, receipt emails, and refund/partial-refund tracking.

Build 181 note:
- Adds verified Stripe/PayPal webhook settlement for quote deposit/payment requests.

Build 180 note:
- Connects accepted quote drafts to deposit/payment requests and final booking confirmation tracking.

Build 179 note:
- Adds hard social publish blocking, local proof tasking, and quote delivery/acceptance tracking.

Build 178 note:
- Adds conversion status saving, final price review saving, live public content block rendering, social/media privacy badges, and local proof recommendations.

Build 177 note:
- Adds dedicated conversion draft review queue, final price reconciliation, and local SEO proof reporting.

Build 176 note:
- Adds reviewed conversion-draft to real booking creation, analytics dashboard cards, and media privacy warning guard.

Build 175 note:
- Adds lead conversion drafts, catalog-backed pricing suggestions, quote status controls, expanded content blocks, gallery privacy/town/service filters, and conversion analytics guard.

Build 174 note:
- Adds quote/proposal draft guard for Admin Leads persistent draft workflow.

Build 173 note:
- Run Python checks in-process with runpy instead of spawning a new Python
  interpreter for every guard. This avoids intermittent sandbox/CI startup
  hangs while preserving each guard's existing SystemExit return code.

Build 207 note:
- Consolidates Markdown into canonical handoff/roadmap files, adds admin docs sanity reporting, and installs visual placeholder enrichment/reporting.
Build 208 note:
- Adds a connected Workflow Command Center that links lead/quote, booking, proof-of-work, invoice/payment, review/public proof, and repeat-maintenance modules.

Build 209 note:
- Adds the live detail interaction backbone: direct photo/video/note posting, explicit customer/review/private audiences, public-feed privacy filtering, protected media metadata, moderation, diagnostics, responsive polish, and Markdown retirement.

Build 216 note:
- Adds bounded public media recovery checks, persistent RLS-protected asset alert records, and DAIP decision/acceptance planning gates without DAIP production implementation.

Build 218 note:
- Adds metadata-only, RLS-protected DAIP internal test mode with a Test Lab, audit trail, explicit public/export/worker hard stops, and guided acceptance checks. It does not add media storage or processing.

Build 219 note:
- Adds an RLS-protected DAIP owner-decision governance workspace, Gate A/B evidence checks, and explicitly held Gates C-F. It does not add DAIP storage, uploads, workers, processing, customer access, exports, or publishing.

Build 221 note:
- Repairs customer-admin route compatibility for /api/admin/customer_admin_list 405 responses by adding generic onRequest dispatchers, list GET fallback, and a cache bump without schema or DAIP production changes.
"""
from __future__ import annotations

import os
import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECKS = [
    "scripts/cloudflare_pages_functions_check.py",
    "scripts/social_dispatch_workflow_check.py",
    "scripts/competitor_roadmap_check.py",
    "scripts/conversion_path_check.py",
    "scripts/booking_condition_recommender_check.py",
    "scripts/booking_intake_admin_review_check.py",
    "scripts/booking_intake_review_actions_check.py",
    "scripts/booking_photo_estimate_links_check.py",
    "scripts/competetive_completion_check.py",
    "scripts/competetive_matrix_build167_check.py",
    "scripts/admin_leads_build168_check.py",
    "scripts/auth_analytics_build169_check.py",
    "scripts/client_dashboard_build170_check.py",
    "scripts/lead_quote_preview_build171_check.py",
    "scripts/public_faq_content_build172_check.py",
    "scripts/admin_content_build173_check.py",
    "scripts/quote_proposal_drafts_build174_check.py",
    "scripts/build175_conversion_content_gallery_analytics_check.py",
    "scripts/build176_conversion_booking_privacy_dashboard_check.py",
    "scripts/build177_conversion_review_price_local_proof_check.py",
    "scripts/build178_status_price_content_privacy_check.py",
    "scripts/build179_publish_block_tasks_quote_acceptance_check.py",
    "scripts/build180_quote_deposit_booking_confirmation_check.py",
    "scripts/build181_payment_webhook_quote_deposits_check.py",
    "scripts/build182_webhook_history_receipts_refunds_check.py",
    "scripts/build183_direct_refunds_reconciliation_images_check.py",
    "scripts/build184_twenty_step_ops_media_payment_check.py",
    "scripts/build185_next_twenty_ops_foundations_check.py",
    "scripts/build186_verified_water_restrictions_check.py",
    "scripts/build187_local_page_water_rules_check.py",
    "scripts/build188_editable_water_rules_hardcoding_audit_check.py",
    "scripts/build189_editable_site_settings_check.py",
    "scripts/build190_editable_settings_live_rendering_check.py",
    "scripts/build191_editable_settings_hardening_check.py",
        "scripts/build192_editable_operations_completion_check.py",
    "scripts/build193_social_templates_and_validation_check.py",
    "scripts/build194_diff_preview_option_libraries_check.py",
    "scripts/build195_schema_history_template_export_check.py",
    "scripts/build196_admin_live_error_repairs_check.py",
    "scripts/build197_self_healing_admin_checks.py",
    "scripts/build198_friendly_json_editors_check.py",
    "scripts/build199_friendly_site_settings_editors_check.py",
    "scripts/build200_friendly_pricing_editors_check.py",
    "scripts/build201_friendly_validation_media_route_sync_check.py",
    "scripts/build202_incident_reports_marketing_check.py",
    "scripts/build203_desktop_mobile_visual_polish_check.py",
    "scripts/build204_gallery_media_resilience_check.py",
    "scripts/build205_sanity_value_roadmap_check.py",
    "scripts/build206_value_added_operations_check.py",
    "scripts/build207_markdown_visual_sanity_check.py",
    "scripts/build208_connected_workflow_command_center_check.py",
    "scripts/build209_live_interaction_documentation_check.py",
    "scripts/build210_connected_live_workflow_check.py",
    "scripts/build211_production_reliability_check.py",
    "scripts/build212_guided_production_testing_check.py",
    "scripts/build213_owner_action_customer_trust_check.py",
    "scripts/build214_security_task_orchestration_check.py",
    "scripts/build215_asset_resolver_daip_planning_check.py",
    "scripts/build216_media_reliability_daip_governance_check.py",
    "scripts/build217_secure_final_balance_links_check.py",
    "scripts/build218_daip_test_mode_foundation_check.py",
    "scripts/build219_daip_governance_workspace_check.py",
    "scripts/build220_customer_access_management_check.py",
    "scripts/build221_customer_admin_route_hotfix_check.py",
    "scripts/build222_daip_phase1_readiness_check.py",
    "scripts/build223_daip_private_mvp_design_check.py",
    "scripts/build224_daip_gate_c_technical_review_check.py",
    "scripts/build225_social_analytics_connections_check.py",
    "scripts/build226_daip_intake_dry_run_check.py",
    "scripts/build227_roadmap_execution_daip_policy_check.py",
    "scripts/build228_creative_project_intelligence_check.py",
    "scripts/build229_standard_job_project_choice_check.py",
    "scripts/build230_project_costs_templates_outputs_check.py",
    "scripts/build231_project_profitability_content_planning_check.py",
    "scripts/build232_project_controls_archive_history_check.py",
    "scripts/build236_calendar_css_schedule_stabilization_check.py",
    "scripts/build237_css_startup_evidence_check.py",
    "scripts/build238_inventory_transactions_seo_startup_check.py",
    "scripts/build239_unified_startup_command_center_check.py",
    "scripts/build240_transactional_inventory_posting_check.py",
    "scripts/build241_startup_command_center_initialization_check.py",
    "scripts/build245_ui_seo_cache_check.py",
    "scripts/build246_catalog_publish_readiness_check.py",
    "scripts/build247_daip_private_media_ingestion_check.py",
    "scripts/build248_supplier_daip_story_review_check.py",
    "scripts/build249_inventory_supplier_recovery_check.py",
    "scripts/release_check_build250.py",
    "scripts/release_check_build251.py",
    "scripts/release_check_build252.py",
    "scripts/release_check_build253.py",
    "scripts/release_check_build254.py",
    "scripts/release_check_build255.py",
    "scripts/release_check_build256.py",
    "scripts/release_check_build257.py",
    "scripts/release_check_build258.py",
    "scripts/release_check_build259.py",
    "scripts/build224_customer_profile_quality_check.py",
    "scripts/seo_h1_check.py",
]


def run_python_check(rel: str) -> int:
    path = ROOT / rel
    if not path.exists():
        print(f"Missing release check: {rel}", flush=True)
        return 1

    print(f"Running {sys.executable} {rel}", flush=True)
    previous_cwd = Path.cwd()
    try:
      os.chdir(ROOT)
      try:
          runpy.run_path(str(path), run_name="__main__")
      except SystemExit as exc:
          code = exc.code
          if code is None:
              return 0
          if isinstance(code, int):
              return code
          print(code, flush=True)
          return 1
    finally:
      os.chdir(previous_cwd)

    return 0


def main() -> int:
    for rel in CHECKS:
        code = run_python_check(rel)
        if code != 0:
            return code
    print("Release check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

