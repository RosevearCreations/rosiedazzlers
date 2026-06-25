from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
errors=[]
required=[
 'admin-today.html','detailer-jobs.html','admin-progress.html','progress.html','admin-gallery.html',
 'functions/api/admin/today_needs_attention_report.js','functions/api/admin/progress_upload_session.js',
 'functions/api/admin/progress_convert_incident.js','functions/api/admin/progress_media_reuse.js',
 'functions/api/admin/job_summary_generate.js','functions/api/admin/review_request_queue_safe.js',
 'functions/api/progress/recommendation_decide.js','functions/api/_lib/live-interaction-alerts.js',
 'functions/api/_lib/proof-of-work.js','sql/2026-06-17_build210_connected_live_workflow.sql',
 'data/build210_connected_live_workflow.json'
]
for rel in required:
 if not (ROOT/rel).exists(): errors.append(f'Missing {rel}')
checks={
 'detailer-jobs.html':['progress_upload_session','cancelUploadBtn','retryUploadBtn','recommendation_amount_cents','proofStatus'],
 'progress.html':['recommendation_decide','completedSummarySection','unreadBadge'],
 'admin-progress.html':['generateSummaryBtn','queueReviewBtn','progress_media_reuse','progress_convert_incident'],
 'admin-gallery.html':['gallery_media_candidates_list','Approved final photos ready for pairing'],
 'admin-today.html':['Today Needs Attention','today_needs_attention_report'],
 'functions/api/detailer/job_action.js':['proof_media_incomplete','loadProofOfWorkStatus'],
 'functions/api/progress/view.js':['unread_count','completed_job_summary'],
 'functions/api/admin/progress_list.js':['unread_staff_count','proof_media_status'],
 'SUPABASE_SCHEMA.sql':['completed_job_summaries','gallery_media_candidates','live_upload_sessions'],
 'AI_PROJECT_HANDOFF.md':['Build 210','connected live-job closeout'],
 'MASTER_VALUE_ROADMAP.md':['Build 210','Completed 20 steps','Next 20 value-added steps']
}
for rel,needles in checks.items():
 p=ROOT/rel
 if not p.exists(): continue
 text=p.read_text(errors='ignore')
 for needle in needles:
  if needle not in text: errors.append(f'{rel} missing marker: {needle}')
try:
 data=json.loads((ROOT/'data/build210_connected_live_workflow.json').read_text())
 if data.get('build')!=210: errors.append('Build 210 JSON has wrong build number')
 if len(data.get('next_20',[]))!=20: errors.append('Build 210 JSON must contain exactly 20 next steps')
except Exception as exc: errors.append(f'Build 210 JSON invalid: {exc}')
root_md=list(ROOT.glob('*.md'))
for p in root_md:
 if 'Build 210 documentation sync' not in p.read_text(errors='ignore'):
  errors.append(f'Root Markdown not synchronized: {p.name}')
if errors:
 print('Build 210 connected workflow check failed:')
 for e in errors: print('-',e)
 raise SystemExit(1)
print('Build 210 connected live workflow checks passed.')
