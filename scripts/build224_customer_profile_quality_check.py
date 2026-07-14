#!/usr/bin/env python3
"""Build 224 customer profile quality controls guard."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REQUIRED={'functions/api/_lib/customer-admin.js':['recordCustomerContactPreferenceChange','collectDuplicateCandidates','preference_history','duplicate_candidates'],'functions/api/admin/customer_admin_save.js':['recordCustomerContactPreferenceChange'],'functions/api/admin/customer_admin_detail.js':['delete detail.preference_history','delete detail.duplicate_candidates'],'admin-customers.html':['Contact preference history','Possible duplicate review','never merges client records automatically','preferenceHistory','duplicateReview'],'sql/2026-07-06_build224_customer_preference_history_duplicate_review.sql':['customer_contact_preference_events','enable row level security','revoke all privileges','service_role']}
def main():
 m=[]
 for rel,marks in REQUIRED.items():
  p=ROOT/rel
  if not p.exists():m.append(f'{rel}: missing');continue
  txt=p.read_text(encoding='utf-8',errors='ignore')
  for q in marks:
   if q not in txt:m.append(f'{rel}: missing {q!r}')
 if m:
  print('Build 224 customer profile quality check failed:');[print('-',x) for x in m];return 1
 print('Build 224 customer profile quality checks passed.');return 0
if __name__=='__main__':raise SystemExit(main())
