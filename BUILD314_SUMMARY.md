# Build 314 — Media / Photo Studio Reliability

Status: **feature implementation complete; source acceptance required before Development promotion**.

## Starting authority

Build 314 started only after `main` and `dev` were verified at the same accepted Build 313 commit:

`813cf492841503ad972168cb630d28054d2774d0`

Production acceptance for that exact Build 313 source was already green before Build 314 work began.

## Scope

Build 314 is a bounded reliability build for the existing Photo Management Studio. It does not redesign the public site and it does not introduce a database migration.

### 1. Cloudflare / R2 sync limits retained

- Ordinary Photo Studio loads remain database-only.
- R2 is scanned only by the explicit **Sync approved R2 photos** action.
- Each sync request remains capped to one page of 100 R2 objects.
- Existing database reconciliation remains page-local and batched.
- The browser reports the total number of bounded sync requests rather than hiding a long monolithic scan.

### 2. Exact assignment tracking

`photo_library_list` now returns exact active placement summaries on each managed photo:

- `assignment_count`
- `assigned_targets`
- `before_after_slots`

The API also reports whether the 1,600-active-placement safety cap was reached so the operator is not given a false "complete" placement audit.

### 3. Before / After pair integrity

When a Photo Studio target is a `before_after_pair`, the server resolves its `:before` / `:after` counterpart before saving. The same managed photo cannot be assigned to both sides of one pair. A conflicting save fails closed with HTTP 409 and a clear operator message.

### 4. Deletion safety extended to Gallery proof

Previously, deletion blocked active `app_media_assignments`, but Gallery before/after rows are stored separately in the `before_after_gallery` editable setting. Build 314 now checks that authority before removing a managed image.

A photo referenced by either `before_url` or `after_url` in a Gallery row cannot be deleted until the Gallery reference is replaced or removed. This applies to draft and published rows.

Existing race and compensation protections remain:

- active assignment check first;
- database FK remains the final race-condition guard;
- inactive placement history is restored when necessary;
- if R2 deletion fails, the managed database row and inactive history are restored.

## Acceptance authority

Build 314 adds:

- `scripts/build314_release_check.py`
- `.github/workflows/build314-source-gate.yml`

The source gate checks JavaScript/Python syntax, Build 314 reliability invariants, retained Build 313 authority, cumulative release checks, SEO single-H1 checks, synchronized route copies, and source hygiene.

## Promotion rule

Do **not** move `dev` or `main` merely because these files exist. Promote Build 314 to `dev` only after its exact feature SHA is green. `main` remains at the accepted Build 313 Production boundary until a separate deliberate Production promotion is approved and accepted.
