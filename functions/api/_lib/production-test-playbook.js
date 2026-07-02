// Build 212 — guided production acceptance playbook.
// Keep this list free of customer/private data. The matching JSON file is for documentation/audit.
export const PRODUCTION_TEST_PLAYBOOK_BUILD212 = [
  {
    "key": "environment_preflight",
    "name": "Environment preflight",
    "category": "Required before live testing",
    "risk": "high",
    "estimated_minutes": 10,
    "pages": [
      "/admin-production.html",
      "/admin-test-centre.html"
    ],
    "prerequisites": [
      "Use an administrator account.",
      "Use the dev/staging site first. Do not test on a real customer booking.",
      "Have one test booking, one staff email address, and one test customer email available."
    ],
    "safety": [
      "Do not paste API keys, passwords, or webhook secrets into notes.",
      "Use fictional customer details or your own internal contact details only."
    ],
    "steps": [
      "Sign in and open /admin-production.html.",
      "Press Refresh report.",
      "Confirm Supabase service is marked ready. Record any required provider or storage items that say needs setup.",
      "Open Guided Test Centre and mark this test Pass only if no required environment item is missing."
    ],
    "expected": "The report loads without a 401/500 error and required services are either ready or clearly flagged for setup.",
    "if_it_fails": [
      "Take a screenshot of the card error only\u2014do not capture secrets.",
      "Record the page URL, date/time, browser/device, and the visible error text.",
      "Mark Blocked and attach a safe screenshot link or note in the Test Centre."
    ]
  },
  {
    "key": "notification_delivery",
    "name": "Email notification configuration and safe test",
    "category": "Provider reliability",
    "risk": "high",
    "estimated_minutes": 10,
    "pages": [
      "/admin-production.html#notifications",
      "/admin-test-centre.html"
    ],
    "prerequisites": [
      "Email provider webhook/environment variable is configured.",
      "Use an email mailbox controlled by Rosie Dazzlers; never a customer email."
    ],
    "safety": [
      "Start with Check config only.",
      "Only use Send test after configuration-only confirms the provider exists."
    ],
    "steps": [
      "Open /admin-production.html and scroll to Notification provider test.",
      "Select Email.",
      "Press Check config only. Confirm the result says configured.",
      "Enter an internal test email address and press Send test.",
      "Check the mailbox, including spam/junk, for the test message.",
      "Return here and record Pass with the receive time, or Fail/Blocked with the error text."
    ],
    "expected": "The app reports a configured provider and the controlled mailbox receives one test notification.",
    "if_it_fails": [
      "Do not keep pressing Send test; one attempt is enough until the provider is repaired.",
      "Check the provider/webhook configuration from the production readiness screen.",
      "Record whether the app returned a configuration error, provider error, or success with no received email."
    ]
  },
  {
    "key": "hosted_final_balance_checkout",
    "name": "Stripe hosted final-balance checkout in test mode",
    "category": "Payment reliability",
    "risk": "high",
    "estimated_minutes": 15,
    "pages": [
      "/admin-production.html#payments",
      "/admin-test-centre.html"
    ],
    "prerequisites": [
      "Stripe test-mode secret key is configured\u2014not live mode for this first test.",
      "A draft/open internal final-balance request exists for a small test amount."
    ],
    "safety": [
      "Use a clearly labelled internal test request.",
      "Never test a live card, real customer email, or production balance without confirming the Stripe mode."
    ],
    "steps": [
      "Open /admin-production.html and refresh the report.",
      "Find a test final-balance request without a link, then press Use this request id.",
      "Press Create hosted checkout.",
      "Open the returned checkout URL in a new tab and confirm it shows the correct small test amount and Rosie Dazzlers branding.",
      "Use a Stripe test card only if the Stripe account is confirmed in test mode.",
      "Return to the Test Centre and record the outcome. Do not call it a Pass until webhook/payment reconciliation is verified separately."
    ],
    "expected": "A Stripe-hosted Checkout URL is created and shows the correct request amount; the original request keeps its manual fallback if Stripe is unavailable.",
    "if_it_fails": [
      "Record the payment request ID, not any card details.",
      "Check whether Stripe is configured in test mode and whether the request status/amount is valid.",
      "Mark Blocked if Stripe keys or webhook configuration are intentionally not set up yet."
    ]
  },
  {
    "key": "customer_visibility_privacy",
    "name": "Live update visibility and customer privacy",
    "category": "Customer experience and privacy",
    "risk": "urgent",
    "estimated_minutes": 15,
    "pages": [
      "/detailer-jobs.html",
      "/admin-progress.html",
      "/progress.html?token=..."
    ],
    "prerequisites": [
      "Use a test booking with progress enabled and a known test progress token.",
      "Use only fake/internal notes and non-sensitive test media."
    ],
    "safety": [
      "Never put a real customer name, VIN, home address, damage photo, or staff-only note into a public test.",
      "Use staff-only text that is harmless but obvious, such as TEST PRIVATE NOTE."
    ],
    "steps": [
      "In /detailer-jobs.html, post one Customer now update: TEST CUSTOMER VISIBLE.",
      "Post one Admin review first update: TEST REVIEW PENDING.",
      "Post one Staff only update: TEST PRIVATE NOTE.",
      "Open the test customer progress link in a separate signed-out/private browser window.",
      "Confirm only TEST CUSTOMER VISIBLE appears for the customer.",
      "Open /admin-progress.html and approve the review-pending update, then refresh the customer page.",
      "Confirm the approved update appears and TEST PRIVATE NOTE never appears."
    ],
    "expected": "The customer sees only customer-visible or approved customer-safe items. Review-pending and staff-only material remains hidden.",
    "if_it_fails": [
      "Stop using the test booking and do not test on customer records.",
      "Capture the exact update label and visibility selected, without screenshots of private media.",
      "Mark Fail and report this as a privacy blocker before using live updates with customers."
    ]
  },
  {
    "key": "mobile_upload_recovery",
    "name": "Mobile photo/video upload and weak-connection recovery",
    "category": "Field reliability",
    "risk": "high",
    "estimated_minutes": 20,
    "pages": [
      "/detailer-jobs.html",
      "/admin-production.html#uploads"
    ],
    "prerequisites": [
      "A phone with Wi-Fi and cellular data.",
      "A small non-sensitive test photo and a short test video."
    ],
    "safety": [
      "Use a test image/video only.",
      "Do not turn off connectivity while a real customer image is uploading."
    ],
    "steps": [
      "Open /detailer-jobs.html on the phone and select the test booking.",
      "Upload the small test photo; confirm progress reaches completion and the item appears in the staff feed.",
      "Start uploading the short video, then briefly disable Wi-Fi or switch networks.",
      "Confirm the page shows a useful failure/retry/cancel message instead of silently losing the upload.",
      "Restore connectivity, use Retry, and confirm the item completes or is visibly queued for review.",
      "Open /admin-production.html#uploads and confirm failed/cancelled/retried sessions are visible if an interruption occurred."
    ],
    "expected": "Upload progress is visible; interruptions create a clear recovery record; retry/cancel controls do not expose the file publicly.",
    "if_it_fails": [
      "Record phone model, browser, connection type, approximate file size, and visible error message.",
      "Do not repeatedly retry a large video on mobile data.",
      "Mark Blocked if the test cannot be run on a real phone/network."
    ]
  },
  {
    "key": "proof_completion_gate",
    "name": "Arrival / during / final proof gate",
    "category": "Work quality protection",
    "risk": "high",
    "estimated_minutes": 15,
    "pages": [
      "/detailer-jobs.html",
      "/admin-progress.html"
    ],
    "prerequisites": [
      "A test booking that can be moved through job stages.",
      "Three harmless test photos, one for each proof stage."
    ],
    "safety": [
      "Do not use incident evidence for the normal proof-gate test."
    ],
    "steps": [
      "Try to complete the test booking before posting proof; confirm the app explains what is missing.",
      "Post one Arrival photo, one During-work photo, and one Final-result photo.",
      "Confirm the proof-stage cards show all three stages as ready.",
      "Attempt completion again and confirm it is allowed.",
      "If an admin override is available, confirm it requires a recorded reason; do not use it for a normal test."
    ],
    "expected": "Completion is blocked until all required proof stages are present, unless an authorized override reason is captured.",
    "if_it_fails": [
      "Record which proof stage was missing or incorrectly accepted.",
      "Mark Fail if a booking can complete without proof and no override reason."
    ]
  },
  {
    "key": "incident_review_safety",
    "name": "Issue-to-incident and review-request safety",
    "category": "Business protection",
    "risk": "urgent",
    "estimated_minutes": 15,
    "pages": [
      "/detailer-jobs.html",
      "/admin-incident-reports.html",
      "/admin-workflow.html"
    ],
    "prerequisites": [
      "A test booking and harmless test issue note/media.",
      "Do not use a real damage claim for this test."
    ],
    "safety": [
      "Keep all incident test evidence staff-only.",
      "Never make a test incident public to the customer."
    ],
    "steps": [
      "Post a staff-only Issue update labelled TEST ISSUE.",
      "Use the issue-to-incident conversion control.",
      "Open /admin-incident-reports.html and confirm the new incident is private and linked to the booking/evidence.",
      "Check the review queue/workflow state and confirm a review request is blocked while the incident is unresolved.",
      "Resolve or close the test incident according to the test workflow, then confirm the booking returns to normal review eligibility only when other requirements are met."
    ],
    "expected": "Issue evidence is preserved privately in a linked incident report and unresolved incidents block review requests.",
    "if_it_fails": [
      "Do not use the feature with a real incident until repaired.",
      "Mark Fail if staff-only evidence is customer-visible or if a review request can proceed while the incident is unresolved."
    ]
  },
  {
    "key": "retention_dry_run",
    "name": "Storage retention dry-run",
    "category": "Data protection",
    "risk": "normal",
    "estimated_minutes": 10,
    "pages": [
      "/admin-production.html#retention"
    ],
    "prerequisites": [
      "Administrator account.",
      "At least one test item with an eligible retention expiry, or expect an empty result."
    ],
    "safety": [
      "Use Run dry-run first.",
      "Do not mark or archive evidence that is permanent proof or legal hold."
    ],
    "steps": [
      "Open /admin-production.html#retention.",
      "Press Run dry-run.",
      "Confirm the result lists only eligible rows or clearly says no items are due.",
      "Confirm permanent proof and legal-hold policies are not included.",
      "Only press Mark expired for review after confirming no real evidence will be affected."
    ],
    "expected": "The sweep is review-only by default and excludes permanent-proof/legal-hold media.",
    "if_it_fails": [
      "Stop and mark Fail if protected evidence appears in the result.",
      "Record the media policy label and booking ID, not the media URL."
    ]
  },
  {
    "key": "end_to_end_smoke",
    "name": "End-to-end acceptance: quote to safe closeout",
    "category": "Final release acceptance",
    "risk": "urgent",
    "estimated_minutes": 30,
    "pages": [
      "/admin-quotes.html",
      "/admin-booking.html",
      "/detailer-jobs.html",
      "/admin-progress.html",
      "/progress.html?token=...",
      "/admin-production.html",
      "/admin-today.html"
    ],
    "prerequisites": [
      "All earlier required tests have passed or are knowingly blocked.",
      "A wholly internal test customer/booking exists."
    ],
    "safety": [
      "Run on dev/staging first. Use no real customer data or payment card details.",
      "Do not mark the build production-ready if notification, privacy, payment, or proof tests failed."
    ],
    "steps": [
      "Create or select an internal quote and convert it to a test booking.",
      "Enable progress and post a customer-visible arrival update.",
      "Add required arrival/during/final proof media.",
      "Post a priced customer recommendation and approve it from the test customer progress page.",
      "Create a test final-balance checkout request; verify the URL only in test mode.",
      "Generate the completed-job summary.",
      "Confirm approved final media can be queued for Gallery Approval without re-uploading.",
      "Confirm unresolved incidents/review blockers are clear before requesting a review.",
      "Open /admin-today.html and confirm no unexplained urgent item remains for the test booking."
    ],
    "expected": "Every handoff is visible, privacy-safe, and traceable without manually copying data between unrelated screens.",
    "if_it_fails": [
      "Mark the failing link in the lifecycle, for example booking \u2192 proof or recommendation \u2192 payment.",
      "Record the screen, booking ID, device/browser, and visible message.",
      "Do not release as production-ready until urgent failure points are resolved."
    ]
  }
  ,
  {
    "key": "daip_test_mode_preflight",
    "name": "DAIP Test Lab safety preflight",
    "category": "DAIP internal test mode",
    "risk": "urgent",
    "estimated_minutes": 8,
    "build_number": 218,
    "pages": ["/admin-daip.html", "/admin-security.html", "/admin-test-centre.html"],
    "prerequisites": ["Build 214 RLS containment is confirmed.", "Build 218 is deployed.", "Use an administrator account and dev/staging first."],
    "safety": ["Do not enter a customer booking, vehicle, address, VIN, photo, video, storage URL, signed URL, or payment data.", "Do not create a storage bucket or configure a worker as part of this test."],
    "steps": ["Open /admin-daip.html while signed in as administrator.", "Confirm the control summary says internal test mode, metadata only, and zero executable tasks.", "Confirm the page says storage, workers, public export, and automatic publishing are disabled.", "Open /admin-security.html and confirm browser-table access remains clear for the new DAIP tables."],
    "expected": "DAIP Test Lab is available only to authorized admin staff and remains locked to internal metadata-only testing.",
    "if_it_fails": ["Stop before creating any DAIP record.", "Record only the visible status/error, browser/device, and time; never include sensitive setup information.", "Mark Failed if any public/export/worker flag shows enabled."]
  },
  {
    "key": "daip_internal_test_registry",
    "name": "DAIP internal test job and metadata registry",
    "category": "DAIP internal test mode",
    "risk": "high",
    "estimated_minutes": 12,
    "build_number": 218,
    "pages": ["/admin-daip.html", "/admin-test-centre.html"],
    "prerequisites": ["One opaque DAIP-only test reference such as RD-TEST-BOOKING-DEMO-01 is ready; it is not a booking UUID.", "A fictional filename and technical metadata are ready; no actual media upload is needed."],
    "safety": ["Do not use a customer booking or real media.", "Do not paste a media URL, R2 path, signed URL, Google Drive reference, customer name, address, or VIN."],
    "steps": ["Create a DAIP test job using the DAIP-only test reference, a safe test label, all three safety checks, and the exact phrase INTERNAL TEST ONLY.", "Confirm a RD-TEST date/sequence job code is created.", "Register one harmless metadata-only photo or short-video record.", "Confirm the asset shows storage status not uploaded and public blocked.", "Refresh the page and confirm the test job and audit-safe summary remain visible."],
    "expected": "The registry saves an internal-only job and metadata record without uploading a file or exposing any storage/public URL.",
    "if_it_fails": ["Mark Failed if an upload, URL, public asset, or customer information appears.", "Record the test job code, not the DAIP-only test reference or any private data.", "Mark Blocked if Build 218 migration has not been applied."]
  },
  {
    "key": "daip_internal_privacy_export_block",
    "name": "DAIP internal privacy review and export block",
    "category": "DAIP internal test mode",
    "risk": "urgent",
    "estimated_minutes": 10,
    "build_number": 218,
    "pages": ["/admin-daip.html", "/gallery.html", "/admin-social.html", "/progress.html?token=...", "/admin-test-centre.html"],
    "prerequisites": ["A harmless Build 218 test asset metadata record exists.", "Use a private/incognito window for public page checks."],
    "safety": ["Use only the Test Lab metadata record; no customer media.", "A privacy result of internal-only cleared is not public consent and must not be used as one."],
    "steps": ["Save Internal only cleared or Blocked private for the test asset.", "Refresh the DAIP Test Lab; confirm public blocked remains shown.", "Open Gallery, Social Queue, and a test progress page in a separate private window.", "Confirm the DAIP test record is not available in any customer/public/social/gallery view.", "Archive the test job and confirm no new asset can be registered afterward."],
    "expected": "Privacy review is auditable but cannot make an asset public; the test record never reaches public, customer, social, gallery, or processing output paths.",
    "if_it_fails": ["Treat any public/customer visibility as a privacy blocker and stop DAIP testing.", "Record the page URL, safe RD-TEST code, device/browser, and time only.", "Do not continue toward a storage or worker phase until fixed and re-tested."]
  }
];
export const PRODUCTION_TEST_KEYS_BUILD212 = new Set(PRODUCTION_TEST_PLAYBOOK_BUILD212.map((item) => item.key));
