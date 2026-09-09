from pathlib import Path

p = Path('functions/api/admin/review_proof_local_seo_loop.js')
text = p.read_text(encoding='utf-8')

required = [
    'customer_reviews?select=*',
    'status === "completed"',
    'job_status).toLowerCase() === "completed"',
    'completed_at || row.detailing_completed_at',
    'publication === "published"',
    'proofKind !== "sample"',
    'review_proof_opportunities',
    'Build 365 is read-only',
    'ready_for_proof_capture_or_link',
]
for token in required:
    if token not in text:
        raise SystemExit(f'MISSING Build 365 authority token: {token}')

for forbidden in [
    'method: "PATCH"',
    'method: "DELETE"',
    'method: "PUT"',
    'Prefer: "return=representation"',
]:
    if forbidden in text:
        raise SystemExit(f'Build 365 report must remain read-only; found: {forbidden}')

if text.count('TARGET_TOWNS') < 2 or text.count('TARGET_SERVICES') < 2:
    raise SystemExit('Build 365 must retain explicit town and service coverage authority.')

print('Build 365 Review -> Proof -> Local SEO authority: PASS')
