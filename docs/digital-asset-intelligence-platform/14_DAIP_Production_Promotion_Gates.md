# DAIP Production Promotion Gates — Rosie Dazzlers

**Status:** Active control document after Build 218.  
**Rule:** No one may treat a DAIP Test Lab record as real-media production readiness.

## Gate A — owner decisions

All DAIP-0 rows in `11_DAIP_Decision_Register.md` must be owner-approved and dated:

- worker host and operating owner;
- monthly storage/egress/AI/render ceiling and stop rule;
- original-storage/backup policy;
- Google Drive role or explicit deferral;
- customer consent wording;
- privacy/content/gallery/publication roles;
- retention, dispute, incident, and legal-hold rules;
- selected internal test data; and
- public-destination scope.

## Gate B — Build 218 safety evidence

The three Build 218 guided tests must pass in development/staging. The recorded evidence must be safe: no signed URL, no customer record, no storage key, no invoice/payment data, and no private media.

## Gate C — storage and upload design review

A new reviewed build must define all of the following before any original byte can be accepted:

- dedicated private bucket/prefix separation for originals, proxies, review derivatives, and approved public derivatives;
- short-lived, single-purpose upload/download authorization; no embedded storage credentials;
- resumable upload recovery and checksums;
- source-to-derivative provenance;
- retention/hold rules and a dry-run cleanup report;
- backup policy with one controlled source of truth.

Cloudflare R2 supports presigned S3 URLs for narrow, time-limited object operations; they must be generated only server-side and treated as sensitive bearer URLs. This is a future design decision, not an enabled Build 218 feature.

## Gate D — non-public processing MVP

The first worker phase must remain private and limited to metadata extraction, validation, checksum, thumbnail/proxy/contact-sheet generation, retry state, cancellation, and cost recording. It must run outside Cloudflare Pages request handling. No AI/publishing work is included until the private technical pipeline passes.

## Gate E — privacy/export proof

Before public derivatives exist:

- privacy review must block export by default;
- automated detections remain advisory and need a human decision;
- customer portal visibility remains separate from marketing consent;
- every derivative shows source, privacy decision, consent state, reviewer, and time;
- gallery/social/website handoff is a separate explicit action.

## Gate F — controlled production promotion

Only after Gates A–E pass may a limited internal-first production pilot be proposed. The pilot must have a written rollback, cost dashboard, incident escalation owner, daily review, and zero automatic publishing.

## Invariant rules across every gate

- Original media remains private and immutable.
- Incident, dispute, legal-hold, customer-portal, and staff-only material remain excluded unless a separately approved narrow exception exists.
- Browser roles do not receive direct database access; Cloudflare Functions remain the application boundary and Supabase RLS/grants remain enforced.
- No generated asset publishes automatically.
- An asset is useful for local SEO only after it is truly approved for the relevant public page, has accurate descriptive filename/alt/caption context, and is placed near relevant local service content.
