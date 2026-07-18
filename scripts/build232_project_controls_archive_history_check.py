from pathlib import Path
R=Path(__file__).resolve().parents[1]
required=['admin-creative-projects.html','functions/api/admin/creative_project_archive_download.js','sql/2026-07-15_build232_project_controls_archive_history.sql','docs/digital-asset-intelligence-platform/26_Project_Controls_Archive_and_Draft_History.md']
for x in required:
 assert (R/x).exists(),x
h=(R/'admin-creative-projects.html').read_text()
for x in ['lineEditor','projectBudget','targetMargin','queueConsentReminder','shotOwner','shotEvidence','Download JSON']:
 assert x in h,x
assert 'Edit ${kind} as JSON' not in h
s=(R/'sql/2026-07-15_build232_project_controls_archive_history.sql').read_text()
for x in ['creative_project_consent_reminders','creative_project_output_draft_versions','enable row level security','revoke all']:
 assert x in s,x
print('Build 232 project controls/archive history guard passed.')
