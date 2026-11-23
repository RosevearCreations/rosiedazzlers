# Rosie Dazzlers Build 920 — Independent Receiver-Ledger Readback, Original Windows Reboot Ceremony & Two-Owner Field Certification

## Original evidence baseline
Original Rosie Cloudflare Pages/Functions, Rosie Supabase project cwxhhvwpilmrfwxirixx, source-signed Build 918 events, independently pinned Build 919 receiver ACKs and original-host witness reviews. At implementation, original 918 source receipts, 919 receiver ACK reviews and host witness reviews were all **zero**, directly inspected in the original database. No original AIDP/Comms ledger readback or original Windows physical reboot was independently witnessed.

**Software GREEN is not physical certification.** Signed claims and two owner reports do not prove transport or original physical recovery by themselves. No customer, payment, booking, provider or inventory changes.

## Implemented features
1. Private responsive Admin cockpit /admin-sysop-920.html; original staff session and admin.settings.manage or daip.manage authorization required, legacy fallback disabled, POST same-origin required, public caching disabled. API: GET/POST /api/admin/sysop_920; other methods denied.
2. Original receiver-ledger readback signed as rosevear.sysop.receiver-ledger-readback.v1. The separately pinned original AIDP or Comms ledger signer must have a different Ed25519 key from the corresponding original Build 919 ACK signer. Exact signed aggregate binds receiver/commit, one 919 ACK UUID, 918 source UUID, receiver receipt UUID, delivery ID and nonce, original durable ledger row UUID, entry and head digests, timestamps, explicit NON_SENSITIVE_AGGREGATE and no action authority. Wrong/stale/replayed/cross-receiver data fails closed.
3. Owner-started 45-minute supervised *pre-reboot evidence* record, with original host ID, original staff UUID, 256-bit server-generated nonce and timestamp. Does not stop or reboot any machine; no prior boot can be attributed to a new ceremony.
4. Two individually signed original owner reports with distinct Rosie staff sessions and independent Ed25519 public pins. Roles PRIMARY_OWNER and SECOND_OWNER. Both bind exactly one preflight nonce/UUID and one Build 919 original host review/boot, Windows event digest, service readback SHA, host witness commit, owner identity/commit, observation timestamp and no automatic restart.
5. Three original private append-only tables: rosie_sysop_receiver_readbacks_v920, rosie_sysop_preflight_v920, rosie_sysop_owner_reports_v920. RLS enabled, anon/auth denied, service-role SELECT and INSERT only, no UPDATE or DELETE. Transactional guard triggers bind readbacks to 919 original ACKs, owner reports to post-preflight 919 host boot evidence and both owner reports to same boot. Unique keys reject duplicate names, signatures and actor roles.
6. Node 24 negative-path tests and the new Rosie 920 Independent Ledger and Two-Owner Host Review Gate alongside inherited 918/919 regression gates.

## Original server-side public-key enrollment
- Existing seven source pins: ROSEVEAR_ROSIE918_SOURCE_PINS_JSON.
- Existing receiver ACK pins: ROSEVEAR_ROSIE919_RECEIVER_PINS_JSON, keyed by ai-data-platform and rosevear-comms-hub.
- Existing host witness pin: ROSEVEAR_ROSIE919_HOST_WITNESS_PIN_JSON, with hostId.
- **New** receiver ledger public pins: ROSEVEAR_ROSIE920_RECEIVER_LEDGER_PINS_JSON, keyed by original receiver ID. Each approved public value contains publicKeySpkiBase64, fingerprintSha256, expectedCommit. Readback signer must NOT be the receiver ACK key.
- **New** exactly two original staff owner pins: ROSEVEAR_ROSIE920_OWNER_PINS_JSON. Map key = Rosie staff UUID; each value contains staffId, ownerRole, publicKeySpkiBase64, fingerprintSha256, expectedCommit. Roles must be PRIMARY_OWNER and SECOND_OWNER, their original Rosie accounts and keys must be different, and each owner must authenticate separately.

Never store private signing keys, bearer tokens, Windows credentials, customer details or original logs in GitHub or the Admin form. Key/commit pins require independent original owner approval in the Cloudflare service environment. This build does not provision or pretend to use private external signers.

## Genuine original Windows and receiver workflow
1. Admit original 918 signed source observation using one-use challenge, then original 919 independent receiver ACK.
2. Independently open the original AIDP/Comms receiver's durable ledger, confirm original signed ACK entry, and obtain a separately signed native ledger readback with its independent ledger authority. Submit to Build 920. Signed imported data stays REVIEW ONLY until independent original receiver-native transport is verified.
3. Prepare genuine original Windows host safety/backup approval. Original authorized owner opens a 45-minute preflight **before** any real reboot, capturing original host ID and nonce. Do not reboot if active services or people may be disrupted. Opening the record does not restart anything.
4. If authorized by the real host custodian, reboot only through the original Windows operator. Independently observe original machine identity, boot event, service recovery and post-boot health. Admit the original post-preflight boot event in 918, distinct staff witness and signed original-host recovery review in 919.
5. Each of two independent enrolled real owners signs the exact 920 report in their own authenticated Rosie Admin account on their own key, bound to the same preflight and original host review. A copied signature cannot count twice.
6. Inspect 920 report. Two genuine signatures may establish TWO_OWNER_SIGNED_REVIEW, but **do not independently prove original Windows boot or independent receiver transport**. Flags independentTransportVerified, sevenSourceConnected and originalHostPhysicallyCertified remain false. No simulated demo can change them. Independently witnessed provider-native and physical field checks remain on HOLD until original evidence and approval.

## Acceptance separation
| Gate | Recorded by software | Must remain separately proven |
| --- | --- | --- |
| Source | 918 signed original packet | Genuine seven-app connectivity |
| Receiver ACK | 919 signed receiver ACK | Original provider-native readback |
| Ledger | 920 independently signed ledger review | Direct original provider ledger verification |
| Preflight | Original Admin nonce and timestamp | Actual original machine reboot |
| Host | 919 Windows event/service hash review | Actual independent physical observation |
| Owners | Two independently pinned owner reports | Independent custodian certification |
| Software | GitHub protected main, immutable Cloudflare Production, release health GREEN | Business/source field GREEN remains HOLD |

## Next proposed
**Build 921 — Live Original Receiver-Ledger API Witness, Original Windows Recovery Health Sampling & Field-Certification Authority Reconciliation.**
