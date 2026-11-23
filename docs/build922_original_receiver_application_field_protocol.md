# Rosie Dazzlers Build 922 — Original receiver compatibility and signed application-health gates

## Release scope and authority
Build 922 adds a source-verified, fail-closed compatibility contract for the **original** AIDP and Comms receiver-native ledger GET; an independently signed original Windows application-health attestation validator correlated with a durable Build 921 sample; and a final field review gate that **never** autonomously certifies physical reboot, seven-source CONNECTED, financial correctness or customer actions.

This is **not** proof that remote endpoints or the original Windows host have been enrolled. Do not label field certification GREEN based on CI, port listeners, sample JSON, simulated signatures, or software deployment alone.

## Original external receiver contract
Original owner must independently provision both receiver endpoints and keys. Expected protocol: `rosevear.sysop.receiver-native-ledger-readback.v1`; fixed path `/v1/rosevear/sysop/ledger-readback`, GET only, scoped read-only bearer, Ed25519, 256-bit challenge, redirects disallowed, max 8KB JSON, non-sensitive aggregate only, independently pinned signer fingerprint and *actual* deployed receiver commit. Compatibility is necessary but insufficient: Build 921 must perform its genuine server-side original endpoint GET with durable ledger, nonce, source, and signer correlation.

## Original Windows application evidence
Contract `rosevear.sysop.windows-app-health-attestation.v1`. The genuine original Windows owner-host agent must prove each application's identity with a challenge at the application protocol layer; **TCP listening alone is not authenticated service health**. Signed envelope includes original host/boot/sample identity, unique attestation UUID, server-provided fresh 256-bit challenge, original sampler commit, freshness window <=60 seconds, and ordered hub/caddy/mqtt/ollama results. `NONE` proof cannot claim AUTHENTICATED. Independently enroll the original source key; do not place private keys in a browser or GitHub.

**Important:** This release supplies a validation contract and source tests, not a deployed original Windows application agent, source registration, persistent 922 evidence API, or original receiver's implementation. Those external dependencies need genuine enrollment and integration before operational acceptance.

## Independent final certification
`finalFieldGate922` requires original native witnesses from BOTH receivers; 3 real Build 921 Windows samples; 3 signed application health observations; 2 genuine distinct owner signatures; independent physical Windows observation; and exact-SHA Production verification. Meeting these produces only **reviewReady**, never autonomous certification. A human with actual field authority must independently approve any final operational change after verifying original receipts and integrity. The state remains HOLD otherwise.

## Test and deployment
Run `node tests/build922_original_application_authority.test.mjs` using Node 24. Protected workflow `.github/workflows/rosie922-original-application-authority-gate.yml` also executes Build 918-921 regressions. Before merging to `main`, inspect protected checks and any Cloudflare preview. Afterwards compare the exact deployed Cloudflare Production commit to `main`, production route smoke and release health. **Never** report Production GREEN without that evidence. Do not reboot the owner Windows PC on a software deployment.

Next proposed: **Build 923 — Original Windows Application-Protocol Challenge Agent, Durable Private Evidence API and Independent Field Acceptance UI** (only after 922 software and live field gaps are reported accurately).
