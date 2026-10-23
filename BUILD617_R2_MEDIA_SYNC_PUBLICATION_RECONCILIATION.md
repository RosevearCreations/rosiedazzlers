# Rosie Dazzlers — Build 617: R2 Media Sync & Publication Reconciliation

## Scope and source acceptance

This build keeps Photo Studio's existing staff-only, approved-public-prefix
R2 scan behind an explicit button. Normal Admin library views and public page
manifests remain database-only. No new SQL schema, public bucket, customer
uploads, consent assumption, or automatic website assignment is introduced.

**Bounded synchronization:** Each Worker request lists at most 20 R2 objects
from one approved prefix and loads at most one matching managed-library page.
Newly seen keys are inserted with `on_conflict=media_key`,
`resolution=ignore-duplicates`, and `source_status=needs_review`. A separate,
explicit staff review is necessary before an image is eligible for publication.
Existing records receive conditional `PATCH` calls for only R2 provenance
(filename/key/url/type/size/etag/upload time/last seen), guarded atomically by
both `updated_at` and the prior `r2_etag`. Human-authored labels, captions,
alt text, license notes, publication status, assignments, and other metadata
are **never included in sync updates**. A zero-row revision or duplicate
insert does not become a false success; it pauses the current page for review.

**Publication boundary:** An active *and* approved-prefix image is needed
for a public website manifest or a new photo placement. Pending-review and
archived records can be inspected by staff but not published through these
paths. A change from a review-held/archived status to Active requires a
verified prior status, explicit staff confirmation and non-empty rights/consent
notes. That operator assertion must reflect independently obtained legal rights
or customer consent; the software cannot verify the underlying permission.
The confirmation and status are both checked server-side. Existing active
photos retain their current assignments; no mass unpublication is initiated
by the R2 sync action itself.

**Recovery boundary:** The browser tracks the exact approved prefix and opaque
cursor before every page. A 409 conflict, 503, Worker limit, disconnected
request, or a 100-page manual budget pauses the operation. The operator
chooses whether to continue the uncertain page; there are no automatic
retries, no attempt to roll back earlier saved pages, and no invented
completion. Cursor state survives only while the page stays open. Reloading
means a new deliberate scan. R2 object deletion/orphan status cannot be
proven from a page-bounded listing, and is not auto-reconciled or deleted.

## Automated checks

`node scripts/r2_media_sync_publication_617_test.mjs` verifies:

1. New images start in `needs_review`, without invented consent or public activation.
2. Existing image reconciliation PATCHes only asset provenance, with revision
   and ETag compare-and-swap guards; a lost race pauses without overwriting.
3. Duplicate registration and unknown upstream writes remain visible holds,
   with no automatic retry and no cursor advancement after an uncertain page.
4. Private prefixes and review-held images cannot enter public image manifests
   or public assignments, even with stale active assignment rows.
5. Owner publication transitions require an explicit confirmation and rights
   note, checked server-side.
6. The primary and mirrored Admin routes match and browser module syntax parses.

The existing Build 314/391/408/422/616 checks remain mandatory. The live
R2 bucket, live consent documentation, real operator recovery drills and
Cloudflare exact-SHA production promotion are separate deployment/owner checks.

## Operator acceptance — pending independent evidence

- [ ] In authenticated Photo Studio, run Sync for a known approved R2 folder;
      record prefix, page count, result and optional continuation cursor.
- [ ] Confirm a new object appears **Needs review**, with no public placement.
- [ ] Verify image ownership/customer permission before choosing **Active**;
      record consent/rationale without private customer details.
- [ ] Confirm an approved manual placement previews correctly on the public
      page without exposing customer/private jobs or evidence image keys.
- [ ] Repeat after a simulated stale-version/uncertain-write warning and
      confirm manual continuation does not silently overwrite staff metadata.

Source GREEN does not mean those production/owner observations occurred.
No public assignment, consent approval, or destructive R2 operation may be
inferred from the successful release.

## References

- [Cloudflare R2 Workers API: cursor and `truncated`](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
- [Supabase upsert API and duplicate handling](https://supabase.com/docs/reference/javascript/upsert)
- `FORWARD_BUILD_ROADMAP_613_621.md`
- `BUILD616_PHOTO_STUDIO_AUTOSAVE_FAILURE_RECOVERY.md`
