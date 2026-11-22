# Rosie Dazzlers 919 — Seven-Source Signer Enrollment, Genuine Receiver ACK Correlation & Original-Host Recovery Witness Acceptance

## Original systems and evidence baseline
Rosie Cloudflare Pages/Functions, original Rosie Supabase project, seven AIDP protocol 1.2 sources, AI Data Platform and Rosevear Comms Hub receivers, original Windows Rosevear AI Hub host.
At baseline, original v918 source receipt, challenge and host-witness counts were **0** when independently inspected on November 22, 2026. This means no live external receipt or physical recovery can honestly be marked accepted from source changes alone.

## Implemented Build 919
- Dedicated private responsive Rosie Admin page at `/admin-sysop-919.html` and authenticated `/api/admin/sysop_919`. It exposes server-side public-pin *readiness booleans*, genuine durable source counts, verified receiver-review counts and host evidence counts, without customer data or signing credentials.
- Reuses seven independently authorized source signer pins from Build 918 `ROSEVEAR_ROSIE918_SOURCE_PINS_JSON`. Missing pins, wrong commit or absent actual original receipts remain HOLD.
- Separately enroll two actual receiver public-key pins using server-only `ROSEVEAR_ROSIE919_RECEIVER_PINS_JSON`, keyed by `ai-data-platform` and `rosevear-comms-hub`, each with `{publicKeySpkiBase64,fingerprintSha256,expectedCommit}`. Never derive pins from a browser submission or from source signer keys.
- The receiver acknowledgement must be genuinely signed by that exact independently pinned receiver key with Ed25519 over canonical sorted JSON. Exact `rosevear.sysop.receiver-ack.v1` payload binds `receiverId`, exact deployed `receiverCommit`, `sourceAppId`, `sourceCommit`, original `sourceReceiptId`, `sourceEventId`, original signature SHA-256, delivery ID/nonce, receiver-origin UUID, received/issued/expiry timestamps, `dataClass=NON_SENSITIVE_AGGREGATE` and `authorizesAction=false`. Unique receiver/delivery/nonce/source pairing rejects replay. Bad signature, source mismatch, impossible receiver timeline, stale timestamps and wrong receiving app fail closed.
- Separately enroll original-host independent witness public pin as server-only `ROSEVEAR_ROSIE919_HOST_WITNESS_PIN_JSON` with the same public identity fields **plus `hostId`**, with its `expectedCommit` bound to the signed `hostWitnessCommit`, distinct fingerprint from the host source signer. This independent Ed25519 signing key must not be the same credential as the source signer key.
- Original-host `rosevear.sysop.original-host-witness.v1` exact signed payload binds the original v918 signed AI Hub boot source receipt/digest, fixed authorized `hostId`, exact independently pinned signed `hostWitnessCommit`, one boot ID, boot timestamp, original Windows event-log SHA-256, actual service readback SHA-256, the separately filed v918 second-staff evidence SHA-256, separate staff UUID and short expiry. The original second staff member must be the signed-in operator and differ from the source registration actor. DB trigger checks the immutable original source/witness relation.
- Two additional Supabase append-only service-role-only tables have RLS enabled and no `anon`/`authenticated` grants. The only writes are scoped evidence reviews. No customer, booking, payment, provider, inventory or general IT settings are changed; no host restart, endpoint POST to a Master, or unapproved Cloudflare secret enrollment is attempted.

## Acceptance boundaries
| Gate | Evidence required | Build 919 meaning |
| --- | --- | --- |
| Git/Cloudflare software release | Protected dev/main checks, live Cloudflare immutable production verification, release-health GREEN | Can be GREEN independently of business |
| Seven independently signed sources | Original source identities, exact commits, real signed challenge-bound receipts | Remains HOLD until actual records |
| Genuine receiver cryptographic review | Independently pinned original AIDP / Comms receivers, actual signature, original source receipt, non-replayed delivery binding | `SIGNED_RECEIVER_ACK_REVIEW_ONLY`; does NOT independently prove network transport |
| Durable independent receiver delivery | Receiver-side independent ledger/transport readback and owner authorization | HOLD until separately verified |
| Original Windows host | Actual original host boot event, separate staff source witness, independent signed Windows log / service readback digests | `SIGNED_HOST_SECOND_WITNESS_REVIEW_ONLY`; **not physical recovery certification** |
| Recovery acceptance | Independently witnessed original machine shutdown/start, service recovery, no stale restart/duplicate events, second owner field signoff | HOLD until original device observed |

## Original operator order
1. Inspect seven-source pins and original receipts at Build 919. In the Build 918 Admin page issue a genuine one-use 60-second challenge and admit the original source's Ed25519 v1.2 envelope. Do not create dummy rows in Production.
2. Obtain the original authenticated receiver's durable ACK through the receiver's own existing operational system (not by signing a local fake ACK); verify receiver key and commit out-of-band, provision its public pin server-side, and submit the exact ACK JSON while fresh in Build 919. An ACK review is not a transport acceptance; independently read its actual receiver origin ledger.
3. For real recovery, collect the original AI Hub boot event and a different original staff witness hash in Build 918, then independently sign the exact Windows event and service readback digests using a separate authorized witness key. Submit Build 919 witness from the different staff session. Independently review original Windows machine boot and service return before operational acceptance.
4. Never mark all seven CONNECTED or Windows host recovered simply because all seven names exist. The non-sensitive read model intentionally returns `false` for operational acceptance until a separate future verified source-of-truth path is built.

## Minimal acceptance tests
`node tests/build919_original_receiver_host.test.mjs`; also retained Build 918 source, private Admin, and continuous-production watcher tests. GitHub job `Rosie 919 Receiver ACK and Original Host Evidence Gate` runs Node 24 on both dev/main PRs and pushes. Synthetic signatures in unit tests verify rejection controls only and do not enroll original sources.

## Next proposed build
**Build 920 — Independent Receiver-Ledger Readback, Original Windows Reboot Ceremony & Two-Owner Field Certification.** This should only elevate real operational acceptance after separately obtained, independently correlated original proof.
