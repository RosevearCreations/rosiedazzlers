#!/usr/bin/env python3
"""Build 224 DAIP Gate C review-only boundary guard."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REQUIRED={'functions/api/_lib/daip-gate-c-review.js':['DAIP_GATE_C_BUILD = 224','ACCEPT TEST-ONLY REVIEW','technical_capabilities_enabled:0','public_capabilities_enabled:0','gate_c_held:true','safeGateCText'],'functions/api/admin/daip_gate_c_technical_review_dashboard.js':['requireStaffAccess','manage_staff','onRequest','GET','POST'],'functions/api/admin/daip_gate_c_technical_review_save.js':['requireStaffAccess','manage_staff','daip_gate_c_technical_reviews'],'admin-daip-gate-c.html':['<h1>DAIP Gate C Technical Review</h1>','noindex,nofollow,noarchive','data-visual-placeholder="daip_gate_c_technical_review"','@media(max-width:760px)'],'sql/2026-07-06_build224_daip_gate_c_technical_review_rollback.sql':['enable row level security','revoke all privileges','grant all privileges','gate_c_held boolean not null default true'],'docs/digital-asset-intelligence-platform/19_DAIP_Gate_C_Technical_Review_and_Rollback_Acceptance.md':['Gate C','Held','rollback']}
FORBIDDEN=['R2Bucket','S3Client(','createPresigned','presigned URL','ffmpeg','OpenAI','gallery publish','social publish']
def main():
 m=[]
 for rel,marks in REQUIRED.items():
  p=ROOT/rel
  if not p.exists():m.append(f'{rel}: missing');continue
  txt=p.read_text(encoding='utf-8',errors='ignore')
  for q in marks:
   if q not in txt:m.append(f'{rel}: missing {q!r}')
 for rel in ['functions/api/_lib/daip-gate-c-review.js','functions/api/admin/daip_gate_c_technical_review_dashboard.js','functions/api/admin/daip_gate_c_technical_review_save.js']:
  txt=(ROOT/rel).read_text(encoding='utf-8',errors='ignore')
  for q in FORBIDDEN:
   if q.lower() in txt.lower():m.append(f'{rel}: forbidden capability marker {q!r}')
 if m:
  print('Build 224 DAIP Gate C technical review check failed:');[print('-',x) for x in m];return 1
 print('Build 224 DAIP Gate C technical review checks passed.');return 0
if __name__=='__main__':raise SystemExit(main())
