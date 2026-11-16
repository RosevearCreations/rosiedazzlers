# Rosie Dazzlers 894 — Private roadside upload recovery (incremental implementation)
Build 894 extends the original staff-only Builds 868/869 camera-first quote draft. It does not create another booking or storage system.

## Staff workflow
1. Sign in as authorized booking staff, obtain private vehicle-photo permission, and capture photos/video on the existing `/admin-booking` page. A durable temporary quote ID is created before any transfer.
2. The UI checks the already reserved/saved file count before beginning another batch. The original server-side eight-file and storage-budget checks remain authoritative.
3. If the network fails after an upload is reserved, the draft keeps its **pending** private media record. Select **Check saved upload** to ask the server to verify the original stored object, without uploading it again.
4. If the original file remains in the same browser tab, select **Retry this file**. The browser first checks if the prior transfer actually succeeded, then requests a short-lived signed URL for **the exact original reserved object**, transfers the same bytes and confirms it. No second media reservation or duplicate draft is created.
5. If the tab was closed, the file bytes are **not** persisted in browser storage and cannot be silently resent. Contact Admin to reconcile the pending record before selecting additional files. A recovery request cannot turn a pending upload into a verified one without independently checking the private Supabase object.
6. Any quote, booking, deposit, customer communication, marketing consent, or Master-system connection remains a separate authenticated workflow.

## Technical safeguards
- Retry requires a genuine staff session with `manage_bookings`, valid unexpired draft and current private-photo permission.
- Exact original `draft_id`, `asset_id`, private bucket, object path, file MIME and size must match the existing pending reservation.
- Retry creates no new database row and uses the original same-origin private Supabase storage target.
- Browser retains file bytes only in an in-memory map for same-tab retry; filenames and media are not saved to localStorage/sessionStorage.
- Existing storage quota includes pending reservations, and signed storage readback determines `stored_private`. The UI never claims success from an HTTP PUT alone.
- **No virus scanning, real-device upload, or original-production Supabase migration verification is claimed by these code-level tests.**

## Verification and release gates
Run `node --test tests/build894_private_retry.test.mjs`, `node scripts/build868_camera_first_intake_test.mjs`, `node scripts/build869_roadside_quick_quote_test.mjs`, and `node --check` on both modified JS files. Protected PR → dev → main requires the application-wide business CI, exact-SHA Cloudflare deployment, queue WITHIN_BUDGET, and production health GREEN. Previous Builds 892/893 full release gates remain separate prerequisites.

## Seven-application status handoff (record only)
Canonical order: `ai-data-platform → rosevear-ai-hub → rosevear-comms-hub → iCamp → YW → devilndove → rosiedazzlers`.
Masters share an approved visual theme; iCamp and YW are explicitly marked as **Slave Application Shell**, while Rosie and Devil n Dove retain distinct internal-company branding. Rosie communication contract `.github/rosevear-master-communications.v1.json` is **CONTRACT_READY**, not evidence of live connectivity. Original Windows owner receiver stays OFF/UNKNOWN. Vercel limits reported by owner: YW, AI Data Platform and iCamp cannot presently advance their Production deployments; preserve their dev-only handoffs, and perform no deployment/connection changes in other repositories. Rosie source work must not auto-activate Master links.
