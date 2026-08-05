# Supplier Link Inventory Import — Build 233

The admin catalog accepts Amazon.ca and Amazon.com product links and creates a reviewable inventory draft. The endpoint normalizes the URL, extracts the ASIN and available public metadata, checks exact duplicates, suggests classification, and writes an audit event.

## Safety boundaries

- HTTPS and an allowlisted supplier host are required.
- The preview never saves inventory automatically.
- Administrators must review name, classification, image, price, quantity and notes.
- Amazon page markup can change or block automated reads; partial drafts remain supported.
- Images remain external URLs until separately reviewed and moved through the existing media process.
- No order placement, credential storage or customer-facing publication is enabled.

## Next supplier adapters

Canadian Tire, Home Depot, Princess Auto, Uline, Costco and Walmart should implement the same normalized preview response rather than create separate inventory schemas.

---

> **Build 237 synchronization (2026-07-28):** This file is retained for current operational reference, release evidence, specialist detail, or history. Current direction lives in `AI_PROJECT_HANDOFF.md` and `MASTER_VALUE_ROADMAP.md`; launch blockers and exact instructions live in `STARTUP_GO_LIVE_BLOCKERS.md`.

---

> **Build 238 synchronization (2026-07-30):** Retained for current operational reference, specialist detail, release evidence, or history. Current architecture lives in `AI_PROJECT_HANDOFF.md`; current direction lives in `MASTER_VALUE_ROADMAP.md`; exact launch blockers live in `STARTUP_GO_LIVE_BLOCKERS.md`.

<!-- BUILD239_SYNC: 2026-08-01 | Current launch interface: /admin-startup-guide.html | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md -->

<!-- BUILD240_SYNC: 2026-08-05 | Authorities: AI_PROJECT_HANDOFF.md, MASTER_VALUE_ROADMAP.md, STARTUP_GO_LIVE_BLOCKERS.md | Inventory posting: /admin-inventory-posting.html -->
