#!/usr/bin/env python3
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
required=[
 'sql/2026-07-12_build229_standard_job_project_choice.sql',
 'functions/api/admin/creative_project_booking_link.js',
 'admin-creative-projects.html','admin-booking.html',
 'docs/digital-asset-intelligence-platform/23_Standard_Jobs_and_Creative_Project_Opt_In.md'
]
missing=[p for p in required if not (ROOT/p).exists()]
if missing: print('Missing Build 229 files:',missing);sys.exit(1)
alltext='\n'.join((ROOT/p).read_text(encoding='utf-8',errors='ignore') for p in required)
for token in ['standard_job','booking_opt_in','source_booking_id','No automatic conversion','public_publish_allowed:false']:
 if token not in alltext: print('Missing Build 229 evidence:',token);sys.exit(1)
html=(ROOT/'admin-booking.html').read_text(encoding='utf-8')
if html.lower().count('<h1')!=1: print('admin-booking H1 count invalid');sys.exit(1)
if 'Create creative project from this booking' not in html or 'Standard job' not in html: print('Booking choice UI missing');sys.exit(1)
endpoint=(ROOT/'functions/api/admin/creative_project_booking_link.js').read_text(encoding='utf-8')
for forbidden in ['automatic publish','signed url','r2 bucket','service role key']:
 if forbidden in endpoint.lower(): print('Forbidden capability in endpoint:',forbidden);sys.exit(1)
print('Build 229 standard job/project choice check passed.')
