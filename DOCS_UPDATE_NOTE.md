# Rosie Dazzlers — Docs Update Note

This note records the purpose of the recent Markdown documentation refresh on the `dev` branch.

---

## Why these docs were refreshed

The Rosie Dazzlers project has moved past being only a booking website with a few admin tools.

The `dev` branch now reflects a broader operational system that includes:

- booking operations
- progress workflows
- jobsite intake
- time tracking
- media handling
- signoff handling
- live operations monitoring
- staff admin
- customer profile/tier admin
- promo admin
- role-aware backend structure

Because of that shift, the older docs needed to be brought up to date.

---

## What the refreshed docs are meant to do

The refreshed docs are meant to make future work easier by clearly documenting:

- the current mental model of the platform
- the current repo structure
- the real direction of the `dev` branch
- the difference between bridge security and the long-term auth model
- the separation between staff roles and customer tiers
- the most important next priorities

---

## Main themes now emphasized in the docs

### 1) `dev` branch is the active source of truth
Future work should treat `dev` as current.

### 2) Token-based progress is the preferred customer progress model
The newer progress direction is based on:
- `progress_token`
- `job_updates`
- `job_media`
- `job_signoffs`

### 3) Shared password is only a bridge
`ADMIN_PASSWORD` still exists, but the backend is moving toward:
- Admin
- Senior Detailer
- Detailer
with real role-aware logic

### 4) Customer tiers are not security roles
Customer tiers are business segmentation only.

### 5) The next phase is workflow/auth polish, not just more endpoints
The backend foundation has grown a lot.
The next major work should focus on:
- real staff auth/session
- stronger staff identity linkage
- gift redemption
- upload flow
- internal UI/shell cleanup
- endpoint consolidation

---

## Docs that were refreshed together

These docs should now be read as a matching set:

- `README.md`
- `PROJECT_BRAIN.md`
- `DEVELOPMENT_ROADMAP.md`
- `REPO_GUIDE.md`
- `SANITY_CHECK.md`
- `AI_CONTEXT.md`
- `CHANGELOG_ADMIN_DETAILER_REFRESH.md`
- `ADMIN_ROLE_MODEL.md`

---

## Guidance for future updates

When the system changes again, try to keep these docs updated together instead of allowing them to drift apart.

Best practice:
- update the high-level docs when architecture changes
- update the roadmap when priorities change
- update repo guide docs when file organization changes
- update sanity/status docs when the real implementation state changes

---

## One-line takeaway

These documentation updates exist to keep future Rosie Dazzlers work aligned with the real `dev` branch direction: a growing, role-aware detailing operations platform rather than only a static booking site.


## Current snapshot — March 21, 2026

Latest pass completed:
- fixed booking add-on checkbox/text layout pressure
- improved service/package image fallback with extra photo cards
- expanded staff management toward richer Admin/Detailer profile editing
- added customer tier discount support in the UI/data model direction
- added/confirmed garage, gift, and redemption visibility in client/admin screens
- added current SQL for tier discounts and richer staff/customer fields

Current next priorities:
- picture-first observation interface
- richer client/detailer threaded comments UI
- manual scheduling / app-management rules UI completion
- final layout polish across booking and internal screens

