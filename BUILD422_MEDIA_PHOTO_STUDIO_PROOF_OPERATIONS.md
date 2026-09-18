# Build 422 — Media, Photo Studio & Proof Operations

Build 422 validates recurring public media assignment, Before/After proof, bounded R2 synchronization and recovery evidence without turning source readiness into invented operating proof.

This release is schema-neutral and read-only. The proof overview reads the existing managed public photo library and active placement rows only; it performs no R2 listing or media mutation.

Operational evidence remains separately classified:
- active recurring placements and multi-placement reuse;
- complete distinct-photo Before/After pairs;
- managed-library sync observations from `last_seen_at`;
- source-ready same-key upload retry and cursor continuation.

Missing or stale evidence remains `owner_action` or `unavailable`. Source GREEN may coexist with those HOLDs, and a real recovery drill is never inferred from source code.

R2 sync remains one approved prefix and one list page per request, with continuation through the returned cursor. Ordinary Photo Studio loads and this proof overview do not scan the bucket automatically.

The retained media safety authorities remain in force: public-only assignment, non-destructive unassign/reset, guarded Before/After pairing, and dry-run-first destructive deletion under explicit administrator authority.

Production promotion still requires feature acceptance, exact Development deployment/runtime acceptance, protected `main` PR checks, and independent exact Production deployment/runtime/business acceptance.

## Next bounded release

Build 423 — Reliability, Performance & Cost Capacity begins only after Build 422 is independently GREEN on protected `main`.
