# Rosie Dazzlers — Autonomous Development Queue

This queue records current actionable work. Completed implementation history belongs in Git history and workflow evidence. The durable numbered sequences are `FORWARD_BUILD_ROADMAP_356_377.md` and the approved continuation `FORWARD_BUILD_ROADMAP_378_385.md`.

## Accepted checkpoint

**Build 384 — Finance Cockpit & Month-End UX** is the accepted synchronized source and Production deployment boundary before the current release begins. Its fail-closed Finance evidence, manual approval boundaries, schema-neutral implementation and exact-SHA Production authority remain retained release protections.

## Current release

**Build 385 — Backup, Restore & Release Recovery Drill** is the active bounded release.

Current scope:

- prove a documented operator recovery path for a bad deployment or operational failure without using Production business data as test material;
- retain the existing read-only Development rollback-candidate authority and narrowly guarded Development Cloudflare recovery mechanics rather than creating parallel rollback logic;
- require exact source ancestry, successful deployment identity, Functions metadata and HTTP smoke for application rollback evidence;
- document fail-closed database recovery evidence around project/environment identity, current migration boundary, actually available backup/PITR capability and a separately authorized restore decision;
- document R2/media preservation around bucket/binding identity and critical asset-path evidence without copying, overwriting or deleting Production objects;
- document configuration, secret-name ownership and DNS/domain recovery responsibilities without recording secret values or mutating DNS;
- keep payment/provider recovery evidence read-only and forbid charge, capture, refund, settlement or paid-state mutation during the drill;
- require explicit operator authorization for any real Git ref move, deployment repair, database restore, R2 mutation, DNS change, secret rotation or provider action;
- require the recovered boundary to pass the normal cumulative and exact-SHA Development/Production acceptance authorities before GREEN is declared;
- keep the release schema-neutral with no database migration or Production business-data mutation.

The exact candidate SHA must pass the focused recovery-drill authority, Current Source Gate and feature-preview acceptance before Development promotion. Development must pass retained runtime/deployment gates on the same SHA before `main` may move. Production promotion remains a non-force fast-forward of that exact Development-GREEN SHA and is complete only after the exact-SHA Production deployment/runtime authority and retained Production business-path authority pass.

## Next release

**Build 386 — Post-Recovery Baseline & Forward Roadmap Renewal** is next after the current recovery release. It will close the 378–385 phase, confirm the new accepted baseline, retire stale recovery references and establish the next bounded forward roadmap without changing business data merely for documentation.

## Continuing rule

Never call a Rosie Dazzlers release GREEN from source changes alone. Preserve the exact tested SHA through Development and authorized Production promotion; keep database migrations as separate acceptance boundaries. Promote `main` by non-force fast-forward to the same Development-GREEN SHA. Missing exact Production runtime/deployment identity is a blocker rather than permission to infer success.