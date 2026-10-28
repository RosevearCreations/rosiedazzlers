# Rosie Dazzlers — QL-245 revised connection evidence return

**Prepared for Rosevear Comms Hub. Nonsecret source status only. NOT an Ed25519-signed verifier packet.**

| Required QL-245 field | Actual Rosie Dazzlers status |
| --- | --- |
| Application / `source_system` / repository | Rosie Dazzlers / `rosiedazzlers` / `RosevearCreations/rosiedazzlers` |
| Exact Build 691 `main` SHA / green CI | **Verify from final `main` release evidence; do not use an unverified SHA here.** Precursor B690 production SHA `671469005a649b0b8a83f7c8ab4facae70542465`, green run: `https://github.com/RosevearCreations/rosiedazzlers/actions/runs/40629256229`. This confirms **production code readiness**, not a real nonproduction connection. |
| Nonproduction server origin and independently verified deployed revision | **UNVERIFIED / NOT PROVISIONED**. Production host must never be used as nonprod test endpoint. |
| Business / tenant / scopes | `rosiedazzlers` / `null` / only `read_health`, `read_capabilities`; two GET endpoints. No write, dispatch or customer read. |
| Source Ed25519 signer key ID / independently pinned public SPKI hash | **NOT PROVISIONED / UNVERIFIED**. B691 builds no signer. |
| Nonsecret HMAC key ID and gateway registry / rotation receipt | **NOT INDEPENDENTLY VERIFIED / NOT PROVISIONED FOR A TEST**. B689 code supports configured HMAC and revocation, but no live provisioning evidence was supplied. Never return a secret. |
| Source signed health and capabilities original receipt IDs | **UNVERIFIED / NOT PROVIDED**. Synthetic request tests are not original gateway traces. |
| Gateway-signed health/capability/audit IDs and durable read-after-restart proof | **UNVERIFIED / NOT PROVIDED**. Gateway has not been contacted by B691. |
| Seven original negative-denial traces and independent reviewer | **0/7 independently verified**. Nonce replay, stale, wrong business, wrong tenant, revoked key, prohibited write, prohibited dispatch all remain `false` in owner inventory. |
| Six source pins and seventh assessor; verified canonical signature | **UNVERIFIED / NOT PROVISIONED**. Unsigned B691 draft cannot pass offline verifier. |
| Independent real-world witness | **UNVERIFIED / NOT PROVIDED**. |
| Authenticated owner pilot approval | **NOT GIVEN**. QL-245 is a request for evidence, not consent to connect. |
| Reversible kill-switch/rollback original witness | **NOT VERIFIED**. Source feature flag stays off by default. |
| Actual connection | **DISCONNECTED / HOLD**. |

## Next evidence to return (only after independent authority)

1. Exact new source SHA, green CI run URL, isolated nonproduction TLS origin and matching deployed revision.
2. Independently provisioned credential **IDs only** and separately authenticated Ed25519 SPKI pins.
3. Original timestamped, signed read-only HMAC GETs and independently retrieved source/gateway audit receipts.
4. Seven original negative denial traces, separate reviewer, restart durability and key revocation/rollback proof.
5. Assessor's independently verified signature and sourced pin. **Owner approval remains NOT GIVEN unless separately authenticated later.**

This is a truthful handoff for QL-245; it must never be interpreted as a successful connection or as pilot permission.
