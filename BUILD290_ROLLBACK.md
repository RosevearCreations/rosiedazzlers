# Build 290 Development Forward-Restore Runbook

This runbook restores **Development** to the exact accepted Build 289 source tree without rewriting Git history.

- Accepted Build 289 SHA: `4464e758e02332138bca039149ecbb9ff475988c`
- Accepted Build 289 tree: `a4e279eae6cb7136d309278b568fa5769a70d796`
- Scope: `dev` only
- Do not move `main`.
- No force push and no branch-ref rewind.
- Build 290 has no schema migration, so this source restore does not require a database rollback.

## When to use

Use only if a Build 290 Development deployment produces a regression that cannot be corrected safely with a smaller forward fix.

## Forward restore commit

From a clean local checkout with `dev` at the exact Build 290 SHA:

```bash
git switch dev
git pull --ff-only

ROLLBACK_SHA=4464e758e02332138bca039149ecbb9ff475988c
ROLLBACK_TREE=a4e279eae6cb7136d309278b568fa5769a70d796
CURRENT_SHA=$(git rev-parse HEAD)

test "$(git rev-parse "${ROLLBACK_SHA}^{tree}")" = "$ROLLBACK_TREE"
git merge-base --is-ancestor "$ROLLBACK_SHA" "$CURRENT_SHA"

git read-tree --reset -u "$ROLLBACK_SHA"
test "$(git write-tree)" = "$ROLLBACK_TREE"

git commit -m "Forward restore Development to accepted Build 289 tree"
git push origin dev
```

`git read-tree --reset -u` makes the index/worktree exactly match the accepted Build 289 tree, including removal of Build 290-only tracked files. The resulting commit is a **forward restore commit** whose parent is the failed Build 290 Development commit and whose tree is exactly Build 289. Therefore the normal `git push origin dev` remains a fast-forward; no force operation is required.

## Required acceptance after restore

Do not call the restore complete until:

1. `dev` points to the new forward restore commit.
2. The restore commit tree is exactly `a4e279eae6cb7136d309278b568fa5769a70d796`.
3. Development Source Gate is green.
4. Build 286–289 retained runtime checks are green where triggered.
5. Full Cloudflare Development Acceptance is green and the `dev` alias converges.
6. Production `main` is unchanged.

## Cloud/database boundary

Build 290 is migration-free and changes no D1/Supabase schema or business data. If a later release includes a schema/data migration, this runbook is not sufficient by itself; use that release's migration-specific forward recovery procedure.
