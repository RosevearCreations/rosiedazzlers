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
  },
  {
    "key": "daip_governance_draft_boundary",
    "name": "DAIP governance draft and hard-stop boundary",
    "category": "DAIP governance",
    "risk": "high",
    "estimated_minutes": 10,
    "build_number": 219,
    "pages": ["/admin-daip-governance.html", "/admin-daip.html", "/admin-test-centre.html"],
    "prerequisites": ["Build 219 migration is applied in dev/staging.", "Use an administrator account and safe policy text only."],
    "safety": ["Do not record vendor credentials, URLs, customer names, VINs, addresses, payment details, storage paths, or media in the decision form.", "A saved draft must never enable storage, upload, worker, export, customer access, or publishing."],
    "steps": ["Open /admin-daip-governance.html and confirm the hard-stop banner is visible.", "Choose one DAIP-0 decision and save a safe draft with an owner, summary, cost impact, privacy impact, and review date.", "Refresh the page and confirm the decision remains Draft and an audit entry exists.", "Confirm Gates C, D, E, and F still show Held.", "Open /admin-daip.html and confirm its control record still says internal test / metadata only."],
    "expected": "A governance draft is auditable but cannot create any production DAIP capability or advance a held gate.",
    "if_it_fails": ["Stop DAIP testing if any upload, storage, worker, export, public route, or customer visibility appears.", "Record only the decision key, screen, browser/device, time, and safe visible error."]
  },
  {
    "key": "daip_governance_owner_approval",
    "name": "DAIP owner approval record and review date",
    "category": "DAIP governance",
    "risk": "high",
    "estimated_minutes": 10,
    "build_number": 219,
    "pages": ["/admin-daip-governance.html", "/admin-test-centre.html"],
    "prerequisites": ["A reviewed safe draft exists for one DAIP-0 decision.", "The owner has agreed to the content before the approval phrase is entered."],
    "safety": ["Approve only a real owner decision; do not use fictional approval as proof of production readiness.", "No approval phrase, policy text, or audit note may contain a key, URL, customer data, or private media reference."],
    "steps": ["Load the reviewed draft from the DAIP-0 decision register.", "Choose Approved by owner.", "Type the exact requested approval phrase for that decision and save.", "Refresh the workspace and confirm it shows Approved, records an approver/time, revision, review date, and audit event.", "Confirm the dashboard still says Production features: 0."],
    "expected": "The owner decision becomes a dated audit record while all DAIP media capabilities remain disabled.",
    "if_it_fails": ["Mark Blocked if the decision needs further owner review.", "Mark Failed if approval works without the exact phrase or if an approval enables any technical capability."]
  },
  {
    "key": "daip_promotion_gates_hold",
    "name": "DAIP promotion-gate hold verification",
    "category": "DAIP governance",
    "risk": "urgent",
    "estimated_minutes": 8,
    "build_number": 219,
    "pages": ["/admin-daip-governance.html", "/admin-test-centre.html"],
    "prerequisites": ["Build 218 test results have been recorded or intentionally marked blocked.", "Use dev/staging only."],
    "safety": ["Do not create a bucket, processor, worker, signed URL, upload endpoint, gallery handoff, customer route, or public export as part of this test."],
    "steps": ["Review Gates A through F on /admin-daip-governance.html.", "Confirm Gate A depends on all 12 owner decisions and Gate B depends on the three Build 218 tests.", "Confirm Gates C, D, E, and F explicitly say Held, even when a draft or owner approval exists.", "Confirm the page says no production features are enabled.", "Record the outcome in the Test Centre."],
    "expected": "The workspace makes the next required work visible without falsely implying that governance completion is production authorization.",
    "if_it_fails": ["Stop and mark Failed if any later gate becomes Ready/Enabled without a separate reviewed build and acceptance evidence.", "Record the gate letter, visible state, screen, browser/device, and time only."]
  },
{
  "key": "customer_access_profile_edit_boundary",
  "name": "Customer management profile edit and role boundary",
  "category": "Customer account access",
  "risk": "high",
  "estimated_minutes": 12,
  "build_number": 220,
  "pages": [
    "/admin-customers.html",
    "/admin-login.html"
  ],
  "prerequisites": [
    "Build 220 migration is applied in development/staging.",
    "Use one harmless staff-created test customer.",
    "Use one administrator/booking-manager and one detailer account if available."
  ],
  "safety": [
    "Do not enter real passwords, payment data, reset links, session tokens, customer media, addresses, or VINs in test notes.",
    "Test with a non-customer internal account only."
  ],
  "steps": [
    "As administrator, open /admin-customers.html and create a harmless internal client profile with a controlled email inbox.",
    "Confirm the screen states that email is the sign-in identifier and no separate username exists.",
    "Save a phone/city/detailer-visible note, refresh, and confirm the safe fields persist.",
    "Sign in as a detailer and confirm operational fields can be updated, while email, private notes, notification preferences, and lifecycle controls are not available.",
    "Confirm a customer-access audit row is shown after the staff action."
  ],
  "expected": "Customer profile editing is role-aware, passwords are absent from the interface, and an audit-safe record is visible.",
  "if_it_fails": [
    "Stop if a password, reset URL/token, session token, payment detail, or private media appears.",
    "Record the screen, role, safe internal test profile ID, device/browser, and visible error only."
  ]
},
{
  "key": "customer_access_secure_reset_and_recovery",
  "name": "Secure password reset and forgotten sign-in email flow",
  "category": "Customer account access",
  "risk": "urgent",
  "estimated_minutes": 15,
  "build_number": 220,
  "pages": [
    "/login",
    "/admin-customers.html",
    "/admin-test-centre.html"
  ],
  "prerequisites": [
    "A controlled inbox belongs to the harmless internal test customer.",
    "A configured notification provider or a clear provider-queue observation is available in dev/staging."
  ],
  "safety": [
    "Do not test with a real customer email or production password.",
    "Do not copy a raw reset link or token into screenshots, audit notes, social tools, or documentation."
  ],
  "steps": [
    "Use Forgot your password with the controlled test email; note that the same generic message appears for a deliberately non-existent email.",
    "From Customer Management, request Send password reset once, then once again. Confirm staff only sees delivery confirmation/status and never sees the raw link.",
    "Open the newest controlled reset email privately, choose a test password, then confirm the reset link cannot be reused.",
    "Confirm prior sessions are revoked and the new password can sign in.",
    "Submit a Forgot which email you used request. Confirm the public form does not reveal account existence and an administrator/booking manager sees a queued request in /admin-customers.html.",
    "Resolve the request with a safe note that does not contain credentials, links, or tokens."
  ],
  "expected": "Recovery is privacy-neutral, password reset links are opaque/single-use, and staff never see or set a client password.",
  "if_it_fails": [
    "Stop if raw credentials, token values, reset URLs, or account-existence confirmation appears.",
    "Mark Fail and record the route, role, safe test profile ID, device/browser, and observed response."
  ]
},
{
  "key": "customer_access_archive_audit",
  "name": "Archive-first client lifecycle and safe audit",
  "category": "Customer account access",
  "risk": "high",
  "estimated_minutes": 10,
  "build_number": 220,
  "pages": [
    "/admin-customers.html",
    "/login",
    "/admin-test-centre.html"
  ],
  "prerequisites": [
    "A harmless internal test client profile exists with no live payment or customer data.",
    "Use an administrator account."
  ],
  "safety": [
    "Archive an internal test profile only.",
    "Do not permanently delete customer records, bookings, payments, tax records, media, or consent data."
  ],
  "steps": [
    "As administrator, select the internal test client and choose Archive client account.",
    "Enter a short safe internal reason and the exact confirmation phrase.",
    "Confirm the account is archived, sessions are revoked, and the profile can be filtered under Archived only.",
    "Confirm password/login access is blocked while the account is archived.",
    "Restore the same client, confirm historical summary/audit remains, then request account setup only if the test requires it."
  ],
  "expected": "Archive blocks sign-in but preserves business history and a safe lifecycle audit rather than deleting linked records.",
  "if_it_fails": [
    "Stop if delete removes records or if archived sign-in succeeds.",
    "Record only the safe test profile ID, route, device/browser, and visible error."
  ]
},
{
  "key": "daip_phase1_readiness_packet_hold",
  "name": "DAIP Phase 1 readiness packet and held-gate verification",
  "category": "DAIP governance",
  "risk": "high",
  "estimated_minutes": 8,
  "build_number": 220,
  "pages": [
    "/admin-daip-governance.html",
    "/admin-daip.html",
    "/admin-test-centre.html"
  ],
  "prerequisites": [
    "Build 218 test evidence is recorded or clearly marked Blocked.",
    "Build 219 governance workspace is deployed in development/staging."
  ],
  "safety": [
    "Do not add a storage bucket, upload, signed URL, worker, AI service, customer asset, gallery/social export, or public publishing action.",
    "Do not place customer media, real booking data, keys, paths, URLs, or credentials in any DAIP decision."
  ],
  "steps": [
    "Read docs/digital-asset-intelligence-platform/16_DAIP_Phase_1_Readiness_Packet.md with the owners.",
    "Confirm the packet lists all twelve DAIP-0 decisions, the Build 218/219 evidence requirement, and the minimum private-MVP design questions.",
    "Open DAIP Governance and confirm Gates C–F remain Held even where a design discussion is recorded.",
    "Confirm the Test Lab remains metadata-only with no storage or worker control."
  ],
  "expected": "Build 220 advances DAIP planning/evidence only; it does not create technical media-production capability.",
  "if_it_fails": [
    "Treat any upload, storage, signed-link, worker, customer-access, gallery/social handoff, or public-publishing route as a hard privacy/cost blocker.",
    "Record only the safe screen name, browser/device, time, and visible status."
  ]
}
,
{
  "key": "daip_phase1_readiness_gate_block",
  "name": "DAIP Phase 1 readiness rejects incomplete Gate A or Gate B",
  "category": "DAIP governance",
  "risk": "high",
  "estimated_minutes": 6,
  "build_number": 222,
  "pages": [
    "/admin-daip-readiness.html",
    "/admin-daip-governance.html",
    "/admin-test-centre.html"
  ],
  "prerequisites": [
    "Build 218 and Build 219 DAIP migrations are applied in development/staging.",
    "At least one DAIP-0 decision or one Build 218 test is deliberately still incomplete."
  ],
  "safety": [
    "Use only harmless internal DAIP test records.",
    "Do not add storage, upload, signed-link, worker, processing, customer-media, or public actions."
  ],
  "steps": [
    "Open DAIP Phase 1 Readiness and confirm the Ready for written design review option is unavailable while Gate A or Gate B is blocked.",
    "Attempt to submit a readiness authorization through the normal form only after selecting an incomplete state; confirm the server refuses it.",
    "Confirm Gate C remains Held in DAIP Governance."
  ],
  "expected": "Incomplete decisions or test evidence cannot be turned into design-review authorization, and no technical/public media capability appears.",
  "if_it_fails": [
    "Stop if readiness can be authorized with Gate A or Gate B blocked.",
    "Record only the screen, safe test state, device/browser, and visible status."
  ]
},
{
  "key": "daip_phase1_written_design_review_only",
  "name": "DAIP Phase 1 written-design-review authorization remains non-technical",
  "category": "DAIP governance",
  "risk": "high",
  "estimated_minutes": 8,
  "build_number": 222,
  "pages": [
    "/admin-daip-readiness.html",
    "/admin-daip-governance.html",
    "/admin-daip.html",
    "/admin-test-centre.html"
  ],
  "prerequisites": [
    "All twelve DAIP-0 decisions are owner-approved in staging.",
    "All three Build 218 internal-test results are recorded as Pass in staging."
  ],
  "safety": [
    "Use safe general text only; do not use customer data, media, URLs, paths, credentials, or payment information.",
    "This authorizes only a written private-MVP design review, not an implementation."
  ],
  "steps": [
    "Open DAIP Phase 1 Readiness and confirm Gate A and Gate B are Ready.",
    "Enter a safe owner, readiness summary, budget stop rule, review date, and all three acknowledgements.",
    "Select Ready for written design review only and type the exact displayed authorization phrase.",
    "Save, refresh, and confirm the audit event and latest readiness record are visible.",
    "Open DAIP Governance and Test Lab; confirm Gate C remains Held and no storage/upload/worker/public control exists."
  ],
  "expected": "The record authorizes a written private-MVP design review only; all technical and public capability counts remain zero.",
  "if_it_fails": [
    "Stop if Gate C advances or any upload, storage, signed-link, worker, customer-media, export, or publishing control appears.",
    "Record only the safe review status, screen, browser/device, and time."
  ]
},
{
  "key": "daip_phase1_readiness_audit_privacy",
  "name": "DAIP Phase 1 readiness audit stays governance-safe",
  "category": "DAIP governance",
  "risk": "high",
  "estimated_minutes": 5,
  "build_number": 222,
  "pages": [
    "/admin-daip-readiness.html",
    "/admin-test-centre.html"
  ],
  "prerequisites": [
    "A harmless Build 222 draft or paused readiness review has been saved in staging."
  ],
  "safety": [
    "Do not enter or inspect customer data, media, credentials, URLs, tokens, paths, or payment information."
  ],
  "steps": [
    "Save a harmless draft or paused review using general governance text only.",
    "Refresh the page and inspect the latest record and audit summary.",
    "Confirm the audit reports only status, safe note, staff actor, and time; it does not expose confidential operational detail.",
    "Confirm the record does not create a customer, media, storage, worker, export, or publishing link."
  ],
  "expected": "The readiness trail is auditable without becoming a repository for customer or technical secrets.",
  "if_it_fails": [
    "Stop if sensitive data appears or a readiness record creates an operational media path.",
    "Record only the safe route, field label, browser/device, and visible result."
  ]
}
,
{
  "key": "daip_private_mvp_design_gate_block",
  "name": "DAIP blueprint submission rejects missing or stale readiness",
  "category": "DAIP private-MVP design review",
  "risk": "urgent",
  "estimated_minutes": 7,
  "build_number": 223,
  "pages": ["/admin-daip-design.html", "/admin-daip-readiness.html", "/admin-daip-governance.html", "/admin-test-centre.html"],
  "prerequisites": ["Build 223 migration is applied in development/staging.", "Build 222 authorization is missing, stale, or Gate A/B is deliberately incomplete."],
  "safety": ["Use only safe general text; no customer data, media, URLs, object paths, credentials, or vendor setup.", "Do not create storage, upload, signed-link, worker, processing, or public configuration as part of this test."],
  "steps": ["Open /admin-daip-design.html and confirm the blueprint page shows the current authorization as not current.", "Attempt to submit a blueprint with the normal form and exact phrase; confirm the server rejects it.", "Save a Draft or Paused entry only if safe general text is required for evidence.", "Confirm Gate C remains Held in Governance."],
  "expected": "A missing or stale readiness authorization blocks submission and cannot create a technical or public DAIP pathway.",
  "if_it_fails": ["Stop if a blueprint submits without a current authorization or Gate C changes.", "Record only the safe screen state, browser/device, time, and visible response."]
},
{
  "key": "daip_private_mvp_design_review_only",
  "name": "DAIP private-MVP blueprint is review-only",
  "category": "DAIP private-MVP design review",
  "risk": "high",
  "estimated_minutes": 10,
  "build_number": 223,
  "pages": ["/admin-daip-design.html", "/admin-daip-readiness.html", "/admin-daip-governance.html", "/admin-daip.html", "/admin-test-centre.html"],
  "prerequisites": ["Build 222 current readiness authorization is valid in staging.", "All text is safe general design language."],
  "safety": ["Do not write real customer details, media, URLs, paths, bucket/object names, credentials, or payment data.", "This is an independent-review queue only; it does not authorize implementation."],
  "steps": ["Confirm the Build 222 authorization is Current.", "Complete all blueprint sections, hard-stop acknowledgements, and the exact displayed phrase.", "Save and refresh; confirm the latest entry says submitted for independent review.", "Open Governance and Test Lab; confirm Gate C remains Held and technical/public capability counts remain zero."],
  "expected": "A blueprint becomes auditable design evidence only and cannot provision storage, uploads, workers, customer media, export, or publishing.",
  "if_it_fails": ["Stop if a technical/public action appears or Gate C advances.", "Record only the safe status, screen, browser/device, and time."]
},
{
  "key": "daip_private_mvp_design_audit_privacy",
  "name": "DAIP design-blueprint audit remains privacy-safe",
  "category": "DAIP private-MVP design review",
  "risk": "high",
  "estimated_minutes": 5,
  "build_number": 223,
  "pages": ["/admin-daip-design.html", "/admin-test-centre.html"],
  "prerequisites": ["One harmless Build 223 draft, paused, or submitted blueprint exists in staging."],
  "safety": ["Do not enter or inspect customer data, media, tokens, URLs, object paths, credentials, or payment information."],
  "steps": ["Refresh the blueprint page and inspect the latest record/audit summary.", "Confirm only status, safe note, safe role/actor label, and time are visible.", "Confirm Gate C is held and no customer/public destination appears in the workspace."],
  "expected": "Blueprint evidence is auditable without becoming storage configuration or a sensitive-data repository.",
  "if_it_fails": ["Stop if sensitive data appears or a public/technical route is created.", "Record only safe UI labels, browser/device, time, and visible result."]
}


];
export const PRODUCTION_TEST_KEYS_BUILD212 = new Set(PRODUCTION_TEST_PLAYBOOK_BUILD212.map((item) => item.key));
