# Rosie Dazzlers — Handoff for Next Chat

Use this note when continuing Rosie Dazzlers work in a new chat.

---

## Branch rule

Current active source of truth:

- `dev`

Do not assume `main` is current.

---

## Fast resume prompt

Use something like:

> Continue Rosie Dazzlers from the `dev` branch docs. Use `README.md`, `PROJECT_BRAIN.md`, `CURRENT_IMPLEMENTATION_STATE.md`, `DEVELOPMENT_ROADMAP.md`, and `NEXT_STEPS_INTERNAL.md` as source of truth. Continue from the next logical step for admin/detailer/staff workflow.

---

## Current project state in one paragraph

Rosie Dazzlers on `dev` is now a growing detailing operations platform, not just a booking website. It has a much larger admin/detailer backend foundation covering bookings, scheduling blocks, token-based progress, jobsite intake, time tracking, media, signoff, live monitoring, staff admin, customer profiles/tiers, and promo management. The next phase should focus on real staff auth/session, consistent staff identity across jobsite actions, gift redemption during booking, unified add-on definitions, direct upload flow, and a cleaner internal role-aware shell.

---

## Best docs to read first in a new chat

1. `BRANCH_WORKFLOW_NOTE.md`
2. `README.md`
3. `PROJECT_BRAIN.md`
4. `CURRENT_IMPLEMENTATION_STATE.md`
5. `NEXT_STEPS_INTERNAL.md`

---

## Most important current rules

- Use `dev` as source of truth
- Token-based progress is the preferred customer progress path
- Customer tiers are not security roles
- Prefer additive changes over destructive rewrites
- Do not casually rename working asset paths or JSON keys
- Focus on workflow/auth polish before adding more isolated endpoints

---

## Most likely next build priorities

1. real staff login/session
2. real staff identity linkage across jobsite actions
3. gift certificate redemption during booking
4. unify add-on pricing/config
5. direct media upload from phone
6. role-aware internal admin/detailer shell
7. cleanup of older endpoint patterns

---

## If continuing code delivery style

Preferred delivery style used in this phase:

- one file at a time
- brief description first
- then one full complete code block for the entire file

---

## One-line continuation note

If resuming later, continue Rosie Dazzlers from the `dev` branch docs and move to the next highest-priority workflow/auth task rather than adding disconnected backend pieces.
