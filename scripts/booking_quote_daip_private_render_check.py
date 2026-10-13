#!/usr/bin/env python3
"""Build 552 source contract; real booking/quote comparisons and renders remain distinct."""
from pathlib import Path
import subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
 p=ROOT/path
 if not p.is_file():errors.append("missing "+path);return ""
 return p.read_text(encoding="utf-8",errors="replace")
guards={
"functions/api/_lib/booking-quote-controlled-interpretation-552.js":["build552BookingQuoteControlledInterpretation","weather_exclusion_audited","retain_booking_quote_follow_up_hold","causal_winner_or_superiority_inferred:false","price_or_discount_changed:false"],
"functions/api/admin/booking_quote_experiment_follow_up_decision.js":["build552BookingQuoteControlledInterpretation","booking_quote_controlled_follow_up_interpretation_552"],
"assets/booking-quote-followup-interpretation-552.js":["initBookingQuoteInterpretation552","booking_quote_controlled_follow_up_interpretation_552","/api/admin/booking_quote_experiment_follow_up_decision"],
"admin-booking-quote-retention-learning.html":["data-build552=\"booking-quote-controlled-follow-up-interpretation\"","id=\"refreshFollowup552\"","assets/booking-quote-followup-interpretation-552.js"],
"assets/daip-private-render-preflight-552.js":["build552PrivateDaipRenderPlan","worker_execution_attempted:false","ffmpeg_invoked:false","private_r2_write_performed:false","social_publish_authorized:false"],
"admin-daip-media.html":["data-build552=\"private-render-preflight\"","id=\"daipRenderCheck552\"","assets/daip-private-render-preflight-552.js"],
"scripts/booking_quote_daip_private_render_test.mjs":["descriptive_follow_up_review_ready","private_render_blocked_requires_worker_and_privacy_evidence"],
"BUILD552_BOOKING_QUOTE_DAIP_PRIVATE_RENDER_PREFLIGHT.md":["Build 552","Build 553","Cloudflare"]
}
for path,tokens in guards.items():
 s=read(path)
 for token in tokens:
  if token not in s:errors.append(path+" missing "+repr(token))
for a,b in [("admin-booking-quote-retention-learning.html","admin-booking-quote-retention-learning/index.html"),("admin-daip-media.html","admin-daip-media/index.html")]:
 if read(a)!=read(b):errors.append("protected route drift: "+a)
for path in [".github/workflows/development-source-gate.yml",".github/workflows/production-business-acceptance-authority.yml"]:
 s=read(path)
 for token in ["Validate booking quote seasonal analysis and DAIP private render preflight",
               "python scripts/booking_quote_daip_private_render_check.py","node scripts/booking_quote_daip_private_render_test.mjs"]:
  if token not in s:errors.append(path+" missing "+repr(token))
for path in ["functions/api/_lib/booking-quote-controlled-interpretation-552.js",
             "functions/api/admin/booking_quote_experiment_follow_up_decision.js",
             "assets/booking-quote-followup-interpretation-552.js",
             "assets/daip-private-render-preflight-552.js",
             "scripts/booking_quote_daip_private_render_test.mjs"]:
 check=subprocess.run(["node","--check",path],cwd=ROOT,capture_output=True,text=True)
 if check.returncode:errors.append(path+" JS syntax: "+check.stderr.strip())
if errors:
 print("BUILD 552 SOURCE GATE FAIL")
 for e in errors:print(" -",e)
 sys.exit(1)
run=subprocess.run(["node","scripts/booking_quote_daip_private_render_test.mjs"],cwd=ROOT,capture_output=True,text=True)
if run.returncode:
 print("BUILD 552 REGRESSION FAIL",run.stderr or run.stdout)
 sys.exit(1)
print("BUILD 552 SOURCE GATE PASS — weather denominators and worker/privacy gating remain source-owned")
