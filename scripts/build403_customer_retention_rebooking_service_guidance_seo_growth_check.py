#!/usr/bin/env python3
"""Retained Build 403 authority: exact-profile retention, rebooking and service/SEO depth."""
from pathlib import Path
import re, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(p):
    q=ROOT/p
    if not q.exists(): errors.append(f'missing {p}'); return ''
    return q.read_text(encoding='utf-8',errors='ignore')
def req(t,ns,label):
    for n in ns:
        if n not in t: errors.append(f'{label} missing {n!r}')
def pair(t,label):
    c=re.search(r'\*\*Build\s+(\d{3})\s+—\s+[^*\n]+\*\*\s+is the active bounded release\.',t)
    n=re.search(r'\*\*Build\s+(\d{3})\s+—\s+[^*\n]+\*\*\s+is next only after',t)
    if not c or not n: errors.append(f'{label} cannot resolve current/next'); return None
    return int(c.group(1)),int(n.group(1))
endpoint=read('functions/api/client/retention.js'); retention=read('functions/api/client/_lib/customer-retention.js')
account=read('assets/my-account-v382.js'); wrapper=read('assets/landing-page.js'); depth=read('assets/build403-service-depth.js')
water=read('water-extraction/index.html'); contract=read('BUILD403_CUSTOMER_RETENTION_REBOOKING_SERVICE_GUIDANCE_SEO_GROWTH.md')
queue=read('AUTONOMOUS_RELEASE_QUEUE.md'); handoff=read('AI_PROJECT_HANDOFF.md'); readme=read('README.md'); roadmap=read('FORWARD_BUILD_ROADMAP_396_405.md'); sitemap=read('sitemap.xml')
req(endpoint,['customer_profile_id=eq.${encodeURIComponent(profileId)}','select=id,customer_profile_id,status,job_status,completed_at,detailing_completed_at,service_date,created_at,package_code,vehicle_size',"allowed_methods: ['GET', 'OPTIONS']"],'customer retention endpoint')
booking_lines=[x for x in endpoint.splitlines() if 'rest/v1/bookings?' in x]
if not booking_lines or any('customer_email=eq.' in x for x in booking_lines): errors.append('booking history must use exact customer_profile_id')
if 'onRequestPatch' in endpoint or 'onRequestDelete' in endpoint: errors.append('retention endpoint must remain read-only')
req(retention,["schema: 'rd.customer.retention.v2'","state: 'unavailable'","state: 'insufficient'","state: 'observed_completed_service'",'rebook_package','rebook_vehicle_size','rebook_date','exact_customer_profile_id: true','fuzzy_identity_merge: false','inferred_outreach_consent: false','persistent_customer_scoring: false','automatic_booking_write: false','automatic_customer_outreach: false','automatic_service_substitution: false','current catalog, availability, scope and price are reconfirmed'],'retention projection')
req(account,['data-build403-customer-retention-rebooking-service-guidance','Start from a completed service.','current catalog, availability, scope and price are reconfirmed','No outreach, appointment or service substitution is created automatically.','Service guidance unavailable.'],'customer account guidance')
if 'setInterval(' in account: errors.append('Build 403 account guidance must not poll permanently')
req(wrapper,['landing-page-build388.js','startBuild389LandingConvergence','startBuild403ServiceDepth'],'landing wrapper')
service_slugs=['paint-correction','odor-removal','ceramic-coating','pet-hair-removal','headlight-restoration','high-grade-paint-sealant','full-clay-treatment','two-stage-polish','uv-protectant','de-ionizing-treatment','de-badging','engine-cleaning','graphene-finish','exterior-wax','vinyl-wrapping','window-tinting','seat-shampoo','carpet-shampoo','salt-stain-treatment','windshield-ceramic-coating','ceramic-spray-wax','trim-restoration','bug-tar-removal','truck-box-wash','fleet-vehicle-add-on']
for s in service_slugs:
    if f"'{s}'" not in depth: errors.append(f'public add-on depth missing {s}')
req(depth,['Professional process & condition assessment','Products, equipment, labour and duration depend on actual condition and severity','gets customer approval before expanding the job','several hours','Test spot','source-removal','trapped-moisture inspection','/water-extraction'],'service-depth authority')
if re.search(r'<h1\b',depth,re.I): errors.append('dynamic service-depth layer must not create another H1')
if 'setInterval(' in depth: errors.append('service-depth authority must not poll permanently')
if water:
    if len(re.findall(r'<h1\b',water,re.I))!=1: errors.append('water-extraction page must contain exactly one H1')
    req(water,['<meta name="description"','<link rel="canonical" href="https://rosiedazzlers.ca/water-extraction"','type="application/ld+json"','data-build403-water-extraction','seat, trim or carpet','trapped moisture','mold growth or corrosion/rust risk','<strong>several hours</strong>','does not promise a fixed repair time or fixed restoration price before inspection','Products, equipment, labour and duration depend on actual condition and severity'],'water-extraction page')
    if '$' in water: errors.append('water-extraction must not hard-code dollar pricing')
req(contract,['exact `customer_profile_id` only','Missing evidence is `unavailable` or `insufficient`','automatic service substitution','Every current public add-on/specialty landing route','Paint correction','Odor remediation','Water extraction / flooded-floor restoration','one meaningful H1','schema migration','Production deployment/runtime/business acceptance must independently prove that exact SHA'],'Build 403 contract')
for text,label in [(queue,'release queue'),(handoff,'project handoff')]:
    p=pair(text,label)
    if p and (p[0] < 403 or p[1] != p[0]+1): errors.append(f'{label} must remain sequential at/after Build 403, got {p}')
req(readme,['BUILD403_CUSTOMER_RETENTION_REBOOKING_SERVICE_GUIDANCE_SEO_GROWTH.md','scripts/build403_customer_retention_rebooking_service_guidance_seo_growth_check.py','scripts/build396_growth_baseline_forward_roadmap_check.py','Production deployment/runtime/business acceptance must independently prove that exact SHA'],'README retained authority')
req(roadmap,['### Build 403 — Customer Retention, Rebooking, Service Guidance & SEO Growth','### Build 404 — Error Recovery, Weak-Connection UX & Reliability Hardening','Genuine observed evidence only','missing data is `unavailable` or `insufficient`','Anonymous acquisition/session evidence and exact customer-profile history remain separate layers','exact Production SHA'],'forward roadmap')
if 'https://rosiedazzlers.ca/water-extraction/' not in sitemap: errors.append('sitemap must publish water-extraction')
if [p for p in ROOT.rglob('*.sql') if re.search(r'(?:^|[^0-9])403(?:[^0-9]|$)',p.name)]: errors.append('Build 403 must remain schema-neutral')
if errors:
    print('BUILD 403 CUSTOMER RETENTION / REBOOKING / SERVICE GUIDANCE / SEO: FAIL')
    for e in errors: print(' -',e)
    sys.exit(1)
print('BUILD 403 CUSTOMER RETENTION / REBOOKING / SERVICE GUIDANCE / SEO: PASS')
print(' - retained exact-profile, advisory rebooking, service-depth and SEO authority preserved')
print(' - retained authority remains compatible with later sequential living releases')
