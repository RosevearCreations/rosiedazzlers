#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-https://dev.rosiedazzlers.pages.dev}"
echo "Build 299 read-only booking-dashboard smoke against ${BASE_URL}"
page="$(curl -fsSL --retry 6 --retry-delay 3 "${BASE_URL}/admin-booking.html")"
asset="$(curl -fsSL --retry 6 --retry-delay 3 "${BASE_URL}/assets/admin-booking-v299.js")"
grep -Fq '<script type="module" src="/assets/admin-booking-v299.js"></script>' <<<"$page"
grep -Fq 'Manage bookings and assignments' <<<"$page"
grep -Fq '/api/admin/bookings' <<<"$asset"
grep -Fq '/api/admin/booking_update' <<<"$asset"
grep -Fq '/api/admin/assign_booking' <<<"$asset"
grep -Fq '/api/admin/booking_finance' <<<"$asset"
echo "Build 299 read-only booking-dashboard smoke: PASS"
