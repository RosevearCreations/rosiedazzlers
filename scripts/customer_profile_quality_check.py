#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(rel):
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")

customer_app = read("app/customer/index.html")
customer_session = read("functions/api/_lib/customer-session.js")
push_helper = read("functions/api/_lib/push-subscriptions.js")
push_config = read("functions/api/customer_push_config.js")
push_subscribe = read("functions/api/customer_push_subscribe.js")
push_unsubscribe = read("functions/api/customer_push_unsubscribe.js")

for token in ['data-app-module="customer"', 'data-notification-enable']:
    if token not in customer_app:
        errors.append(f"customer app missing {token}")

for rel, body in [
    ("functions/api/customer_push_config.js", push_config),
    ("functions/api/customer_push_subscribe.js", push_subscribe),
    ("functions/api/customer_push_unsubscribe.js", push_unsubscribe),
]:
    if "getCurrentCustomerSession" not in body:
        errors.append(f"{rel} is not bounded by the customer session")

for token in ["notification_opt_in", "saveCustomerPushSubscription", "revokeCustomerPushSubscription"]:
    if token not in push_helper:
        errors.append(f"customer push authority missing {token}")

if "setInterval(" in customer_app:
    errors.append("customer app contains prohibited perpetual polling")

for secret in ["SUPABASE_SERVICE_ROLE_KEY", "VAPID_PRIVATE_KEY"]:
    if secret in customer_app:
        errors.append(f"browser customer app exposes server secret name {secret}")

if not customer_session:
    errors.append("customer session authority unavailable")

if errors:
    print("Customer profile quality check: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("Customer profile quality check: PASS")
print(" - customer app identity and authenticated push ownership are intact")
print(" - customer notification opt-in authority remains server-side")
print(" - no customer-app polling interval or browser secret exposure detected")
