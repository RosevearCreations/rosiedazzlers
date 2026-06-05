#!/usr/bin/env python3
from pathlib import Path
root = Path(__file__).resolve().parents[1]
checks = {
  "admin-media-health.html": ["data-build184=\"media-health-scan\"", "/api/admin/media_asset_health_scan", "Media and image health"],
  "admin-media-health/index.html": ["data-build184=\"media-health-scan\""],
  "admin-payments.html": ["data-build184=\"refund-poll-accountant-export-receipt-retry\"", "/api/admin/payment_refund_status_poll", "/api/admin/payment_receipt_resend", "/api/admin/payment_accountant_package_export"],
  "admin.html": ["data-build184=\"media-health-dashboard-card\"", "/admin-media-health.html"],
  "assets/admin-menu.js": ["admin-media-health", "Media Health"],
  "assets/admin-auth.js": ["admin-media-health"],
  "functions/api/admin/payment_refund_status_poll.js": ["Build 184", "pollStripeRefund", "pollPayPalRefund"],
  "functions/api/admin/payment_receipt_resend.js": ["queueQuoteDepositReceiptEmail"],
  "functions/api/admin/payment_accountant_package_export.js": ["HST_RATE", "accountant-payment-package"],
  "functions/api/admin/media_asset_health_scan.js": ["Build 184", "data/media_requirements.json"],
  "data/image_requirements_build184.json": ["\"build\": \"184\"", "required_assets"],
  "sql/2026-06-01_build184_twenty_step_ops_media_payment_no_ddl_note.sql": ["Build 184"],
  "IMAGES.md": ["Build 184", "Admin Media Health"],
  "DEVELOPMENT_ROADMAP.md": ["Build 184", "20 completed"]
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
    raise SystemExit("Build 184 guard failed:\n" + "\n".join(missing))
print("Build 184 twenty-step ops/media/payment guard passed.")
