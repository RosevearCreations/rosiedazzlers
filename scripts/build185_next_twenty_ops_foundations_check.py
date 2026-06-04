#!/usr/bin/env python3
from pathlib import Path
root = Path(__file__).resolve().parents[1]
checks = {
  "admin-media-health.html": ["data-build185=\"media-health-upload-tasks-dimensions\"", "/api/admin/media_asset_upload", "/api/admin/media_asset_tasks_list"],
  "admin-payments.html": ["data-build185=\"final-balance-payment-applications-fees-tax-close\"", "/api/admin/payment_variance_summary", "/api/admin/payment_accountant_export_full", "data-save-fee"],
  "admin-tax-review.html": ["data-build185=\"hst-gst-review-screen\"", "/api/admin/payment_tax_review_summary"],
  "admin-close.html": ["data-build185=\"month-end-close-checklist\"", "/api/admin/month_end_close_checklist"],
  "admin-seo-tasks.html": ["data-build185=\"search-console-local-seo-task-cards\"", "/api/admin/local_seo_task_cards_list"],
  "admin.html": ["data-build185=\"next-twenty-dashboard-warnings\"", "build185OpsWarnings", "/admin-tax-review.html"],
  "assets/admin-menu.js": ["admin-tax-review", "admin-close", "admin-seo-tasks"],
  "assets/admin-auth.js": ["admin-tax-review", "admin-close", "admin-seo-tasks"],
  "functions/api/admin/media_asset_upload.js": ["Build 185", "ROSIE_PUBLIC_ASSETS_BUCKET"],
  "functions/api/admin/media_asset_tasks_list.js": ["Build 185", "media_asset_tasks"],
  "functions/api/admin/payment_variance_summary.js": ["Build 185", "missing_processor_fee"],
  "functions/api/admin/payment_processor_fee_save.js": ["Build 185", "processor_fee_cents"],
  "functions/api/admin/payment_tax_review_summary.js": ["Build 185", "HST_RATE"],
  "functions/api/admin/payment_refund_retry_scan.js": ["Build 185", "refund retry"],
  "functions/api/admin/payment_receipt_retry_queue.js": ["Build 185", "receipt"],
  "functions/api/quote_deposit_receipt.js": ["Build 185", "Deposit Receipt"],
  "functions/api/admin/final_balance_request_create.js": ["Build 185", "final_balance_payment_requests"],
  "functions/api/admin/payment_application_save.js": ["Build 185", "payment_applications"],
  "functions/api/admin/month_end_close_checklist.js": ["Build 185", "month-end"],
  "functions/api/admin/local_seo_task_cards_list.js": ["Build 185", "Search Console"],
  "functions/api/admin/payment_accountant_export_full.js": ["Build 185", "journal_candidates"],
  "data/image_requirements_build185.json": ["\"build\": \"185\"", "required_assets"],
  "sql/2026-06-02_build185_next_twenty_ops_foundations.sql": ["media_asset_tasks", "payment_applications", "month_end_close_checklists"],
  "IMAGES.md": ["Build 185", "Upload methods", "packages/pet_hair_removal.png"],
  "DEVELOPMENT_ROADMAP.md": ["Build 185", "Next 20 completed foundations"],
  "COMPETETIVE_COMPLETION_MATRIX.md": ["Build 185 matrix update"]
}
missing=[]
for rel, needles in checks.items():
    path=root/rel
    if not path.exists():
        missing.append(f"missing {rel}")
        continue
    text=path.read_text(errors='ignore')
    for needle in needles:
        if needle not in text:
            missing.append(f"{rel} missing {needle}")
if missing:
    raise SystemExit("Build 185 guard failed:\n" + "\n".join(missing))
print("Build 185 next-20 operations/media/payment guard passed.")
