#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

helper = read("functions/api/_lib/customer-communication-consent.js")
hooks = read("functions/api/_lib/notification-hooks.js")
processor = read("functions/api/notifications_process.js")
recovery = read("functions/api/admin/abandoned_recovery_enqueue.js")
profile = read("functions/api/client/profile_update.js")
listing = read("functions/api/notifications_list.js")
test = read("scripts/customer_communication_consent_delivery_test.mjs")
workflow = read(".github/workflows/customer-communication-consent-delivery-authority.yml")
development = read(".github/workflows/development-source-gate.yml")
production = read(".github/workflows/production-business-acceptance-authority.yml")
policy = read("BUILD411_CUSTOMER_COMMUNICATION_CONSENT_DELIVERY_EVIDENCE.md").lower()

for token in (
    "evaluateCustomerCommunicationConsent", "loadCustomerCommunicationDispatchGate",
    "classifyNotificationDeliveryEvidence", '"missing_customer_profile_id"',
    '"customer_opted_out"', '"channel_preference_changed"', '"recipient_changed"',
    '"no_active_push_subscription"', '"event_push_opted_out"', 'state: "provider_accepted"',
    "provider_dependent: true", "definitive_delivery: false", "inferred_consent: false",
):
    if token not in helper:
        errors.append(f"communication helper missing {token}")

if "sms_phone" not in hooks:
    errors.append("customer notification profile loader does not include sms_phone")

for token in ("loadCustomerCommunicationDispatchGate", "customer_consent_", 'status: "cancelled"', "dispatchNotificationThroughProvider"):
    if token not in processor:
        errors.append(f"notification processor missing {token}")
gate_pos = processor.find("const consentGate = await loadCustomerCommunicationDispatchGate")
dispatch_pos = processor.find("const dispatch = await dispatchNotificationThroughProvider")
if gate_pos < 0 or dispatch_pos < 0 or gate_pos >= dispatch_pos:
    errors.append("dispatch-time consent gate must run before provider dispatch")

for token in ("loadCustomerNotificationProfile", "evaluateCustomerCommunicationConsent", "customer_profile_id: profile.id", "Current explicit customer communication consent is required"):
    if token not in recovery:
        errors.append(f"abandoned recovery boundary missing {token}")

for token in (
    'Object.prototype.hasOwnProperty.call(body, "notification_opt_in")',
    'Object.prototype.hasOwnProperty.call(body, "notification_channel")',
    'Object.prototype.hasOwnProperty.call(body, "detailer_chat_opt_in")',
    'Object.prototype.hasOwnProperty.call(body, "notify_on_progress_post")',
    'Object.prototype.hasOwnProperty.call(body, "notify_on_media_upload")',
    'Object.prototype.hasOwnProperty.call(body, "notify_on_comment_reply")',
):
    if token not in profile:
        errors.append(f"customer preference update is not partial-safe: {token}")

if "sent_at" not in listing:
    errors.append("notification list does not expose provider-acceptance timestamp")

for token in ("current explicit consent", "dispatch time", "abandoned checkout", "provider accepted", "not final delivery", "unsubscribe", "no inferred consent", "schema-neutral"):
    if token not in policy:
        errors.append(f"policy missing {token}")

for token in ("Customer Communication, Consent & Delivery Evidence Authority", "python scripts/customer_communication_consent_delivery_check.py", "node scripts/customer_communication_consent_delivery_test.mjs"):
    if token not in workflow:
        errors.append(f"focused workflow missing {token}")

for token in ("python scripts/customer_communication_consent_delivery_check.py", "node scripts/customer_communication_consent_delivery_test.mjs"):
    if token not in development:
        errors.append(f"Development source gate missing durable communication authority {token}")
    if token not in production:
        errors.append(f"Production authority missing durable communication authority {token}")

if "CUSTOMER COMMUNICATION CONSENT & DELIVERY EVIDENCE: PASS" not in test:
    errors.append("executable communication contract is missing PASS authority")
if any("411" in path.name.lower() for path in ROOT.rglob("*.sql")):
    errors.append("customer communication acceptance must not introduce a Build 411 schema migration")

commands = (
    ["node", "--check", "functions/api/_lib/customer-communication-consent.js"],
    ["node", "--check", "functions/api/notifications_process.js"],
    ["node", "--check", "functions/api/admin/abandoned_recovery_enqueue.js"],
    ["node", "--check", "functions/api/client/profile_update.js"],
    ["node", "--check", "scripts/customer_communication_consent_delivery_test.mjs"],
    ["node", "scripts/customer_communication_consent_delivery_test.mjs"],
)
for command in commands:
    proc = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("CUSTOMER COMMUNICATION CONSENT & DELIVERY EVIDENCE AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("CUSTOMER COMMUNICATION CONSENT & DELIVERY EVIDENCE AUTHORITY: PASS")
