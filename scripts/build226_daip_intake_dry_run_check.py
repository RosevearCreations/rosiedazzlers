from pathlib import Path
import re
r=Path(__file__).resolve().parents[1]
def need(p,terms):
 s=(r/p).read_text(errors='ignore')
 for t in terms: assert t in s,f'{p}: missing {t}'
need('admin-daip-intake-dry-run.html',['<h1>DAIP Intake Dry Run</h1>','noindex,nofollow,noarchive','daip_intake_dry_run','No file selector exists'])
need('functions/api/_lib/daip-intake-dry-run.js',['media_bytes_received:false','storage_authorization_created:false','worker_execution_requested:false','public_destination_enabled:false'])
need('sql/2026-07-08_build226_daip_intake_dry_run.sql',['enable row level security','revoke all privileges','media_bytes_received boolean not null default false','gate_c_held boolean not null default true'])
need('service-worker.js',['/admin-daip-intake-dry-run.html','/data/build226_daip_intake_dry_run.json'])
sw=(r/'service-worker.js').read_text(errors='ignore')
assert any(v in sw for v in ('rosie-app-v20260708build226','rosie-app-v20260712build228','rosie-app-v20260712build229','rosie-app-v20260713build230','rosie-app-v20260714build231','rosie-app-v20260726build236','rosie-app-v20260728build237','rosie-app-v20260730build238'))
assert len(re.findall(r'<h1\b',(r/'admin-daip-intake-dry-run.html').read_text(),re.I))==1
print('Build 226 DAIP intake dry-run guard passed.')
