#!/usr/bin/env python3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
required=[
 'sql/2026-07-13_build230_project_costs_templates_outputs.sql',
 'admin-creative-projects.html',
 'functions/api/admin/creative_project_line_save.js',
 'functions/api/admin/creative_project_draft_save.js',
 'functions/api/admin/creative_project_batch_approval.js',
 'functions/api/admin/creative_project_link_action.js',
 'functions/api/admin/creative_project_daip_associate.js',
 'data/build230_project_costs_templates_outputs.json',
 'docs/digital-asset-intelligence-platform/24_Creative_Project_Costs_Templates_and_Output_Governance.md'
]
missing=[x for x in required if not (ROOT/x).exists()]
assert not missing, f"Missing Build 230 files: {missing}"
sql=(ROOT/required[0]).read_text()
for token in ['creative_project_material_lines','creative_project_labour_lines','creative_project_cost_lines','creative_project_output_drafts','creative_project_templates','creative_project_daip_associations','enable row level security','revoke all privileges']:
 assert token in sql, token
html=(ROOT/'admin-creative-projects.html').read_text()
for token in ['Materials, labour & costs','Unified project-output approval','Story and platform-specific drafts','Reversible project controls','DAIP association']:
 assert token in html, token
assert html.lower().count('<h1')==1
daip=(ROOT/'functions/api/admin/creative_project_daip_associate.js').read_text()
for token in ['gate_c_held===false','technical_capability_enabled===true','DAIP association remains blocked']:
 assert token in daip, token
print('Build 230 project costs/templates/output governance check passed.')
