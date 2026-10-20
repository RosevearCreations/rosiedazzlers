# Build 600 — Independent Owner Export Recipient Acknowledgement Ledger & Manual Follow-Up Review Continuity

## Scope
Build 600 is a **read-only, provider-neutral Ed25519 verification contract** that continues Build 599's owner-approved, metadata-only export and independently signed recipient acknowledgement. Every verifier replays the complete upstream signature and independent digest-pin chain rather than accepting an untrusted `status: VERIFIED` flag.

- `verifyIndependentRecipientAcknowledgementLedger` checks a **complete and ordered recipient-signed acknowledgement ledger**. Each Ed25519 receipt binds the original owner-authorized export SHA-256, owner handoff SHA-256, Build 599 initial recipient receipt SHA-256, owner governance head, repository, issue, incident, exact recipient, sequence, predecessor SHA-256 and canonical issue time. Receipt signing-key fingerprint must match the independently pinned Build 599 recipient key and differ from owner and previous independent reviewer keys.
- Permitted recipient actions: `ACKNOWLEDGE_REVIEW_MATERIAL`, `REQUEST_ADDITIONAL_EVIDENCE`, `REPORT_REVIEW_DISCREPANCY`. These are review metadata only; none proves external delivery, customer authorization or exception closure.
- An **independently retained recipient head pin** must match the final receipt digest, complete count, original signed recipient receipt, owner handoff, exact export digest, recipient and independent external reference. Any removed, reordered, forged, unlinked, changed, future-dated or wrong-signer receipt fails closed with HOLD.
- `verifyOwnerManualFollowUpContinuity` re-verifies that signed recipient ledger and validates a **separate complete Ed25519 owner-signed follow-up decision chain** binding exact recipient head, original signed receipt digest, owner handoff digest, export, recipient identity, sequence, predecessor, canonical timestamp and owner review reference.
- Permitted manual owner actions: `ACKNOWLEDGE_RECIPIENT_REVIEW`, `REQUEST_MANUAL_EVIDENCE_RECHECK`, `DEFER_FOLLOWUP_REVIEW`, `ESCALATE_TO_OWNER_MANUAL_REVIEW`. A separately maintained owner-head pin must match its final digest, complete count, verified recipient head and export, original receipt and issue.
- `ownerRecipientFollowUpWorkbench` is a **read-only data model**, not an activated Admin page. It summarizes latest recipient and owner decisions with exact external evidence heads. All outputs preserve `liveExceptionStatus: UNCHANGED`, `auditHoldCleared: false`, `automaticClosure: false`, `automaticDelivery: false`, and `externalWritePerformed: false`.

## Activation and safety
Synthetic test fixtures use ephemeral keys, not genuine owner or recipient credentials. Build 600 **does not** deploy a customer or Admin route, activate paid independent WORM storage, create real signatures, independently custody keys, send exports or notifications, clear production audit holds, process bookings, alter prices, or touch payments/customer records. Operational use needs independent signer custody, real manual owner authorization, independent recipient acknowledgement, separately held off-repository digest pins, and a privacy-reviewed transport and reconciliation process.

The customer quote-first booking wizard remains **optional** beside the standard/direct booking path. No intake or checkout activation is changed.

## Required release evidence
- `node scripts/release_incident_recipient_acknowledgement_ledger_test.mjs`
- `node scripts/release_health_monitor_test.mjs`, including all earlier regression suites.
- Protected GitHub source gate A–D and aggregate, exact-`main` Cloudflare Pages production deployment, exact deployment verification and full Production Business Acceptance including its aggregate, before reporting GREEN.

**Next proposed Build 601 — Independent Recipient Acknowledgement Exception Review & Owner Follow-Up Receipt Handoff.**
