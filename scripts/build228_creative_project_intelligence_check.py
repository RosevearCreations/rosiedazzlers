from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]
required=['admin-creative-projects.html','functions/api/_lib/creative-projects.js','functions/api/admin/creative_projects_dashboard.js','functions/api/admin/creative_project_save.js','functions/api/admin/creative_project_session_save.js','functions/api/admin/creative_project_output_save.js','sql/2026-07-12_build228_creative_project_intelligence_foundation.sql','data/build228_creative_project_intelligence.json']
missing=[x for x in required if not (root/x).exists()]
if missing: raise SystemExit('Missing: '+', '.join(missing))
html=(root/'admin-creative-projects.html').read_text()
assert len(re.findall(r'<h1\b',html,re.I))==1
assert 'public_publish_allowed' in (root/'sql/2026-07-12_build228_creative_project_intelligence_foundation.sql').read_text()
assert 'default false' in (root/'sql/2026-07-12_build228_creative_project_intelligence_foundation.sql').read_text().lower()
data=json.loads((root/'data/build228_creative_project_intelligence.json').read_text())
assert len(data['outputs'])==17 and data['public_publish_default'] is False
assert (root/'admin-creative-projects/index.html').read_bytes()==(root/'admin-creative-projects.html').read_bytes()
print('Build 228 Creative Project Intelligence guard passed.')
