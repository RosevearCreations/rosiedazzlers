from pathlib import Path
r=Path(__file__).resolve().parents[1]
need=['admin-roadmap-execution.html','functions/api/admin/roadmap_execution_dashboard.js','functions/api/admin/roadmap_execution_save.js','functions/api/admin/daip_intake_policy_save.js','sql/2026-07-09_build227_roadmap_execution_daip_policy.sql','data/build227_roadmap_execution_daip_policy.json']
for x in need:
 assert (r/x).exists(),x
s=(r/'sql/2026-07-09_build227_roadmap_execution_daip_policy.sql').read_text()
for x in ['gate_c_held boolean not null default true check (gate_c_held is true)','technical_capability_enabled boolean not null default false check (technical_capability_enabled is false)','revoke all privileges']:
 assert x in s,x
html=(r/'admin-roadmap-execution.html').read_text().lower()
assert html.count('<h1')==1
for banned in ['type="file"','presigned','object key','publish now']:
 assert banned not in html,banned
print('Build 227 roadmap execution and DAIP policy check passed.')
