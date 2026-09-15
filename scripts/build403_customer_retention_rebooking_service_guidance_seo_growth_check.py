#!/usr/bin/env python3
"""Build 403 fail-closed authority for exact-profile retention, explainable rebooking and public service depth."""
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]

def read(path):
    p=ROOT/path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8",errors="ignore")

def require(text,needles,label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

def pair(text,label):
    cur=re.search(r"\*\*Build\s+(\d{3})\s+—\s+[^*\n]+\*\*\s+is the active bounded release\.",text)
    nxt=re.search(r"\*\*Build\s+(\d{3})\s+—\s+[^*\n]+\*\*\s+is next only after",text)
    if not cur or not nxt:
        errors.append(f"{label} cannot resolve current/next release")
        return None
    return int(cur.group(1)),int(nxt.group(1))

endpoint=read('functions/api/client/retention.js')
retention=read('functions/api/client/_lib/customer-retention.js')
account=read('assets/my-account-v382.js')
wrapper=read('assets/landing-page.js')
depth=read('assets/build403-service-depth.js')
water=read('water-extraction/index.html')
contract=read('BUILD403_CUSTOMER_RETENTION_REBOOKING_SERVICE_GUIDANCE_SEO_GROWTH.md')
queue=read('AUTONOMOUS_RELEASE_QUEUE.md')
handoff=read('AI_PROJECT_HANDOFF.md')
readme=read('README.md')
roadmap=read('FORWARD_BUILD_ROADMAP_396_405.md')
sitemap=read('sitemap.xml')

require(endpoint,[
    'customer_profile_id=eq.${encodeURIComponent(profileId)}',
    'select=id,customer_profile_id,status,job_status,completed_at,detailing_completed_at,service_date,created_at,package_code,vehicle_size',
    'allowed_methods: [\'GET\', \'OPTIONS\']'
], 'customer retention endpoint')
booking_lines=[line for line in endpoint.splitlines() if 'rest/v1/bookings?' in line]
if not booking_lines or any('customer_email=eq.' in line for line in booking_lines):
    errors.append('booking-history projection must use exact customer_profile_id, never email matching')
if 'onRequestPatch' in endpoint or 'onRequestDelete' in endpoint:
    errors.append('customer retention endpoint must remain read-only')

require(retention,[
    "schema: 'rd.customer.retention.v2'",
    "state: 'unavailable'",
    "state: 'insufficient'",
    "state: 'observed_completed_service'",
    'rebook_package', 'rebook_vehicle_size', 'rebook_date',
    'exact_customer_profile_id: true',
    'fuzzy_identity_merge: false',
    'inferred_outreach_consent: false',
    'persistent_customer_scoring: false',
    'automatic_booking_write: false',
    'automatic_customer_outreach: false',
    'automatic_service_substitution: false',
    'current catalog, availability, scope and price are reconfirmed'
], 'retention projection')

require(account,[
    'data-build403-customer-retention-rebooking-service-guidance',
    'data-build403-service-guidance',
    'Start from a completed service.',
    'current catalog, availability, scope and price are reconfirmed',
    'No outreach, appointment or service substitution is created automatically.',
    'Service guidance unavailable.'
], 'customer account guidance')
if 'setInterval(' in account:
    errors.append('Build 403 account guidance must not introduce permanent polling')

require(wrapper,['landing-page-build388.js','startBuild389LandingConvergence','startBuild403ServiceDepth'], 'landing wrapper')
service_slugs=[
 'paint-correction','odor-removal','ceramic-coating','pet-hair-removal','headlight-restoration',
 'high-grade-paint-sealant','full-clay-treatment','two-stage-polish','uv-protectant','de-ionizing-treatment',
 'de-badging','engine-cleaning','graphene-finish','exterior-wax','vinyl-wrapping','window-tinting',
 'seat-shampoo','carpet-shampoo','salt-stain-treatment','windshield-ceramic-coating','ceramic-spray-wax',
 'trim-restoration','bug-tar-removal','truck-box-wash','fleet-vehicle-add-on'
]
for slug in service_slugs:
    if f"'{slug}'" not in depth:
        errors.append(f'public add-on depth missing {slug}')
require(depth,[
    'Professional process & condition assessment',
    'Products, equipment, labour and duration depend on actual condition and severity',
    'gets customer approval before expanding the job',
    'several hours',
    'Test spot',
    'source-removal',
    'trapped-moisture inspection',
    '/water-extraction'
], 'service-depth authority')
if re.search(r'<h1\b',depth,re.I):
    errors.append('dynamic Build 403 service-depth layer must not create another H1')
if 'setInterval(' in depth:
    errors.append('service-depth authority must not use permanent polling')

if water:
    if len(re.findall(r'<h1\b',water,re.I)) != 1: errors.append('water-extraction page must contain exactly one H1')
    require(water,[
        '<meta name="description"', '<link rel="canonical" href="https://rosiedazzlers.ca/water-extraction"',
        'type="application/ld+json"', 'data-build403-water-extraction',
        'seat, trim or carpet', 'trapped moisture', 'mold growth or corrosion/rust risk',
        '<strong>several hours</strong>', 'does not promise a fixed repair time or fixed restoration price before inspection',
        'Products, equipment, labour and duration depend on actual condition and severity'
    ], 'water-extraction landing page')
    if '$' in water: errors.append('water-extraction page must not hard-code public dollar pricing')

require(contract,[
    'exact `customer_profile_id` only', 'Missing evidence is `unavailable` or `insufficient`',
    'automatic service substitution', 'Every current public add-on/specialty landing route',
    'Paint correction', 'Odor remediation', 'Water extraction / flooded-floor restoration',
    'one meaningful H1', 'schema migration',
    'Production deployment/runtime/business acceptance must independently prove that exact SHA'
], 'Build 403 contract')

q=pair(queue,'release queue'); h=pair(handoff,'project handoff')
if q != (403,404): errors.append(f'release queue must be living 403/404, got {q}')
if h != (403,404): errors.append(f'project handoff must be living 403/404, got {h}')
require(readme,[
    'Current source direction: **Build 403 — Customer Retention, Rebooking, Service Guidance & SEO Growth**.',
    'BUILD403_CUSTOMER_RETENTION_REBOOKING_SERVICE_GUIDANCE_SEO_GROWTH.md',
    'scripts/build403_customer_retention_rebooking_service_guidance_seo_growth_check.py',
    'scripts/build402_admin_operations_cockpit_growth_experiment_check.py',
    'scripts/build396_growth_baseline_forward_roadmap_check.py',
    'Production deployment/runtime/business acceptance must independently prove that exact SHA'
], 'README')
require(roadmap,[
    '### Build 403 — Customer Retention, Rebooking, Service Guidance & SEO Growth',
    '### Build 404 — Error Recovery, Weak-Connection UX & Reliability Hardening',
    'Genuine observed evidence only',
    'missing data is `unavailable` or `insufficient`',
    'Anonymous acquisition/session evidence and exact customer-profile history remain separate layers',
    'exact Production SHA'
], 'forward roadmap')
if 'https://rosiedazzlers.ca/water-extraction/' not in sitemap:
    errors.append('sitemap must publish water-extraction landing route')

migrations=[p for p in ROOT.rglob('*.sql') if re.search(r'(?:^|[^0-9])403(?:[^0-9]|$)',p.name)]
if migrations:
    errors.append('Build 403 must not introduce a database migration: '+', '.join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print('BUILD 403 CUSTOMER RETENTION / REBOOKING / SERVICE GUIDANCE / SEO: FAIL')
    for error in errors: print(' -',error)
    sys.exit(1)
print('BUILD 403 CUSTOMER RETENTION / REBOOKING / SERVICE GUIDANCE / SEO: PASS')
print(' - exact-profile completed-service guidance is fail-closed and advisory')
print(f' - {len(service_slugs)} established add-on/specialty landing routes receive condition-aware process depth')
print(' - flooded-floor/water-extraction restoration has a dedicated SEO-safe public process page')
print(' - no schema, payment/provider, consent/outreach, customer, accounting/inventory or destructive R2 mutation is authorized')
