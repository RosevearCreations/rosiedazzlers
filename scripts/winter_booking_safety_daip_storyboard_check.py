#!/usr/bin/env python3
"""Build 547 release invariant: read-only winter decision plus private DAIP storyboard wiring."""
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    target=root/path
    if not target.is_file():
        errors.append("missing "+path)
        return ""
    return target.read_text(encoding="utf-8",errors="replace")
w=read("functions/api/_lib/winter-booking-rule-observed-safety-transparency.js")
wt=read("scripts/winter_booking_rule_observed_safety_transparency_test.mjs")
d=read("assets/daip-multicamera-storyboard.js")
dt=read("scripts/daip_multicamera_storyboard_test.mjs")
api=read("functions/api/admin/service_economics_commercial_capacity_review.js")
js=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
h=read("admin-service-economics-commercial-capacity-review.html")
h2=read("admin-service-economics-commercial-capacity-review/index.html")
daip=read("admin-daip-media.html")
daip2=read("admin-daip-media/index.html")
doc=read("BUILD547_WINTER_BOOKING_SAFETY_DAIP_MULTICAMERA_STORYBOARD.md")
track=read("DAIP_CONTINUOUS_BUILD_TRACK_547_555.md")
for label,source,needles in [
 ("winter helper",w,["buildWinterBookingObservedSafetyTransparency","observed_reservation_collision_outcome_unavailable","unknown_weather_sessions_need_separate_review","booking_mutation_allowed:false","weather_ineligible_is_conversion_failure:false"]),
 ("winter tests",wt,["observed_reservation_collision_outcome_unavailable","unknown_weather_sessions_need_separate_review","booking_mutation_allowed"]),
 ("DAIP helper",d,["buildDaipPrivateStoryboards","source:\"staff_selected_private_project_media\"","server_persisted:false","video_rendered:false","publishing_authorized:false"]),
 ("DAIP tests",dt,["camera_angle_count","before_sequence_missing","publishing_authorized"]),
 ("staff API",api,["buildWinterBookingObservedSafetyTransparency","winter_booking_observed_safety_transparency:winterObservedSafety"]),
 ("staff report",js,["renderWinterBookingObservedSafetyTransparency","winterBookingObservedSafetyGrid"]),
 ("staff HTML",h,['data-build547="winter-observed-safety"','id="winterBookingObservedSafetyGrid"']),
 ("DAIP HTML",daip,['data-build547="daip-private-multicamera"','id="daipPreviewStoryboard"','data-angle-for=',"buildDaipPrivateStoryboards","private-daip-storyboard-build547.json"]),
 ("contract",doc,["Build 547","Build 548","DAIP","Cloudflare","consent"]),
 ("continuity roadmap",track,["547","548","549","550","551","552","553","554","555","private"])
]:
    for needle in needles:
        if needle not in source:
            errors.append(label+" missing "+needle)
if h!=h2: errors.append("staff protected routes diverge")
if daip!=daip2:errors.append("DAIP protected routes diverge")
for path in [".github/workflows/development-source-gate.yml",".github/workflows/production-business-acceptance-authority.yml"]:
    contents=read(path)
    for needle in ["Validate observed winter booking safety and private DAIP storyboard",
        "python scripts/winter_booking_safety_daip_storyboard_check.py",
        "node scripts/winter_booking_rule_observed_safety_transparency_test.mjs",
        "node scripts/daip_multicamera_storyboard_test.mjs"]:
        if needle not in contents:errors.append(path+" missing "+needle)
if errors:
    print("BUILD 547 WINTER OBSERVED SAFETY AND DAIP MULTI-CAMERA AUTHORITY: FAIL")
    for e in errors:print(" - "+e)
    sys.exit(1)
print("BUILD 547 WINTER OBSERVED SAFETY AND DAIP MULTI-CAMERA AUTHORITY: PASS")
