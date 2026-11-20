# Rosie Dazzlers Build 915 — live-provider acceptance gate (implementation in progress)
Build 914 is the current independently verified production baseline. This branch adds a fail-closed external receipt validation and privacy-safe attribution aggregation contract with Node tests; it does **not** connect a provider account, write any real supplier stock, publish media, or prove an original device session.

## Source of Value requirements mapped
RD14 — separate customer inspection consent, DAIP review and public-channel authority; consent recheck is mandatory immediately before publication certification.
RD20 — distinguish enquiries from completed profitable visits; aggregate attribution with a small-group threshold, never identifiable event payloads.
RD21–RD25 — independent Rosie-specific bookkeeping, processor clearing, route contribution and customer obligations. No financial ledger changes in this isolated contract.

## Required independent acceptance before Build 915 can be marked fully GREEN
1. Sign in with verified Admin, Detailer and Customer credentials on actual desktop and mobile browsers. Database shows only one active Admin and one active Senior Detailer staff row plus one customer profile as of 2026-11-20; a customer login session has not been demonstrated.
2. Verify supplier custody against actual physical receipt; no synthetic equipment stock or claim of receipt.
3. Owner-approved scoped OAuth identity and read-only content status from each intended YouTube / Instagram / Facebook provider. Match original creator/channel owner, actual video ID, public state, canonical URL and independent time-stamped readback. Never promote a queued item on a user-entered URL alone.
4. Recheck valid original customer consent and DAIP manifest immediately before live platform publication or certification. Withdrawal must reopen any prior certification, and run actual provider takedown separately.
5. Reconcile attribution only from allowed first-party source/event types, minimum five per reported group; do not ingest IP, URLs with query parameters, personal contacts, or customer identifiers.
6. Run protected dev and main PR checks and independently verify the deployed Cloudflare Production exact-main commit and original cross-device creative flows.

## Reversible data testing
Use a unique `test_run_id` with `TEST_ONLY` prefix for any non-financial fixture. Only delete records created by that run, in reverse dependency order, after checking no live reference. Never alter authentic Supplies and Tools values, financial documents or customer consent to make a test pass.

**Release status: HOLD pending real provider credentials / live published video / customer & device witnesses.** This page is not Production acceptance.
