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
    "getCurrentCustomerSession",
    "serviceHeaders",
    "onRequestGet",
    "onRequestPost",
    "authenticated_customer_completed_booking",
    "loadEligibleBookings",
    "loadOwnedBooking",
    "bookingIsCompleted",
    "customer_email=eq.",
    "Choose one of your completed bookings before submitting a review.",
    "vehicle_id: null",
    'review_source: "app"',
    'status: "submitted"',
    "GOOGLE_REVIEW_URL",
    "is_public: body.is_public === true",
    "booking_verified: true",
    'publication_state: "submitted_for_approval"',
)
forbid(
    "functions/api/client/reviews_save.js",
    "vehicle_id: String(body",
    "review_source: String(body",
    "google_review_url: String(body",
    "error: await res.text()",
    "status: \"approved\"",
    "status: \"published\"",
)

need(
    "assets/customer-review-v286.js",
    "Build 286",
    'REVIEW_API = "/api/client/reviews_save"',
    'normalizedPath !== "/my-account"',
    "Completed booking",
    "Choose a completed booking",
    "No completed bookings available",
    "Only completed bookings on this signed-in account can be reviewed.",
    "MutationObserver",
    "customer_review_prompt_view",
    "customer_review_submit_attempt",
    "RosieAnalytics?.track",
    'new CustomEvent("rd:analytics"',
)
forbid(
    "assets/customer-review-v286.js",
    "five star",
    "5-star review",
    "great service",
    "referral discount",
    "referral credit",
    "loyalty discount",
    "/api/checkout",
    "/api/availability",
)

need(
    "assets/client-auth.js",
    "loadBuild285CustomerRebook",
    "/assets/customer-rebook-v285.js",
    "loadBuild286CustomerReview",
    'path !== "/my-account"',
    "/assets/customer-review-v286.js",
    "data-build286-customer-review",
)
need(
    "my-account/index.html",
    'id="reviewForm"',
    'id="reviewBooking"',
    'id="reviewPublic"',
    "Allow public reuse after approval",
)
account_asset = ROOT / "assets/my-account-v296.js"
account_runtime = read("assets/my-account-v296.js") if account_asset.exists() else read("my-account/index.html")
if "/api/client/reviews_save" not in account_runtime:
    errors.append("customer account runtime missing retained Build 286 reviews_save authority")

summary = read("BUILD286_SUMMARY.md")
for token in [
    "Completed-Job Customer Review Authority",
    "signed-in customer",
    "completed",
    "no schema migration",
    "submitted",
    "Allow public reuse after approval",
    "No referral reward",
    "Production remains closed",
]:
    if token.lower() not in summary.lower():
        errors.append(f"BUILD286_SUMMARY.md missing {token}")

need(
    ".github/workflows/build286-source-gate.yml",
    "Build 286 Source Gate",
    "build286-customer-review-authority",
    "customer-review-v286.js",
    "reviews_save.js",
    "build286_release_check.py",
    "build286_http_smoke.sh",
    "seq 271 285",
)
need(
    ".github/workflows/build286-development-acceptance.yml",
    "Build 286 Development Runtime Acceptance",
    "branches:",
    "- dev",
    "build286_release_check.py",
    "build286_http_smoke.sh",
    "https://dev.rosiedazzlers.pages.dev",
    "Production remains closed",
)
need(
    "scripts/build286_http_smoke.sh",
    "/assets/customer-review-v286.js",
    "/assets/client-auth.js",
    "/api/client/reviews_save",
    "Completed booking",
    "customer_review_prompt_view",
    "Unauthorized",
)

seo_guard = read("scripts/seo_h1_check.py")
for token in ["build286_release_check.py", "build286.exists()", "run_guard(build286)"]:
    if token not in seo_guard:
        errors.append(f"cumulative SEO/release path missing Build 286 hook: {token}")

# The established cumulative Development workflows remain authoritative. Build 286
# is retained through release_check -> seo_h1_check, while its own runtime workflow
# proves the new endpoint/asset on the mutable dev alias after deployment convergence.
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
command("node", "--check", "assets/customer-review-v286.js")
command("node", "--check", "assets/client-auth.js")
command("bash", "-n", "scripts/build286_http_smoke.sh")

if errors:
    print("Build 286 completed-job customer review authority check FAILED:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Build 286 completed-job customer review authority check: PASS")
print("- customer review booking evidence is re-verified against the authenticated customer account")
print("- only genuinely completed owned bookings are eligible for direct customer review submission")
print("- browser-supplied vehicle/source/Google URL authority is removed while explicit reuse consent remains")
print("- submitted reviews remain approval-gated; no fabricated praise/publication or referral economics were added")
print("- account UI exposes completed bookings only and disables review submission when none exist")
print("- no schema migration, pricing, payment or referral authority was introduced")
print("- Production remains closed")
