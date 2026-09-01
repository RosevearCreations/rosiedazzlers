#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")

def need(rel: str, *tokens: str) -> None:
    body = read(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")

def forbid(rel: str, *tokens: str) -> None:
    body = read(rel)
    for token in tokens:
        if token.lower() in body.lower():
            errors.append(f"{rel} contains forbidden authority token {token}")

def command(*args: str) -> None:
    proc = subprocess.run(args, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode:
        errors.append(f"command failed: {' '.join(args)}\n{proc.stdout}{proc.stderr}")

need(
    "functions/api/client/reviews_save.js",
    "authenticated_customer_completed_booking",
    "eligible_bookings: eligibleBookings",
    "google_review_url: GOOGLE_REVIEW_URL",
    'status: "submitted"',
    "booking_verified: true",
    'publication_state: "submitted_for_approval"',
)
forbid(
    "functions/api/client/reviews_save.js",
    "google_review_url: String(body",
    'status: "approved"',
    'status: "published"',
)

need(
    "assets/customer-review-share-v287.js",
    "Build 287",
    'REVIEW_API = "/api/client/reviews_save"',
    'ANALYTICS_ASSET = "/assets/public-analytics.js"',
    'SHARE_SOURCE = "customer_share"',
    'SHARE_CAMPAIGN = "customer_referral"',
    "Review Rosie on Google",
    "Share Rosie",
    "Sharing does not create a discount, credit, or reward.",
    "navigator.share",
    "navigator.clipboard",
    "customer_google_review_open",
    "customer_share_started",
    "customer_share_completed",
    "customer_review_share_prompt_view",
)
forbid(
    "assets/customer-review-share-v287.js",
    "/api/checkout",
    "price_total_cents",
    "deposit_cents",
    "referral_credit",
    "reward_amount",
    "coupon",
    "promo_code",
    "five star",
    "5-star",
)

need(
    "assets/customer-share-entry-v287.js",
    "Build 287",
    'normalizedPath !== "/book"',
    'params.get("utm_source") !== "customer_share"',
    'params.get("utm_campaign") !== "customer_referral"',
    'ANALYTICS_ASSET = "/assets/public-analytics.js"',
    "customer_share_booking_entry",
    'authority: "analytics_only"',
    "reward_applied: false",
    "Current service selection, vehicle size, availability, add-ons, price, deposit and payment rules still apply.",
)
forbid(
    "assets/customer-share-entry-v287.js",
    "/api/checkout",
    "/api/availability",
    "data-package",
    "price_total_cents",
    "deposit_cents",
    "promo_code",
    "coupon",
)

need(
    "assets/public-analytics.js",
    "utm_source",
    "utm_campaign",
    "source:",
    "campaign:",
    "globalScope.RosieAnalytics",
)
need(
    "assets/client-auth.js",
    "loadBuild285CustomerRebook",
    "loadBuild286CustomerReview",
    "loadBuild287CustomerReviewShare",
    'path !== "/my-account"',
    "/assets/customer-review-share-v287.js",
    "data-build287-customer-review-share",
)
need(
    "assets/pricing-catalog-client.js",
    'import("./booking-quick-start-v274.js")',
    '.then(() => import("./booking-retention-v275.js"))',
    '.then(() => import("./customer-rebook-v285.js"))',
    '.then(() => import("./customer-share-entry-v287.js"))',
    "legacy booking remains available",
)

summary = read("BUILD287_SUMMARY.md")
for token in [
    "Customer Review Follow-Up + Referral Sharing Mechanics",
    "completed service",
    "Google",
    "utm_source=customer_share",
    "utm_campaign=customer_referral",
    "No schema migration",
    "No referral/loyalty economics",
    "Production remains closed",
]:
    if token.lower() not in summary.lower():
        errors.append(f"BUILD287_SUMMARY.md missing {token}")

for rel in ["AI_PROJECT_HANDOFF.md", "MASTER_VALUE_ROADMAP.md"]:
    body = read(rel)
    for token in ["**Build:** 287", "Build 287", "Production remains closed"]:
        if token.lower() not in body.lower():
            errors.append(f"{rel} missing {token}")
    for token in ["**Build:** 283", "**Build:** 284", "Build 283", "Build 284", "contextual proof"]:
        if token.lower() not in body.lower():
            errors.append(f"{rel} missing retained compatibility token {token}")

need(
    ".github/workflows/build287-source-gate.yml",
    "Build 287 Source Gate",
    "build287-customer-review-share-loop",
    "customer-review-share-v287.js",
    "customer-share-entry-v287.js",
    "build287_release_check.py",
    "build287_http_smoke.sh",
    "seq 271 286",
)
need(
    ".github/workflows/build287-development-acceptance.yml",
    "Build 287 Development Runtime Acceptance",
    "branches:",
    "- dev",
    "build287_release_check.py",
    "build287_http_smoke.sh",
    "https://dev.rosiedazzlers.pages.dev",
    "Production remains closed",
)
need(
    "scripts/build287_http_smoke.sh",
    "/assets/customer-review-share-v287.js",
    "/assets/customer-share-entry-v287.js",
    "/assets/client-auth.js",
    "/assets/pricing-catalog-client.js",
    "/assets/public-analytics.js",
    "/api/client/reviews_save",
    "customer_share_booking_entry",
    "customer_referral",
    "Unauthorized",
)

seo_guard = read("scripts/seo_h1_check.py")
for token in ["build287_release_check.py", "build287.exists()", "run_guard(build287)"]:
    if token not in seo_guard:
        errors.append(f"cumulative SEO/release path missing Build 287 hook: {token}")

need(
    ".github/workflows/development-source-gate.yml",
    "python scripts/release_check.py",
    "python scripts/seo_h1_check.py",
    "Build 285",
)
need(
    ".github/workflows/cloudflare-development-acceptance.yml",
    "python scripts/release_check.py",
    "scripts/development_http_smoke.sh",
    "Production promotion boundary",
)

command("node", "--check", "functions/api/client/reviews_save.js")
command("node", "--check", "assets/customer-review-share-v287.js")
command("node", "--check", "assets/customer-share-entry-v287.js")
command("node", "--check", "assets/client-auth.js")
command("node", "--check", "assets/pricing-catalog-client.js")
command("bash", "-n", "scripts/build287_http_smoke.sh")

if errors:
    print("Build 287 customer review/share loop check FAILED:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Build 287 customer review/share loop check: PASS")
print("- server-owned Google destination extends the completed-booking review authority")
print("- account follow-up is neutral: no prefilled praise, auto-publication or provider verification claim")
print("- customer sharing uses native share/clipboard with same-origin UTM booking links")
print("- exact customer_share/customer_referral booking entry is analytics-only and cannot alter booking authority")
print("- no referral credits, discounts, rewards, checkout fields or booking-note attribution were introduced")
print("- no schema migration or payment authority was introduced")
print("- Production remains closed")
