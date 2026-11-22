# Rosie Dazzlers Build 918 — Seven-app signed source receipts, production monitoring and original-host recovery

Original source: Rosie Cloudflare Pages+Functions, original Rosie Supabase, AIDP protocol v1.2 and the existing Rosevear AI Hub / Comms independent signer paths. The seven canonical app IDs are \`ai-data-platform\`, \`rosevear-ai-hub\`, \`rosevear-comms-hub\`, \`icamp\`, \`yw\`, \`devilndove\` and \`rosiedazzlers\`.

## Security and evidence rules
- **Signed source != receiver CONNECTED.** A recorded envelope is only authenticated to a pre-enrolled Ed25519 public-key pin and exact expected Git SHA, fresh issue/expiry, one server challenge and protected service-role database transaction. Source/transport/counterparty and independent Master ACK have separate authority.
- The envelope exactly matches AIDP \`rosevear.sysop.statistics.v1\` protocol 1.2: no customer names, addresses, vehicles, bookings, photos, posts, salaries, payment/tax rows, secrets, arbitrary fields or commands. Unknown metrics stay null. Any unsigned, stale, wrong-ID, wrong-commit, wrong challenge, reused nonce/event or tampered payload fails closed.
- Enrollment is server-side only: \`ROSEVEAR_ROSIE918_SOURCE_PINS_JSON\` maps each source ID to \`{publicKeySpkiBase64,fingerprintSha256,expectedCommit}\`; fingerprints are SHA-256 over SPKI DER and must be independently pinned. No self-selected/browser-supplied keys or unreviewed network URLs.
- The original Windows host recovery check can store a **different-staff** review of one signed \`rosevear-ai-hub\` host boot event. This is still **SECOND_STAFF_REPORTED_UNVERIFIED**, never a physical boot certificate, real machine restart, independent AIDP/Comms receiver ACK or authorizing recovery. No machine is rebooted by this build.
- The private Admin cockpit only reads source-sized metadata and opaque signatures/digests. It does not show source packet secrets or original customer data.
- Read-only scheduled Production health observes GitHub exact-main checks, Cloudflare's accepted release verifier, the public Rosie site and private endpoint denial boundaries. It does not mutate git, deploy, restart any host, change bookings or send customers messages.
- Build917 original external provider-native takedown, multi-surface recall, physical device acceptance, causal finance and previously unenrolled older independent signer watches remain separate HOLDs.

## Production acceptance
Source gates and signed-read receipt software may be GREEN when required exact-SHA tests, development preview, protected main, ten exact immutable Cloudflare Production jobs, canonical runtime smoke and new Release Health GREEN pass. Seven-source continuity, independent Master ACK and original Windows-host reboot remain HOLD until genuine original evidence exists. Never report seven CONNECTED because all seven names are present in the UI.

## Operator enrollment
1. Independently pin the seven sources' SPKI keys and exact deployed Git hashes. Put only public pins and approved SHA identities in server-side configuration; never store signing keys in Git.
2. Sign into Rosie as an original authorized Admin. Generate the 60-second challenge for one source and obtain its provider-native signed v1.2 envelope using that exact challenge. Admit via the private cockpit while fresh, then inspect the durable per-source result. An imported packet is a real signed *source*, not an AIDP reception receipt.
3. Observe a genuine AI Hub host boot only after a signed original-host event exists and is independently witnessed by a different authorized Rosie staff member. A hash-only witness remains unverified.
4. Require separately independent receiver transport ACK, original-host reboot/readback and owner sign-off to progress any master-level business acceptance.
