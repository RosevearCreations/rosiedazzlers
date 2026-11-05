# QL-336 — Auto-detailing child-shell preparation (HOLD)

The original Rosie Dazzlers remains the only owned business; future auto-detailing businesses cannot inherit its records or provider accounts.

- New shell GET handlers are separate from the legacy `/api/integration/v1/{health,capabilities}` endpoints and return non-cacheable **503 HOLD**. Wrong child scope/POST is rejected. No source proof, KMS key or nonce store is invented.
- `supabase/migrations/20261105040001_ql336_owned_child_shell_hold.sql` is **source-controlled, not yet applied**. It adds four private registries with FORCE RLS and no browser grants or active rows, but does not change legacy bookings, customers, staff, photos, payments or service-account access.
- First child slug (for later source verification): `rosie-dazzlers`. A child record alone never grants access; full source query/RLS/media/storage/Stripe/PayPal isolation must be independently verified.
- Apply in reviewed Development only after genuine backup and owner/source authorization. Do not seed active users or child resources. Actual live multi-tenant conversion is **NO-GO** pending backup, backfill and cross-child abuse tests.

Local acceptance: `node --test scripts/ql336_owned_child_shell_test.mjs`.
