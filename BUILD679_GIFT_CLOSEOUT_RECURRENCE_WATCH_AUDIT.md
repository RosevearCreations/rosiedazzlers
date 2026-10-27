# Build 679 — Gift closeout recurrence watch and independent customer-safe audit

## Shipped behavior

- After a Build 678 `owner_closeout_recorded` event, an authenticated owner may open **one** watch linked to that exact closeout and assign an additional active independent auditor.
- A case reopened after closeout, or whose decision/recheck was superseded, remains **HOLD**. The watch never auto-closes recurrence or alters a prior reviewer finding.
- The owner renews source evidence through **GET-only Stripe Checkout/session line-item** verification and an atomic comparison of the current receipt, certificate count, checkout line order, currency, payment intent, and delivery-hold records.
- A different signed-in auditor (not the owner, prior recheck reviewer or original recovery-decision author) can independently sign fresh evidence within two hours. A separate owner acknowledgment completes this iteration. Aging evidence can be renewed again; previous events are immutable.
- The workflow never creates/refunds payments, issues/redeems gift certificates, retries delivery or sends email/SMS. The API does not return recipient addresses, certificate codes or Stripe payment intents.

## Operational HOLD

The current live staff roster has one non-owner reviewer. Genuine independence may require authorizing another actual staff member. **Do not create a fictional account or auto-assign the same reviewer.** The owner UI lists only active eligible staff; database enforcement rejects same-person auditing.

## Delivery/verification

1. Run `bash scripts/current_gift_issuance_regression.sh` and `python scripts/release_hygiene_check.py`.
2. Apply `20261027131323_build679_gift_closeout_audit.sql` to the Rosie Dazzlers Supabase project, then execute `20261027131324_build679_gift_closeout_audit_rollback_canary.sql`. The canary must verify zero retained synthetic rows.
3. The server-only RPC has an explicit `service_role` grant, RLS enabled, no `anon`/`authenticated` policy, a per-Stripe-session advisory lock, and immutable events.
4. Promote via feature PR to `dev`, then protected `dev` PR to `main`. Require successful source and production-business gates.
5. Confirm Cloudflare Pages Production at the exact merged `main` SHA with immutable deployment and domain smoke evidence; retain a public GitHub Actions link.

No live customer email, SMS, gift credit, Stripe payment or refund action is part of Build 679 acceptance.
