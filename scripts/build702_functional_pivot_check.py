#!/usr/bin/env python3
"""Build 702: verify owner gift-test pause and return to real booking workflows."""
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
planner = (root / "booking-planner.html").read_text(encoding="utf-8")
today = (root / "admin-today.html").read_text(encoding="utf-8")
gift_review = (root / "admin-gift-recovery-review.html").read_text(encoding="utf-8")
checkout = (root / "functions/api/checkout.js").read_text(encoding="utf-8")

assert re.search(r'<label hidden><input id="ack_power_water" type="checkbox" checked disabled', planner)
assert re.search(r'<label hidden><input id="need_mobile_water_power" type="checkbox"', planner)
assert planner.count('["Water/power setup", "Rosie brings standard detailing water and power"]') == 2
assert "Customer provides water and power" not in planner
assert "Quote staff-supplied water/power setup" not in planner
assert 'id="ack_driveway" type="checkbox"' in planner
assert 'id="ack_bylaw" type="checkbox"' in planner
assert 'id="ack_cancellation" type="checkbox"' in planner
assert 'ack_power_water: true' in planner
assert "ack_power_water" in checkout and "ack_cancellation" in checkout

assert 'id="build702DailyWork"' in today
assert 'data-build702-gift-testing-pause' in gift_review
assert "Gift testing paused" in gift_review
assert "not a finding that any pending delivery succeeded" in gift_review
for path, target in {
    "/book": "book/index.html",
    "/admin-booking.html": "admin-booking.html",
    "/admin-quotes.html": "admin-quotes.html",
    "/admin-blocks.html": "admin-blocks.html",
    "/admin-leads.html": "admin-leads.html",
}.items():
    assert f'href="{path}"' in today or f'href="{path}"' in gift_review, path
    assert (root / target).is_file(), target

print("Build 702 functional pivot PASS: booking utility source, required acknowledgements, live admin routes, gift-test pause boundary")
